import React, { useMemo, useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  FileDown, 
  Sparkles,
  BarChart3,
  Filter,
  Download,
  Database
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar,
  Legend
} from 'recharts';
import { format, parseISO, isWithinInterval, min as minDate, max as maxDate, isValid } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { DataRecord, AnalysisSummary } from '../types';

interface DashboardProps {
  data: DataRecord[];
}

export function Dashboard({ data }: DashboardProps) {
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const safeFormat = (dateVal: any, formatStr: string, fallback: string = '-') => {
    if (!dateVal) return fallback;
    try {
      const d = new Date(dateVal);
      if (!isValid(d)) return fallback;
      return format(d, formatStr);
    } catch {
      return fallback;
    }
  };

  // Column detection
  const columns = useMemo(() => {
    if (data.length === 0) return { date: '', revenue: '', income: '', filterCol: '', colA: '', colB: '', colC: '' };
    const keys = Object.keys(data[0]);
    const findKey = (keywords: string[]) => 
      keys.find(k => keywords.some(kw => k.toLowerCase().includes(kw))) || '';
    
    // Explicitly mapping indices for "Column A, B, C, D" support
    return {
      date: findKey(['date', 'time', 'period', 'day']) || keys[0],
      revenue: findKey(['revenue', 'sales', 'turnover', 'gross', 'total revenue']) || keys[2],
      income: findKey(['income', 'profit', 'net', 'earnings', 'net income']) || keys[1],
      filterCol: keys[3] || '', // Column D
      colA: keys[0] || '',
      colB: keys[1] || '',
      colC: keys[2] || ''
    };
  }, [data]);

  const filterOptions = useMemo(() => {
    if (!columns.filterCol) return [];
    const values = data.map(d => String(d[columns.filterCol])).filter(v => v && v !== 'undefined');
    return Array.from(new Set(values)).sort();
  }, [data, columns.filterCol]);

  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [selectedCompany, setSelectedCompany] = useState<string>('All');

  const companyOptions = useMemo(() => {
    if (!columns.colA) return [];
    const values = data.map(d => String(d[columns.colA])).filter(v => v && v !== 'undefined');
    return Array.from(new Set(values)).sort();
  }, [data, columns.colA]);

  // Filtered data
  const filteredData = useMemo(() => {
    let result = data;
    
    if (selectedFilter !== 'All' && columns.filterCol) {
      result = result.filter(d => String(d[columns.filterCol]) === selectedFilter);
    }

    if (selectedCompany !== 'All' && columns.colA) {
      result = result.filter(d => String(d[columns.colA]) === selectedCompany);
    }

    return result;
  }, [data, columns, selectedFilter, selectedCompany]);

  // Statistics
  const stats = useMemo(() => {
    if (filteredData.length === 0) return {
      maxIncomeRec: null,
      minIncomeRec: null,
      maxRevenueRec: null,
      minRevenueRec: null,
      totalIncome: 0,
      totalRevenue: 0,
      avgIncome: 0,
    };

    const incomeKey = columns.income;
    const revenueKey = columns.revenue;

    const findExtreme = (data: DataRecord[], key: string, type: 'max' | 'min') => {
      return data.reduce((extreme, current) => {
        const currentVal = Number(current[key]) || 0;
        const extremeVal = extreme ? (Number(extreme[key]) || 0) : (type === 'max' ? -Infinity : Infinity);
        if (type === 'max') {
          return currentVal > extremeVal ? current : extreme;
        } else {
          return currentVal < extremeVal ? current : extreme;
        }
      }, data[0]);
    };

    const maxIncomeRec = findExtreme(filteredData, incomeKey, 'max');
    const minIncomeRec = findExtreme(filteredData, incomeKey, 'min');
    const maxRevenueRec = findExtreme(filteredData, revenueKey, 'max');
    const minRevenueRec = findExtreme(filteredData, revenueKey, 'min');

    const incomes = filteredData.map(d => Number(d[incomeKey]) || 0);
    const revenues = filteredData.map(d => Number(d[revenueKey]) || 0);

    return {
      maxIncomeRec,
      minIncomeRec,
      maxRevenueRec,
      minRevenueRec,
      totalIncome: incomes.reduce((a, b) => a + b, 0),
      totalRevenue: revenues.reduce((a, b) => a + b, 0),
      avgIncome: incomes.length ? incomes.reduce((a, b) => a + b, 0) / incomes.length : 0,
    };
  }, [filteredData, columns]);

  // AI Analysis Trigger
  const getAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const sample = filteredData.slice(0, 50); // Send a representative sample
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataSummary: {
            stats,
            sample,
            totalRows: filteredData.length,
            columns: Object.keys(data[0])
          },
          userQuery: "Provide a detailed trend analysis and financial health check."
        })
      });
      const result = await response.json();
      setAiAnalysis(result.analysis);
    } catch (error) {
      console.error(error);
      setAiAnalysis("Failed to generate AI insights. Please try again later.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Export CSV
  const exportCSV = () => {
    const csv = Papa.unparse(filteredData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `report_${safeFormat(new Date(), 'yyyyMMdd')}.csv`);
  };

  // Export PDF
  const exportPDF = () => {
    const doc = new jsPDF() as any;
    doc.setFontSize(20);
    doc.text('Financial Trend Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on ${safeFormat(new Date(), 'PPP')}`, 14, 28);

    doc.autoTable({
      startY: 35,
      head: [['Metric', 'Value']],
      body: [
        ['Total Revenue', `$${(stats.totalRevenue || 0).toLocaleString()}`],
        ['Max Revenue', `$${(Number(stats.maxRevenueRec?.[columns.revenue]) || 0).toLocaleString()}`],
        ['Total Income', `$${(stats.totalIncome || 0).toLocaleString()}`],
        ['Max Income', `$${(Number(stats.maxIncomeRec?.[columns.income]) || 0).toLocaleString()}`],
        ['Avg Income', `$${(stats.avgIncome || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
        ['Records', filteredData.length.toString()],
      ],
    });

    if (aiAnalysis) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text('AI Insights', 14, 20);
      doc.setFontSize(10);
      const splitText = doc.splitTextToSize(aiAnalysis, 180);
      doc.text(splitText, 14, 30);
    }

    doc.save(`report_${safeFormat(new Date(), 'yyyyMMdd')}.pdf`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="text-blue-600" />
            Dataset Insights
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Analyzing {filteredData.length} records across {Object.keys(data[0] || {}).length} variables
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {companyOptions.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <Database size={14} className="text-blue-500" />
              <select 
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer outline-none min-w-[120px]"
              >
                <option value="All">All Companies</option>
                {companyOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}

          {filterOptions.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <Filter size={14} className="text-slate-400" />
              <select 
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer outline-none min-w-[100px]"
              >
                <option value="All">All Periods</option>
                {filterOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors text-sm"
            >
              <Download size={16} />
              CSV
            </button>
            <button
              onClick={exportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors text-sm shadow-sm hover:shadow-md"
            >
              <FileDown size={16} />
              PDF Report
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Maximum Net Income" 
          value={stats.maxIncomeRec ? Number(stats.maxIncomeRec[columns.income]) : 0} 
          icon={<TrendingUp className="text-blue-600" />}
          subText={stats.maxIncomeRec ? `Company: ${stats.maxIncomeRec[columns.colA]}` : "No data available"}
        />
        <StatCard 
          label="Minimum Net Income" 
          value={stats.minIncomeRec ? Number(stats.minIncomeRec[columns.income]) : 0} 
          icon={<TrendingDown className="text-orange-600" />}
          subText={stats.minIncomeRec ? `Company: ${stats.minIncomeRec[columns.colA]}` : "No data available"}
        />
        <StatCard 
          label="Maximum Total Revenue" 
          value={stats.maxRevenueRec ? Number(stats.maxRevenueRec[columns.revenue]) : 0} 
          icon={<DollarSign className="text-indigo-600" />}
          subText={stats.maxRevenueRec ? `Company: ${stats.maxRevenueRec[columns.colA]}` : "No data available"}
        />
        <StatCard 
          label="Minimum Total Revenue" 
          value={stats.minRevenueRec ? Number(stats.minRevenueRec[columns.revenue]) : 0} 
          icon={<DollarSign className="text-purple-600" />}
          subText={stats.minRevenueRec ? `Company: ${stats.minRevenueRec[columns.colA]}` : "No data available"}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800 tracking-tight">Revenue & Net Income Over Time</h3>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
               <div className="flex items-center gap-1.5">
                 <div className="w-2 h-2 rounded-full bg-blue-500" />
                 Revenue
               </div>
               <div className="flex items-center gap-1.5">
                 <div className="w-2 h-2 rounded-full bg-green-500" />
                 Net Income
               </div>
            </div>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey={columns.date} 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => safeFormat(val, 'MMM d', val)}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `$${val > 999 ? (val/1000).toFixed(0) + 'k' : val}`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelFormatter={(val) => safeFormat(val, 'PPP')}
                />
                <Area 
                  type="monotone" 
                  dataKey={columns.revenue} 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
                <Area 
                  type="monotone" 
                  dataKey={columns.income} 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorInc)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* New: Data Points Table for A, B, C */}
          <div className="mt-8 pt-8 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Database size={16} className="text-blue-500" />
              List of Companies
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-3 font-semibold text-slate-900 uppercase tracking-wider text-[10px]">{columns.colA || 'Col A'}</th>
                    <th className="pb-3 font-semibold text-slate-900 uppercase tracking-wider text-[10px]">{columns.colB || 'Col B'}</th>
                    <th className="pb-3 font-semibold text-slate-900 uppercase tracking-wider text-[10px]">{columns.colC || 'Col C'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(() => {
                    const seen = new Set();
                    const unique = filteredData.filter(row => {
                      const val = row[columns.colA];
                      if (seen.has(val)) return false;
                      seen.add(val);
                      return true;
                    });
                    return unique.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 font-medium text-slate-900">{row[columns.colA]}</td>
                        <td className="py-3">{typeof row[columns.colB] === 'number' ? `$${row[columns.colB].toLocaleString()}` : row[columns.colB]}</td>
                        <td className="py-3">{typeof row[columns.colC] === 'number' ? `$${row[columns.colC].toLocaleString()}` : row[columns.colC]}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
              {filteredData.length > 10 && (
                <p className="mt-4 text-center text-xs text-slate-400 italic">
                  Showing first 10 unique records. Export for full dataset.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* AI Sidebar */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight tracking-tight">AI Data Assistant</h3>
              <p className="text-slate-400 text-xs">Intelligent trend analysis</p>
            </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar pr-2">
            {aiAnalysis ? (
              <div className="markdown-body prose-invert prose-sm">
                <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="p-4 bg-slate-800 rounded-full text-slate-500">
                  <Sparkles size={32} />
                </div>
                <p className="text-slate-400 text-sm">
                  Run our AI agent to uncover hidden trends and anomalies in your financial data.
                </p>
              </div>
            )}
          </div>

          <button
            onClick={getAIAnalysis}
            disabled={isAnalyzing}
            className={cn(
              "mt-8 w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg",
              isAnalyzing 
                ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-500 text-white active:scale-[0.98]"
            )}
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                Analyzing trends...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Deep Insights
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, trend, subText }: { label: string; value: number; icon: React.ReactNode; trend?: 'up' | 'down' | 'neutral', subText?: string }) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        {trend && (
           <div className={cn(
             "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1",
             trend === 'up' ? "bg-green-50 text-green-600" : trend === 'down' ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"
           )}>
             {trend === 'up' ? <TrendingUp size={12} /> : trend === 'down' ? <TrendingDown size={12} /> : null}
             {trend}
           </div>
        )}
      </div>
      <div>
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
        <h4 className="text-2xl font-bold text-slate-900 tracking-tight">
          ${typeof value === 'number' ? value.toLocaleString() : value}
        </h4>
        {subText && <p className="text-slate-400 text-[10px] mt-1 font-medium italic">{subText}</p>}
      </div>
    </motion.div>
  );
}
