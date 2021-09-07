from django.dispatch import receiver
from django.db.models.signals import post_save, pre_save, post_init, pre_init, pre_delete, post_delete
from .models import Vote, BingoCard, SiteUser, Hashtag
from libreddit_sort import hot_score, best_score
from django.db.transaction import atomic
import re


@receiver(post_save, sender=BingoCard)
def card_post_create(sender: BingoCard, instance: BingoCard, created: bool, **kwargs):
    if not created:
        return

    create_unix_timestamp(instance)
    create_hashtags(instance)


def create_unix_timestamp(card: BingoCard):
    # get unix timestamp
    card.created_timestamp = card.created_at.timestamp()
    card.save()


def create_hashtags(card: BingoCard):
    # parse bingo card name for first 4 hashtags and create them, then add them to card and category
    hashtags_text = re.findall(r'#(\w+)', card.name)[:4]

    Hashtag.objects.bulk_create([
        Hashtag(name=h.lower())
        for h in hashtags_text
        if len(h) <= 20
    ], ignore_conflicts=True)

    hashtags = Hashtag.objects.filter(name__in=hashtags_text)

    card.hashtags.add(*hashtags)
    card.category.hashtags.add(*hashtags)


@receiver(post_save, sender=Vote)
def increase_card_scores(sender: Vote, instance: Vote, created: bool, **kwargs):
    card = instance.card
    adjust_card_scores(card)


@receiver(post_delete, sender=Vote)
def decrease_card_scores(sender: Vote, instance: Vote, using, **kwargs):
    card = instance.card
    adjust_card_scores(card)


def adjust_card_scores(card: BingoCard):
    up = card.votes.filter(up=True).count()
    total = card.votes.count()
    score = up - (total - up)
    timestamp = card.created_at.timestamp()

    card.hot = hot_score(up, total, timestamp)
    card.best = best_score(up, total)
    card.score = score

    with atomic():
        card.save()

        author = card.author
        author.score = sum(author.cards_created.values_list('score', flat=True))
        author.save()

    #print(card)
