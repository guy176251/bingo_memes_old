from rest_framework.serializers import ValidationError
from django.contrib.auth.models import User
import re
from .models import BingoCard, BingoCardCategory, SiteUser, BingoTile


def user_exists(ID):
    if not SiteUser.objects.filter(id=ID).exists():
        raise ValidationError('Invalid user id.')


def category_name_exists(name):
    if not BingoCardCategory.objects.filter(name__iexact=name).exists():
        raise ValidationError('Invalid category id.')


def category_id_exists(ID):
    if not BingoCardCategory.objects.filter(id=ID).exists():
        raise ValidationError('Invalid category id.')


def card_exists(ID):
    if not BingoCard.objects.filter(id=ID).exists():
        raise ValidationError('Invalid card id.')


def tile_exists(ID):
    if not BingoTile.objects.filter(id=ID).exists():
        raise ValidationError('Invalid bingo tile id.')


def password_length(password):
    if len(password) < 10:
        raise ValidationError('Password needs to be at least 10 characters long.')


def email_unique(email):
    if User.objects.filter(email=email).exists():
        raise ValidationError('Email is already registered.')


def username_length(username):
    if len(username) > 20:
        raise ValidationError('Username must be up to 20 characters long.')


def username_unique(username):
    if User.objects.filter(username=username).exists():
        raise ValidationError('Username is already taken.')


def only_letters_and_numbers(some_str):
    if not re.match(r'^\w+$', some_str):
        raise ValidationError('Field must only consist of letters and numbers.')


def category_unique(cat_name):
    if BingoCardCategory.objects.filter(db_name=cat_name.lower()).exists():
        raise ValidationError('Category name already exists.')


def length_is_(max_length: int):
    def check_length(some_str):
        if len(some_str) < 0 or len(some_str) > max_length:
            raise ValidationError(f'Must be {max_length} or less characters long.')
    return check_length
