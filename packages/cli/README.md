# ABSpider Recon CLI

> Terminal reconnaissance for authorized passive and active web security checks.

```bash
npm install -g abspider
abspider example.com
```

## Usage

```bash
abspider <target> [options]
abspider-recon <target> [options]
```

Examples:

```bash
# Passive reconnaissance
abspider example.com

# Passive and active modules
abspider https://example.com --all

# Conservative active scan
abspider https://example.com --active --mode conservative

# Aggressive scan with common ports
abspider https://example.com --all --mode aggressive --port-profile common

# JSON output
abspider example.com --modules dns,sslTls --json --pretty
```

## Modules

Passive modules:

```text
siteInfo, headers, whois, geoip, dns, mx, subnet, subdomains,
reverseip, virustotal, sslTls, techStack, seo
```

Active modules:

```text
ports, sqlinjection, xss, lfi, wordpress, brokenLinks,
corsMisconfig, ddosFirewall
```

## Scan Modes

| Mode | Behavior |
| --- | --- |
| `conservative` | Lower payload volume, slower pacing, web-focused ports. |
| `adaptive` | Balanced defaults, adjusts after slow or failed modules. |
| `aggressive` | Broader payload volume, higher concurrency, broader port/subdomain coverage. |

## Options

Run:

```bash
abspider --help
```

Notable options:

| Option | Description |
| --- | --- |
| `--passive` | Run passive modules only. Default. |
| `--active` | Run active modules only. |
| `--all` | Run passive and active modules. |
| `--modules <list>` | Run selected modules. |
| `--mode <name>` | `conservative`, `adaptive`, or `aggressive`. |
| `--port-profile <name>` | `web`, `common`, or `full`. |
| `--payloads <n>` | Max SQLi, XSS, and LFI payloads from bundled payload files. |
| `--subdomain-limit <n>` | Max DNS wordlist entries before CT/API sources. |
| `--no-ct` | Disable crt.sh certificate transparency lookup. |
| `--json` | Print machine-readable JSON. |
| `--output <file>` | Write full JSON results to disk. |

## Notes

- Only scan systems you own or have explicit written permission to test.
- The Node CLI is not subject to browser CORS restrictions.
- CDN/WAF protections such as Cloudflare are detected and reported. The CLI does not evade access controls.
- Press `Ctrl+C` to stop gracefully and keep partial results.
- Set `VIRUSTOTAL_API_KEY` or `VITE_VIRUSTOTAL_API_KEY` for VirusTotal.
- Set `SECURITYTRAILS_API_KEY` or `VITE_SECURITYTRAILS_API_KEY` for SecurityTrails subdomain data.

## License

MIT
