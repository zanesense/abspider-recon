# 🕸️ ABSpider Recon Dashboard: A Modern Security Tool

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

> **ABSpider** is a modern, browser-based reconnaissance dashboard built for security professionals and bug bounty hunters. It features a lightweight UI, fast performance, and a powerful mix of **passive-first** and optional **active modules**, powered by **Vite + React**.

---

## 🔒 Security & Deployment

### User Authentication
ABSpider leverages **Supabase** for robust and passwordless user authentication. Users gain access via a **Magic Link** sent to their email, eliminating the need to manage passwords and enhancing security.

### Live Deployment
The latest version of ABSpider Recon Dashboard is deployed and available here:
 > 🌐 [Abspider Recon Dashboard](https://abspider-recon.vercel.app)

---

## 💡 Key Highlights & Overview

ABSpider enables security teams to quickly gather **actionable intelligence** on web targets.

* **Intelligence Focus:** Real-time, passive data collection (WHOIS, CT Logs) paired with optional active scanning (SQLi, XSS, LFI).
* **Reporting:** Generates professional, exportable **PDF reports** summarizing all findings.
* **Notifications:** Supports **Discord webhook notifications** for real-time scan updates.
* **Configuration:** Secure, centralized **Dashboard Settings**—no manual `.env` files required.

---

## 🚀 Quick Start: Get Running in Minutes

To start your development server, follow these simple steps:

```bash
# Clone the repository
git clone [https://github.com/zanesense/abspider-recon.git](https://github.com/zanesense/abspider-recon.git)
cd abspider-recon

# Install dependencies using npm or yarn
npm install
# or
yarn install

# Start the development server
npm run dev
# or
yarn dev
````

> Open your browser at http://localhost:5000.

> ⚙️ **Note:** All scan configurations (targets, proxies, webhooks) are managed exclusively through the **Dashboard Settings UI**.

-----

## 🧭 Core Features & Modules

ABSpider uses a modular approach, offering both stealthy passive checks and comprehensive active vulnerability scans.

| Module                    | Type    | Description                                                                     |
| :------------------------ | :------ | :------------------------------------------------------------------------------ |
| **HTTP Headers Analysis** | Passive | Real-time security header scoring (HSTS, CSP, XFO) and technology fingerprinting. |
| **WHOIS / RDAP Lookup** | Passive | Retrieves domain registration, registrar, nameservers, and date information via public APIs. |
| **Subdomain Enumeration** | Passive | Discovers subdomains using Certificate Transparency (CT) logs and concurrent DNS lookups. |
| **Port Scanning** | Active  | Checks connectivity and identifies services on common ports (21, 22, 80, 443, 3306). |
| **SQL Scan** | Active  | Checks for potential **SQL Injection (SQLi)** vulnerabilities in input fields and parameters. |
| **XSS Scan** | Active  | Detects reflected, DOM, and stored **XSS** vulnerabilities using context-aware payloads. |
| **LFI Scan** | Active  | Scans for Local File Inclusions using real payloads. |
| **PDF Report Generation** | Utility | Generates professional, exportable PDF reports summarizing all scan findings.     |
| **Discord Webhook** | Utility | Sends scan notifications and rich embeds to specified Discord channels in real-time. |

### Additional Features:

  - CORS Bypass using CORS Proxies
  - Cloudflare Bypass
  - Threadded Scanning for faster lookups

-----

## 📑 Detailed Reporting & Integrations

### Reporting

PDF reports are designed for professional security analysis and include:

  * **Executive Summary** and overall security score.
  * **Module-by-Module Findings** with raw evidence.
  * Vulnerability severity & **CVSS-like scoring**.
  * Reproducible steps & **Proof-of-Concept (PoC)** snippets.
  * Remediation recommendations for discovered flaws.

### Integrations

| Integration          | Purpose                                                     |
| :------------------- | :---------------------------------------------------------- |
| **Discord Webhooks** | Real-time scan completion notifications and alerts.         |
| **Local Storage** | Secures sensitive PoC data locally within the browser.      |
| **Export Options** | Provides findings in **PDF / JSON** formats for triage and submission. |

### Optional APIs

> Configure API keys in the settings tab

| Integration          | Purpose                                                     |
| :------------------- | :---------------------------------------------------------- |
| **Shodan** | Enhanced port scanning, banner grabbing, and vulnerability detection.         |
| **VirusTotal** | Domain reputation, malware scanning, and threat intelligence.     |
| **SecurityTrails** | Historical DNS data, subdomain discovery, and WHOIS history. |
| **BuiltWith** | Technology stack detection, analytics, and framework identification. |
| **OpenCage** | Enhanced geocoding, reverse geocoding, and detailed location data. |
| **Hunter.io** | Email discovery, domain search, and email verification. |
| **ClearBit** | Company data enrichment, logo API, and business intelligence. |

-----

## 📸 Interface

<img src="https://i.postimg.cc/Ss4nWCRY/localhost-5000.png">

-----

## ⚖️ Legal Notice

ABSpider is strictly for **authorized security testing only**.

**Unauthorized scanning** of domains you do not own or do not have **explicit written permission** to test may be illegal. Always comply with applicable local, state, and international laws. **Use responsibly.**

-----

## 🙏 Credits & Acknowledgements

| Component / Service     | Purpose                                                     |
| :---------------------- | :---------------------------------------------------------- |
| React                   | Core UI library for the frontend.                           |
| Vite                    | Fast frontend bundling and development tooling.             |
| **Supabase** | User authentication and database services.                  |
| crt.sh / CT logs        | Certificate Transparency sources for passive subdomain discovery. |
| Google DNS-over-HTTPS   | High-speed, secure DNS lookups.                             |
| Public WHOIS / RDAP APIs | Domain registration and ownership information.              |

Special thanks to the open-source community for empowering modern reconnaissance workflows.

-----

<p align=center>© 2025 <a href="https://github.com/zanesense"><b>zanesense</b></a> · <i>Built for security professionals.</i> 🚀</p>
