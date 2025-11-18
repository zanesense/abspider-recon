import { Scan } from '@/services/scanService';
import { generatePdfReport, generateDocxReport, generateMarkdownReport, generateCsvReport } from '@/services/reportService';
import { toast } from '@/hooks/use-toast';

type ReportFormat = 'pdf' | 'docx' | 'md' | 'csv';

export const generateReportContent = async (
  scan: Scan,
  format: ReportFormat,
  returnContent: boolean = false // If true, returns content; if false, triggers download
): Promise<string | void> => {
  try {
    switch (format) {
      case 'pdf':
        return generatePdfReport(scan, returnContent);
      case 'docx':
        return generateDocxReport(scan, returnContent);
      case 'md':
        return generateMarkdownReport(scan, returnContent);
      case 'csv':
        return generateCsvReport(scan, returnContent);
      default:
        toast({
          title: "Error",
          description: "Invalid report format selected.",
          variant: "destructive",
        });
        return;
    }
  } catch (error: any) {
    console.error('Error generating report content:', error);
    toast({
      title: "Report Generation Failed",
      description: error.message || "An unexpected error occurred while generating the report.",
      variant: "destructive",
    });
    return;
  }
};