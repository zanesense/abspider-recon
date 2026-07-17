# Changelog

All notable changes to ABSpider Recon are tracked here. GitHub Releases may include additional packaging notes, but this file is the repository source of truth for release history.

## Unreleased

### Fixed

- **Proxy protocol correctness** — FastAPI now requests identity encoding, frames request bodies with `Content-Length`, and skips body reads for `HEAD` and bodyless status responses.
- **Scanner false positives** — Git exposure no longer treats `403` as exposed, blind SQL injection requires a baseline-matching true condition, GET forms are excluded from CSRF findings, and reflected URLs alone no longer count as open redirects.
- **Pause status preservation** — aborted scan cleanup now preserves `paused` as well as `stopped`, preventing a paused scan from racing to `failed`.
- **Public status telemetry** — aggregate scan metrics now come from a dedicated read-only database function and count distinct users instead of exposing viewer-specific RLS results.
- **Web proxy scan accuracy** — proxy-assisted `HEAD` requests now work on Vercel and FastAPI, public targets no longer fail on unsupported DNS `ANY` queries, HTML is returned as bytes instead of JSON-serialized buffers, target headers survive the proxy hop, indeterminate browser port failures report as filtered, and manual redirects remain visible to the open-redirect scanner.
- **Browser analysis results** — SEO now uses the native HTML parser, Cloudflare detection relies on response evidence instead of incidental body text, tech fingerprinting no longer crashes on reversed meta-generator attributes, and common React, Next.js, and Nuxt signatures are detected.
- **Certificate and domain lookups** — crt.sh subdomain and SSL/TLS requests plus RDAP WHOIS requests now fall back through the same-origin proxy when browser CORS blocks direct access.
- **MX lookups** — DNS queries now use Cloudflare's JSON DoH endpoint with proxy fallback, preventing HTML gateway responses from reaching the JSON parser.
- **Request retries** — timed-out requests now receive a fresh abort controller on retry, while upstream HTML error pages are reduced to their title instead of flooding scan errors.
- **Broken link crawler scope** — `brokenLinkService.ts` now compares parsed hostnames instead of substring matching, preventing crawl of unintended external domains whose URL contains the target domain as a substring.
- **IPv6 ULA detection for fc01-fcff** — `apiUtils.ts` IPv6 ULA check now covers the full `fc00::/7` range instead of only `fc00:` and `fd*` prefixes.
- **Toast listener leak** — `use-toast.ts` listener registration no longer re-runs on every state change, preventing unbounded listener accumulation and stale-state bugs.
- **crypto.randomUUID() crash on HTTP** — `NotificationContext.tsx` now falls back to a timestamp-based ID when `crypto.randomUUID()` is unavailable (non-HTTPS contexts).
- **Semver `<`/`>` equality** — `cveScannerService.ts` versionInRange now returns `false` when all segments are equal for `<`/`>` operators instead of incorrectly matching patched versions.
- **SSL altNames suffix matching** — `sslTlsService.ts` altName filtering uses exact match or `.domain` suffix instead of `startsWith`, preventing false-positive matches on unrelated domains.
- **Meta tag attribute order** — `seoService.ts`, `siteInfoService.ts`, and `techStackService.ts` regexes now match meta tags regardless of `name`/`content` attribute order.
- **WAF probe CORS bypass** — `wafProtectionService.ts` always uses `fetchWithBypass` so CORS-restricted targets are properly reached during WAF detection.
- **GraphQL silent errors** — `graphQLService.ts` empty catch blocks now log caught exceptions instead of silently swallowing them.
- **`as any` cast removed** — `statusService.ts` no longer casts `supabase.auth` to `any`, preserving type safety on `getSession()` calls.
- **DMARC 'pc' tag removed** — `emailSecurityService.ts` no longer silently accepts the non-standard `pc` tag, parsing only the correct `pct` tag per RFC 7489.
- **Progress bar overflow on skip** — `scanService.ts` now decrements the progress counter when a module is skipped, preventing >100% progress display.
- **Cookie split comma-in-date** — `headerService.ts` cookie split regex now uses a safer pattern to avoid splitting on commas inside RFC 1123 date strings.
- **Set-Cookie `requestManager` variable declarations** — Fixed `let`/`const` lint error in `wafProtectionService.ts`.

### Security

- **Vercel proxy DNS rebinding closed** — outbound requests now connect through the public IP returned by validation instead of resolving the hostname a second time.
- **Provider proxy destinations restricted** — authenticated API-key proxy requests now require HTTPS and the exact configured provider hostname, with redirects disabled.
- **SSRF DNS rebinding closed** — `backend/main.py` replaced `httpx` with `asyncio.open_connection` using pinned IPs from a single DNS resolution, eliminating the TOCTOU window between SSRF check and HTTP request. Redirect hops are also re-validated via `_resolve_and_pin()`.
- **Rate-limiter race condition fixed** — per-IP rate limiting now uses `asyncio.Lock` to prevent concurrent requests from bypassing the bucket count check.
- **Rate-limiter memory leak patched** — empty IP buckets are purged every 5 minutes to prevent unbounded dictionary growth under IP-rotation attacks.
- **CORS origin reflection removed** — `api/keys.ts` now whitelists allowed origins instead of reflecting `Origin` verbatim with `Access-Control-Allow-Credentials`, preventing credential-bearing cross-origin reads.
- **X-Forwarded-For rate-limit spoofing** — both `backend/main.py` and `api/proxy.ts` now use `X-Forwarded-For` (behind a trusted proxy) for rate-limit bucketing instead of relying solely on `client.host` / `socket.remoteAddress`.
- **API key injection blocked** — `backend/main.py` now validates API keys for `\r`, `\n`, `\0` characters before embedding them in HTTP headers or query parameters.

### Changed

- **Cross-scan rate limiting** — `requestManager.ts` rate limiter moved from per-instance `Map` to a module-level `Map` shared across all scans, preventing scan restarts from resetting domain-level throttle state.
- **CVE database refreshable** — `cveScannerService.ts` now supports remote CVE data via `CVE_DATABASE_URL` env var or `refreshCVEDatabase()`, with the hardcoded list as fallback.

### Fixed

- **XSS false positives from error pages** — `xssScanService.ts` skips reflection checks on non-200 responses, since error pages commonly echo parameters back regardless of actual reflection.
- **Pause/resume skip bug** — `scanService.ts` pause now decrements `progress.current` by 1 so the aborted module is retried on resume instead of skipped.
- **Stale scan state in finally block** — `scanService.ts` finally block now reloads the scan from DB before checking completion status.
- **Subnet IP crash** — `scanService.ts` uses optional chaining (`?.`) on `dns.records.A` array access to prevent crash when DNS data is missing.
- **PDF report crash on null ddosFirewall fields** — `reportService.ts` uses optional chaining on `indicators` and `responseSummary` arrays.
- **Dead code removed** — `smartScanService.ts` stripped unused `responseTime` and `lastResponseTime` fields from `ScanTarget` interface.
- **RDAP malformed response crash** — `whoisService.js` guards `vcardArray` length before access to prevent crash on incomplete responses.
- **CLI module display crashes** — `abspider-cli.mjs` hardened 20+ unsafe `.length`, `.slice`, `.map` calls across all module display functions with null-safe defaults.

### Added

- **Reports now include all 35 scan modules** — PDF, DOCX, Markdown, and CSV exports cover every module result: Whois, Reverse IP, Email Security, JS Analysis, S3 Buckets, Git Exposure, Open Redirect, CVE Scanner, GraphQL, Rate Limit, CSRF, CDN/Cloud Provider detection, Robots & Sitemap, Cookie Audit, and Email Harvesting.
- **Vercel serverless functions for `/api/keys`** — `api/keys.ts` (GET/POST) and `api/keys/proxy.ts` (POST) handle API key management and provider proxying without requiring the FastAPI backend, fixing `405` errors on Vercel deployments.
- **PDF cover page** — dark-themed cover sheet with target info, scan ID, timestamp, and security grade before the executive summary.

### Changed

- **PDF vulnerability summary** — expanded from 9 to 16 rows, covering all vulnerability-related modules with severity and action columns.
- Moved release history out of `README.md` into this standalone changelog.

### Fixed

- **X-Forwarded-For rate-limit spoofing** — `api/proxy.ts` no longer trusts the client-supplied `X-Forwarded-For` header for rate-limit bucketing, using only `socket.remoteAddress`.
- **AbortSignal listener leak in proxy path** — `corsProxy.ts` now cleans up the `signal.abort` listener with `{ once: true }` on the backend proxy fallback path.
- **Raw fetch in smart scan** — `smartScanService.ts` now uses `fetchWithBypass` instead of raw `fetch()`, so CORS-protected targets are properly handled during initial recon.
- **Empty catches in GraphQL scanner** — `graphQLService.ts` error handlers now log the caught exception instead of silently swallowing it.
- **Full body read in WAF protection** — `wafProtectionService.ts` truncates response bodies to 4 KB before pattern matching, preventing OOM on large responses.
- **Null scan.status in webhook** — `webhookService.ts` adds a null guard before calling `.toUpperCase()` on `scan.status`.
- Updated README architecture and deployment notes to describe the current FastAPI `/api/proxy` backend, Docker Compose stack, and static Vercel deployment behavior.
- Documented smart proxy routing: CORS-enabled third-party APIs now bypass the FastAPI proxy while target-site probes can still use proxy fallback.
- Fixed the root `npm run cli` script to call `packages/cli/scripts/abspider-cli.mjs`.
- Updated `Dockerfile.dev` to Node 20 to match the app, CI, and CLI requirements.
- Removed stale Vite env examples for browser-bundled third-party API keys; dashboard API keys and Discord webhooks are configured per user in Settings.
- **DOCX reports** now include full vulnerability tables (SQLi, XSS, LFI, CORS, WordPress), plus site info, tech stack, security headers, GeoIP, DNS records, subdomains, SEO, broken links, WAF, VirusTotal, and SSL/TLS sections.
- **Markdown reports** now include all sections matching the PDF detail level, with formatted tables for every module.
- **CSV reports** now export detailed rows for XSS, LFI, CORS, WordPress, and broken links in addition to the existing SQL injection details.
- Landing page now shows a user avatar and **Dashboard** link when already logged in, replacing the **Sign in** button.

### Fixed

- Added `skipProxy` support to `fetchWithBypass()`, `corsProxy.fetch()`, and `RequestManager.fetch()` so direct provider APIs return their real JSON bodies instead of proxy HTML or gateway responses.
- Updated CORS-enabled API calls to bypass `/api/proxy`, including Google DNS, crt.sh, RDAP, Shodan, VirusTotal, SecurityTrails, BuiltWith, OpenCage, Hunter.io, Clearbit, ipapi, and ip-api.
- Fixed MX and GeoIP direct-fetch failures by avoiding scanner-only headers on `skipProxy` requests and replacing the HTTP GeoIP fallback with an HTTPS endpoint.
- Corrected the dashboard module count to reflect 35 recon modules.
- Added scan controls that let a user skip the currently running module and continue with the next module.
- Fixed dashboard component/widget sizing so panels use responsive dimensions instead of fixed lengths.
- **SSRF bypass via redirect following** — `proxy.ts` and `backend/main.py` now re-validate each redirect hop against blocked hostnames and private IPs instead of trusting the initial URL only.
- **Blocking DNS in async handler** — replaced `socket.getaddrinfo()` with `asyncio.getaddrinfo()` in the backend to prevent event loop blocking under concurrent requests.
- **Rate-limit spoofing via X-Forwarded-For** — the backend now prioritizes `socket.remoteAddress` over the client-supplied `X-Forwarded-For` header for rate-limit bucketing.
- **Authorization header forwarded to upstreams** — removed `authorization` from the allowed header list in both `proxy.ts` and `backend/main.py` so user credentials are never leaked to arbitrary proxy targets.
- **CVE scanner false negatives** — fixed `versionInRange()` to compare all semver segments instead of returning after the first segment, and skip CVEs when the detected version is unknown (`'detected'`) to avoid massive false positives.
- **CVE scanner pre-release handling** — `parseVersion()` no longer strips pre-release identifiers, fixing version comparison for beta/rc releases.
- **Null dereference in security grading** — added optional chaining on `vulnerabilities.length` to prevent `TypeError` crashes when a module is vulnerable but has no vulnerability array.
- **Variable name mismatch in grading** — renamed `criticalWPVulns` to properly filter for `'critical'` severity instead of `'high'`.
- **IPv4-mapped IPv6 SSRF bypass** — `isInternalIP()` now detects `::ffff:x.x.x.x` addresses as private, closing an SSRF bypass vector.
- **Metrics reference corruption in retries** — each retry attempt now creates a fresh metrics object so `recentMetrics` contains per-attempt data instead of reused references.
- **WAF challenge detection broken with HEAD** — changed detection method from `HEAD` to `GET` since HTTP HEAD responses must not include a body, making body-based WAF checks always fail.
- **Rate-limit false positives from network errors** — `rateLimitService.ts` now only counts `429` responses as blocks, not DNS failures or timeouts.
- **Open redirect detection gaps** — `openRedirectService.ts` now catches second-order redirects through same-domain gadgets and logs errors instead of swallowing them.
- **Decompression errors swallowed** — `proxyFetch.js` no longer has an empty `catch` block, so decompression failures surface instead of causing opaque parse errors.
- **Missing DNS resolution in CORS proxy** — `isInternalTarget()` does not require DNS; instead, SSRF protection is delegated to the backend proxy for any target it can't rule out by IP alone.
- **Webhook crash on null status** — `webhookService.ts` adds a null guard before calling `.toUpperCase()` on `scan.status`.
- **AbortSignal listener leak** — CORS proxy now removes `AbortSignal` event listeners on the success path to prevent accumulation.
- **Signal override in apiUtils** — `makeRequest()` no longer silently overrides a caller-provided `signal` with its own `AbortController`, preserving cancellation support.
- **Fragile SQLi time-based detection** — `sqlScanService.ts` uses a more robust check instead of matching a specific English error string.
- **`/etc/passwd` detection gated on `/bin/bash`** — `lfiScanService.ts` no longer requires `/bin/bash` to detect `/etc/passwd`, covering systems using other shells.
- **JSON.parse crash on corrupted file** — CLI report loading now wraps `JSON.parse` in a `try/catch` so a corrupt file yields a clean error instead of an unhandled exception.
- **Unhandled download rejections** — wrapped `doc.save()` and `saveAs()` calls in `try/catch` so browser-blocked downloads don't cause unhandled promise rejections.
- **RequireAuth network error crash** — added `try/catch` and a `cancelled` flag to the session check effect so network failures redirect to login instead of throwing.
- **Semver tilde operator incorrect** — fixed `cveVersionInRange` tilde (`~`) logic to match correct semver semantics (`~X.Y.Z` locks all prior parts, last part is a minimum).
- **Large body OOM in protection detection** — truncated the response body to 100 KB before string matching in `detectProtection()`.
- **Third-party API keys exposed to browser** — added a backend proxy (`/api/keys` and `/api/keys/proxy`) so Shodan, VirusTotal, SecurityTrails, BuiltWith, OpenCage, Hunter.io, and Clearbit keys never reach the browser. All seven provider API calls now route through the FastAPI backend, which attaches keys server-side. A new Supabase migration (`0004_secure_api_keys.sql`) restricts the `user_api_keys` table to `service_role` only, revoking direct client access.

## 2.1.3

### Changed

- Published CLI package updates under `packages/cli` with the `abspider` and `abspider-recon` binaries.
- Kept the CLI independent from Supabase and browser CORS limitations.

## 2.1.0

### Added

- Added 14 modules across three categories:
  - Infrastructure Analysis: CDN Detection, Cloud Provider, Email Security, Cookie Audit.
  - Reconnaissance & Discovery: JS Analysis, S3 Buckets, Git Exposure, Email Harvesting, Sitemap/Robots.
  - Vulnerability Assessment: Open Redirect, CVE Scanner, GraphQL, Rate Limiting, CSRF.
- Added the "Reconnaissance & Discovery" section in the scan configuration flow.

## 2.0.0

### Changed

- Split the project into a dashboard SPA and the published `abspider` CLI package under `packages/cli`.
- Replaced the earlier Vercel serverless/edge proxy approach with a dedicated FastAPI backend at `/api/proxy`.
- Added Docker support for the production frontend, FastAPI backend, and Vite development server.
- Introduced persistent scan history, JSON/PDF/DOCX report export, and per-user settings.
- Moved third-party API keys and Discord webhook configuration into authenticated dashboard settings backed by Supabase.

## 1.x

### Changed

- Initial pre-split recon dashboard.
- Single Vite app with a smaller module set and no published CLI package.
