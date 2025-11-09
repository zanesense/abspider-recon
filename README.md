# 🕷️ ABSpider Recon Dashboard v1.0

**ABSpider is the all-in-one, professional web reconnaissance and security analysis tool designed for penetration testers and security researchers. Powered by Vite and React, it performs real-time, comprehensive intelligence gathering right from your browser.**

![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)
![Technology](https://img.shields.io/badge/Tech-Vite%20%26%20React-61DAFB?style=for-the-badge)
![Focus](https://img.shields.io/badge/Focus-Web_Reconnaissance-7B519B?style=for-the-badge)
![API Dependency](https://img.shields.io/badge/APIs-Google%20DNS%20%7C%20crt.sh%20%7C%20RDAP-ff69b4?style=for-the-badge)
![Usage](https://img.shields.io/badge/Usage-Authorized_Security_Testing_ONLY-red?style=for-the-badge)

---

## 💻 Setup & Configuration (Vite + React)

ABSpider is built as a **Vite/React application**. To run the tool locally, you must have **Node.js** (LTS version) and **npm** or **Yarn** installed.

### 1. Local Installation

Use the following commands to clone the repository, install dependencies, and start the local development server:

```bash
# 1. Clone the repository
git clone [https://github.com/your-repo/abspider.git](https://github.com/your-repo/abspider.git)
cd abspider

# 2. Install dependencies (using npm or yarn)
npm install
# OR
yarn install

# 3. Start the application in development mode
# Vite uses 'dev' command by default
npm run dev
# OR
yarn dev
````

>🌐 The tool would run on `https://localhost:5173`). 

### 2\. Deployment (Production Build)

To prepare the application for production hosting (e.g., on Netlify, Vercel, or a static server), run the build command:

```bash
# Vite uses the 'build' command
npm run build
# OR
yarn build
```

This command creates a production-ready bundle in the default `dist/` directory.

### 3\. Application Configuration (Optional but Recommended)

Once running, configure these optional settings in the in-app **Settings** menu:

| Setting | Purpose | How to Configure |
| :--- | :--- | :--- |
| **Proxy Rotation** | Helps **avoid API rate limiting** and maintains anonymity during aggressive scans. | Enter a list of proxies (one per line) in the dedicated settings field. |
| **Discord Webhook** | Receive **real-time notifications** when long scans complete, including a summary and error reports. | Enter a valid Discord webhook URL and click "Test Webhook" to verify. |

-----

## 🚀 Usage Guide

### Starting a New Scan

1.  Click the **"New Scan"** button in the sidebar.
2.  Enter your target domain or URL (e.g., `example.com` or `https://example.com`).
3.  **Select your desired modules.** Use the checkboxes to enable or disable entire categories or individual tools based on your assessment goal.
      * *Tip:* Disable unused modules (like SEO Analysis) to increase scan speed.
4.  Set your desired **Threads** count (5 is default and safest; up to 20 for speed).
5.  Check **"Use Proxy"** if you have configured proxy rotation.
6.  Click **"Start Reconnaissance."**

### Module Selection Quick Guide

| Assessment Goal | Recommended Modules |
| :--- | :--- |
| **Infrastructure Mapping** | WHOIS, DNS Lookup, MX Lookup, Subdomain Enumeration, Port Scanning, GeoIP Lookup. |
| **Website Security Audit** | HTTP Headers, SQL Injection, XSS Testing, WordPress Scanner. |
| **External Intelligence (OSINT)** | Subdomain Enumeration, Reverse IP Lookup, Site Info (robots.txt, CMS). |

### Viewing and Reporting Results

  * Scans appear instantly on the **Dashboard** with real-time updates.
  * Click the scan entry to view **detailed results**, organized by the module used.
  * Click **"Download Report"** to generate a clean, professional PDF of all findings.

-----

## ✨ Full Module Breakdown

ABSpider is organized into six powerful sections, covering everything from basic domain intelligence to active vulnerability assessment.

| 🧩 **Category** | 🔍 **Modules Included** | 🛡️ **Key Capabilities** |
| :--- | :--- | :--- |
| **Basic Reconnaissance** | Site Info, HTTP Headers | Gathers **Title, IP, Server, CMS, Cloudflare, robots.txt**, and analyzes **Security Headers** and technologies. |
| **Network & Domain Intelligence** | WHOIS, DNS Lookup, MX Lookup, GeoIP Lookup, Subnet Calculator, Port Scanning | Comprehensive view of domain ownership, DNS records (**A, MX, TXT, DMARC, etc.**), network ranges, and **26 common ports** with service detection. |
| **Advanced Reconnaissance** | Subdomain Enumeration, Reverse IP Lookup | Deep discovery of subdomains using **DNS and Certificate Transparency** and identifying other domains on the same IP. |
| **🚨 Vulnerability Assessment** | SQL Injection, XSS Testing | **Active testing** for common web vulnerabilities. ***⚠️ Only run with explicit permission.*** |
| **CMS-Specific Scanning** | WordPress Scanner | Detailed analysis of WordPress sites, detecting **version, plugins, themes, sensitive files**, and known vulnerabilities. |
| **SEO & Content Analysis** | SEO Analysis | Passive review of **Meta tags, headings, links, social media**, and page metrics. |

-----

## 📚 External APIs and Credits

ABSpider is a powerful aggregator, leveraging several high-quality public and commercial APIs to compile its comprehensive reports. We gratefully credit the following sources for making this tool possible:

  * **Vite & React:** The foundational tools used for the fast bundling, development, and building of the user interface and dashboard experience.
  * **Google DNS over HTTPS:** Used for high-speed, reliable DNS queries and brute-forcing in the Subdomain Enumeration module.
  * **crt.sh:** Used to query public **Certificate Transparency logs** for passive subdomain discovery.
  * **RDAP (Registration Data Access Protocol):** Used to retrieve up-to-date and standardized **WHOIS** domain registration information.
  * **ipapi.co:** Used for IP address and domain information, including **GeoIP Lookup**.
  * **Other Security Tools/Concepts:** Modules like the WordPress Scanner and Vulnerability Assessment draw inspiration from industry-leading tools (e.g., Nikto, WPScan, Nmap) and established security frameworks.

-----

## ⚠️ Legal Notice: Use Responsibly

ABSpider includes modules for active testing (like **SQL Injection** and **XSS Testing**) that can be illegal.

This tool is built for **authorized security testing only**.

**DO NOT** use active testing modules or scan systems, networks, or domains unless you own them or have explicit, written permission from the owner. Unauthorized scanning and testing may be illegal in your jurisdiction and carries severe legal penalties.

-----

<p align=center>
<b>© 2025 ABSpider Recon Dashboard</b> - <i>Professional intelligence, simplified.</i><br>
Built with ❤️ by <b><a href="https://github.com/zanesense">zanesense.</a></b>
</p>
