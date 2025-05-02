ARG ARCH=
FROM ${ARCH}node:22.14.0-bookworm AS build
WORKDIR /app
ENV DOCKER=YES NODE_ENV=production
ADD . .
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends build-essential && \
    npm ci --include=dev && \
    npm run build && \
    npm ci --omit=dev

FROM ${ARCH}node:22.14.0-bookworm-slim
WORKDIR /app
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        make \
        gcc \
        g++ \
        pkg-config \
        pcscd \
        libpcsclite-dev \
        libccid \
        libdvbv5-dev \
        pcsc-tools \
        dvb-tools \
        wget

RUN wget https://github.com/tsukumijima/libaribb25/releases/download/v0.2.9/libaribb25_0.2.9_amd64.deb && \
    apt-get install -y ./libaribb25_0.2.9_amd64.deb && \
    rm libaribb25_0.2.9_amd64.deb && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
COPY --from=build /app /app
CMD ["./docker/container-init.sh"]
EXPOSE 40772 9229
