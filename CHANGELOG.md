# Changelog

All notable changes to ABSpider Recon are tracked here. GitHub Releases may include additional packaging notes, but this file is the repository source of truth for release history.

## Unreleased

### Changed

- Moved release history out of `README.md` into this standalone changelog.
- Updated README architecture and deployment notes to describe the current FastAPI `/api/proxy` backend, Docker Compose stack, and static Vercel deployment behavior.
- Documented smart proxy routing: CORS-enabled third-party APIs now bypass the FastAPI proxy while target-site probes can still use proxy fallback.
- Fixed the root `npm run cli` script to call `packages/cli/scripts/abspider-cli.mjs`.
- Updated `Dockerfile.dev` to Node 20 to match the app, CI, and CLI requirements.
- Removed stale Vite env examples for browser-bundled third-party API keys; dashboard API keys and Discord webhooks are configured per user in Settings.

### Fixed

- Added `skipProxy` support to `fetchWithBypass()`, `corsProxy.fetch()`, and `RequestManager.fetch()` so direct provider APIs return their real JSON bodies instead of proxy HTML or gateway responses.
- Updated CORS-enabled API calls to bypass `/api/proxy`, including Google DNS, crt.sh, RDAP, Shodan, VirusTotal, SecurityTrails, BuiltWith, OpenCage, Hunter.io, Clearbit, ipapi, and ip-api.
- Corrected the dashboard module count to reflect 35 recon modules.
- Added scan controls that let a user skip the currently running module and continue with the next module.
- Fixed dashboard component/widget sizing so panels use responsive dimensions instead of fixed lengths.

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
