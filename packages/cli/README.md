# ABSpider Recon CLI

ABSpider Recon CLI is a Node.js command-line tool for authorized web reconnaissance and security scanning. It combines passive intelligence gathering with optional active checks for ports, common web vulnerabilities, configuration issues, and CDN/WAF indicators.

> Only scan systems you own or have explicit permission to test.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Scan Profiles](#scan-profiles)
- [Modules](#modules)
- [Options](#options)
- [Configuration](#configuration)
- [Examples](#examples)
- [Output](#output)
- [Troubleshooting](#troubleshooting)
- [Security Notice](#security-notice)
- [Contributors](#contributors)
- [License](#license)

## Features

- Passive reconnaissance for site metadata, headers, DNS, MX, WHOIS/RDAP, GeoIP, subnet data, SSL/TLS, SEO, technology stack, reverse IP, and subdomains.
- Active scanning for open ports, SQL injection indicators, reflected XSS, local file inclusion indicators, WordPress paths, broken links, CORS behavior, and bounded WAF/rate-limit checks.
- Multiple scan modes: `conservative`, `adaptive`, and `aggressive`.
- Module selection with aliases such as `ssl`, `tech`, `sqli`, `wp`, `cors`, and `waf`.
- JSON output support for automation and reporting.
- Optional result export to a file.
- Graceful shutdown with `Ctrl+C`, preserving partial results.
- CDN/WAF protection detection for providers such as Cloudflare, Sucuri, Akamai, CloudFront, and generic WAF/CDN headers.

## Installation

### Requirements

- Node.js 18 or newer
- npm, pnpm, or yarn
- Internet access for modules that query external services

This tool uses Node.js built-in modules such as:

- `node:dns/promises`
- `node:fs/promises`
- `node:net`
- `node:tls`
- `node:perf_hooks`

It also relies on the global `fetch` API, which is available in modern Node.js versions.

### Local Install

```bash
git clone <repository-url>
cd <repository-name>
npm install
````

If the CLI entry is not already configured in `package.json`, add a `bin` section similar to:

```json
{
  "type": "module",
  "bin": {
    "abspider": "./bin/abspider.js",
    "abspider-recon": "./bin/abspider.js"
  }
}
```

Then link the CLI locally:

```bash
npm link
```

## Usage

```bash
abspider <target> [options]
abspider-recon <target> [options]
```

Targets may be provided as a hostname or full URL:

```bash
abspider example.com
abspider https://example.com
```

When no protocol is provided, the tool normalizes the target to HTTPS.

## Scan Profiles

### Passive

Runs passive modules only. This is the default behavior.

```bash
abspider example.com --passive
```

### Active

Runs active modules only.

```bash
abspider example.com --active
```

### All

Runs passive and active modules together.

```bash
abspider example.com --all
```

## Modes

ABSpider supports three scan modes.

| Mode           | Description                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------- |
| `conservative` | Lower request volume, slower delay, fewer payloads, smaller port/subdomain scope.                 |
| `adaptive`     | Balanced default mode. Adjusts delay, payload count, and concurrency based on module performance. |
| `aggressive`   | Higher concurrency, larger payload count, broader port and subdomain checks. Use carefully.       |

```bash
abspider example.com --mode conservative
abspider example.com --mode adaptive
abspider example.com --mode aggressive
```

Shortcut flags are also supported:

```bash
abspider example.com --conservative
abspider example.com --adaptive
abspider example.com --aggressive
```

## Modules

### Passive Modules

| Module       | Description                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| `siteInfo`   | Fetches status, title, response time, content length, resolved IP, server headers, and protection hints. |
| `headers`    | Collects response headers and scores common security headers.                                            |
| `whois`      | Queries RDAP domain registration data.                                                                   |
| `geoip`      | Looks up IP geolocation and ASN information, with optional OpenCage reverse geocoding.                    |
| `dns`        | Resolves DNS records such as A, AAAA, MX, NS, TXT, CNAME, and SOA.                                       |
| `mx`         | Retrieves mail exchange records.                                                                         |
| `subnet`     | Calculates a basic `/24` subnet from the resolved IPv4 address.                                          |
| `subdomains` | Enumerates subdomains using DNS wordlist checks and optional certificate transparency lookup.            |
| `reverseip`  | Performs reverse IP lookup using HackerTarget.                                                           |
| `virustotal` | Queries VirusTotal domain reputation when an API key is configured.                                      |
| `sslTls`     | Retrieves TLS certificate metadata, issuer, validity, SAN, and fingerprint.                              |
| `techStack`  | Detects common technologies from HTML and headers, with optional BuiltWith API enrichment.                |
| `seo`        | Extracts title, description, canonical URL, H1 count, image alt status, and link counts.                 |

### Active Modules

| Module          | Description                                                                      |
| --------------- | -------------------------------------------------------------------------------- |
| `ports`         | Checks configured TCP ports and reports open, closed, or filtered results.       |
| `sqlinjection`  | Sends bounded SQLi payload probes and detects common database error indicators.  |
| `xss`           | Sends reflected XSS payload probes and checks for unencoded reflection.          |
| `lfi`           | Sends LFI payload probes and checks for common file disclosure/error markers.    |
| `wordpress`     | Checks common WordPress indicator paths.                                         |
| `brokenLinks`   | Extracts links and validates them with HEAD requests.                            |
| `corsMisconfig` | Tests CORS behavior with a controlled external origin.                           |
| `ddosFirewall`  | Sends a bounded number of HEAD requests to detect WAF/CDN and rate-limit behavior. |

## Module Aliases

You can use aliases with `--modules`.

| Alias                         | Module          |
| ----------------------------- | --------------- |
| `site`, `siteinfo`            | `siteInfo`      |
| `header`                      | `headers`       |
| `ssl`, `ssltls`               | `sslTls`        |
| `tech`, `techstack`           | `techStack`     |
| `links`, `brokenlinks`        | `brokenLinks`   |
| `cors`, `corsmisconfig`       | `corsMisconfig` |
| `sqli`, `sql`, `sqlinjection` | `sqlinjection`  |
| `wp`, `wordpress`             | `wordpress`     |
| `waf`, `wafprotection`, `ddos`, `ddosfirewall` | `ddosFirewall`  |
| `port`, `ports`               | `ports`         |
| `vt`, `virustotal`            | `virustotal`    |
| `reverse`, `reverseip`        | `reverseip`     |
| `subdomain`, `subdomains`     | `subdomains`    |

## Options

| Option                  | Description                                                 |
| ----------------------- | ----------------------------------------------------------- |
| `--passive`             | Run passive modules only. Default.                          |
| `--active`              | Run active modules only.                                    |
| `--all`                 | Run passive and active modules.                             |
| `--modules <list>`      | Comma-separated list of modules or aliases.                 |
| `--mode <name>`         | Scan mode: `conservative`, `adaptive`, or `aggressive`.     |
| `--ports <list>`        | Comma-separated port list. Overrides mode/profile port set. |
| `--port-profile <name>` | Port set: `web`, `common`, or `full`.                       |
| `--threads <number>`    | Maximum concurrent port/subdomain checks.                   |
| `--timeout <ms>`        | HTTP/socket timeout in milliseconds. Default: `10000`.      |
| `--payloads <number>`   | Maximum payloads per active injection check.                |
| `--ddos-requests <n>`   | Number of bounded WAF/rate-limit probe requests.            |
| `--delay <ms>`          | Delay between active payload requests.                      |
| `--subdomain-limit <n>` | Maximum DNS wordlist subdomains to check.                   |
| `--no-ct`               | Disable certificate transparency lookup from `crt.sh`.      |
| `--json`                | Print full JSON output instead of the terminal UI.          |
| `--output <file>`       | Write full JSON results to a file.                          |
| `--pretty`              | Pretty-print JSON output.                                   |
| `--no-color`            | Disable ANSI terminal colors.                               |
| `--interactive`, `-i`   | Prompt for target, profile, modules, and scan settings with arrow-key controls. |
| `--update`              | Check npm, update ABSpider if needed, relaunch, and exit when no target is provided. |
| `--no-update`           | Disable the npm auto-update check for this run.             |
| `--help`, `-h`          | Show help.                                                  |
| `--version`, `-v`       | Show version.                                               |

## Interactive Mode

Run `abspider --interactive` or `abspider -i` to configure a scan step by step. In a terminal, use Up/Down arrow keys to move through choices, Enter to select a radio option, and Space to toggle modules before pressing Enter to continue.

## Auto Updates

ABSpider checks npm whenever the CLI starts. If the installed version is current, it continues the run. If a newer package exists, it installs it with:

```bash
npm install -g abspider@latest
```

After a successful install, the CLI relaunches the same command once so the new package handles the scan. The relaunched process skips the update check to avoid an update loop.

To update explicitly without running a scan:

```bash
abspider --update
```

For `--json` scans, update status is written to stderr so stdout remains valid JSON. The updater is skipped only for CI runs or when disabled:

```bash
abspider example.com --no-update
ABSPIDER_NO_UPDATE=1 abspider example.com
```

## Configuration

### Optional Environment Variables

Some modules work without API keys, but these variables enable additional data sources:

```bash
export SECURITYTRAILS_API_KEY="your-securitytrails-api-key"
export VIRUSTOTAL_API_KEY="your-virustotal-api-key"
export BUILTWITH_API_KEY="your-builtwith-api-key"
export OPENCAGE_API_KEY="your-opencage-api-key"
```

The tool also checks Vite-style equivalents:

```bash
export VITE_SECURITYTRAILS_API_KEY="your-securitytrails-api-key"
export VITE_VIRUSTOTAL_API_KEY="your-virustotal-api-key"
export VITE_BUILTWITH_API_KEY="your-builtwith-api-key"
export VITE_OPENCAGE_API_KEY="your-opencage-api-key"
```

`BUILTWITH_API_KEY` enriches the `techStack` module. `OPENCAGE_API_KEY` enriches the `geoip` module after latitude and longitude are resolved.

### Payload Files

The SQL injection, XSS, and LFI modules load payloads from:

```text
../src/payloads/sqli.json
../src/payloads/xss.json
../src/payloads/lfi.json
```

Make sure these files exist relative to the CLI file when packaging or distributing the tool.

## Examples

Run the default passive scan:

```bash
abspider example.com
```

Run all modules:

```bash
abspider example.com --all
```

Run active checks conservatively:

```bash
abspider https://example.com --active --mode conservative
```

Run all modules with aggressive timing but common ports only:

```bash
abspider https://example.com --all --mode aggressive --port-profile common
```

Run selected modules and save JSON results:

```bash
abspider example.com --modules whois,dns,sslTls,ports,cors --output scan.json
```

Run JSON output in pretty format:

```bash
abspider example.com --all --json --pretty
```

Scan selected ports only:

```bash
abspider example.com --active --modules ports --ports 80,443,8080,8443
```

Disable colors:

```bash
abspider example.com --no-color
```

Disable certificate transparency lookup:

```bash
abspider example.com --modules subdomains --no-ct
```

## Output

### Terminal Output

By default, ABSpider prints a styled terminal interface with:

* Target information
* Selected profile and scan mode
* Module-by-module progress
* Module summaries
* Detailed findings
* Final scan summary

### JSON Output

Use `--json` for machine-readable output:

```bash
abspider example.com --all --json
```

Use `--pretty` for formatted JSON:

```bash
abspider example.com --all --json --pretty
```

Write output to a file:

```bash
abspider example.com --all --output scan.json
```

The result object includes:

* Tool name and version
* Original and normalized target
* Hostname
* Start and completion timestamps
* Profile and mode
* Module results
* Errors
* Interrupted status

## Troubleshooting

### `Target is required`

Provide a hostname or URL:

```bash
abspider example.com
```

### `Unknown option`

Check available options:

```bash
abspider --help
```

### `Unknown module`

Use a valid module name or alias:

```bash
abspider example.com --modules whois,dns,ssl,ports
```

### `Unknown mode`

Valid modes are:

```text
conservative
adaptive
aggressive
```

### `Request timed out`

Increase the timeout:

```bash
abspider example.com --timeout 20000
```

### VirusTotal module is skipped

Set an API key:

```bash
export VIRUSTOTAL_API_KEY="your-key"
```

### SecurityTrails subdomain lookup does not return results

Set an API key:

```bash
export SECURITYTRAILS_API_KEY="your-key"
```

### TLS module is skipped

The TLS module only runs against HTTPS targets or port `443`.

### Payload modules fail to load

Ensure these files exist:

```text
src/payloads/sqli.json
src/payloads/xss.json
src/payloads/lfi.json
```

<p align=center><a src=https://github.com/zanesense/abspider-recon>repo</a> • <a src=https://github.com/zanesense>developer
