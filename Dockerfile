FROM node:14-alpine

ENV TELEGRAM_TOKEN=''
ENV URL=/
ENV PORT=8070
ENV PGHOST=localhost
ENV PGPORT=5432
ENV PGUSER='whisper'
ENV PGPASSWORD=''
ENV PGDATABASE='whisper'

EXPOSE 8070

WORKDIR /var/app
COPY package.json .
COPY package-lock.json .
RUN npm install

COPY . .
CMD ["npm","start"]
