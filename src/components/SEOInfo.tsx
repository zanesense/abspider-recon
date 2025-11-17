import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Link as LinkIcon, Image, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';
import ModuleCardWrapper from './ModuleCardWrapper'; // Import the new wrapper

interface SEOInfoProps {
  seo?: {
    httpCode: number;
    title: string;
    metaDescription?: string;
    h1Tags: string[];
    h2Tags: string[];
    imageCount: number;
    linkCount: {
      internal: number;
      external: number;
      total: number;
    };
    socialLinks: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
      linkedin?: string;
      youtube?: string;
    };
    allLinks: string[];
    pageSize: number;
    loadTime: number;
  };
  isTested: boolean; // New prop
  moduleError?: string; // New prop
}

const SEOInfo = ({ seo, isTested, moduleError }: SEOInfoProps) => {
  if (!isTested) return null;

  const hasData = !!seo && (
    !!seo.title ||
    !!seo.metaDescription ||
    seo.h1Tags.length > 0 ||
    seo.h2Tags.length > 0 ||
    seo.imageCount > 0 ||
    seo.linkCount.total > 0 ||
    Object.keys(seo.socialLinks).length > 0
  );

  return (
    <ModuleCardWrapper
      title="SEO & Content Analysis"
      icon={TrendingUp}
      iconColorClass="text-pink-500 dark:text-pink-400"
      moduleError={moduleError}
      hasData={hasData}
      noDataMessage="No SEO information could be retrieved."
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">HTTP Code</p>
            <Badge className={seo?.httpCode === 200 ? 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30'}>
              {seo?.httpCode}
            </Badge>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Load Time</p>
            <p className="text-primary font-bold">{seo?.loadTime}ms</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Page Size</p>
            <p className="text-purple-500 dark:text-purple-400 font-bold">{(seo?.pageSize / 1024).toFixed(2)} KB</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
              <Image className="h-3 w-3 text-muted-foreground/70" />
              Images
            </p>
            <p className="text-foreground font-bold text-xl">{seo?.imageCount}</p>
          </div>
        </div>

        {seo?.title && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Page Title</p>
            <p className="text-foreground bg-muted rounded p-3">{seo.title}</p>
          </div>
        )}

        {seo?.metaDescription && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Meta Description</p>
            <p className="text-foreground bg-muted rounded p-3 text-sm">{seo.metaDescription}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {seo?.h1Tags && seo.h1Tags.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">H1 Tags ({seo.h1Tags.length})</p>
              <div className="space-y-1">
                {seo.h1Tags.map((tag, index) => (
                  <p key={index} className="text-foreground bg-muted rounded p-2">{tag}</p>
                ))}
              </div>
            </div>
          )}
          {seo?.h2Tags && seo.h2Tags.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">H2 Tags ({seo.h2Tags.length})</p>
              <div className="space-y-1">
                {seo.h2Tags.slice(0, 5).map((tag, index) => (
                  <p key={index} className="text-foreground bg-muted rounded p-2">{tag}</p>
                ))}
                {seo.h2Tags.length > 5 && (
                  <p className="text-muted-foreground/70 p-2">+ {seo.h2Tags.length - 5} more</p>
                )}
              </div>
            </div>
          )}
        </div>

        {seo?.linkCount && (
          <div>
            <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
              <LinkIcon className="h-3 w-3 text-muted-foreground/70" />
              Link Analysis
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-primary">{seo.linkCount.total}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Links</p>
              </div>
              <div className="bg-muted rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-500 dark:text-green-400">{seo.linkCount.internal}</p>
                <p className="text-xs text-muted-foreground mt-1">Internal</p>
              </div>
              <div className="bg-muted rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-500 dark:text-blue-400">{seo.linkCount.external}</p>
                <p className="text-xs text-muted-foreground mt-1">External</p>
              </div>
            </div>
          </div>
        )}

        {seo?.socialLinks && Object.keys(seo.socialLinks).length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-3">Social Media Links</p>
            <div className="flex flex-wrap gap-2">
              {seo.socialLinks.facebook && (
                <a href={seo.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-muted hover:bg-muted/50 rounded px-3 py-2 transition-colors">
                  <Facebook className="h-4 w-4 text-blue-500" />
                  <span className="text-foreground">Facebook</span>
                </a>
              )}
              {seo.socialLinks.twitter && (
                <a href={seo.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-muted hover:bg-muted/50 rounded px-3 py-2 transition-colors">
                  <Twitter className="h-4 w-4 text-sky-500" />
                  <span className="text-foreground">Twitter</span>
                </a>
              )}
              {seo.socialLinks.instagram && (
                <a href={seo.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-muted hover:bg-muted/50 rounded px-3 py-2 transition-colors">
                  <Instagram className="h-4 w-4 text-pink-500" />
                  <span className="text-foreground">Instagram</span>
                </a>
              )}
              {seo.socialLinks.linkedin && (
                <a href={seo.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-muted hover:bg-muted/50 rounded px-3 py-2 transition-colors">
                  <Linkedin className="h-4 w-4 text-blue-600" />
                  <span className="text-foreground">LinkedIn</span>
                </a>
              )}
              {seo.socialLinks.youtube && (
                <a href={seo.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-muted hover:bg-muted/50 rounded px-3 py-2 transition-colors">
                  <Youtube className="h-4 w-4 text-red-500" />
                  <span className="text-foreground">YouTube</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </ModuleCardWrapper>
  );
};

export default SEOInfo;