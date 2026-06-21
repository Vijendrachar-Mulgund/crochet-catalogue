#!/bin/bash
# Double-click this file to open the Crochet Catalogue.
# It starts a tiny local server (so your data saves reliably) and opens your browser.
cd "$(dirname "$0")" || exit 1
PORT=8765

# If something is already serving on the port, just open the browser.
if ! curl -s "http://127.0.0.1:$PORT/index.html" >/dev/null 2>&1; then
  # Prefer python3, fall back to python.
  if command -v python3 >/dev/null 2>&1; then
    python3 -m http.server "$PORT" >/dev/null 2>&1 &
  elif command -v python >/dev/null 2>&1; then
    python -m SimpleHTTPServer "$PORT" >/dev/null 2>&1 &
  else
    echo "Python is not installed. Opening the file directly instead."
    open "index.html"
    exit 0
  fi
  sleep 1
fi

open "http://127.0.0.1:$PORT/index.html"
echo "Crochet Catalogue is open in your browser."
echo "You can close this Terminal window when you're done."
