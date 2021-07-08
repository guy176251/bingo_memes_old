from django.core.management.base import BaseCommand
from api.models import BingoCard, SiteUser, Vote, BingoCardCategory, tile_fields
from random import sample
from django.contrib.auth.models import User
from libreddit_sort import hot_score, best_score


class Command(BaseCommand):
    def handle(self, *args, **options):
        if BingoCard.objects.all().count() > 0:
            print('Bingo cards already exist. Can only run this script to initialize an empty database.')
            return

        # 10 users, including myself
        num_of_usrs = 10
        num_of_cards = 10
        num_of_categories = 5
        total_cards = num_of_cards * num_of_usrs

        auth_me = User.objects.filter(username='long', is_superuser=True).first()
        if not auth_me:
            print('No superuser with username "long", should prob created yourself lol.')
            return

        site_me = SiteUser.objects.create(name=auth_me.username, auth_user=auth_me, score=num_of_cards)

        site_usrs = []
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
        site_usrs.append(site_me)

        BingoCardCategory.objects.bulk_create([
            BingoCardCategory(name=n,
                              author=site_usrs[i // (num_of_usrs // num_of_categories)])

            for i, n in enumerate([f'TrashTaste{j}' for j in range(num_of_categories)])
        ])
        categories = BingoCardCategory.objects.all()

        tile_texts = [sample(all_tile_texts[1:], 24) for _ in range(total_cards)]
        for texts in tile_texts:
            texts.insert(12, all_tile_texts[0])

        BingoCard.objects.bulk_create([
            BingoCard(author=site_usrs[i // num_of_cards],
                      name=f'Trash Taste Card #{i + 1}',
                      score=1,
                      ups=1,
                      votes_total=1,
                      best=best_score(1, 1),
                      category=categories[i // (total_cards // num_of_categories)],
                      **dict(zip(tile_fields, tile_texts[i])))

            for i in range(total_cards)
        ])

        cards = BingoCard.objects.all()
        for c in cards:
            timestamp = c.created_at.timestamp()
            c.created_timestamp = timestamp
            c.hot = hot_score(1, 1, timestamp)

        BingoCard.objects.bulk_update(cards, ['created_timestamp', 'hot'])

        #for card, texts in zip(cards, tile_texts):
        #    texts.insert(12, all_tile_texts[0])
        #    BingoTile.objects.bulk_create([BingoTile(text=text, card=card) for text in texts])

        Vote.objects.bulk_create([Vote(user=card.author, card=card, up=True) for index, card in enumerate(cards)])


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
