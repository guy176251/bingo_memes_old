from django.contrib.auth import authenticate, login, logout
from django.shortcuts import get_object_or_404
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.db.transaction import atomic
from django.db.models import QuerySet, Count
from rest_framework import generics, filters #, mixins
from rest_framework import permissions
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.request import Request
from datetime import timedelta, datetime

from .models import BingoCard, BingoCardCategory, SiteUser
from .serializers import (
    CardDetailSerializer,
    VoteSerializer,
    UserCreateSerializer,
    UserSerializer,
    UserDetailSerializer,
    LoginSerializer,
    CardListSerializer,
    #CategoryListSerializer,
    CategorySerializer,
)

##############################################################################


def index(request, *_, **__):
    return render(request, 'index.html')


##############################################################################


class Pagination(PageNumberPagination):
    page_size = 5

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


class CardList(generics.ListCreateAPIView):

    '''
    Gets a list of cards, or creates a single new card.
    '''

    queryset = BingoCard.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    serializer_class = CardListSerializer
    pagination_class = Pagination
    filter_backends = [
        DateFilter,
        filters.SearchFilter,
        CardCategoryFilter,
        CardAuthorFilter,
        filters.OrderingFilter,
    ]
    search_fields = ['name']
    ordering_fields = ['best', 'hot', 'created_at', 'score']
    ordering = ['-created_at']

    #def perform_create(self, serializer):
    #    site_user = self.request.user.site_user
    #    print(f'{site_user = }')
    #    serializer.save(author=site_user)


class UserDetail(generics.RetrieveAPIView):
    '''
    Gets a single site user.
    '''

    queryset = SiteUser.objects.all()
    serializer_class = UserDetailSerializer


class CardDetail(generics.RetrieveAPIView):

    '''
    Get, delete or update a single bingo card.
    '''

    queryset = BingoCard.objects.all()
    serializer_class = CardDetailSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def put(self, request: Request, *args, **kwargs):
        card = self.get_object()
        site_user = request.user.site_user
        #print(f'{site_user = }\n{card.author = }')
        if site_user.id != card.author.id:
            return Response(status=status.HTTP_403_FORBIDDEN)

        # remove category
        data = request.data
        try:
            data.pop('category')
        except KeyError:
            pass

        serializer = self.get_serializer(card, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        if getattr(card, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the card.
            card._prefetched_objects_cache = {}

        return Response(serializer.data)

    def delete(self, request, *_, **__):
        card = self.get_object()
        site_user = request.user.site_user
        #print(f'{site_user = }\n{card.author = }')
        if site_user.id != card.author.id:
            return Response(status=status.HTTP_403_FORBIDDEN)

        category = card.category

        with atomic():
            card.delete()

            count = category.cards.count()
            if not count:
                category.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class TopThreeFilter(filters.BaseFilterBackend):

    def filter_queryset(self, request, queryset, view):
        return queryset.annotate(card_count=Count('cards')).order_by('-card_count')[:3]


class CategoryList(generics.ListAPIView):

    '''
    Shows bingo card categories.
    '''

    queryset = BingoCardCategory.objects.all()
    serializer_class = CategorySerializer
    pagination_class = Pagination
    ordering_fields = ['score', 'created_at']
    ordering = ['-created_at']
    filter_backends = [
        filters.SearchFilter,
        TopThreeFilter,
    ]
    search_fields = ['name']


class CategoryDetail(generics.RetrieveAPIView):

    '''
    Get a single bingo card category.
    '''

    queryset = BingoCardCategory.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'name'
    db_lookup_field = 'name__iexact'

    def get_object(self):
        queryset = self.get_queryset()             # Get the base queryset
        queryset = self.filter_queryset(queryset)  # Apply any filter backends
        filter = {self.db_lookup_field: self.kwargs[self.lookup_field]}
        return get_object_or_404(queryset, **filter)  # Lookup the object


##############################################################################


@api_view(['POST'])
def some_word(_):
    return Response(False)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@csrf_protect
def upvote_view(request):
    serializer = VoteSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user.site_user)
        return Response()

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@csrf_protect
def create_user_view(request):
    serializer = UserCreateSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'detail': 'Account created.'}, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


##############################################################################


@api_view(['POST'])
@csrf_protect
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(**serializer.data)
    if not user:
        return Response({'valid': False}, status=status.HTTP_400_BAD_REQUEST)

    login(request, user)
    return Response({'valid': True, 'user': UserSerializer(request.user.site_user).data})


@api_view()
def logout_view(request):
    if not request.user.is_authenticated:
        return Response({'detail': 'You\'re not logged in.'}, status=status.HTTP_400_BAD_REQUEST)

    logout(request)
    return Response({'detail': 'Successfully logged out.'})


@api_view()
@ensure_csrf_cookie
def session_view(request):
    is_authenticated = request.user.is_authenticated
    resp = {'isAuthenticated': is_authenticated}
    if is_authenticated:
        resp.update({'user': UserSerializer(request.user.site_user).data})
    return Response(resp)
