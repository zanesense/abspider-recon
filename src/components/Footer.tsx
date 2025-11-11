import { Heart, Github } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm py-6 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span className="font-medium">© {currentYear} ABSpider</span>
            <span className="text-border">•</span>
            {/* CLEANED UP FORMATTING HERE */}
            <a
              href="/docs/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary/80 transition-colors"
            >
              Documentation
            </a>
            <span className="text-border">•</span>
            <span>All rights reserved</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Built with</span>
            <Heart className="h-4 w-4 text-red-500 fill-red-500 animate-pulse" />
            <span className="text-muted-foreground">by</span>
            <a
              href="https://github.com/zanesense"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:text-primary/80 font-semibold transition-colors"
            >
              <Github className="h-4 w-4" />
              zanesense
            </a>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-center text-xs text-muted-foreground">
            Professional Web Reconnaissance Tool • For Educational & Authorized Testing Only
          </p>
        </div>
      </div >
    </footer >
  );
};

export default Footer;