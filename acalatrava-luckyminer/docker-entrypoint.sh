#!/bin/sh
set -e

DATA_DIR="/app/data"

if [ ! -d "$DATA_DIR" ]; then
    mkdir -p "$DATA_DIR"
fi

if [ "$(id -u)" = "0" ]; then
    chown -R 1000:1000 "$DATA_DIR" || true
    chmod -R 755 "$DATA_DIR" || true
    exec gosu 1000:1000 "$@"
else
    chmod -R 755 "$DATA_DIR" || true
    exec "$@"
fi

