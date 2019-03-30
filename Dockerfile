# This image size : 89.9MB 
FROM node:11.0.0-alpine

ARG project_dir=/app/

COPY . ${project_dir}
WORKDIR ${project_dir}

RUN set -x && \
    apk upgrade --no-cache && \
    yarn install

CMD ["yarn", "start"]

