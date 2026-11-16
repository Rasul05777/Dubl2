FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt requirements.lock.txt ./
RUN pip install --no-cache-dir -r requirements.lock.txt
COPY . .
RUN useradd -m app && mkdir /app/uploads && chown app:app /app/uploads
USER app
CMD ["sh", "start.sh"]
