from django.urls import path, re_path

from . import views

app_name = 'games'


urlpatterns = [
    path('', views.index, name='index'),
    path('<slug:date_str>', views.date, name='show'),
]
