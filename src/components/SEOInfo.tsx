import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Link as LinkIcon, Image, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';

interface SEOInfoProps {
  seo: {
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
}

const SEOInfo = ({ seo }: SEOInfoProps) => {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-pink-400" />
          SEO & Content Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1">HTTP Code</p>
            <Badge className={seo.httpCode === 200 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}>
              {seo.httpCode}
            </Badge>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1">Load Time</p>
            <p className="text-cyan-400 font-bold">{seo.loadTime}ms</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1">Page Size</p>
            <p className="text-purple-400 font-bold">{(seo.pageSize / 1024).toFixed(2)} KB</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1 flex items-center gap-1">
              <Image className="h-3 w-3 text-slate-500" />
              Images
            </p>
            <p className="text-white font-bold text-xl">{seo.imageCount}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-slate-400 mb-2">Page Title</p>
          <p className="text-white bg-slate-800 rounded p-3">{seo.title}</p>
        </div>

        {seo.metaDescription && (
          <div>
            <p className="text-sm text-slate-400 mb-2">Meta Description</p>
            <p className="text-slate-300 bg-slate-800 rounded p-3 text-sm">{seo.metaDescription}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {seo.h1Tags.length > 0 && (
            <div>
              <p className="text-sm text-slate-400 mb-2">H1 Tags ({seo.h1Tags.length})</p>
              <div className="space-y-1">
                {seo.h1Tags.map((tag, index) => (
                  <p key={index} className="text-sm text-slate-300 bg-slate-800 rounded p-2">{tag}</p>
                ))}
              </div>
            </div>
          )}
          {seo.h2Tags.length > 0 && (
            <div>
              <p className="text-sm text-slate-400 mb-2">H2 Tags ({seo.h2Tags.length})</p>
              <div className="space-y-1">
                {seo.h2Tags.slice(0, 5).map((tag, index) => (
                  <p key={index} className="text-sm text-slate-300 bg-slate-800 rounded p-2">{tag}</p>
                ))}
                {seo.h2Tags.length > 5 && (
                  <p className="text-xs text-slate-500 p-2">+ {seo.h2Tags.length - 5} more</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm text-slate-400 mb-3 flex items-center gap-1">
            <LinkIcon className="h-3 w-3 text-slate-500" />
            Link Analysis
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-cyan-400">{seo.linkCount.total}</p>
              <p className="text-xs text-slate-400 mt-1">Total Links</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-400">{seo.linkCount.internal}</p>
              <p className="text-xs text-slate-400 mt-1">Internal</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-400">{seo.linkCount.external}</p>
              <p className="text-xs text-slate-400 mt-1">External</p>
            </div>
          </div>
        </div>

        {Object.keys(seo.socialLinks).length > 0 && (
          <div>
            <p className="text-sm text-slate-400 mb-3">Social Media Links</p>
            <div className="flex flex-wrap gap-2">
              {seo.socialLinks.facebook && (
                <a href={seo.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 rounded px-3 py-2 transition-colors">
                  <Facebook className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-slate-300">Facebook</span>
                </a>
              )}
              {seo.socialLinks.twitter && (
                <a href={seo.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 rounded px-3 py-2 transition-colors">
                  <Twitter className="h-4 w-4 text-sky-500" />
                  <span className="text-sm text-slate-300">Twitter</span>
                </a>
              )}
              {seo.socialLinks.instagram && (
                <a href={seo.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 rounded px-3 py-2 transition-colors">
                  <Instagram className="h-4 w-4 text-pink-500" />
                  <span className="text-sm text-slate-300">Instagram</span>
                </a>
              )}
              {seo.socialLinks.linkedin && (
                <a href={seo.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 rounded px-3 py-2 transition-colors">
                  <Linkedin className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-slate-300">LinkedIn</span>
                </a>
              )}
              {seo.socialLinks.youtube && (
                <a href={seo.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 rounded px-3 py-2 transition-colors">
                  <Youtube className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-slate-300">YouTube</span>
                </a>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SEOInfo;