FROM node:11.0.0-alpine

ARG project_dir=/app/

COPY . ${project_dir}
WORKDIR ${project_dir}

RUN set -x && \
    apk upgrade --no-cache && \
    apk add --update --no-cache git && \
    curl -o- -L https://yarnpkg.com/install.sh | sh && \
    yarn install

# CMD ["yarn", "serve"]

