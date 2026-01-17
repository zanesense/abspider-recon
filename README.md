# 🕸️ ABSpider Recon: Web Security Made Easy!

<p align="center">
  <strong>Modern Web Security Intelligence Platform</strong>
</p>

<p align="center">
  <a href="https://github.com/zanesense/abspider-recon/releases">
    <img src="https://img.shields.io/badge/release-v1.0.0-blue.svg" alt="Release">
  </a>
  <a href="https://github.com/zanesense/abspider-recon/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-yellow.svg" alt="License">
  </a>
  <a href="https://github.com/zanesense/abspider-recon/stargazers">
    <img src="https://img.shields.io/github/stars/zanesense/abspider-recon" alt="Stars">
  </a>
</p>

---

## 🎯 What is ABSpider?

ABSpider is a powerful browser-based reconnaissance dashboard built for security professionals, penetration testers, and bug bounty hunters. Combining **passive intelligence gathering** with **active vulnerability scanning**, it delivers actionable security insights through an intuitive modern interface.

**🌐 [Try Live Demo](https://abspider-recon.vercel.app)**

---

## 🎯 Why Choose ABSpider?

- **🚀 Zero Backend Required** - Fully browser-based with client-side processing
- **🔒 Privacy-First** - Your data stays in your browser, no server-side tracking
- **⚡ 20+ Recon Modules** - Comprehensive passive and active scanning capabilities
- **📊 Enterprise Reporting** - Professional PDF reports with actionable insights
- **🎨 Modern UX** - Intuitive interface built with React and Tailwind CSS
- **🔌 Extensible** - Optional API integrations for enhanced intelligence gathering

---

## ✨ Key Features

### 🔍 Intelligence Gathering
- **Passive Reconnaissance:** WHOIS lookup, DNS enumeration, subdomain discovery via CT logs, GeoIP location
- **Active Scanning:** SQL injection, XSS detection, LFI scanning, port scanning, CORS testing
- **Technology Fingerprinting:** Identify frameworks, CMS, analytics, and server technologies
- **Security Analysis:** HTTP header scoring, SSL/TLS certificate validation, WAF detection

### 🛡️ Smart Scanning
- **AI-Powered Modes:** Conservative, adaptive, and aggressive scanning with intelligent payload management
- **Real-time Monitoring:** Target health tracking with automatic intensity adjustment
- **Stealth Detection:** Automatic WAF and rate-limiting detection

### 📊 Professional Reporting
- **Comprehensive PDF Reports:** Executive summaries, detailed findings, PoC snippets, and remediation guidance
- **Export Options:** JSON and PDF formats for easy integration with your workflow
- **Severity Scoring:** Clear vulnerability classification with confidence ratings

### 🔔 Stay Informed
- **Notification Center:** Real-time scan updates with smart categorization
- **Discord Integration:** Instant webhook notifications for critical alerts
- **Activity Dashboard:** Track scan history and performance metrics

### ⚙️ Advanced Configuration
- **Centralized Settings:** Manage API keys, proxies, and scan parameters from one place
- **Scan Templates:** Save and reuse configurations for repeated tasks
- **Scheduling:** Automate reconnaissance with daily, weekly, or monthly schedules
- **User Profiles:** Personalized preferences with role-based access

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/zanesense/abspider-recon.git
cd abspider-recon

# Install dependencies
npm install

# Start development server
npm run dev
```

Access the dashboard at `http://localhost:5000`

---

## 📸 Interface Preview

<p align="center">
  <img src="https://i.postimg.cc/dsfymjY8/screencapture-localhost-5000-dashboard-2026-01-02-05-09-52.png" alt="ABSpider Recon Dashboard Interface" width="100%">
</p>

---

## 🧰 Reconnaissance Modules

| Module | Description | Type |
|--------|-------------|------|
| 🌐 Site Info | IP, server, CMS, robots.txt analysis | Passive |
| 🛡️ Headers | Security header scoring (HSTS, CSP, XFO) | Passive |
| 📜 WHOIS | Domain registration and ownership data | Passive |
| 📍 GeoIP | Server location identification | Passive |
| 📡 DNS | A, AAAA, CNAME, TXT, MX, NS records | Passive |
| 🔍 Subdomains | CT log enumeration and DNS discovery | Passive |
| 📈 SEO | Meta tags, headings, performance analysis | Passive |
| 🔌 Ports | Service detection with Shodan integration | Active |
| 💉 SQLi | SQL injection vulnerability testing | Active |
| ✍️ XSS | Reflected, DOM, and stored XSS detection | Active |
| 📁 LFI | Local file inclusion scanning | Active |
| ⚠️ CORS | Cross-origin misconfiguration testing | Active |
| 🦠 VirusTotal | Domain reputation and malware scanning | Active |
| 🔒 SSL/TLS | Certificate validation and analysis | Passive |

---

## 💼 Use Cases

**Perfect for:**

- 🎯 **Bug Bounty Hunters** - Rapid reconnaissance and vulnerability discovery
- 🛡️ **Penetration Testers** - Comprehensive security assessments with professional reporting
- 🔍 **Security Researchers** - Deep-dive analysis of web application architecture
- 📊 **Security Auditors** - Compliance testing and security posture evaluation
- 🚨 **Red Team Operations** - Initial footprinting and attack surface mapping
- 👨‍💻 **Developers** - Security testing during development lifecycle

---

## 🔐 Security & Authentication

- **Supabase Authentication:** Passwordless magic link login
- **Role-Based Access:** Secure user management and permissions
- **Data Encryption:** Client-side storage with secure handling
- **API Key Management:** Optional integrations with Shodan, VirusTotal, SecurityTrails, and more

> ⚠️ **Security Notice:** API keys are stored client-side. Use test keys only—never production or sensitive credentials.

---

## ⚖️ Legal & Ethical Use

**⚠️ CRITICAL: Authorized Use Only**

- Only scan systems you **own** or have **explicit written permission** to test
- Unauthorized scanning is **illegal** in most jurisdictions
- You are **solely responsible** for compliance with applicable laws (CFAA, GDPR, etc.)
- Keep documentation of authorization for all scans
- Violations may result in criminal prosecution, fines, and civil liability

**This tool does not grant permission to scan any system.**

---

## 🛠️ Built With

- **Frontend:** React + Vite + Tailwind CSS
- **UI Components:** shadcn/ui + Lucide Icons
- **Backend:** Supabase (Auth & Database)
- **Reports:** jsPDF + jspdf-autotable
- **State Management:** TanStack Query
- **Forms:** React Hook Form + Zod

---

## 🗺️ Roadmap

- [ ] Multi-target batch scanning
- [ ] Custom payload libraries
- [ ] Advanced WAF fingerprinting
- [ ] Automated vulnerability chaining
- [ ] Integration with popular security tools (Burp Suite, OWASP ZAP)
- [ ] Mobile app for iOS/Android
- [ ] Team collaboration features
- [ ] Backend API for enterprise deployments

---

## ❓ FAQ

**Q: Do I need API keys to use ABSpider?**  
A: No! ABSpider works out-of-the-box with passive modules. API keys are optional for enhanced features (Shodan, VirusTotal, etc.).

**Q: Is this legal to use?**  
A: Yes, but only on systems you own or have explicit written authorization to test. Unauthorized scanning is illegal.

**Q: Can I use this for commercial projects?**  
A: Yes! ABSpider is MIT licensed. You can use it for both personal and commercial purposes.

**Q: Does ABSpider store my scan data?**  
A: Scan results are securely stored in your Supabase database and associated with your account. Your data is private and accessible only to you.

**Q: How accurate are the vulnerability findings?**  
A: Results include confidence scores. Always manually verify findings before reporting vulnerabilities.

**Q: Can I contribute to the project?**  
A: Absolutely! Check our [contribution guidelines](https://github.com/zanesense/abspider-recon/blob/main/CONTRIBUTING.md).

---

## 📚 Documentation & Support

- 📖 [Full Documentation](https://github.com/zanesense/abspider-recon/wiki) *(Coming Soon)*
- 🐛 [Report Bugs](https://github.com/zanesense/abspider-recon/issues/new?template=bug_report.md)
- 💡 [Request Features](https://github.com/zanesense/abspider-recon/issues/new?template=feature_request.md)
- 💬 [Discussions](https://github.com/zanesense/abspider-recon/discussions)

---

## 🤝 Contributing

Contributions are welcome! Check out our [contribution guidelines](https://github.com/zanesense/abspider-recon/blob/main/CONTRIBUTING.md) to get started.

<a href="https://github.com/zanesense/abspider-recon/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=zanesense/abspider-recon" />
</a>

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <sub>Built with 💜 by <a href="https://github.com/zanesense">zanesense</a></sub>
  <br>
  <sub>Empowering security professionals worldwide 🚀</sub>
</p>