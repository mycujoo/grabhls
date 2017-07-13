FROM mhart/alpine-node:7.8
WORKDIR /src
ADD . .

RUN apk add ffmpeg  curl curl-dev --update

ENTRYPOINT ["index.js"]
