FROM mhart/alpine-node:7.8
WORKDIR /srv
ADD . .

RUN apk add ffmpeg  curl curl-dev --update

RUN npm install && npm link

ENTRYPOINT ["grabhls"]
