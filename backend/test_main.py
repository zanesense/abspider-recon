import asyncio
import unittest

from fastapi import Request
from main import _attach_auth, _is_allowed_provider_url, app, delete_account


class VercelFastApiTests(unittest.TestCase):
    def test_service_and_self_hosted_routes_are_registered(self):
        paths = {route.path for route in app.routes}
        self.assertTrue({"/proxy", "/keys", "/keys/proxy", "/account"}.issubset(paths))
        self.assertTrue({"/api/proxy", "/api/keys", "/api/keys/proxy", "/api/account"}.issubset(paths))

        account_route = next(route for route in app.routes if route.path == "/api/account" and "DELETE" in route.methods)
        self.assertEqual(account_route.methods, {"DELETE"})

    def test_provider_proxy_only_accepts_exact_https_host(self):
        self.assertTrue(_is_allowed_provider_url("shodan", "https://api.shodan.io/shodan/host/1.1.1.1"))
        self.assertFalse(_is_allowed_provider_url("shodan", "http://api.shodan.io/shodan/host/1.1.1.1"))
        self.assertFalse(_is_allowed_provider_url("shodan", "https://api.shodan.io.evil.example/path"))

    def test_query_api_keys_are_encoded(self):
        url, _ = _attach_auth("https://api.builtwith.com/free1/api.json", {}, "builtwith", "a+b&c")
        self.assertEqual(url, "https://api.builtwith.com/free1/api.json?KEY=a%2Bb%26c")

    def test_account_deletion_requires_authentication(self):
        response = asyncio.run(delete_account(Request({"type": "http", "headers": []})))
        self.assertEqual(response.status_code, 401)


if __name__ == "__main__":
    unittest.main()
