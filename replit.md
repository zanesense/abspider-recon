# ABSpider Recon Dashboard

## Overview
ABSpider is a modern, browser-based reconnaissance dashboard built for security professionals and bug bounty hunters. It provides a comprehensive suite of passive and active security scanning modules through an intuitive web interface.

**Technology Stack:**
- Frontend: React 18 + TypeScript
- Build Tool: Vite
- UI Framework: Tailwind CSS + Radix UI
- Routing: React Router v7
- State Management: TanStack Query (React Query)

## Project Structure
```
src/
├── components/     # Reusable UI components
│   ├── ui/        # shadcn/ui components
│   └── ...        # Feature-specific components
├── pages/         # Route pages (Index, NewScan, ScanResults, Settings)
├── services/      # API services for scanning modules
├── contexts/      # React contexts (Theme)
├── hooks/         # Custom React hooks
└── lib/           # Utility functions
```

## Key Features
- **Passive Scanning**: WHOIS/RDAP lookup, subdomain enumeration via CT logs, HTTP headers analysis
- **Active Scanning**: Port scanning, SQL injection detection, XSS vulnerability scanning
- **Reporting**: PDF report generation with jsPDF
- **Integrations**: Discord webhook notifications
- **Settings**: Browser-based configuration (no .env files needed)

## Development
The application runs on Vite's dev server configured for Replit:
- Host: 0.0.0.0 (allows Replit proxy)
- Port: 5000 (Replit's standard web preview port)
- All hosts allowed for iframe proxy compatibility

## Recent Changes
- 2025-01-12: Initial Replit environment setup
  - Configured Vite for Replit proxy (0.0.0.0:5000, allowedHosts: true)
  - Set up development workflow

## Security Note
This tool is designed for **authorized security testing only**. Unauthorized scanning may be illegal.
