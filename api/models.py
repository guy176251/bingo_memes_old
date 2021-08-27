from django.db import models
from django.conf import settings

#tile_fields = [f'tile_{i}' for i in range(1, 26)]


class SiteUser(models.Model):
    name = models.CharField(max_length=20)
    auth_user = models.OneToOneField(settings.AUTH_USER_MODEL,
                                     related_name='site_user',
                                     on_delete=models.CASCADE)

    created_at = models.DateTimeField(auto_now_add=True)
    score = models.IntegerField(default=0)
    followers = models.ManyToManyField('self',
                                       through='Follow',
                                       related_name='following',
                                       symmetrical=False)


class BingoCardCategory(models.Model):
    name = models.CharField(max_length=20, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    icon_url = models.CharField(max_length=2000, default='')
    banner_url = models.CharField(max_length=2000, default='')
    description = models.CharField(max_length=200, default='')

    author = models.ForeignKey(SiteUser,
                               related_name='categories_created',
                               on_delete=models.CASCADE)

    subscribers = models.ManyToManyField(SiteUser,
                                         through='Subscription',
                                         related_name='subscriptions')

    class Meta:
        ordering = ['-created_at']


class Follow(models.Model):
    follower = models.ForeignKey(SiteUser, on_delete=models.CASCADE, related_name='follows_to')
    followee = models.ForeignKey(SiteUser, on_delete=models.CASCADE, related_name='follows_from')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        #unique_together = ['user', 'following']
        constraints = [
            models.UniqueConstraint(
                fields=['followee', 'follower'],
                name='unique_follow')
        ]


class Subscription(models.Model):
    user = models.ForeignKey(SiteUser, on_delete=models.CASCADE)
    category = models.ForeignKey(BingoCardCategory, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        #unique_together = ['user', 'category']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'category'],
                name='unique_subscription')
        ]


class BingoCard(models.Model):
    name = models.CharField(max_length=50)

    author = models.ForeignKey(SiteUser,
                               related_name='cards_created',
                               on_delete=models.CASCADE)

    created_at = models.DateTimeField(auto_now_add=True)
    created_timestamp = models.FloatField(default=0)

    edited_at = models.DateTimeField(auto_now=True)
    edited_timestamp = models.FloatField(default=0)

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


class BingoTile(models.Model):
    text = models.CharField(max_length=200)
    score = models.FloatField(default=0)
    card = models.ForeignKey(BingoCard,
                             related_name='tiles',
                             on_delete=models.CASCADE)


class Hashtag(models.Model):
    name = models.CharField(max_length=20, unique=True)
    categories = models.ManyToManyField(BingoCardCategory, related_name='hashtags')
    cards = models.ManyToManyField(BingoCard, related_name='hashtags')

    class Meta:
        ordering = ['name']


class Vote(models.Model):
    user = models.ForeignKey(SiteUser,
                             related_name='votes',
                             on_delete=models.CASCADE)

    card = models.ForeignKey(BingoCard,
                             related_name='votes',
                             on_delete=models.CASCADE)

    up = models.BooleanField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'card']


class TestParent(models.Model):
    name = models.CharField(max_length=20, unique=True)


class TestChild(models.Model):
    name = models.CharField(max_length=20, unique=True)
    parent = models.ForeignKey(TestParent, related_name='children', on_delete=models.CASCADE)
