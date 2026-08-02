FROM python:3.12-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
RUN addgroup --system app && adduser --system --ingroup app app
COPY pyproject.toml ./
COPY app ./app
COPY alembic.ini ./
COPY migrations ./migrations
COPY entrypoint.sh ./entrypoint.sh
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir .
RUN chmod +x /app/entrypoint.sh && chown app:app /app/entrypoint.sh
USER app
EXPOSE 8080
CMD ["/app/entrypoint.sh"]
