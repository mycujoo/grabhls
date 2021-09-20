FROM node:current-alpine3.14
WORKDIR /srv
ADD . .

RUN apk update && apk add ffmpeg curl curl-dev --update

RUN npm install && npm link
RUN rm -rf /var/apk/cache/*

ENTRYPOINT ["grabhls"]
