# syntax=docker/dockerfile:1.6
FROM --platform=$TARGETPLATFORM node:25-bullseye

ARG TARGETPLATFORM
ARG BUILD_CFLAGS
ENV CFLAGS="${BUILD_CFLAGS:- -O3 -pipe}"

RUN apt-get update && apt-get install -y build-essential uthash-dev libjansson-dev libbase58-0 yasm gosu

RUN cd /tmp && \
    git clone https://github.com/duriantang/bfgminer-debian && \
    cd bfgminer-debian && \
    chmod +x *.sh && \
    ./autogen.sh && \
    case "$TARGETPLATFORM" in \
        linux/amd64) export CFLAGS="-O3 -pipe -march=x86-64-v2 -mtune=generic" ;; \
        linux/arm64) export CFLAGS="-O3 -pipe -mcpu=neoverse-n1 -mtune=generic" ;; \
    esac && \
    ./configure --enable-cpumining --with-system-openssl CFLAGS="-fcommon" && \
    sed -i "s/void (\*cgsleep_us_r/extern void (\*cgsleep_us_r/" util.h && \
    make LDFLAGS="-Wl,--allow-multiple-definition" -j"$(nproc)" && \
    make install && \
    ldconfig /usr/local/lib && \
    cd / && \
    rm -rf /tmp/bfgminer

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p /app/data && \
    chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]

