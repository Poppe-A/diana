#!/bin/sh
set -e

echo "Running migrations..."
yarn migrate

echo "Starting Nest..."
exec yarn start:prod
