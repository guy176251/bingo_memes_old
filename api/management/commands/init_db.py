import itertools
from typing import List, Optional
from dataclasses import dataclass
from django.core.management.base import BaseCommand
from random import sample, randint, choice
from django.contrib.auth.models import User
from django.db.transaction import atomic
from libreddit_sort import hot_score, best_score
from api.signals import create_hashtags, create_unix_timestamp
from api.models import (
    BingoCard,
    BingoTile,
    BingoCardCategory,
    SiteUser,
    Vote,
    #UserSubscription,
    #CategorySubscription,
)

# 10 users, including myself
num_of_usrs = 10
num_of_cards = 10
num_of_categories = 5
total_cards = num_of_cards * num_of_usrs
#banner_url = 'https://styles.redditmedia.com/t5_2p976a/styles/bannerBackgroundImage_06kn9itvtu451.png?width=4000&s=11c921cbb8dfbf979b45ef928693881fe3af1741'
banner_url = 'https://yt3.ggpht.com/Cxw4AarF_wX_PqgBJ-BsK6C_toAsxVAyGnsHJFssO9D7B3H2LS4xq1a7p0VSV-GstyLxPEOR5g=w1707-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj'
icon_url = 'https://yt3.ggpht.com/ytc/AKedOLQFVN7wLaJFbdPU56qOkNlbkrMneYpTmGpneRig=s88-c-k-c0x00ffffff-no-rj-mo'
category_description = 'This is one of several test categories that are based on Trash Taste. Trash Taste is a podcast about various topics, which sometimes includes anime.'


def db_check() -> SiteUser:
    '''
    Run before any database init function. Returns site user.
    '''

    if BingoCard.objects.all().count() > 0:
        print('Bingo cards already exist. Can only run this script to initialize an empty database.')
        return

    auth_me = User.objects.filter(username='long', is_superuser=True).first()
    if not auth_me:
        print('No superuser with username "long", should prob created yourself lol.')
        return

    site_me = SiteUser.objects.create(name=auth_me.username, auth_user=auth_me, score=num_of_cards)

    return site_me


@dataclass
class DummyUser:
    name: str
    password: str
    email: str
    obj: Optional[SiteUser] = None


@dataclass
class DummyCategory:
    name: str
    author_name: str
    sub_names: List[str]
    obj: Optional[BingoCardCategory] = None


@dataclass
class DummyCard:
    name: str
    category_name: str
    author_name: str
    obj: Optional[BingoCard] = None


@dataclass
class DummyData:
    users: List[DummyUser]
    categories: List[DummyCategory]
    cards: List[DummyCard]


def create_dummy_data() -> DummyData:
    '''
    Create various "groups" of users that are subscribed
    to certain categories to test various filters.
    '''

    category_types = {
        'MEMES',
        'WEEB',
        'POLITICS',
        'ART',
        'SPORTS',
        'NEWS',
    }
    category_names = {
        t: {f'{t}_{c}' for c in {'A', 'B', 'C', 'D', 'E'}}
        for t in category_types
    }
    user_names = {
        t: {f'{t}_USER_{i}' for i in range(1, 6)}
        for t in category_types
    }
    #all_cat_names = set(itertools.chain.from_iterable(category_names.values()))
    all_usr_names = set(itertools.chain.from_iterable(user_names.values()))

    user_objs = list(itertools.chain.from_iterable(
        (
            DummyUser(
                name=n,
                password=f'pass{n[-1]}',
                email=f'{n}@fakepoopmail.com',
            )
            for n in names
        )
        for t, names in user_names.items()
    ))

    card_objs = list(
        itertools.chain.from_iterable(
            itertools.chain.from_iterable(
                (
                    (
                        DummyCard(
                            name=f'{name}_CARD_{i} #' + ' #'.join(sample(all_tag_texts, randint(1, 3))),
                            category_name=name,
                            author_name=choice(tuple(user_names[t]))
                        )
                        for i in range(1, 11)
                    )
                    for name in category_names[t]
                )
                for t in category_types
            )
        )
    )

    category_objs = list(itertools.chain.from_iterable(
        (

            DummyCategory(
                name=n,
                author_name=choice(tuple(user_names[t])),
                sub_names=[
                    *sample(tuple(user_names[t]), randint(2, 4)),
                    choice(tuple(all_usr_names - user_names[t]))
                ],
            )
            for n in names
        )
        for t, names in category_names.items()
    ))

    return DummyData(
        users=user_objs,
        categories=category_objs,
        cards=card_objs,
    )


@atomic
def init_db_new():
    '''
    Used with dummy data.
    '''

    db_check()
    dummy_data = create_dummy_data()

    for usr in dummy_data.users:
        print(usr)
        auth_usr = User.objects.create_user(
            username=usr.name,
            password=usr.password,
            email=usr.email,
        )
        site_usr = SiteUser.objects.create(
            name=auth_usr.username,
            auth_user=auth_usr,
            score=num_of_cards,
        )
        usr.obj = site_usr

    #auth_usrs = User.objects.bulk_create([
    #    User(
    #        username=usr.name,
    #        password=usr.password,
    #        email=usr.email,

    #    ) for usr in dummy_data.users
    #])

    #site_usrs = SiteUser.objects.bulk_create([
    #    SiteUser(
    #        name=usr.username,
    #        auth_user=usr,
    #        score=num_of_cards,

    #    ) for usr in auth_usrs
    #])

    #for usr, obj in zip(dummy_data.users, site_usrs):
    #    usr.obj = obj

    user_dict = {usr.name: usr for usr in dummy_data.users}

    cat_objs = BingoCardCategory.objects.bulk_create([
        BingoCardCategory(
            name=cat.name,
            author=user_dict[cat.author_name].obj,
            icon_url=icon_url,
            banner_url=banner_url,
            description=category_description,

        ) for cat in dummy_data.categories
    ])

    for cat, obj in zip(dummy_data.categories, cat_objs):
        cat.obj = obj
        cat.obj.subscribers.add(*[user_dict[name].obj for name in cat.sub_names])
        #print(f'Category is same: {cat.name == obj.name}')

    category_dict = {cat.name: cat for cat in dummy_data.categories}

    for usr in dummy_data.users:

        #for cat_name in usr.sub_names:
        #    category_dict[cat_name].obj.subscribers.add(usr.obj)

        follow_pool = [follower for follower in dummy_data.users
                       if follower.obj.id != usr.obj.id]

        for follower in sample(follow_pool, randint(1, 3)):
            usr.obj.followers.add(follower.obj)

    card_objs = BingoCard.objects.bulk_create([
        BingoCard(
            name=card.name,
            author=user_dict[card.author_name].obj,
            category=category_dict[card.category_name].obj,
            score=1,
            ups=1,
            votes_total=1,
            best=best_score(1, 1),
        )
        for card in dummy_data.cards
    ])

    for card, obj in zip(dummy_data.cards, card_objs):
        card.obj = obj

    Vote.objects.bulk_create([
        Vote(user=card.obj.author, card=card.obj, up=True)
        for card in dummy_data.cards
    ])

    for card in dummy_data.cards:
        create_unix_timestamp(card.obj)
        create_hashtags(card.obj)

    BingoCard.objects.bulk_update(
        [card.obj for card in dummy_data.cards],
        ['created_timestamp', 'hot']
    )

    BingoTile.objects.bulk_create(itertools.chain.from_iterable(
        (BingoTile(text=f'tile {i}', card=card.obj) for i in range(1, 26))
        for card in dummy_data.cards
    ))

    for card in dummy_data.cards:
        voter_pool = [usr for usr in dummy_data.users
                      if card.obj.author.id != usr.obj.id]

        for voter in sample(voter_pool, randint(1, 10)):
            Vote.objects.create(user=voter.obj,
                                card=card.obj,
                                up=True)


def init_db():
    site_me = db_check()

    site_usrs = [site_me]
    for i in range(1, num_of_usrs):
        auth_usr = User.objects.create_user(
            username=f'testuser{i}',
            password=f'pass{i}',
            email=f'user{i}@fakepoopmail.com'
        )
        site_usr = SiteUser.objects.create(
            name=auth_usr.username,
            auth_user=auth_usr,
            score=num_of_cards
        )
        site_usrs.append(site_usr)
    #site_usrs.append(site_me)

    BingoCardCategory.objects.bulk_create([
        BingoCardCategory(name=n,
                          icon_url=icon_url,
                          banner_url=banner_url,
                          description=category_description,
                          author=site_usrs[i // (num_of_usrs // num_of_categories)])

        for i, n in enumerate([f'TrashTaste{j}' for j in range(num_of_categories)])
    ])
    categories = list(BingoCardCategory.objects.all())

    tile_text_groups = [sample(all_tile_texts[1:], 24) for _ in range(total_cards)]
    for each in tile_text_groups:
        each.insert(12, all_tile_texts[0])

    BingoCard.objects.bulk_create([
        BingoCard(author=site_usrs[i // num_of_cards],
                  category=categories[i // (total_cards // num_of_categories)],
                  name=f'Trash Taste Card {i + 1} #' + ' #'.join(sample(all_tag_texts, randint(1, 3))),
                  score=1,
                  ups=1,
                  votes_total=1,
                  best=best_score(1, 1),
                  #**dict(zip(tile_fields, tile_text_groups[i]))
                  )

        for i in range(total_cards)
    ])

    cards = BingoCard.objects.all()

    with atomic():
        for c in cards:
            create_unix_timestamp(c)
            create_hashtags(c)

    BingoCard.objects.bulk_update(cards, ['created_timestamp', 'hot'])

    for tile_texts, card in zip(tile_text_groups, cards):
        BingoTile.objects.bulk_create([
            BingoTile(text=text, card=card)
            for text in tile_texts
        ])

    for usr in site_usrs:
        #CategorySubscription.objects.bulk_create([
        #    CategorySubscription(category=c, user=usr)
        #    for c in sample(categories, 2)
        #])

        for c in sample(categories, 2):
            c.subscribers.add(usr)

        user_pool = [u for u in site_usrs if usr.id != u.id]
        for u in sample(user_pool, 2):
            u.followers.add(usr)

        #UserSubscription.objects.bulk_create([
        #    UserSubscription(follower=usr, followee=u)
        #    for u in sample(user_pool, 2)
        #])

    Vote.objects.bulk_create([
        Vote(user=card.author, card=card, up=True)
        for index, card in enumerate(cards)
    ])


all_tag_texts = [
    'monke',
    'grant',
    'karen',
    'food',
    'anime',
    'japan',
]

all_tile_texts = [
    'Free Space',
    'They talk to Meilyne behind the camera',
    '"When I worked at the BBC..."',
    'They mention JOJO',
    'CUM! CUM! CUM!',
    'Garnt laughs to himself',
    'Connor leans back while talking so you cannot hear him',
    'Joey flexes his Japanese',
    '"it hits different"',
    'Someone says "giga-brain"',
    'Mentioning 93%, Gig UK, Hentaiman or any nickname',
    'TOURNAMENT AAAAAAARC!!!',
    'They mention hentai',
    'Everyone wears shirts from same franchise',
    'They talks about food',
    '"Back in uni/college..."',
    'Someone says "monkey brain"',
    'Garnt wears shorts',
    'Someone tries to say something but gets interrupted',
    'They talk about living in Japan',
    'Someone mentions School Days',
    'Someone mentions the Fate franchise',
    'They mention a fan-made meme or the subreddit',
    'Garnt says "so for me it was like..."',
    'Connor story time',
    'When you actually laughed and feel wholesome',
    'NUT!',
    'GUEST EPISODE',
    'Garnt says "I feel like..."',
    '"I\'m just gonna say it..."',
    'CHOTTO MATE',
    'ISEKAI',
    '"So here\'s the thing..."',
    'They show the original source material',
    '"but with attitude"',
    '"...you know what I mean?"',
    'WEEB',
    'ANIME TIDDIES',
    '"It\'s like that meme..."',
    '"...that was a big tangent, what were we talking about again?"',
    'Garnt says "so here\'s a question for you..."',
    '"pretty mid"',
    'They actually talk about anime',
    'SIMP',
    'Connor purposefully starts an argument',
]

#print(len(max(all_tile_texts, key=lambda t: len(t))))


class Command(BaseCommand):
    def handle(self, *args, **options):
        init_db_new()
