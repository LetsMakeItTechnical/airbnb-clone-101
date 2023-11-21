FROM node:20

# RUN apk add --no-cache libc6-compat
RUN npm i -g npm

WORKDIR /home/nextjs/app

COPY package.json .
# COPY package-lock.json .
COPY .env .
# COPY .next .
COPY tsconfig.json .

RUN npm install -f
# RUN npm install --omit=optional
RUN npx browserslist@latest --update-db
RUN npx next telemetry disable

COPY . .

EXPOSE 5432
EXPOSE 6379

RUN npx prisma generate
# RUN npx prisma migrate deploy

RUN npm rebuild bcrypt --build-from-source

EXPOSE 80

RUN npm run build

CMD [ "npm", "start" ]
