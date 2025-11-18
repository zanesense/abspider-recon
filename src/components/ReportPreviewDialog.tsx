import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileType, FileDown, FileSpreadsheet, Eye } from 'lucide-react';

interface ReportPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reportFormat: 'pdf' | 'docx' | 'md' | 'csv' | null;
  previewContent: string; // Base64 for PDF, raw text for others
  onDownload: () => void;
}

const ReportPreviewDialog: React.FC<ReportPreviewDialogProps> = ({
  isOpen,
  onClose,
  reportFormat,
  previewContent,
  onDownload,
}) => {
  if (!reportFormat || !previewContent) return null;

  const getTitle = () => {
    switch (reportFormat) {
      case 'pdf': return 'PDF Report Preview';
      case 'docx': return 'Word Report Preview';
      case 'md': return 'Markdown Report Preview';
      case 'csv': return 'CSV Report Preview';
      default: return 'Report Preview';
    }
  };

  const getIcon = () => {
    switch (reportFormat) {
      case 'pdf': return <FileText className="mr-2 h-5 w-5" />;
      case 'docx': return <FileType className="mr-2 h-5 w-5" />;
      case 'md': return <FileDown className="mr-2 h-5 w-5" />;
      case 'csv': return <FileSpreadsheet className="mr-2 h-5 w-5" />;
      default: return <Eye className="mr-2 h-5 w-5" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {getIcon()} {getTitle()}
          </DialogTitle>
          <DialogDescription>
            A temporary preview of your generated report.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden rounded-md border border-border bg-muted/50">
          {reportFormat === 'pdf' ? (
            <iframe src={previewContent} className="w-full h-full border-none" title="PDF Preview"></iframe>
          ) : (
            <pre className="w-full h-full p-4 text-sm font-mono overflow-auto text-foreground whitespace-pre-wrap">
              {previewContent}
            </pre>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border text-foreground hover:bg-muted/50">
            Close
          </Button>
          <Button onClick={onDownload} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md">
            <Download className="mr-2 h-4 w-4" /> Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportPreviewDialog;