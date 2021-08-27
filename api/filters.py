from datetime import timedelta, datetime
from django.db.models import QuerySet, Count
from rest_framework import filters #, mixins
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.request import Request
from rest_framework.response import Response


class Pagination(PageNumberPagination):
    page_size = 10

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'page_size': self.page_size,
            'results': data,
        })


class CardCategoryFilter(filters.BaseFilterBackend):
    def filter_queryset(self, request: Request, cards: QuerySet, _):
        category = request.query_params.get('category')
        if category:
            try:
                cards = cards.filter(category__name__iexact=category)
            except Exception as err:
                print(err)
        return cards


class CardHashtagFilter(filters.BaseFilterBackend):
    def filter_queryset(self, request: Request, cards: QuerySet, _):
        hashtag = request.query_params.get('hashtag')
        if hashtag:
            try:
                cards = cards.filter(hashtags__name__iexact=hashtag)
            except Exception as err:
                print(err)
        return cards


class CardAuthorFilter(filters.BaseFilterBackend):
    def filter_queryset(self, request: Request, cards: QuerySet, _):
        user_id = request.query_params.get('user')
        if user_id:
            try:
                cards = cards.filter(author__id=user_id)
            except Exception as err:
                print(err)
        return cards


date_deltas = {
    'hour': {'hours': 1},
    'day': {'days': 1},
    'week': {'weeks': 1},
    'month': {'days': 30},
    'year': {'weeks': 52},
}


class DateFilter(filters.BaseFilterBackend):
    def filter_queryset(self, request: Request, cards: QuerySet, _):
        interval = date_deltas.get(request.query_params.get('from'))
        if interval:
            some_time_ago = datetime.today() - timedelta(**interval)
            try:
                cards = cards.filter(created_at__gte=some_time_ago)
            except Exception as err:
                print(err)
        return cards


class TopThreeCategoryFilter(filters.BaseFilterBackend):
    def filter_queryset(self, request: Request, queryset: QuerySet, _):
        return queryset.annotate(card_count=Count('cards')).order_by('-card_count')[:3]


def top_n_categories(n: int):
    class Wrapper(filters.BaseFilterBackend):
        def filter_queryset(self, request: Request, queryset: QuerySet, _):
            return queryset.annotate(sub_count=Count('subscribers')).order_by('-sub_count')[:n]

    return Wrapper


class TopThreeCardFilter(filters.BaseFilterBackend):
    def filter_queryset(self, request: Request, queryset: QuerySet, _):
        return queryset.order_by('-best')[:3]
