from django.contrib.auth import authenticate, login, logout
from django.shortcuts import get_object_or_404
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.db.transaction import atomic
from django.db.models import QuerySet
from rest_framework import generics  # , filters #, mixins
from rest_framework import permissions
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.request import Request

from .models import BingoCard, BingoCardCategory, SiteUser
from .serializers import (
    CardDetailSerializer,
    VoteSerializer,
    UserCreateSerializer,
    UserSessionSerializer,
    UserDetailSerializer,
    LoginSerializer,
    CardListSerializer,
    CategorySerializer,
    CategorySearchBarSerializer,
    CardSearchBarSerializer,
    # SubToCategorySerializer,
    # FollowUserSerializer,
    UserFollowSerializer,
    CategorySubscribeSerializer,
    CategoryRelatedSerializer,
)

from .filters import (
    Pagination,
    SearchFilter,
    OrderingFilter,
    CardCategoryFilter,
    CardAuthorFilter,
    DateFilter,
    TopThreeCategoryFilter,
    TopThreeCardFilter,
    CardHashtagFilter,
    top_n_categories,
)

HOME_SORT = "-hot"

##############################################################################


def index(request, *_, **__):
    return render(request, "index.html")


##############################################################################


class UserDetail(generics.RetrieveAPIView):
    """
    Gets a single site user.
    """

    queryset = SiteUser.objects.all()
    serializer_class = UserDetailSerializer


class CardList(generics.ListCreateAPIView):

    """
    Gets a list of cards, or creates a single new card.
    """

    queryset = BingoCard.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    serializer_class = CardListSerializer
    pagination_class = Pagination
    filter_backends = [
        DateFilter,
        SearchFilter,
        CardCategoryFilter,
        CardAuthorFilter,
        CardHashtagFilter,
        OrderingFilter,
    ]
    search_fields = ["name"]
    ordering_fields = ["best", "hot", "created_at", "score"]
    ordering = ["-created_at"]

    # def perform_create(self, serializer):
    #    site_user = self.request.user.site_user
    #    print(f'{site_user = }')
    #    serializer.save(author=site_user)


class IsAuthorOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to edit it.
    Assumes the model instance has an `owner` attribute.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        try:
            site_user = request.user.site_user
        except AttributeError:
            return False

        # Instance must have an attribute named `owner`.
        return obj.author == site_user


class CardDetail(generics.RetrieveUpdateDestroyAPIView):

    """
    Get, delete or update a single bingo card.
    """

    queryset = BingoCard.objects.all()
    serializer_class = CardDetailSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]

    def put(self, request: Request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    #    card = self.get_object()
    #    site_user = request.user.site_user
    #    #print(f'{site_user = }\n{card.author = }')
    #    if site_user.id != card.author.id:
    #        return Response(status=status.HTTP_403_FORBIDDEN)

    #    # remove category
    #    data = request.data
    #    try:
    #        data.pop('category')
    #    except KeyError:
    #        pass

    #    serializer = self.get_serializer(card, data=data, partial=True)
    #    serializer.is_valid(raise_exception=True)
    #    serializer.save()

    #    if getattr(card, '_prefetched_objects_cache', None):
    #        # If 'prefetch_related' has been applied to a queryset, we need to
    #        # forcibly invalidate the prefetch cache on the card.
    #        card._prefetched_objects_cache = {}

    #    return Response(serializer.data)

    # def delete(self, request, *_, **__):
    #    card = self.get_object()
    #    site_user = request.user.site_user
    #    #print(f'{site_user = }\n{card.author = }')
    #    if site_user.id != card.author.id:
    #        return Response(status=status.HTTP_403_FORBIDDEN)

    #    category = card.category

    #    with atomic():
    #        card.delete()

    #        count = category.cards.count()
    #        if not count:
    #            category.delete()

    #    return Response(status=status.HTTP_204_NO_CONTENT)


class PopularCategoryList(generics.ListAPIView):

    """
    Shows bingo card categories.
    """

    queryset = BingoCardCategory.objects.all()
    serializer_class = CategoryRelatedSerializer
    pagination_class = Pagination
    ordering_fields = ["score", "created_at"]
    ordering = ["-created_at"]
    filter_backends = [top_n_categories(5)]


class CategoryList(generics.ListAPIView):

    """
    Shows bingo card categories.
    """

    queryset = BingoCardCategory.objects.all()
    serializer_class = CategorySerializer
    pagination_class = Pagination
    ordering_fields = ["score", "created_at"]
    ordering = ["-created_at"]


class CategoryDetail(generics.RetrieveAPIView):

    """
    Get a single bingo card category.
    """

    queryset = BingoCardCategory.objects.all()
    serializer_class = CategorySerializer
    lookup_field = "name"
    db_lookup_field = "name__iexact"

    def get_object(self):
        queryset = self.get_queryset()  # Get the base queryset
        queryset = self.filter_queryset(queryset)  # Apply any filter backends
        filter = {self.db_lookup_field: self.kwargs[self.lookup_field]}
        return get_object_or_404(queryset, **filter)  # Lookup the object


class CardSearchList(generics.ListAPIView):
    """
    View for category search bar. Returns top 3 categories sorted by number of bingo cards.
    """

    queryset = BingoCard.objects.all()
    serializer_class = CardSearchBarSerializer
    filter_backends = [
        SearchFilter,
        TopThreeCardFilter,
    ]
    search_fields = ["name"]


class CategorySearchList(generics.ListAPIView):
    """
    View for category search bar. Returns top 3 categories sorted by number of bingo cards.
    """

    queryset = BingoCardCategory.objects.all()
    serializer_class = CategorySearchBarSerializer
    filter_backends = [
        SearchFilter,
        TopThreeCategoryFilter,
    ]
    search_fields = ["name"]


##############################################################################


class HomePageList(generics.ListAPIView):
    serializer_class = CardListSerializer
    pagination_class = Pagination
    filter_backends = [
        OrderingFilter,
    ]
    ordering_fields = ["best", "hot", "created_at", "score"]
    ordering = ["-created_at"]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user: SiteUser = self.request.user.site_user

        # follow_ids: QuerySet = user.following.values_list('cards_created', flat=True)
        subscription_ids: QuerySet = user.subscriptions.values_list("cards", flat=True)

        home_page_cards: QuerySet = BingoCard.objects.filter(id__in=subscription_ids)

        return home_page_cards


# @api_view()
# @permission_classes([permissions.IsAuthenticated])
# def home_page_view(request: Request):
#    user: SiteUser = request.user.site_user
#
#    follow_ids: QuerySet = user.following.values_list('followee_id', flat=True)
#    follow_cards: QuerySet = BingoCard.objects.filter(author_id__in=follow_ids)
#
#    subscription_ids: QuerySet = user.subscriptions.values_list('category_id', flat=True)
#    subscription_cards: QuerySet = BingoCard.objects.filter(category_id__in=subscription_ids)
#
#    home_page_cards = subscription_cards.union(follow_cards).order_by(HOME_SORT)
#
#    paginator = Pagination()
#    results = paginator.paginate_queryset(home_page_cards, request)
#    serializer = CardListSerializer(results, many=True, context={'request': request})
#
#    return paginator.get_paginated_response(serializer.data)


@csrf_protect
@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def sub_category_view(request):
    serializer = CategorySubscribeSerializer(
        data=request.data, context={"request": request}
    )
    if serializer.is_valid():
        serializer.save()
        return Response()

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@csrf_protect
@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def follow_user_view(request):
    serializer = UserFollowSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        serializer.save()
        return Response()

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@csrf_protect
@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def upvote_view(request):
    serializer = VoteSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user.site_user)
        return Response()

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@csrf_protect
@api_view(["POST"])
def create_user_view(request):
    serializer = UserCreateSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"detail": "Account created."}, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


##############################################################################


@csrf_protect
@api_view(["POST"])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        print(f"improper format: {serializer.errors}")
        return Response({"valid": False}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(**serializer.data)
    if not user:
        print("password incorrect")
        return Response({"valid": False}, status=status.HTTP_400_BAD_REQUEST)

    login(request, user)
    return Response(
        {"valid": True, "user": UserSessionSerializer(request.user.site_user).data}
    )


@api_view()
def logout_view(request):
    if not request.user.is_authenticated:
        return Response(
            {"detail": "You're not logged in."}, status=status.HTTP_400_BAD_REQUEST
        )

    logout(request)
    return Response({"detail": "Successfully logged out."})


@api_view()
@ensure_csrf_cookie
def session_view(request):
    is_authenticated = request.user.is_authenticated
    resp = {"isAuthenticated": is_authenticated}
    if is_authenticated:
        resp.update({"user": UserSessionSerializer(request.user.site_user).data})
    return Response(resp)
