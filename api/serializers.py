import difflib
from . import validators
from .models import (
    BingoCard,
    BingoTile,
    Vote,
    SiteUser,
    BingoCardCategory,
    #CategorySubscription,
    #UserSubscription,
    Subscription,
    Follow,
    Hashtag,
)
from django.contrib.auth.models import User
from django.core.validators import EmailValidator
from django.db import IntegrityError
from django.db.transaction import atomic
from rest_framework import serializers
#from libreddit_sort import hot_score, best_score

is_immutable = {'required': False, 'read_only': True}


############
### AUTH ###
############


class UserSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteUser
        fields = ['id', 'name', 'score']


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


class UserCreateSerializer(serializers.Serializer):

    email = serializers.CharField(
        validators=[
            EmailValidator(),
            validators.email_unique])

    password = serializers.CharField(
        validators=[validators.password_length])

    username = serializers.CharField(
        validators=[
            validators.username_length,
            validators.username_unique,
            validators.only_letters_and_numbers])

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        site_user = SiteUser.objects.create(
            name=validated_data['username'],
            auth_user=user,
            score=0
        )
        return site_user


#######################
### EVERYTHING ELSE ###
#######################


class HashtagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hashtag
        fields = ['name']


class CategoryRelatedSerializer(serializers.ModelSerializer):
    is_subscribed = serializers.SerializerMethodField()
    subscriber_count = serializers.SerializerMethodField()

    class Meta:
        model = BingoCardCategory
        fields = ['name', 'id', 'icon_url', 'is_subscribed', 'subscriber_count']

    def get_subscriber_count(self, category: BingoCardCategory):
        return category.subscribers.count()

    def get_is_subscribed(self, category: BingoCardCategory):
        user = self.context['request'].user
        try:
            site_user = user.site_user
        except AttributeError:
            pass
        else:
            return category.subscribers.filter(id=site_user.id).exists()


class UserDetailSerializer(serializers.ModelSerializer):
    categories_created = CategoryRelatedSerializer(many=True)
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = SiteUser
        fields = ['name', 'id', 'score', 'created_at', 'is_following', 'categories_created']

    def get_is_following(self, followee: SiteUser):
        user = self.context['request'].user
        try:
            follower = user.site_user
        except AttributeError:
            pass
        else:
            return followee.followers.filter(id=follower.id).exists()


class CategorySerializer(serializers.ModelSerializer):
    author = UserDetailSerializer(**is_immutable)
    hashtags = HashtagSerializer(many=True)
    created_at = serializers.DateTimeField(**is_immutable)
    is_subscribed = serializers.SerializerMethodField()
    subscriber_count = serializers.SerializerMethodField()
    related_categories = serializers.SerializerMethodField()

    name = serializers.CharField(
        validators=[
            validators.only_letters_and_numbers,
            validators.length_is_(20)])

    class Meta:
        model = BingoCardCategory
        fields = ['name', 'author', 'id', 'created_at', 'is_subscribed', 'description',
                  'subscriber_count', 'hashtags', 'banner_url', 'icon_url', 'related_categories']
        extra_kwargs = {
            field: is_immutable
            for field in ['id']
        }

    def get_related_categories(self, category: BingoCardCategory):
        request = self.context['request']
        # subscription_set is used instead of subscribers bc subscribers doesn't give all the category ids
        related_names = category.subscription_set.values_list('user__subscriptions__name', flat=True)
        if not related_names.exists():
            return []
        related_dict = {}
        for n in related_names:
            related_dict[n] = related_dict.get(n, 0) + 1
        top_10 = sorted(related_dict, key=lambda i: related_dict[i], reverse=True)[:11]
        top_10.remove(category.name)
        top_5 = difflib.get_close_matches(category.name, top_10, 5)
        print(f'{top_5 = }')
        related_objs = self.Meta.model.objects.filter(name__in=top_5)

        return [CategoryRelatedSerializer(c, context={'request': request}).data
                for c in related_objs
                if c.id != category.id]

    def get_subscriber_count(self, category: BingoCardCategory):
        return category.subscribers.count()

    def get_is_subscribed(self, category: BingoCardCategory):
        user = self.context['request'].user
        try:
            site_user = user.site_user
        except AttributeError:
            pass
        else:
            return category.subscribers.filter(id=site_user.id).exists()

    def create(self, validated_data):
        ModelClass = self.Meta.model
        author = self.context['request'].user.site_user
        validated_data['author'] = author

        category = ModelClass.objects.filter(name__iexact=validated_data['name']).first()
        if not category:
            category = ModelClass.objects.create(**validated_data)

        return category


class TileSerializer(serializers.ModelSerializer):
    # id fields needs explicit field definition if they are to be used in creation/update
    id = serializers.IntegerField()

    class Meta:
        model = BingoTile
        fields = ['id', 'text']


class CategorySmallSerializer(serializers.ModelSerializer):
    class Meta:
        model = BingoCardCategory
        fields = ['name']
        extra_kwargs = {
            'name': {'validators': [validators.category_name_exists]}
        }

    def create(self, category_data):
        ModelClass = self.Meta.model
        category = ModelClass.objects.filter(name__iexact=category_data['name']).first()
        return category


class UserSmallSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteUser
        fields = ['name', 'id']


class CardDetailSerializer(serializers.ModelSerializer):
    category = CategorySmallSerializer()
    upvoted = serializers.SerializerMethodField()
    author = UserSmallSerializer(**is_immutable)
    tiles = TileSerializer(many=True)
    hashtags = HashtagSerializer(many=True, read_only=True)

    class Meta:
        model = BingoCard
        fields = ['id', 'score', 'name', 'author', 'created_at',
                  'hashtags', 'upvoted', 'category', 'tiles']

        extra_kwargs = {
            f: is_immutable
            for f in ['score', 'created_at']

            #'name': {'validators': [validators.length_is_(50)]},
        }

    def get_upvoted(self, card):
        user = self.context['request'].user
        try:
            site_user = user.site_user
        except AttributeError:
            pass
        else:
            vote = Vote.objects.filter(card=card, user=site_user).first()
            if vote:
                return vote.up

    def update(self, card, card_data):
        '''Only changes tile data.'''
        #card.name = card_data['name']
        tile_data = card_data.pop('tiles')

        #from pprint import pprint
        #pprint(tile_data)
        with atomic():
            #card.save()
            BingoTile.objects.bulk_update([
                BingoTile(id=tile['id'], text=tile['text'])
                for tile in tile_data
            ], ['text'])

        return card


class CardListSerializer(CardDetailSerializer):
    tiles = TileSerializer(many=True, write_only=True)

    def validate(self, card_data):
        if len(card_data['tiles']) != 25:
            raise serializers.ValidationError('Card must contain exactly 25 tiles.')
        return card_data

    def create(self, card_data):
        CardModel = self.Meta.model

        category_data = card_data.pop('category')
        category = self.fields['category'].create(category_data)
        author = self.context['request'].user.site_user

        card_data.update({
            'author': author,
            'category': category,
            'score': 1,
            'ups': 1,
            'votes_total': 1,
        })

        tile_data = card_data.pop('tiles')

        with atomic():
            card = CardModel.objects.create(**card_data)

            Vote.objects.create(
                user=author,
                card=card,
                up=True)

            self.fields['tiles'].create(
                [{'text': tile['text'], 'card': card}
                 for tile in tile_data]
            )

        return card


class CardVoteSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(validators=[validators.card_exists])

    class Meta:
        model = BingoCard
        fields = ['id']


class VoteSerializer(serializers.ModelSerializer):
    card = CardVoteSerializer()

    class Meta:
        model = Vote
        fields = ['up', 'card']

    def create(self, vote_data: dict):
        VoteModel = self.Meta.model

        card_id = vote_data['card']['id']
        card = BingoCard.objects.get(id=card_id)
        vote_data['card'] = card

        new_up = vote_data['up']

        old = False
        try:
            vote = VoteModel.objects.create(**vote_data)
        except IntegrityError:
            old = True
            vote_data.pop('up')
            vote = VoteModel.objects.filter(**vote_data).first()

        #new_score = 1 if new_up else -1
        #old_score = (1 if vote.up else -1) if old else 0
        #keep = new_score - old_score
        #score = keep or new_score * (-1 if old else 1)
        #ups = -1 if old_score == 1 else 1 if new_score == 1 else 0
        #total = -1 if not keep else 1 if not old else 0

        #card.ups += ups
        #card.votes_total += total
        #author = card.author
        #for obj in [card, author]:
        #    obj.score += score

        #card.best = best_score(card.ups, card.votes_total)
        #card.hot = hot_score(card.ups, card.votes_total, card.created_timestamp)
        #print(card)

        with atomic():
            if old:
                #if keep:
                if vote.up != new_up:
                    vote.up = new_up
                    vote.save()
                else:
                    vote.delete()

            #card.save()
            #author.save()

        return vote


class CategorySearchBarSerializer(serializers.ModelSerializer):
    class Meta:
        model = BingoCardCategory
        fields = ['name']


class CardSearchBarSerializer(serializers.ModelSerializer):
    class Meta:
        model = BingoCard
        fields = ['name', 'id']


class UserFollowSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(validators=[validators.user_exists])

    class Meta:
        model = SiteUser
        fields = ['id']

    def create(self, user_data: dict):
        follower = self.context['request'].user.site_user
        followee = self.Meta.model.objects.get(id=user_data['id'])

        if followee.followers.filter(id=follower.id).exists():
            followee.followers.remove(follower)
        else:
            followee.followers.add(follower)

        return followee


class CategorySubscribeSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(validators=[validators.category_id_exists])

    class Meta:
        model = BingoCardCategory
        fields = ['id']

    def create(self, category_data: dict):
        user = self.context['request'].user.site_user
        category = self.Meta.model.objects.get(id=category_data['id'])

        if category.subscribers.filter(id=user.id).exists():
            category.subscribers.remove(user)
        else:
            category.subscribers.add(user)

        return category


#class CategoryIdSerializer(serializers.ModelSerializer):
#    id = serializers.IntegerField(validators=[validators.category_exists])
#
#    class Meta:
#        model = BingoCardCategory
#        fields = ['id']
#
#
#class SubToCategorySerializer(serializers.ModelSerializer):
#    category = CategoryIdSerializer()
#
#    class Meta:
#        model = Subscription
#        fields = ['category']
#
#    def create(self, sub_data: dict):
#        SubModel = self.Meta.model
#
#        category_id = sub_data['category']['id']
#        category = BingoCardCategory.objects.get(id=category_id)
#        sub_data['category'] = category
#
#        try:
#            subscription = SubModel.objects.create(**sub_data)
#        except IntegrityError:
#            subscription = SubModel.objects.filter(**sub_data).first()
#            subscription.delete()
#
#        return subscription
#
#
#class UserIdSerializer(serializers.ModelSerializer):
#    id = serializers.IntegerField(validators=[validators.user_exists])
#
#    class Meta:
#        model = SiteUser
#        fields = ['id']
#
#
#class FollowUserSerializer(serializers.ModelSerializer):
#    followee = UserIdSerializer()
#
#    class Meta:
#        model = Follow
#        fields = ['followee']
#
#    def create(self, sub_data: dict):
#        SubModel = self.Meta.model
#
#        followee_id = sub_data['followee']['id']
#        followee = SiteUser.objects.get(id=followee_id)
#        sub_data['followee'] = followee
#
#        try:
#            subscription = SubModel.objects.create(**sub_data)
#            print('creating')
#        except IntegrityError:
#            subscription = SubModel.objects.filter(**sub_data).first()
#            subscription.delete()
#            print('deleting')
#
#        print(subscription)
#        return subscription


#def card_meta(*, detail=False, lst=False):
#
#    immutable_fields = {
#        f: is_immutable
#        for f in ['score', 'created_at', 'hashtags']
#    }
#
#    #detail = ['tiles'] if detail else []
#    lst = False
#    lst = ['top_3'] if lst else []
#
#    class Meta:
#        model = BingoCard
#        fields = ['id', 'score', 'name', 'author', 'created_at', 'hashtags',
#                  'upvoted', 'category', 'tiles', *lst]
#
#        extra_kwargs = {
#            #'name': {'validators': [validators.length_is_(50)]},
#            **immutable_fields,
#        }
#
#    return Meta
#
#
