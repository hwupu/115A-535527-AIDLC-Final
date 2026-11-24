FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:0.9 /uv /usr/local/bin/uv
WORKDIR /srv
# STT_GPU=1 (set by docker-compose.gpu.yml) adds the CUDA libraries; without it the image stays CPU-only.
ARG STT_GPU=0
COPY pyproject.toml uv.lock ./
RUN if [ "$STT_GPU" = "1" ]; then uv sync --frozen --no-dev --group gpu --no-cache; \
    else uv sync --frozen --no-dev --no-cache; fi
ENV PATH="/srv/.venv/bin:$PATH" \
    LD_LIBRARY_PATH="/srv/.venv/lib/python3.12/site-packages/nvidia/cublas/lib:/srv/.venv/lib/python3.12/site-packages/nvidia/cudnn/lib"
COPY app app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
