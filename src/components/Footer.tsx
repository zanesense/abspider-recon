import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Bug, Heart, BookOpen } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-t border-slate-700/50 dark:border-slate-800/50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand Section */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
              <Bug className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                ABSpider
              </h3>
              <p className="text-xs text-slate-400">Security Reconnaissance</p>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a
              href="/docs/index.html"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              Documentation
            </a>
            <a
              href="https://github.com/zanesense/abspider-recon"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <Github className="h-4 w-4" />
              Source Code
            </a>
            <a
              href="https://github.com/zanesense/abspider-recon/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <Bug className="h-4 w-4" />
              Report Issues
            </a>
          </div>

          {/* Copyright */}
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>© {currentYear} ABSpider by</span>
            <a
              href="https://github.com/zanesense"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-md border border-blue-500/30 text-blue-400 hover:text-blue-300 hover:border-blue-400/50 transition-all duration-300 font-medium"
            >
              <Github className="h-3 w-3" />
              zanesense
            </a>
            <span>• Made with</span>
            <Heart className="h-4 w-4 text-red-500 animate-pulse" />
            <span>for security researchers</span>
          </div>
        </div>

        {/* Legal Notice */}
        <div className="mt-4 pt-4 border-t border-slate-700/50 text-center">
          <p className="text-xs text-slate-500">
            For educational and authorized testing purposes only.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;