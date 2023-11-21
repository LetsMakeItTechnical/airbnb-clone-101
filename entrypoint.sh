#!/bin/sh
# Wait for PostgreSQL to start
until $(curl --output /dev/null --silent --head --fail http://postgres:5432); do
    printf '.'
    sleep 5
done

echo "PostgreSQL started."

# Run Prisma migrations
npx prisma migrate deploy

npm run build

# Start your application
npm run start
