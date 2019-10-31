from django.shortcuts import render
from django.http import HttpResponse, Http404

import datetime

# Create your views here.

def index(request):
    games = ['MIL', 'HOU']
    context = { 'games': games,}
    return render(request, 'games/index.html', context)


def date(request, date_str):
    try:
        date = datetime.date.fromisoformat(date_str)
    except ValueError:
        raise Http404("Date not correct format")
    return render(request, 'games/show.html')
