#from rest_framework.serializers import ValidationError
#from math import sqrt
from . import validators
from .models import BingoCard, tile_fields, Vote, SiteUser, BingoCardCategory
from django.contrib.auth.models import User
from django.core.validators import EmailValidator
from django.db import IntegrityError
from django.db.transaction import atomic
from rest_framework import serializers
from libreddit_sort import hot_score, best_score

is_immutable = {'required': False, 'read_only': True}


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


class UserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=False)

    class Meta:
        model = SiteUser
        fields = ['name', 'id', 'score']


class UserDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteUser
        fields = ['name', 'id', 'score', 'created_at']


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


class CategorySerializer(serializers.ModelSerializer):
    author = UserSerializer(**is_immutable)
    created_at = serializers.DateTimeField(**is_immutable)

    name = serializers.CharField(
        validators=[
            validators.only_letters_and_numbers,
            validators.length_is_(20)])

    class Meta:
        model = BingoCardCategory
        fields = ['name', 'author', 'id', 'created_at']
        extra_kwargs = {
            field: is_immutable
            for field in ['id']
        }

    def create(self, validated_data):
        ModelClass = self.Meta.model
        author = self.context['request'].user.site_user
        validated_data['author'] = author

        category = ModelClass.objects.filter(name__iexact=validated_data['name']).first()
        if not category:
            category = ModelClass.objects.create(**validated_data)

        return category


def card_meta(*, show_tiles=True):

    tile_serializer_fields = {
        tile: {
            'validators': [validators.length_is_(200)],
            'write_only': not show_tiles
        }
        for tile in tile_fields
    }

    immutable_fields = {
        f: is_immutable
        for f in ['score', 'created_at']
    }

    class Meta:
        model = BingoCard
        fields = ['id', 'score', 'name', 'author', 'created_at', 'upvoted', 'category', *tile_fields]
        extra_kwargs = {
            'name': {'validators': [validators.length_is_(50)]},
            **tile_serializer_fields,
            **immutable_fields,
        }

    return Meta


class CardBaseSerializer(serializers.ModelSerializer):
    category = CategorySerializer()
    upvoted = serializers.SerializerMethodField()
    author = UserSerializer(**is_immutable)

    Meta = card_meta()

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


class CardDetailSerializer(CardBaseSerializer):
    pass


class CardListSerializer(CardBaseSerializer):
    Meta = card_meta(show_tiles=False)

    def create(self, card_data):
        CardModel = self.Meta.model

        author = self.context['request'].user.site_user

        category_data = card_data.pop('category')
        category_serializer = self.fields['category']
        category = category_serializer.create(category_data)

        card_data.update({
            'author': author,
            'category': category,
            'score': 1,
            'ups': 1,
            'votes_total': 1,
        })

        with atomic():
            card = CardModel.objects.create(**card_data)
            timestamp = card.created_at.timestamp()
            card.created_timestamp = timestamp
            card.hot = hot_score(1, 1, timestamp)
            card.best = best_score(1, 1)
            card.save()

            Vote.objects.create(
                user=author,
                card=card,
                up=True)

            author.score += 1
            author.save()

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

        new_score = 1 if new_up else -1
        old_score = (1 if vote.up else -1) if old else 0
        keep = new_score - old_score
        score = keep or new_score * (-1 if old else 1)
        ups = -1 if old_score == 1 else 1 if new_score == 1 else 0
        total = -1 if not keep else 1 if not old else 0

        card.ups += ups
        card.votes_total += total
        author = card.author
        for obj in [card, author]:
            obj.score += score

        card.best = best_score(card.ups, card.votes_total)
        card.hot = hot_score(card.ups, card.votes_total, card.created_timestamp)
        print(card)

        with atomic():
            if old:
                if keep:
                    vote.up = new_up
                    vote.save()
                else:
                    vote.delete()

            card.save()
            author.save()

        return vote


#def wilson_score(card: BingoCard):
#    up = card.ups
#    total = card.votes.count()
#
#    print(f'\n{total = }\n{up = }')
#
#    if (total == 0):
#        return 0
#
#    z = 1.96
#    phat = up / total
#
#    a = phat + z * z / (2 * total)
#    s = (phat * (1 - phat) + z * z / (4 * total)) / total
#    print(f'\n{s = }')
#    b = z * sqrt(s)
#    c = 1 + z * z / total
#
#    result = (a - b) / c
#    card.top = result
#
#    print(f'\n{result = }\n')


#class CategoryListSerializer(serializers.ModelSerializer):
#    name = serializers.CharField(validators=[validators.only_letters_and_numbers, validators.length_is_(20)])
#    cards_count = serializers.SerializerMethodField()
#
#    class Meta:
#        model = BingoCardCategory
#        fields = ['name', 'id', 'created_at', 'cards_count']
#        extra_kwargs = {
#            field: is_immutable
#            for field in ['id', 'created_at']
#        }
#
#    def get_cards_count(self, category):
#        return category.cards.count()
#
#    def create(self, validated_data):
#        category = BingoCardCategory.objects.filter(name__iexact=validated_data['name']).first()
#        if not category:
#            category = BingoCardCategory.objects.create(**validated_data)
#        return category

    #def createe(self, vote_data):
    #    VoteModel = self.Meta.model

    #    card = BingoCard.objects.get(id=vote_data['card']['id'])
    #    vote_data['card'] = card

    #    author = card.author
    #    keep = new = True

    #    try:
    #        vote = VoteModel.objects.create(**vote_data)
    #        adjust_score(value_of(vote.up), card, author)
    #    except IntegrityError:
    #        up = vote_data.pop('up')
    #        vote = VoteModel.objects.filter(**vote_data).first()
    #        new = False
    #        if up == vote.up:
    #            adjust_score(-value_of(up), card, author)
    #            keep = False
    #        else:
    #            adjust_score(2 * value_of(up), card, author)
    #            vote.up = up

    #    wilson_score(card)

    #    with atomic():
    #        author.save()
    #        card.save()
    #        if not keep:
    #            vote.delete()
    #        elif not new:
    #            vote.save()

    #    return vote

#def value_of(up):
#    return 1 if up else -1
#
#
#def adjust_score(value, *objs):
#    for obj in objs:
#        obj.score += value
#
#
