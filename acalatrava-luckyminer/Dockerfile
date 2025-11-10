# syntax=docker/dockerfile:1.6
FROM --platform=$TARGETPLATFORM node:25-bullseye

ARG TARGETPLATFORM
ARG BUILD_CFLAGS
ENV CFLAGS="${BUILD_CFLAGS:- -O3 -pipe}"

RUN apt-get update && apt-get install -y build-essential uthash-dev libjansson-dev libbase58-0 yasm gosu

RUN cd /tmp && \
    git clone https://github.com/acalatrava/bfgminer-debian && \
    cd bfgminer-debian && \
    chmod +x *.sh && \
    ./build-optimized.sh && \
    make install && \
    ldconfig /usr/local/lib && \
    cd / && \
    rm -rf /tmp/bfgminer-debian

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p /app/data && \
    chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]

