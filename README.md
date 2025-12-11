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

---

## ✨ Uncover Hidden Threats with ABSpider Recon

**ABSpider** is a cutting-edge, browser-based reconnaissance dashboard crafted for security professionals, penetration testers, and bug bounty hunters. It offers a sleek UI, blazing-fast performance, and a powerful blend of **passive-first** and optional **active modules**, all powered by **Vite + React**.

Dive deep into web targets, gather actionable intelligence, and identify vulnerabilities with unparalleled ease.

---

## 🚀 Live Demo & Deployment

Experience ABSpider Recon Dashboard in action right now!

> 🌐 **[Launch ABSpider Recon Dashboard](https://abspider-recon.vercel.app)**

---

## 🌟 Why ABSpider? Your Reconnaissance Superpower

*   **🕵️‍♂️ Intelligence-First Approach:** Prioritizes passive data collection (WHOIS, CT Logs, GeoIP) to minimize footprint, with powerful active scans (SQLi, XSS, LFI, Port Scanning) available when authorized.
*   **📊 Professional Reporting:** Generate comprehensive, exportable **PDF reports** summarizing all findings, complete with severity, evidence, and remediation advice.
*   **🔔 Real-time Notifications:** Stay informed with **Discord webhook notifications** for instant scan updates and critical alerts.
*   **⚙️ Seamless Configuration:** Manage all scan parameters, proxies, and API keys directly through a secure, centralized **Dashboard Settings UI**.
*   **🛡️ Intelligent Bypass:** Overcome common web protections with built-in **CORS & Cloudflare Bypass** mechanisms.
*   **⚡ Blazing Fast:** Built with **Vite + React** for a lightning-fast development and user experience.
*   **⏰ Client-Side Scheduling:** Automate your reconnaissance tasks with flexible daily, weekly, or monthly scheduling (requires the browser tab to be open).

---

## 🧭 Core Features & Modules: Your Arsenal

ABSpider employs a modular approach, offering both stealthy passive checks and comprehensive active vulnerability scans.

| Module                     | Description                                                              | Type      |
| :------------------------- | :----------------------------------------------------------------------- | :-------- |
| 🌐 Site Information        | Basic website details, IP, web server, CMS, and `robots.txt` analysis.   | Passive   |
| 🛡️ HTTP Headers Analysis   | Real-time security header scoring (HSTS, CSP, XFO) and technology fingerprinting. | Passive   |
| 💻 Tech Stack Fingerprinting | Identifies web technologies, frameworks, and analytics used by the target. | Passive   |
| 📜 WHOIS / RDAP Lookup     | Domain registration, registrar, nameservers, and date information.       | Passive   |
| 📍 GeoIP Location          | Pinpoints the physical location of the target server's IP address.       | Passive   |
| 📡 DNS Records             | Enumerates A, AAAA, CNAME, TXT, MX, NS, and SOA records.                 | Passive   |
| 📧 MX Records               | Analyzes mail server configurations, including SPF and DMARC.            | Passive   |
| 🔍 Subdomain Enumeration    | Discovers subdomains using Certificate Transparency (CT) logs and DNS lookups. | Passive   |
| 🔄 Reverse IP Lookup        | Identifies other domains hosted on the same IP address.                  | Passive   |
| 📈 SEO Analysis            | Analyzes meta tags, headings, links, and page performance for SEO insights. | Passive   |
| 🔌 Port Scanning           | Checks connectivity and identifies services on common ports, with Shodan integration. | Active    |
| 💉 SQL Injection Test      | Checks for potential **SQL Injection (SQLi)** vulnerabilities.          | Active    |
| ✍️ XSS Detection            | Detects reflected, DOM, and stored **XSS** vulnerabilities.              | Active    |
| 📁 LFI Scanning            | Scans for Local File Inclusions using real payloads.                     | Active    |
| ⚠️ CORS Misconfiguration   | Identifies Cross-Origin Resource Sharing (CORS) vulnerabilities.         | Active    |
| 🦠 VirusTotal Scan          | Domain reputation, malware scanning, and threat intelligence via VirusTotal API. | Active    |
| 🔗 Broken Link Checker      | Scans for broken internal and external links on the target website.      | Active    |
| 🧱 DDoS Firewall Test      | Detects WAF/DDoS protection mechanisms (e.g., Cloudflare, Sucuri).       | Active    |
| 🔒 SSL/TLS Analysis        | Analyzes SSL/TLS certificate details, issuer, expiry, and common names.  | Passive   |
| 🔢 Subnet Scan             | Calculates network range details for a given IP and CIDR.                | Utility   |
| ⚙️ WordPress Scan          | Identifies WordPress versions, plugins, themes, and common vulnerabilities. | Utility   |

---

## 🔒 Security & Authentication

ABSpider leverages **Supabase** for robust and passwordless user authentication. Users gain access via a **Magic Link** sent to their email, eliminating the need to manage passwords and enhancing security. Access to the dashboard is strictly enforced, ensuring only authorized users can initiate scans and view sensitive data.

---

## 📑 Detailed Reporting & Integrations

### 📄 Comprehensive PDF Reports

Our reports are designed for professional security analysis and include:

*   **Executive Summary** and overall security grade.
*   **Module-by-Module Findings** with raw evidence.
*   Vulnerability severity & **confidence scores**.
*   Reproducible steps & **Proof-of-Concept (PoC)** snippets.
*   Actionable remediation recommendations for discovered flaws.

### 🔗 Seamless Integrations

*   **Discord Webhooks:** Real-time scan completion notifications and alerts.
*   **Local Storage:** Persists scan history and settings locally within the browser for convenience.
*   **Export Options:** Provides findings in **PDF / JSON** formats for triage and submission.

### 🔑 Optional API Keys (Enhance Your Recon)

> **⚠️ CRITICAL WARNING: Client-Side Accessible API Key Storage**
> API keys are stored in your Supabase database, but are still accessible client-side. This means any Cross-Site Scripting (XSS) vulnerability or physical access to your browser could expose these keys.
> **DO NOT store sensitive, paid, or production API keys here.** This feature is intended for testing with non-critical keys only. For production use, a secure backend for API key management is strongly recommended.

| Service        | Purpose                                                              | Status   |
| :------------- | :------------------------------------------------------------------- | :------- |
| Shodan         | Enhanced port scanning, banner grabbing, and vulnerability detection. | Optional |
| VirusTotal     | Domain reputation, malware scanning, and threat intelligence.        | Optional |
| SecurityTrails | Historical DNS data, subdomain discovery, and WHOIS history.         | Optional |
| BuiltWith      | Technology stack detection, analytics, and framework identification. | Optional |
| OpenCage       | Enhanced geocoding, reverse geocoding, and detailed location data.   | Optional |
| Hunter.io      | Email discovery, domain search, and email verification.              | Optional |
| Clearbit       | Company data enrichment, logo API, and business intelligence.        | Optional |

---

## 🚀 Quick Start: Get Running in Minutes

To start your development server, follow these simple steps:

```bash
# 1. Clone the repository
git clone https://github.com/zanesense/abspider-recon.git
cd abspider-recon

# 2. Install dependencies using npm or yarn
npm install
# or
yarn install

# 3. Start the development server
npm run dev
# or
yarn dev
```

> Open your browser at `http://localhost:5000`.
> ⚙️ **Note:** All scan configurations (targets, proxies, webhooks) are managed exclusively through the **Dashboard Settings UI**.

---

## 📸 Interface Preview

<img src="https://i.postimg.cc/zfKzfkTj/localhost-5000.png" alt="ABSpider Recon Dashboard Interface" width="100%">

---

## ⚖️ Legal Notice & Ethical Use

ABSpider is strictly for **authorized security testing only**.

**Unauthorized scanning** of domains you do not own or do not have **explicit written permission** to test may be illegal. Always comply with applicable local, state, and international laws. **Use responsibly.**

> ⚠️ **IMPORTANT WARNING: Authorized Use Only**
> *   You may **ONLY** scan websites and systems you own or have explicit written authorization to test.
> *   Unauthorized scanning may be illegal in your jurisdiction.
> *   You are solely responsible for ensuring you have proper authorization. Keep documentation of authorization for all scans performed.
> *   Comply with all applicable laws including Computer Fraud and Abuse Act (CFAA), GDPR, and local regulations.
> *   Unauthorized access to computer systems is a criminal offense in most jurisdictions. Penalties may include fines, imprisonment, and civil liability.
> *   This tool does not grant permission to scan any system.

> ⚠️ **WARNING: Internal Targets**
> Scanning internal IP addresses or `localhost` without explicit authorization is highly discouraged and may be illegal. The tool will warn you if an internal target is detected.

> ⚠️ **WARNING: Public CORS Proxy Risks**
> Using public CORS proxies can expose your target URLs, headers, and response content to the proxy operators. For sensitive operations, consider setting up a self-hosted, trusted CORS proxy or using a direct fetch only mode. The security and reliability of these third-party services are not guaranteed.

---

## 🙏 Credits & Acknowledgements

Special thanks to the open-source community for empowering modern reconnaissance workflows.

| Component / Service        | Purpose                                                              |
| :------------------------- | :------------------------------------------------------------------- |
| **React**                  | Core UI library for the frontend.                                    |
| **Vite**                   | Fast frontend bundling and development tooling.                      |
| **Supabase**               | User authentication and database services.                           |
| **crt.sh / CT logs**       | Certificate Transparency sources for passive subdomain discovery.    |
| **Google DNS-over-HTTPS**  | High-speed, secure DNS lookups.                                      |
| **Public WHOIS / RDAP APIs** | Domain registration and ownership information.                       |
| **jsPDF & jspdf-autotable** | Client-side PDF report generation.                                   |
| **Lucide React**           | Beautiful and customizable SVG icons.                                |
| **Tailwind CSS & shadcn/ui** | Utility-first CSS framework and accessible UI components.            |
| **@tanstack/react-query**  | Powerful server state management.                                    |
| **React Hook Form & Zod**  | Robust form handling and validation.                                 |
| **Sonner**                 | Modern toast notifications.                                          |

---

## 💜 Contributors 

<a href="https://github.com/zanesense/abspider-recon/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=zanesense/abspider-recon" />
</a>

---

<p align=center>© 2025 <a href="https://github.com/zanesense"><b>zanesense</b></a> · <i>Built for security professionals.</i> 🚀</p>
