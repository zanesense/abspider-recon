/* ABSpider Recon Docs — shared navigation & UI */

const NAV = [
    {
        group: "Overview",
        items: [
            { href: "index.html",         label: "Introduction",      icon: "home",      key: "index" },
            { href: "getting-started.html", label: "Getting Started", icon: "rocket",    key: "getting-started" },
        ],
    },
    {
        group: "Reference",
        items: [
            { href: "modules.html",         label: "Recon Modules",    icon: "radar",        key: "modules" },
            { href: "architecture.html",    label: "Architecture",     icon: "blocks",       key: "architecture" },
            { href: "cli.html",             label: "CLI Reference",    icon: "terminal",     key: "cli" },
            { href: "api-reference.html",   label: "API Reference",    icon: "plug",         key: "api-reference" },
        ],
    },
    {
        group: "Operations",
        items: [
            { href: "configuration.html",   label: "Configuration",    icon: "settings",   key: "configuration" },
            { href: "reports.html",         label: "Reports",          icon: "file-text",  key: "reports" },
            { href: "deployment.html",      label: "Deployment",       icon: "cloud",      key: "deployment" },
        ],
    },
    {
        group: "Help",
        items: [
            { href: "troubleshooting.html", label: "Troubleshooting", icon: "wrench",      key: "troubleshooting" },
            { href: "security.html",        label: "Security & Legal", icon: "shield",     key: "security" },
        ],
    },
];

const ICONS = {
    home:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    rocket:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
    radar:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/><path d="M16.24 7.76A6 6 0 1 0 17.17 17"/><path d="M9 12h.01"/><path d="M15.66 9A4 4 0 1 1 12 16"/></svg>',
    blocks:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    terminal:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
    plug:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v4a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8z"/></svg>',
    settings:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    "file-text":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
    cloud:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
    wrench:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    shield:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    github:    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.55v-2.1c-3.2.7-3.87-1.37-3.87-1.37-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17.92-.26 1.9-.39 2.88-.39.98 0 1.96.13 2.88.39 2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.36.78 1.05.78 2.12v3.14c0 .31.21.66.79.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/></svg>',
    "external-link":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
    menu:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
    x:         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    chevron:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    scan:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>',
};

/* Render sidebar */
function renderSidebar(activeKey) {
    const sb = document.getElementById("sidebar");
    if (!sb) return;
    let html = `
        <a href="index.html" class="sidebar-brand" style="text-decoration:none;">
            <div class="logo">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>
            </div>
            <div class="name">ABSpider Recon<small>Documentation</small></div>
        </a>
    `;
    for (const group of NAV) {
        html += `<div class="nav-group"><div class="nav-group-title">${group.group}</div>`;
        for (const item of group.items) {
            const isActive = item.key === activeKey;
            html += `<a href="${item.href}" class="nav-item${isActive ? " active" : ""}">
                <span class="icon">${ICONS[item.icon] || ""}</span>
                <span>${item.label}</span>
            </a>`;
        }
        html += `</div>`;
    }
    sb.innerHTML = html;
}

/* Build table of contents from h2/h3 in main article */
function buildTOC() {
    const article = document.querySelector(".article");
    const toc = document.getElementById("toc");
    if (!article || !toc) return;
    const headings = article.querySelectorAll("h2, h3");
    if (headings.length < 2) { toc.style.display = "none"; return; }
    let html = `<div class="toc-title">On this page</div><ul>`;
    headings.forEach((h) => {
        if (!h.id) {
            h.id = h.textContent.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        }
        const cls = h.tagName === "H3" ? ' style="padding-left: 1.5rem; font-size: 0.78rem;"' : "";
        html += `<li><a href="#${h.id}"${cls}>${h.textContent.replace("¶", "").trim()}</a></li>`;
    });
    html += `</ul>`;
    toc.innerHTML = html;

    // Active section on scroll
    const tocLinks = toc.querySelectorAll("a");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                tocLinks.forEach((l) => l.classList.remove("active"));
                const link = toc.querySelector(`a[href="#${entry.target.id}"]`);
                if (link) link.classList.add("active");
            }
        });
    }, { rootMargin: "-30% 0px -65% 0px", threshold: 0 });
    headings.forEach((h) => observer.observe(h));
}

/* Mobile sidebar toggle */
function setupMobileNav() {
    const toggle = document.getElementById("mobileToggle");
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    if (!toggle || !sidebar) return;
    function open() { sidebar.classList.add("open"); backdrop.classList.add("show"); }
    function close() { sidebar.classList.remove("open"); backdrop.classList.remove("show"); }
    toggle.addEventListener("click", () => sidebar.classList.contains("open") ? close() : open());
    if (backdrop) backdrop.addEventListener("click", close);
    sidebar.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
}

/* Topbar breadcrumb from data-page attribute */
function renderBreadcrumb() {
    const bc = document.getElementById("breadcrumb");
    if (!bc) return;
    const pageLabel = bc.dataset.page;
    if (!pageLabel) return;
    bc.innerHTML = `<a href="index.html">Docs</a><span class="sep">›</span><span>${pageLabel}</span>`;
}

/* Init */
document.addEventListener("DOMContentLoaded", () => {
    const active = document.body.dataset.page;
    renderSidebar(active);
    renderBreadcrumb();
    buildTOC();
    setupMobileNav();
});
