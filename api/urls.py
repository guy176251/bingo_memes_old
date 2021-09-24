from django.urls import path  # , re_path
from . import views

urlpatterns = [
    *[
        # frontend url routes
        path(url, views.index)
        for url in [
            "",
            "cards/",
            "cards/<int:card_id>/",
            "cards/<int:card_id>/edit/",
            "users/<int:user_id>/",
            "login/",
            "signup/",
            "categories/",
            "categories/<str:category_name>/",
            "categories/<str:category_name>/create/",
            "search/",
            "profile/",
            "create/card/",
        ]
    ],
    ##########################
    path("api/bar/categories/", views.CategorySearchList.as_view()),
    path("api/bar/cards/", views.CardSearchList.as_view()),
    path("api/categories/", views.CategoryList.as_view()),
    path("api/categories/<str:name>/", views.CategoryDetail.as_view()),
    path("api/cards/", views.CardList.as_view()),
    path("api/cards/<int:pk>/", views.CardDetail.as_view()),
    path("api/users/<int:pk>/", views.UserDetail.as_view()),
    path("api/votes/", views.upvote_view),
    path("api/signup/", views.create_user_view),
    path("api/subscribe/", views.sub_category_view),
    path("api/follow/", views.follow_user_view),
    path("api/home/", views.HomePageList.as_view()),
    path("api/popular/categories/", views.PopularCategoryList.as_view()),
    ##########################
    path("api/login/", views.login_view, name="api-login"),
    path("api/logout/", views.logout_view, name="api-logout"),
    path("api/session/", views.session_view, name="api-session"),
    ##########################
    # every other path goes to index
    # has to be last
    # re_path(r'.*', views.index),
]
