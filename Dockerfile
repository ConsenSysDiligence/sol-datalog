FROM debian:bookworm AS base

WORKDIR /souffle

RUN apt-get update && apt-get install -y \
    bison \
    build-essential \
    clang \
    cmake \
    doxygen \
    flex \
    g++ \
    git \
    libffi-dev \
    libncurses5-dev \
    libsqlite3-dev \
    make \
    mcpp \
    python3 \
    sqlite3 \
    zlib1g-dev \
    libomp-dev

RUN git clone https://github.com/souffle-lang/souffle.git --depth 1 . \
    && cmake -S . -B build -DSOUFFLE_DOMAIN_64BIT=ON -DCMAKE_INSTALL_PREFIX=inst \
    && cmake --build build --target install -j $(nproc)

FROM node:22-bookworm-slim

RUN apt-get update \
    && apt-get install -y \
        build-essential \
        g++ \
        git \
        libffi-dev \
        libncurses5-dev \
        libsqlite3-dev \
        sqlite3 \
        python3 \
        zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

ENV INCLUDE_DIR=/usr/local/include
ENV SOLC_TYPED_AST_DIR=/solc-typed-ast/src
ENV LD_LIBRARY_PATH=/sol-datalog/src/functors:$LD_LIBRARY_PATH

COPY --from=base /souffle/inst/include/ /usr/local/include
COPY --from=base /souffle/inst/bin/souffle /usr/local/bin
COPY --from=base /souffle/inst/bin/souffle-compile.py /usr/local/bin

WORKDIR /solc-typed-ast

RUN git clone https://github.com/Consensys/solc-typed-ast.git .

WORKDIR /sol-datalog

RUN git clone https://github.com/Nurchik/sol-datalog.git . \
    && git checkout compiled \
    && npm install

RUN npm run build-full

ENTRYPOINT ["node", "dist/bin/cli.js"]
