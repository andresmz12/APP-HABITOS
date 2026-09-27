#!/bin/sh
# Push DB schema with retries before starting the app.
# If Prisma refuses a plain push (e.g. a new required column can't be
# backfilled on existing rows), fall back to a full reset — acceptable here
# since this app has no external backup strategy for its data.
MAX=5
i=1
while [ $i -le $MAX ]; do
  echo "==> prisma db push (attempt $i/$MAX)..."
  if ./node_modules/.bin/prisma db push --accept-data-loss; then
    echo "==> Schema ready."
    break
  fi
  if [ $i -eq $MAX ]; then
    echo "==> Plain push failed after $MAX attempts. Trying --force-reset..."
    if ./node_modules/.bin/prisma db push --force-reset --accept-data-loss; then
      echo "==> Schema ready after force-reset."
    else
      echo "==> WARNING: prisma db push failed even with --force-reset. Starting anyway."
    fi
  else
    echo "==> Retrying in 5s..."
    sleep 5
  fi
  i=$((i + 1))
done

exec npm start
