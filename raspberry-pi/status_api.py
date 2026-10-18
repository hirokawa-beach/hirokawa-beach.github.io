"""Read-only Raspberry Pi telemetry. Run behind cloudflared on loopback only."""
from __future__ import annotations

import logging
import math
import os
import platform
import threading
import time
from collections import deque
from pathlib import Path

import psutil
from flask import Flask, jsonify, request
from waitress import serve

SAMPLE_INTERVAL = 2
HISTORY_SECONDS = 600
LOGGER = logging.getLogger("hb283-status")


def public_text(value: str | None) -> str | None:
    if not value:
        return None
    return "".join(c for c in value if c.isprintable()).strip()[:160] or None


def device_info() -> dict:
    """Read only public OS/model fields, never hostname, serial or network IDs."""
    model = public_text(os.environ.get("STATUS_DEVICE_MODEL"))
    if not model:
        for location in ("/proc/device-tree/model", "/sys/firmware/devicetree/base/model", "/sys/class/dmi/id/product_name"):
            try:
                model = public_text(Path(location).read_text())
                if model:
                    break
            except (OSError, UnicodeError):
                continue
    os_name = public_text(os.environ.get("STATUS_DEVICE_OS"))
    if not os_name:
        try:
            os_name = public_text(platform.freedesktop_os_release().get("PRETTY_NAME"))
        except (AttributeError, OSError):
            pass
    return {"name": public_text(os.environ.get("STATUS_DEVICE_NAME")),
            "os": os_name or public_text(f"{platform.system()} {platform.release()}"),
            "model": model, "architecture": public_text(platform.machine())}


def cpu_temperature() -> float | None:
    """Prefer the Pi's CPU thermal zone, then known CPU sensor groups."""
    try:
        value = float(Path("/sys/class/thermal/thermal_zone0/temp").read_text()) / 1000
        if math.isfinite(value) and -40 <= value <= 150:
            return round(value, 1)
    except (OSError, ValueError):
        pass
    try:
        sensors = psutil.sensors_temperatures()
        for name in ("cpu_thermal", "cpu-thermal", "soc_thermal", "coretemp", "k10temp"):
            for sensor in sensors.get(name, []):
                value = sensor.current
                if math.isfinite(value) and -40 <= value <= 150:
                    return round(value, 1)
    except (AttributeError, OSError, ValueError):
        pass
    return None


class TelemetryStore:
    def __init__(self, clock=time.monotonic):
        self._clock = clock
        self._lock = threading.Lock()
        self._samples: deque[dict] = deque(maxlen=HISTORY_SECONDS // SAMPLE_INTERVAL + 1)
        self._last_received: float | None = None

    def add(self, sample: dict) -> None:
        with self._lock:
            # A clock correction should not leave future points in the history.
            if self._samples and sample["timestamp"] <= self._samples[-1]["timestamp"]:
                self._samples.clear()
            self._samples.append(sample.copy())
            self._last_received = self._clock()

    def snapshot(self) -> dict | None:
        with self._lock:
            if not self._samples or self._last_received is None or self._clock() - self._last_received > 10:
                return None
            latest = self._samples[-1].copy()
            latest.update(interval_seconds=SAMPLE_INTERVAL,
                          history=[s.copy() for s in self._samples
                                   if s["timestamp"] >= latest["timestamp"] - HISTORY_SECONDS])
            return latest


def sample_metrics() -> dict:
    now = time.time()
    cpu = psutil.cpu_percent(interval=None)
    memory = psutil.virtual_memory().percent
    uptime = max(0, now - psutil.boot_time())
    if not (math.isfinite(cpu) and 0 <= cpu <= 100 and math.isfinite(memory) and 0 <= memory <= 100):
        raise ValueError("Invalid resource measurement")
    return {"timestamp": round(now, 3), "cpu": round(cpu, 1), "memory": round(memory, 1),
            "temperature": cpu_temperature(), "uptime": int(uptime)}


def collect(store: TelemetryStore, stop: threading.Event) -> None:
    # psutil's first nonblocking CPU result is meaningless; prime in this thread.
    psutil.cpu_percent(interval=None)
    while not stop.wait(SAMPLE_INTERVAL):
        try:
            store.add(sample_metrics())
        except Exception:
            LOGGER.exception("Telemetry collection failed")


def create_app(store: TelemetryStore, allowed_origins: str = "") -> Flask:
    app = Flask(__name__)
    origins = {origin.strip().rstrip("/") for origin in allowed_origins.split(",") if origin.strip()}
    info = device_info()

    @app.after_request
    def response_headers(response):
        response.headers["Cache-Control"] = "no-store, max-age=0"
        response.headers["X-Content-Type-Options"] = "nosniff"
        if request.headers.get("Origin") in origins:
            response.headers["Access-Control-Allow-Origin"] = request.headers["Origin"]
            response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
            response.vary.add("Origin")
        return response

    @app.get("/metrics")
    def metrics():
        data = store.snapshot()
        if data is None:
            return jsonify(error="telemetry_unavailable"), 503
        return jsonify(**data, device=info)

    return app


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    store = TelemetryStore()
    stop = threading.Event()
    collector = threading.Thread(target=collect, args=(store, stop), name="telemetry", daemon=True)
    collector.start()
    app = create_app(store, os.environ.get("ALLOWED_ORIGINS", "http://localhost:4321,http://127.0.0.1:4321"))
    try:
        # Requests read a snapshot; visitors never trigger sampling or commands.
        serve(app, host="127.0.0.1", port=int(os.environ.get("STATUS_PORT", "8765")),
              threads=4, channel_timeout=15, max_request_body_size=1024, expose_tracebacks=False)
    finally:
        stop.set()
        collector.join(timeout=3)


if __name__ == "__main__":
    main()
