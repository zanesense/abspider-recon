import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Bug, Heart, BookOpen } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-gradient-to-r from-muted/80 via-background to-muted/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-sm">
              <Bug className="text-primary-foreground" size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                ABSpider
              </h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Security Reconnaissance</p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <a
              href="https://abspider.zanesense.dev/docs/"
              className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Documentation</span>
            </a>
            <a
              href="https://github.com/zanesense/abspider-recon"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Source Code</span>
            </a>
            <a
              href="https://github.com/zanesense/abspider-recon/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Bug className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Report Issues</span>
            </a>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] sm:text-sm text-muted-foreground flex-wrap justify-center">
            <span>&copy; {currentYear} ABSpider by</span>
            <a
              href="https://github.com/zanesense"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-border bg-muted/50 text-foreground hover:bg-muted transition-colors font-medium"
            >
              <Github className="h-3 w-3" />
              zanesense
            </a>
            <span className="hidden sm:inline">&bull; Made with <Heart className="h-3.5 w-3.5 inline text-red-500" /> for security researchers</span>
          </div>
        </div>

        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border text-center">
          <p className="text-[10px] sm:text-xs text-muted-foreground/60">
            For educational and authorized testing purposes only.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;