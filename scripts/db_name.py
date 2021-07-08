#!/usr/bin/env python3

import os
import pathlib

path = pathlib.Path(__file__).absolute().parent.parent
os.chdir(path)
os.sys.path.append(str(path))

from bingo_memes.settings import (
    DATABASES,
    WSGI_APPLICATION,
    STATICFILES_DIRS,
    STATIC_URL,
    APP_NAME,
)

db_name = DATABASES['default']['NAME']

if __name__ == '__main__':
    print(db_name)
