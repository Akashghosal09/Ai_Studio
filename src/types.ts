export interface DataRecord {
  [key: string]: any;
}

export interface AnalysisSummary {
  maxNetIncome: number;
  minNetIncome: number;
  maxTotalRevenue: number;
  minTotalRevenue: number;
  totalRecords: number;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  chartData: any[];
}

export interface AIAnalysisResponse {
  analysis: string;
}
