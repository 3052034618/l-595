export class GenerateReportDto {
  type: 'monthly' | 'quarterly' | 'annual' | 'custom';
  startDate?: string;
  endDate?: string;
  auditObjectIds?: string[];
  autoExport?: boolean;
}
