FROM python:3.11-slim

WORKDIR /app/etl

COPY etl/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir psycopg2-binary

COPY etl/ ./

ENV PYTHONUNBUFFERED=1
ENTRYPOINT ["python", "main.py"]