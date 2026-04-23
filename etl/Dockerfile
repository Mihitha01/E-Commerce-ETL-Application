FROM python:3.11-slim

WORKDIR /app/etl

COPY [requirements.txt](http://_vscodecontentref_/3) ./
RUN pip install --no-cache-dir -r [requirements.txt](http://_vscodecontentref_/4) \
    && pip install --no-cache-dir psycopg2-binary

COPY etl/ ./

ENV PYTHONUNBUFFERED=1
ENTRYPOINT ["python", "main.py"]