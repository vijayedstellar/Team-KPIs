import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, User, TrendingUp, Award, AlertTriangle, Target } from 'lucide-react';
import { performanceService } from '../services/performanceService';
import { analystService } from '../services/analytService';
import type { PerformanceRecord, Analyst, KPITarget } from '../lib/supabase';
import { getPerformanceCategory } from '../utils/performanceCategories';
import { generateActionItems, formatKPIName } from '../utils/actionItemsGenerator';
import MockAnnualReport from './MockAnnualReport';
import toast from 'react-hot-toast';

interface AnnualReportData {
  analyst: Analyst;
  monthlyRecords: PerformanceRecord[];
  totalPerformance: {
    outreaches: number;
    live_links: number;
    high_da_links: number;
    content_distribution: number;
    new_blogs: number;
    blog_optimizations: number;
    top_5_keywords: number;
  };
  averagePerformance: number;
  performanceGrade: string;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
}

const AnnualReportGenerator: React.FC = () => {
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [targets, setTargets] = useState<KPITarget[]>([]);
  const [selectedAnalyst, setSelectedAnalyst] = useState<string>('');
  const [reportYear, setReportYear] = useState<number>(2025);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<AnnualReportData | null>(null);
  const [showSampleReport, setShowSampleReport] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [analystsList, kpiTargets] = await Promise.all([
        analystService.getActiveAnalysts(),
        performanceService.getKPITargets()
      ]);
      setAnalysts(analystsList);
      setTargets(kpiTargets);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    }
  };

  const generateAnnualReport = async () => {
    if (!selectedAnalyst) {
      toast.error('Please select an analyst');
      return;
    }

    setLoading(true);
    try {
      const analyst = analysts.find(a => a.id === selectedAnalyst);
      if (!analyst) return;

      // Get all performance records for the analyst in the selected year
      const performanceRecords = await performanceService.getAnalystYearlyPerformance(selectedAnalyst, reportYear);
      
      if (performanceRecords.length === 0) {
        toast.error('No performance data found for the selected analyst and year');
        setLoading(false);
        return;
      }

      // Calculate total performance
      const totalPerformance = performanceRecords.reduce((acc, record) => ({
        outreaches: acc.outreaches + record.outreaches,
        live_links: acc.live_links + record.live_links,
        high_da_links: acc.high_da_links + record.high_da_links,
        content_distribution: acc.content_distribution + record.content_distribution,
        new_blogs: acc.new_blogs + record.new_blogs,
        blog_optimizations: acc.blog_optimizations + record.blog_optimizations,
        top_5_keywords: acc.top_5_keywords + record.top_5_keywords
      }), {
        outreaches: 0,
        live_links: 0,
        high_da_links: 0,
        content_distribution: 0,
        new_blogs: 0,
        blog_optimizations: 0,
        top_5_keywords: 0
      });

      // Calculate average performance percentage
      const kpiNames = ['outreaches', 'live_links', 'high_da_links', 'content_distribution', 'new_blogs', 'blog_optimizations', 'top_5_keywords'];
      let totalAchievement = 0;
      let validKPIs = 0;

      const kpiPerformances = kpiNames.map(kpiName => {
        const target = targets.find(t => t.kpi_name === kpiName && t.role === analyst.department);
        if (target && target.annual_target > 0) {
          const achievement = Math.round((totalPerformance[kpiName as keyof typeof totalPerformance] / target.annual_target) * 100);
          totalAchievement += achievement;
          validKPIs++;
          return { kpi: kpiName, achievement, target: target.annual_target, actual: totalPerformance[kpiName as keyof typeof totalPerformance] };
        }
        return null;
      }).filter(Boolean);

      const averagePerformance = validKPIs > 0 ? Math.round(totalAchievement / validKPIs) : 0;
      const performanceCategory = getPerformanceCategory(averagePerformance);

      // Generate strengths and improvements
      const strengths: string[] = [];
      const improvements: string[] = [];

      kpiPerformances.forEach(kpi => {
        if (kpi && kpi.achievement >= 100) {
          strengths.push(`Exceeded ${formatKPIName(kpi.kpi)} target by ${kpi.achievement - 100}% (${kpi.actual}/${kpi.target})`);
        } else if (kpi && kpi.achievement < 84) {
          improvements.push(`${formatKPIName(kpi.kpi)} needs improvement: ${kpi.achievement}% of target (${kpi.actual}/${kpi.target})`);
        }
      });

      // Generate recommendations based on latest performance
      const latestRecord = performanceRecords[performanceRecords.length - 1];
      const actionItems = generateActionItems(latestRecord, performanceRecords.slice(0, -1), targets);
      const recommendations = actionItems.slice(0, 5).map(item => item.recommendations[0]);

      const reportData: AnnualReportData = {
        analyst,
        monthlyRecords: performanceRecords,
        totalPerformance,
        averagePerformance,
        performanceGrade: performanceCategory.name,
        strengths: strengths.length > 0 ? strengths : ['Consistent performance across all KPIs', 'Reliable team member'],
        improvements: improvements.length > 0 ? improvements : ['Continue maintaining current performance levels'],
        recommendations: recommendations.length > 0 ? recommendations : ['Continue current strategies', 'Focus on consistency']
      };

      setReportData(reportData);
      toast.success('Annual report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate annual report');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const printContent = document.getElementById('annual-report-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Annual Performance Report - ${reportData.analyst.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .section { margin-bottom: 25px; }
            .section h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 15px 0; }
            .kpi-item { padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
            .performance-badge { padding: 5px 10px; border-radius: 15px; font-weight: bold; }
            .critical { background-color: #fee; color: #c53030; }
            .bad { background-color: #fffbeb; color: #d69e2e; }
            .target { background-color: #f0fff4; color: #38a169; }
            .good { background-color: #ebf8ff; color: #3182ce; }
            ul { padding-left: 20px; }
            li { margin-bottom: 5px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const getPerformanceGradeColor = (grade: string) => {
    switch (grade) {
      case 'Critical': return 'text-red-600 bg-red-100';
      case 'Bad': return 'text-amber-600 bg-amber-100';
      case 'Target': return 'text-green-600 bg-green-100';
      case 'Good': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Annual Performance Report Generator</h2>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Team Member</label>
            <select
              value={selectedAnalyst}
              onChange={(e) => setSelectedAnalyst(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose team member...</option>
              {analysts.map((analyst) => (
                <option key={analyst.id} value={analyst.id}>{analyst.name} - {analyst.department}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Year</label>
            <select
              value={reportYear}
              onChange={(e) => setReportYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={generateAnnualReport}
              disabled={loading || !selectedAnalyst}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {reportData && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Annual Performance Report - {reportData.analyst.name}
            </h3>
            <button
              onClick={exportToPDF}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>

          <div id="annual-report-content" className="p-6">
            {/* Report Header */}
            <div className="header text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Annual Performance Report</h1>
              <div className="text-lg text-gray-600">
                <p><strong>{reportData.analyst.name}</strong> - {reportData.analyst.department}</p>
                <p>Performance Period: {reportYear}</p>
                <p>Report Generated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="section mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Executive Summary
              </h3>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{reportData.averagePerformance}%</div>
                    <div className="text-sm text-gray-600">Overall Performance</div>
                  </div>
                  <div className="text-center">
                    <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getPerformanceGradeColor(reportData.performanceGrade)}`}>
                      {reportData.performanceGrade}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Performance Grade</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{reportData.monthlyRecords.length}</div>
                    <div className="text-sm text-gray-600">Months Tracked</div>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI Performance Summary */}
            <div className="section mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                KPI Performance Summary
              </h3>
              <div className="kpi-grid">
                {Object.entries(reportData.totalPerformance).map(([kpi, value]) => {
                  const target = targets.find(t => t.kpi_name === kpi && t.role === reportData.analyst.department);
                  const achievement = target ? Math.round((value / target.annual_target) * 100) : 0;
                  const category = getPerformanceCategory(achievement);
                  
                  return (
                    <div key={kpi} className="kpi-item">
                      <div className="font-semibold text-gray-900">{formatKPIName(kpi)}</div>
                      <div className="text-2xl font-bold text-gray-800">{value.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Target: {target?.annual_target.toLocaleString() || 'N/A'}</div>
                      <div className={`performance-badge ${category.name.toLowerCase()}`}>
                        {achievement}% Achievement
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strengths */}
            <div className="section mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Key Strengths
              </h3>
              <ul className="space-y-2">
                {reportData.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas for Improvement */}
            <div className="section mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Areas for Improvement
              </h3>
              <ul className="space-y-2">
                {reportData.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="section mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Recommendations for Next Year
              </h3>
              <ul className="space-y-2">
                {reportData.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Monthly Performance Trend */}
            <div className="section">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Monthly Performance Trend</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outreaches</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Live Links</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">High DA</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">New Blogs</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.monthlyRecords.map((record) => (
                      <tr key={record.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Date(record.year, parseInt(record.month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.outreaches}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.live_links}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.high_da_links}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.new_blogs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {!reportData && !showSampleReport && (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Annual Performance Report</h3>
          <p className="text-gray-500 mb-6">
            Select a team member and year to generate a comprehensive annual performance report with KPI analysis, strengths, improvements, and recommendations.
          </p>
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => setShowSampleReport(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <FileText className="w-5 h-5" />
              View Sample Report
            </button>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Report Includes:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Executive summary with overall performance grade</li>
              <li>• Detailed KPI performance analysis</li>
              <li>• Key strengths and achievements</li>
              <li>• Areas for improvement</li>
              <li>• Actionable recommendations for next year</li>
              <li>• Monthly performance trends</li>
              <li>• Professional PDF export for HR records</li>
            </ul>
          </div>
        </div>
      )}

      {/* Sample Report */}
      {showSampleReport && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Sample Annual Performance Report - SEO Analyst
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSampleReport(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close Sample
              </button>
              <button
                onClick={() => {
                  const printContent = document.getElementById('sample-report-content');
                  if (printContent) {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <title>Sample Annual Performance Report</title>
                            <style>
                              body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                              .section { margin-bottom: 25px; }
                              .section h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                              .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 15px 0; }
                              .kpi-item { padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
                              .performance-badge { padding: 5px 10px; border-radius: 15px; font-weight: bold; }
                              .critical { background-color: #fee; color: #c53030; }
                              .bad { background-color: #fffbeb; color: #d69e2e; }
                              .target { background-color: #f0fff4; color: #38a169; }
                              .good { background-color: #ebf8ff; color: #3182ce; }
                              ul { padding-left: 20px; }
                              li { margin-bottom: 5px; }
                              @media print { body { margin: 0; } }
                            </style>
                          </head>
                          <body>
                            ${printContent.innerHTML}
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.print();
                    }
                  }
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Sample PDF
              </button>
            </div>
          </div>

          <div id="sample-report-content" className="p-6">
            <MockAnnualReport />
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnualReportGenerator;