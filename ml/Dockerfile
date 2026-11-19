# The pickup-ETA model server for demo.mealdeck.in (docker-compose's "demo"
# profile). On start it simulates orders from the menus mounted at /menu,
# trains the random forest (a few seconds) and serves it. The data is
# SIMULATED; see README.md.
FROM python:3.13-slim
WORKDIR /app
RUN pip install --no-cache-dir "scikit-learn==1.9.1" "joblib>=1.4" "numpy>=2"
COPY features.py simulate.py train_eta.py serve_eta.py ./
RUN useradd --system --no-create-home eta && mkdir -p data models && chown -R eta /app
USER eta
EXPOSE 8099
HEALTHCHECK --interval=10s --timeout=3s --start-period=60s --retries=5 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8099/health', timeout=2)" || exit 1
CMD ["sh", "-c", "python simulate.py --menu-dir /menu && python train_eta.py && exec python serve_eta.py --host 0.0.0.0"]
