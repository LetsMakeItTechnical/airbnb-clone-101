# Airbnb Clone with Next.js 13 App Router: React, Tailwind, Prisma, Posgtres, NextAuth AWS CDK 2023

### Prerequisites

**Node version 16.x**

### Cloning the repository

```shell
git clone https://github.com/LetsMakeItTechnical/airbnb-clone-101.git
```

### Features

- **Next.js 13**: Frontend and server-side rendering for a seamless user experience.
- **Prisma ORM**: Robust database interactions with support for complex queries and migrations.
- **Redis Caching**: Enhanced performance with an in-memory data store for real-time data fetching.
- **AWS CDK**: Infrastructure as Code (IaC) to provision and manage AWS resources effectively.

### Run Postgres Container Locally

```shell
npm run docker
```

### Install packages

```shell
npm i
```

### Setup .env file

```js
DATABASE_URL="postgres://POSTGRES_USER:POSTGRES_PASSWORD@localhost:5432/airclone"
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_ID=
GITHUB_SECRET=
NEXTAUTH_SECRET=
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

### Setup Prisma

```shell
npx prisma db push

```

### Start the app

```shell
npm run dev
```

## Available commands

Running commands with npm `npm run [command]`

| command | description                              |
| :------ | :--------------------------------------- |
| `dev`   | Starts a development instance of the app |
