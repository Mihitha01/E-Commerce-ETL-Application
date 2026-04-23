FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-pip \
    && ln -s /usr/bin/python3 /usr/local/bin/python \
    && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json /app/backend/
WORKDIR /app/backend
RUN npm ci --omit=dev

COPY etl/requirements.txt /app/etl/requirements.txt
RUN pip3 install --break-system-packages --no-cache-dir -r /app/etl/requirements.txt \
    && pip3 install --break-system-packages --no-cache-dir psycopg2-binary

COPY backend /app/backend
COPY etl /app/etl

WORKDIR /app/backend
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "server.js"]