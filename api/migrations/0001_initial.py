# Generated by Django 3.2 on 2021-08-27 04:47

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='BingoCard',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('created_timestamp', models.FloatField(default=0)),
                ('edited_at', models.DateTimeField(auto_now=True)),
                ('edited_timestamp', models.FloatField(default=0)),
                ('best', models.FloatField(default=0)),
                ('hot', models.FloatField(default=0)),
                ('ups', models.IntegerField()),
                ('votes_total', models.IntegerField()),
                ('score', models.IntegerField()),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='BingoCardCategory',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=20, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('icon_url', models.CharField(default='', max_length=2000)),
                ('banner_url', models.CharField(default='', max_length=2000)),
                ('description', models.CharField(default='', max_length=200)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Follow',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name='SiteUser',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('score', models.IntegerField(default=0)),
                ('auth_user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='site_user', to=settings.AUTH_USER_MODEL)),
                ('followers', models.ManyToManyField(related_name='following', through='api.Follow', to='api.SiteUser')),
            ],
        ),
        migrations.CreateModel(
            name='TestParent',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=20, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='TestChild',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=20, unique=True)),
                ('parent', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='children', to='api.testparent')),
            ],
        ),
        migrations.CreateModel(
            name='Subscription',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.bingocardcategory')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.siteuser')),
            ],
        ),
        migrations.CreateModel(
            name='Hashtag',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=20, unique=True)),
                ('cards', models.ManyToManyField(related_name='hashtags', to='api.BingoCard')),
                ('categories', models.ManyToManyField(related_name='hashtags', to='api.BingoCardCategory')),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.AddField(
            model_name='follow',
            name='followee',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='follows_from', to='api.siteuser'),
        ),
        migrations.AddField(
            model_name='follow',
            name='follower',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='follows_to', to='api.siteuser'),
        ),
        migrations.CreateModel(
            name='BingoTile',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('text', models.CharField(max_length=200)),
                ('score', models.FloatField(default=0)),
                ('card', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tiles', to='api.bingocard')),
            ],
        ),
        migrations.AddField(
            model_name='bingocardcategory',
            name='author',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='categories_created', to='api.siteuser'),
        ),
        migrations.AddField(
            model_name='bingocardcategory',
            name='subscribers',
            field=models.ManyToManyField(related_name='subscriptions', through='api.Subscription', to='api.SiteUser'),
        ),
        migrations.AddField(
            model_name='bingocard',
            name='author',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='cards_created', to='api.siteuser'),
        ),
        migrations.AddField(
            model_name='bingocard',
            name='category',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='cards', to='api.bingocardcategory'),
        ),
        migrations.CreateModel(
            name='Vote',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('up', models.BooleanField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('card', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='votes', to='api.bingocard')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='votes', to='api.siteuser')),
            ],
            options={
                'unique_together': {('user', 'card')},
            },
        ),
        migrations.AddConstraint(
            model_name='subscription',
            constraint=models.UniqueConstraint(fields=('user', 'category'), name='unique_subscription'),
        ),
        migrations.AddConstraint(
            model_name='follow',
            constraint=models.UniqueConstraint(fields=('followee', 'follower'), name='unique_follow'),
        ),
    ]
