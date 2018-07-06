FROM alpine:3.7
WORKDIR /srv
ADD . .

RUN apk add ffmpeg nodejs curl curl-dev --update

RUN npm install && npm link
RUN rm -rf /var/apk/cache/*

ENTRYPOINT ["grabhls"]
