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
 <a href="https://deepwiki.com/zanesense/abspider-recon"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki"></a>
</p>

---

## 🎯 What is ABSpider?

ABSpider is a powerful browser-based reconnaissance dashboard built for security professionals, penetration testers, and bug bounty hunters. Combining **passive intelligence gathering** with **active vulnerability scanning**, it delivers actionable security insights through an intuitive modern interface.

**🌐 [Try Live Demo](https://abspider-recon.vercel.app)**

---

## 🎯 Why Choose ABSpider?

<table>
  <tr>
    <td align="center" width="16%">
      <b>🚀</b><br/>
      <b>Zero Backend</b><br/>
      <sub>Fully browser-based</sub>
    </td>
    <td align="center" width="16%">
      <b>🔒</b><br/>
      <b>Privacy-First</b><br/>
      <sub>Your data, your control</sub>
    </td>
    <td align="center" width="16%">
      <b>⚡</b><br/>
      <b>20+ Modules</b><br/>
      <sub>Comprehensive scanning</sub>
    </td>
    <td align="center" width="16%">
      <b>📊</b><br/>
      <b>Enterprise Reports</b><br/>
      <sub>Professional PDFs</sub>
    </td>
    <td align="center" width="16%">
      <b>🎨</b><br/>
      <b>Modern UX</b><br/>
      <sub>React + Tailwind</sub>
    </td>
    <td align="center" width="16%">
      <b>🔌</b><br/>
      <b>Extensible</b><br/>
      <sub>Optional API integrations</sub>
    </td>
  </tr>
</table>

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

# Copy the example env file and fill in your own values
cp .env.example .env

# Start development server
npm run dev
```

Access the dashboard at `http://localhost:5000`

## 🗄️ Database Setup (Supabase, one-time)

ABSpider stores scans, preferences, settings and API keys in Supabase. First
time you run the app you must apply the migrations in
[`supabase/migrations/`](supabase/migrations/). Two options:

**A — Supabase CLI (recommended):**

```bash
supabase link --project-ref <YOUR_PROJECT_REF>
supabase db push
```

**B — Supabase Dashboard:** open *SQL Editor → New query* and run the three
files in numeric order (`0001_init_schema.sql`, `0002_rls_policies.sql`,
`0003_storage_avatars.sql`). See [`supabase/README.md`](supabase/README.md)
for full steps and verification.

## 🔐 Environment Variables

All runtime configuration is supplied through Vite environment variables. Copy
[`.env.example`](.env.example) to `.env` and replace the placeholders. **Do
not commit a populated `.env` file** — `.env` is covered by `.gitignore`.

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL used for auth and storage. |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon (publishable) key. Safe to ship to the browser when Row Level Security is enabled. |
| `VITE_SHODAN_API_KEY` | No | Optional Shodan API key for port scanning. |
| `VITE_VIRUSTOTAL_API_KEY` | No | Optional VirusTotal API key for domain reputation. |
| `VITE_SECURITYTRAILS_API_KEY` | No | Optional SecurityTrails API key for DNS history. |
| `VITE_HUNTER_API_KEY` | No | Optional Hunter.io API key for email enumeration. |
| `VITE_DISCORD_WEBHOOK_URL` | No | Discord webhook used for scan notifications. Treat as a secret. |

Only variables prefixed with `VITE_` are exposed to the client bundle. Rotate
any value that may have been published, store production secrets in your
hosting provider's secret manager, and never paste real keys into source
control. See [SECURITY.md](SECURITY.md) for responsible-disclosure
instructions.

---

## 🏗️ Project Architecture

```mermaid
graph TB
    A[ABSpider Recon<br/>React + Vite Frontend] --> B[Component Layer]
    
    B --> B1[Dashboard UI]
    B --> B2[Scan Modules<br/>20+ types]
    B --> B3[Notification Center]
    B --> B4[Report Generator]
    B --> B5[Settings Management]
    
    B1 --> C[State Management]
    B2 --> C
    B3 --> C
    B4 --> C
    B5 --> C
    
    C --> C1[TanStack Query<br/>Server State]
    C --> C2[React Context<br/>UI State]
    C --> C3[React Hook Form<br/>Form State]
    
    C1 --> D[Service Layer]
    C2 --> D
    C3 --> D
    
    D --> D1[Scan Engine<br/>Smart Manager]
    D --> D2[API Integrations]
    D --> D3[Report Generation<br/>jsPDF]
    D --> D4[Notification System]
    
    D1 --> E[Supabase Backend]
    D2 --> E
    D3 --> E
    D4 --> E
    
    D2 --> F[External APIs]
    
    E --> E1[Auth<br/>Magic Link]
    E --> E2[PostgreSQL DB]
    E --> E3[User Profiles]
    E --> E4[Scan History]
    E --> E5[Settings]
    E --> E6[API Keys]
    
    F --> F1[Shodan]
    F --> F2[VirusTotal]
    F --> F3[SecurityTrails]
    F --> F4[Hunter.io]
    F --> F5[CT Logs]
    F --> F6[DNS APIs]
    F --> F7[WHOIS/RDAP]
    
    style A fill:#4F46E5,stroke:#312E81,stroke-width:3px,color:#fff
    style B fill:#7C3AED,stroke:#5B21B6,stroke-width:2px,color:#fff
    style C fill:#EC4899,stroke:#BE185D,stroke-width:2px,color:#fff
    style D fill:#F59E0B,stroke:#D97706,stroke-width:2px,color:#fff
    style E fill:#10B981,stroke:#059669,stroke-width:2px,color:#fff
    style F fill:#06B6D4,stroke:#0891B2,stroke-width:2px,color:#fff
```

### Tech Stack Breakdown

**Frontend Framework**
- React 18 with Vite for blazing-fast HMR
- TypeScript for type safety
- Tailwind CSS + shadcn/ui for modern UI

**State & Data Flow**
- TanStack Query for server state and caching
- React Context for global app state
- React Hook Form + Zod for form validation

**Backend & Storage**
- Supabase Auth (passwordless magic link)
- Supabase PostgreSQL for user data & scan results
- Row-level security for data isolation

**Scanning Engine**
- AI-powered payload management
- Adaptive rate limiting
- Multi-threaded execution
- Real-time health monitoring

**Reporting & Notifications**
- jsPDF + jspdf-autotable for PDF generation
- Discord webhook integration
- In-app notification center
- Sonner for toast notifications

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

<table>
  <tr>
    <td align="center" width="33%">
      <b>🎯</b><br/>
      <b>Bug Bounty Hunters</b><br/>
      <sub>Rapid reconnaissance and vulnerability discovery</sub>
    </td>
    <td align="center" width="33%">
      <b>🛡️</b><br/>
      <b>Penetration Testers</b><br/>
      <sub>Comprehensive security assessments with professional reporting</sub>
    </td>
    <td align="center" width="33%">
      <b>🔍</b><br/>
      <b>Security Researchers</b><br/>
      <sub>Deep-dive analysis of web application architecture</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="33%">
      <b>📋</b><br/>
      <b>Security Auditors</b><br/>
      <sub>Compliance testing and security posture evaluation</sub>
    </td>
    <td align="center" width="33%">
      <b>🚨</b><br/>
      <b>Red Team Operations</b><br/>
      <sub>Initial footprinting and attack surface mapping</sub>
    </td>
    <td align="center" width="33%">
      <b>👨‍💻</b><br/>
      <b>Developers</b><br/>
      <sub>Security testing during development lifecycle</sub>
    </td>
  </tr>
</table>

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

<p align="center">
  <img src="https://skillicons.dev/icons?i=react,vite,tailwind,typescript,supabase,postgres" alt="Tech Stack"/>
</p>

- **Frontend:** React + Vite + Tailwind CSS + TypeScript
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
