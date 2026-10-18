import sys
import os
import threading
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from status_api import (HISTORY_SECONDS, SAMPLE_INTERVAL, TelemetryStore,
                        collect, cpu_temperature, create_app, sample_metrics, device_info)


def sample(timestamp=1000, temperature=48.5):
    return dict(timestamp=timestamp, cpu=12.5, memory=31.2, temperature=temperature, uptime=120)


class StatusTests(unittest.TestCase):
    def setUp(self):
        self.now = 0
        self.store = TelemetryStore(clock=lambda: self.now)
        self.client = create_app(self.store, "https://hb283.dev,http://localhost:4321").test_client()

    def test_empty_and_stale_measurements_are_unavailable(self):
        self.assertEqual(self.client.get("/metrics").status_code, 503)
        self.store.add(sample())
        self.assertEqual(self.client.get("/metrics").status_code, 200)
        self.now = 11
        self.assertEqual(self.client.get("/metrics").status_code, 503)

    def test_bounded_history_and_clock_correction(self):
        for timestamp in range(1000, 3000, SAMPLE_INTERVAL):
            self.store.add(sample(timestamp))
        data = self.store.snapshot()
        self.assertEqual(len(data["history"]), HISTORY_SECONDS // SAMPLE_INTERVAL + 1)
        self.assertEqual(data["history"][-1]["timestamp"], data["timestamp"])
        self.store.add(sample(10))
        self.assertEqual(len(self.store.snapshot()["history"]), 1)

    def test_public_response_contains_only_metrics(self):
        self.store.add(sample(temperature=None))
        response = self.client.get("/metrics")
        self.assertEqual(set(response.json), {"timestamp", "cpu", "memory", "temperature", "uptime", "interval_seconds", "history", "device"})
        self.assertEqual(set(response.json["device"]), {"name", "os", "model", "architecture"})
        self.assertIsNone(response.json["temperature"])
        self.assertEqual(response.headers["Cache-Control"], "no-store, max-age=0")
        self.assertEqual(self.client.post("/metrics").status_code, 405)
        self.assertEqual(self.client.get("/admin").status_code, 404)

    def test_exact_origin_cors_including_error_responses(self):
        allowed = self.client.get("/metrics", headers={"Origin": "https://hb283.dev"})
        self.assertEqual(allowed.headers["Access-Control-Allow-Origin"], "https://hb283.dev")
        self.assertIn("Origin", allowed.headers["Vary"])
        for origin in ["https://evil.example", "https://hb283.dev.evil.example"]:
            self.assertNotIn("Access-Control-Allow-Origin", self.client.get("/metrics", headers={"Origin": origin}).headers)

    def test_snapshot_mutation_does_not_corrupt_store(self):
        self.store.add(sample())
        data = self.store.snapshot()
        data["history"][0]["cpu"] = 100
        self.assertEqual(self.store.snapshot()["history"][0]["cpu"], 12.5)

    @patch("status_api.Path.read_text", return_value="48750\n")
    def test_pi_cpu_temperature(self, _):
        self.assertEqual(cpu_temperature(), 48.8)

    @patch("status_api.psutil.sensors_temperatures", return_value={}, create=True)
    @patch("status_api.Path.read_text", side_effect=OSError)
    def test_missing_temperature_is_null(self, *_):
        self.assertIsNone(cpu_temperature())

    @patch("status_api.cpu_temperature", return_value=42)
    @patch("status_api.psutil.boot_time", return_value=1000)
    @patch("status_api.psutil.virtual_memory", return_value=SimpleNamespace(percent=31.2))
    @patch("status_api.psutil.cpu_percent", return_value=12.5)
    @patch("status_api.time.time", return_value=1120)
    def test_actual_sample_shape(self, *_):
        self.assertEqual(sample_metrics(), sample(1120, 42))

    def test_first_cpu_measurement_is_primed_and_not_published(self):
        stop = threading.Event()
        with patch("status_api.psutil.cpu_percent", return_value=0) as cpu, \
                patch.object(stop, "wait", side_effect=[False, True]), \
                patch("status_api.sample_metrics", return_value=sample()) as sampler:
            collect(self.store, stop)
            cpu.assert_called_once_with(interval=None)
            sampler.assert_called_once()
            self.assertEqual(self.store.snapshot()["cpu"], 12.5)

    @patch.dict(os.environ, {}, clear=True)
    @patch("status_api.platform.machine", return_value="aarch64")
    @patch("status_api.platform.freedesktop_os_release", return_value={"PRETTY_NAME": "Debian GNU/Linux 13 (trixie)"}, create=True)
    @patch("status_api.Path.read_text", return_value="Raspberry Pi 5 Model B Rev 1.0\x00")
    def test_device_info_detects_actual_model_and_os(self, *_):
        self.assertEqual(device_info(), {"name": None, "os": "Debian GNU/Linux 13 (trixie)",
                                       "model": "Raspberry Pi 5 Model B Rev 1.0", "architecture": "aarch64"})

    @patch.dict(os.environ, {"STATUS_DEVICE_NAME": "Pi 5", "STATUS_DEVICE_MODEL": "My model", "STATUS_DEVICE_OS": "Raspberry Pi OS"}, clear=True)
    @patch("status_api.Path.read_text", side_effect=AssertionError("override should not read model files"))
    def test_public_labels_can_be_overridden_without_exposing_other_environment(self, _):
        info = device_info()
        self.assertEqual(info["name"], "Pi 5")
        self.assertEqual(info["model"], "My model")
        self.assertEqual(info["os"], "Raspberry Pi OS")
        self.assertEqual(set(info), {"name", "os", "model", "architecture"})

    @patch.dict(os.environ, {}, clear=True)
    @patch("status_api.platform.machine", return_value="aarch64")
    @patch("status_api.platform.system", return_value="Linux")
    @patch("status_api.platform.release", return_value="6.12")
    @patch("status_api.platform.freedesktop_os_release", side_effect=OSError, create=True)
    @patch("status_api.Path.read_text", side_effect=OSError)
    def test_missing_model_does_not_invent_hardware(self, *_):
        self.assertEqual(device_info(), {"name": None, "os": "Linux 6.12", "model": None, "architecture": "aarch64"})


if __name__ == "__main__":
    unittest.main()
