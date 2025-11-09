FROM node:25-bullseye

RUN apt-get update && apt-get install -y build-essential uthash-dev libjansson-dev libbase58-0 yasm gosu

RUN cd /tmp && \
    git clone https://github.com/duriantang/bfgminer-debian && \
    cd bfgminer-debian && \
    chmod +x *.sh && \
    ./autogen.sh && \
    ./configure --enable-cpumining && \
    sed -i "s/void (\*cgsleep_us_r/extern void (\*cgsleep_us_r/" util.h && \
    sed -i "s/^\(const uint32_t g_4sha256_k\[\)/static \1/" sha256_sse4_amd64.c && \
    make && \
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

