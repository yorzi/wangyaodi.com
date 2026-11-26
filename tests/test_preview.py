import io
import runpy
import unittest
from pathlib import Path
from unittest.mock import patch


preview = runpy.run_path(str(Path(__file__).resolve().parents[1] / "bin/serve"))


class Request:
    """Transport for a single HTTP request without binding a local port."""

    def __init__(self, method, path):
        self.input = io.BytesIO(f"{method} {path} HTTP/1.0\r\n\r\n".encode())
        self.output = bytearray()

    def makefile(self, *args):
        return self.input

    def sendall(self, data):
        self.output.extend(data)


class PreviewTest(unittest.TestCase):
    def request(self, method, path):
        req = Request(method, path)
        handler = preview["Handler"]
        with patch.object(handler, "log_message"):
            handler(req, ("localhost", 0), None, directory=preview["ROOT"])
        headers, body = req.output.split(b"\r\n\r\n", 1)
        return headers.decode().splitlines(), body

    def test_permanent_redirects_preserve_query(self):
        for path, status, target in [
            ("/vibecare", 301, "/ai-audits"),
            ("/vibecare.html", 301, "/ai-audits"),
            ("/hire-me.html", 308, "/hire-me"),
            ("/blog/index.html", 308, "/blog/"),
        ]:
            with self.subTest(path=path):
                headers, body = self.request("GET", path + "?from=test")
                self.assertIn(str(status), headers[0])
                self.assertIn("Location: " + target + "?from=test", headers)
                self.assertFalse(body)

    def test_missing_page_head_has_only_headers(self):
        for path, code in [("/ai-audits", 200), ("/unknown-page", 404)]:
            with self.subTest(path=path):
                headers, body = self.request("GET", path)
                head, head_body = self.request("HEAD", path)
                self.assertIn(str(code), headers[0])
                self.assertEqual(headers[0], head[0])
                self.assertIn(f"Content-Length: {len(body)}", head)
                self.assertTrue(body)
                self.assertFalse(head_body)
