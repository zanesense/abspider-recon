import { Scan } from '@/services/scanService';
import { generatePdfReport, generateDocxReport, generateMarkdownReport, generateCsvReport } from '@/services/reportService';
import { toast } from '@/hooks/use-toast';

type ReportFormat = 'pdf' | 'docx' | 'md' | 'csv';

export const generateReportContent = async (
  scan: Scan,
  format: ReportFormat,
): Promise<void> => { // Removed returnContent parameter
  try {
    switch (format) {
      case 'pdf':
        generatePdfReport(scan); // Always triggers download
        break;
      case 'docx':
        generateDocxReport(scan); // Always triggers download
        break;
      case 'md':
        generateMarkdownReport(scan); // Always triggers download
        break;
      case 'csv':
        generateCsvReport(scan); // Always triggers download
        break;
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