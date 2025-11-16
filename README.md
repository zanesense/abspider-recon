# 🕸️ ABSpider Recon Dashboard: Your Modern Web Security Intelligence Hub

<p align="center">
  <a href="https://github.com/zanesense/abspider-recon/releases">
    <img src="https://img.shields.io/badge/release-v1.0.0-blue.svg?style=flat&scale=1.1" alt="Release Version">
  </a>
  <a href="https://github.com/zanesense/abspider-recon/actions">
    <img src="https://img.shields.io/badge/build-passing-brightgreen.svg?style=flat&scale=1.1" alt="Build Status">
  </a>
  <a href="https://chatgpt.com/c/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-yellow.svg?style=flat&scale=1.1" alt="License: MIT">
  </a>
  <a href="https://github.com/zanesense/abspider-recon/stargazers">
    <img src="https://img.shields.io/github/stars/zanesense/abspider-recon?style=flat&label=Stars&scale=1.1" alt="GitHub Stars">
  </a>
  <a href="https://github.com/zanesense/abspider-recon/graphs/contributors">
    <img src="https://img.shields.io/badge/contributors-welcome-orange.svg?style=flat&scale=1.1" alt="Contributors Welcome">
  </a>
  <img src="https://img.shields.io/github/forks/zanesense/abspider-recon?style=flat&label=Forks&scale=1.1" alt="GitHub Forks">
  <img src="https://img.shields.io/github/last-commit/zanesense/abspider-recon?style=flat&scale=1.1" alt="Last Commit">
  <img src="https://img.shields.io/github/languages/code-size/zanesense/abspider-recon?style=flat&scale=1.1" alt="Code Size">
</p>

> **ABSpider** is a cutting-edge, browser-based reconnaissance dashboard crafted for security professionals and bug bounty hunters. It offers a sleek UI, blazing-fast performance, and a powerful blend of **passive-first** and optional **active modules**, all powered by **Vite + React**.

---

## 🔒 Security & Deployment

### User Authentication
ABSpider leverages **Supabase** for robust and passwordless user authentication. Users gain access via a **Magic Link** sent to their email, eliminating the need to manage passwords and enhancing security. Access to the dashboard is strictly enforced, ensuring only authorized users can initiate scans and view sensitive data.

### Live Deployment
The latest version of ABSpider Recon Dashboard is deployed and available here:
 > 🌐 [Abspider Recon Dashboard](https://abspider-recon.vercel.app)

---

## 💡 Key Highlights & Overview

ABSpider empowers security teams to quickly gather **actionable intelligence** on web targets, from basic site information to deep vulnerability assessments.

*   **Intelligence Focus:** Real-time, passive data collection (WHOIS, CT Logs, GeoIP) paired with optional active scanning (SQLi, XSS, LFI, Port Scanning).
*   **Reporting:** Generates professional, exportable **PDF reports** summarizing all findings.
*   **Notifications:** Supports **Discord webhook notifications** for real-time scan updates.
*   **Configuration:** Secure, centralized **Dashboard Settings**—no manual `.env` files required.
*   **CORS & Cloudflare Bypass:** Intelligent mechanisms to overcome common web protections.

---

## 🧭 Core Features & Modules

ABSpider employs a modular approach, offering both stealthy passive checks and comprehensive active vulnerability scans.

| Module                    | Type    | Description                                                                     |
| :------------------------ | :------ | :------------------------------------------------------------------------------ |
| **Site Information**      | Passive | Gathers basic website details, IP, web server, CMS, and `robots.txt`.           |
| **HTTP Headers Analysis** | Passive | Real-time security header scoring (HSTS, CSP, XFO) and technology fingerprinting. |
| **WHOIS / RDAP Lookup**   | Passive | Retrieves domain registration, registrar, nameservers, and date information.    |
| **GeoIP Location**        | Passive | Pinpoints the physical location of the target server's IP address.              |
| **DNS Records**           | Passive | Enumerates A, AAAA, MX, NS, TXT, CNAME, and SOA records.                        |
| **MX Records**            | Passive | Analyzes mail server configurations, including SPF and DMARC.                   |
| **Subnet Scan**           | Utility | Calculates network range details for a given IP and CIDR.                       |
| **Port Scanning**         | Active  | Checks connectivity and identifies services on common ports, with Shodan integration. |
| **Subdomain Enumeration** | Passive | Discovers subdomains using Certificate Transparency (CT) logs and DNS lookups.  |
| **Reverse IP Lookup**     | Passive | Identifies other domains hosted on the same IP address.                         |
| **SQL Injection Test**    | Active  | Checks for potential **SQL Injection (SQLi)** vulnerabilities.                 |
| **XSS Detection**         | Active  | Detects reflected, DOM, and stored **XSS** vulnerabilities.                     |
| **LFI Scanning**          | Active  | Scans for Local File Inclusions using real payloads.                            |
| **WordPress Scan**        | Utility | Identifies WordPress versions, plugins, themes, and common vulnerabilities.     |
| **SEO Analysis**          | Passive | Analyzes meta tags, headings, links, and page performance for SEO insights.     |
| **DDoS Firewall Test**    | Active  | Detects WAF/DDoS protection mechanisms (e.g., Cloudflare, Sucuri).              |
| **PDF Report Generation** | Utility | Generates professional, exportable PDF reports summarizing all scan findings.     |
| **Discord Webhook**       | Utility | Sends scan notifications and rich embeds to specified Discord channels.         |

### Additional Features:

*   **CORS Bypass** using intelligent proxy rotation.
*   **Cloudflare Bypass** for enhanced target accessibility.
*   **Threaded Scanning** for faster lookups and concurrent operations.

-----

## 📑 Detailed Reporting & Integrations

### Reporting

PDF reports are designed for professional security analysis and include:

*   **Executive Summary** and overall security score.
*   **Module-by-Module Findings** with raw evidence.
*   Vulnerability severity & **CVSS-like scoring**.
*   Reproducible steps & **Proof-of-Concept (PoC)** snippets.
*   Remediation recommendations for discovered flaws.

### Integrations

| Integration          | Purpose                                                     |
| :------------------- | :---------------------------------------------------------- |
| **Discord Webhooks** | Real-time scan completion notifications and alerts.         |
| **Local Storage**    | Persists scan history and settings locally within the browser. |
| **Export Options**   | Provides findings in **PDF / JSON** formats for triage and submission. |

### Optional APIs

> Configure API keys in the settings tab for enhanced data.
> **⚠️ CRITICAL WARNING:** Private API keys are stored directly in your browser's local storage. This is highly insecure. **DO NOT store sensitive, paid, or production API keys here.** This feature is intended for testing with non-critical keys only. For production use, a secure backend for API key management is strongly recommended.

| Integration          | Purpose                                                     |
| :------------------- | :---------------------------------------------------------- |
| **Shodan**           | Enhanced port scanning, banner grabbing, and vulnerability detection.         |
| **VirusTotal**       | Domain reputation, malware scanning, and threat intelligence.     |
| **SecurityTrails**   | Historical DNS data, subdomain discovery, and WHOIS history. |
| **BuiltWith**        | Technology stack detection, analytics, and framework identification. |
| **OpenCage**         | Enhanced geocoding, reverse geocoding, and detailed location data. |
| **Hunter.io**        | Email discovery, domain search, and email verification. |
| **Clearbit**         | Company data enrichment, logo API, and business intelligence. |

-----

## 🚀 Quick Start: Get Running in Minutes

To start your development server, follow these simple steps:

```bash
# Clone the repository
git clone https://github.com/zanesense/abspider-recon.git
cd abspider-recon

# Install dependencies using npm or yarn
npm install
# or
yarn install

# Start the development server
npm run dev
# or
yarn dev
```

> Open your browser at `http://localhost:5000`.

> ⚙️ **Note:** All scan configurations (targets, proxies, webhooks) are managed exclusively through the **Dashboard Settings UI**.

-----

## 📸 Interface

<img src="https://i.postimg.cc/Ss4nWCRY/localhost-5000.png">

-----

## ⚖️ Legal Notice

ABSpider is strictly for **authorized security testing only**.

**Unauthorized scanning** of domains you do not own or do not have **explicit written permission** to test may be illegal. Always comply with applicable local, state, and international laws. **Use responsibly.**

> ⚠️ **WARNING:** Scanning internal IP addresses or `localhost` without explicit authorization is highly discouraged and may be illegal. The tool will warn you if an internal target is detected.

> ⚠️ **WARNING:** Using public CORS proxies can expose your target URLs, headers, and response content to the proxy operators. For sensitive operations, consider setting up a self-hosted, trusted CORS proxy or using a direct fetch only mode. The security and reliability of these third-party services are not guaranteed.

-----

## 🙏 Credits & Acknowledgements

| Component / Service     | Purpose                                                     |
| :---------------------- | :---------------------------------------------------------- |
| React                   | Core UI library for the frontend.                           |
| Vite                    | Fast frontend bundling and development tooling.             |
| **Supabase**            | User authentication and database services.                  |
| crt.sh / CT logs        | Certificate Transparency sources for passive subdomain discovery. |
| Google DNS-over-HTTPS   | High-speed, secure DNS lookups.                             |
| Public WHOIS / RDAP APIs | Domain registration and ownership information.              |

Special thanks to the open-source community for empowering modern reconnaissance workflows.

-----

<p align=center>© 2025 <a href="https://github.com/zanesense"><b>zanesense</b></a> · <i>Built for security professionals.</i> 🚀</p>