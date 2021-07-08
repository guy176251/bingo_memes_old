from django.db import models
from django.conf import settings

tile_fields = [f'tile_{i}' for i in range(1, 26)]


class SiteUser(models.Model):
    name = models.CharField(max_length=20)
    auth_user = models.OneToOneField(settings.AUTH_USER_MODEL,
                                     related_name='site_user',
                                     on_delete=models.CASCADE)

    created_at = models.DateTimeField(auto_now_add=True)
    score = models.IntegerField(default=0)


class BingoCardCategory(models.Model):
    name = models.CharField(max_length=20, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    author = models.ForeignKey(SiteUser,
                               related_name='categories_created',
                               on_delete=models.CASCADE)


class BingoCard(models.Model):
    name = models.CharField(max_length=50)

    author = models.ForeignKey(SiteUser,
                               related_name='bingo_cards',
                               on_delete=models.CASCADE)

    created_at = models.DateTimeField(auto_now_add=True)
    created_timestamp = models.FloatField(default=0)
    category = models.ForeignKey(BingoCardCategory,
                                 related_name='cards',
                                 on_delete=models.CASCADE)

    best = models.FloatField(default=0) # wilson score
    hot = models.FloatField(default=0)
    ups = models.IntegerField()
    votes_total = models.IntegerField()
    score = models.IntegerField()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'''
Card {self.id}:
    Name: "{self.name}"
    Created At: {self.created_at}
    Score: {self.score}
    Best: {self.best}
    Hot: {self.hot}
    Votes:
        Up: {self.ups}
        Total: {self.votes_total}
'''


for tile in tile_fields:
    BingoCard.add_to_class(tile, models.CharField(max_length=200))


class Vote(models.Model):
    user = models.ForeignKey(SiteUser,
                             related_name='votes',
                             on_delete=models.CASCADE)

    card = models.ForeignKey(BingoCard,
                             related_name='votes',
                             on_delete=models.CASCADE)

    up = models.BooleanField()

    class Meta:
        unique_together = ['user', 'card']
