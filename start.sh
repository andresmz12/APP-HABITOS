#!/bin/sh
# Push DB schema with retries before starting the app
MAX=5
i=1
while [ $i -le $MAX ]; do
  echo "==> prisma db push (attempt $i/$MAX)..."
  if ./node_modules/.bin/prisma db push --accept-data-loss; then
    echo "==> Schema ready."
    break
  fi
  if [ $i -eq $MAX ]; then
    echo "==> WARNING: prisma db push failed after $MAX attempts. Starting anyway."
  else
    echo "==> Retrying in 5s..."
    sleep 5
  fi
  i=$((i + 1))
done

exec npm start
