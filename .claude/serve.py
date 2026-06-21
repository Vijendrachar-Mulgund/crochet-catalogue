import os
import functools
from http.server import HTTPServer, SimpleHTTPRequestHandler

ROOT = "/tmp/catalogue-preview"
os.chdir(ROOT)
Handler = functools.partial(SimpleHTTPRequestHandler, directory=ROOT)
HTTPServer(("127.0.0.1", 4173), Handler).serve_forever()
