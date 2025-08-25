import React, { useState, useEffect } from 'react';
import { Plus, Edit, Calendar, TrendingUp, BarChart3, AlertTriangle, X } from 'lucide-react';
import { performanceService } from '../services/performanceService';
import { analystService } from '../services/analytService';
import type { PerformanceRecord, Analyst, KPITarget } from '../lib/supabase';
import PerformanceIndicator from './PerformanceIndicator';
import ActionItemsPanel from './ActionItemsPanel';
import { generateActionItems } from '../utils/actionItemsGenerator';
import toast from 'react-hot-toast';

const PerformanceTracking: React.FC = () => {
  const [performanceRecords, setPerformanceRecords] = useState<PerformanceRecord[]>([]);
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [targets, setTargets] = useState<KPITarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PerformanceRecord | null>(null);
  const [selectedAnalyst, setSelectedAnalyst] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedRecordForActions, setSelectedRecordForActions] = useState<PerformanceRecord | null>(null);
  
  const [formData, setFormData] = useState({
    analyst_id: '',
    month: new Date().getMonth() + 1 < 10 ? `0${new Date().getMonth() + 1}` : `${new Date().getMonth() + 1}`,
    year: new Date().getFullYear(),
    outreaches: 0,
    live_links: 0,
    high_da_links: 0,
    content_distribution: 0,
    new_blogs: 0,
    blog_optimizations: 0,
    top_5_keywords: 0
  });

  useEffect(() => {
    loadData();
  }, [selectedAnalyst, selectedYear, selectedMonth]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [records, analystsList, kpiTargets] = await Promise.all([
        performanceService.getPerformanceRecords(selectedAnalyst || undefined),
        analystService.getActiveAnalysts(),
        performanceService.getKPITargets()
      ]);

      let filteredRecords = records;
      if (selectedYear) {
        filteredRecords = records.filter(record => record.year === selectedYear);
      }
      if (selectedMonth) {
        filteredRecords = filteredRecords.filter(record => record.month === selectedMonth);
      }

      setPerformanceRecords(filteredRecords);
      setAnalysts(analystsList);
      setTargets(kpiTargets);
    } catch (error) {
      console.error('Error loading performance data:', error);
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await performanceService.createOrUpdatePerformanceRecord(formData);
      toast.success('Performance record saved successfully');
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving performance record:', error);
      toast.error('Failed to save performance record');
    }
  };

  const handleEdit = (record: PerformanceRecord) => {
    setEditingRecord(record);
    setFormData({
      analyst_id: record.analyst_id,
      month: record.month.padStart(2, '0'),
      year: record.year,
      outreaches: record.outreaches,
      live_links: record.live_links,
      high_da_links: record.high_da_links,
      content_distribution: record.content_distribution,
      new_blogs: record.new_blogs,
      blog_optimizations: record.blog_optimizations,
      top_5_keywords: record.top_5_keywords
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      analyst_id: '',
      month: new Date().getMonth() + 1 < 10 ? `0${new Date().getMonth() + 1}` : `${new Date().getMonth() + 1}`,
      year: new Date().getFullYear(),
      outreaches: 0,
      live_links: 0,
      high_da_links: 0,
      content_distribution: 0,
      new_blogs: 0,
      blog_optimizations: 0,
      top_5_keywords: 0
    });
    setEditingRecord(null);
    setShowModal(false);
  };

  const getTargetForKPI = (kpiName: string) => {
    const target = targets.find(t => t.kpi_name === kpiName);
    return target?.monthly_target || 0;
  };

  const calculateAchievementRate = (actual: number, target: number) => {
    return target > 0 ? Math.round((actual / target) * 100) : 0;
  };

  const handleShowActionItems = (record: PerformanceRecord) => {
    setSelectedRecordForActions(record);
  };

  const getActionItems = () => {
    if (!selectedRecordForActions) return [];
    
    const previousRecords = performanceRecords.filter(
      r => r.analyst_id === selectedRecordForActions.analyst_id && r.id !== selectedRecordForActions.id
    );
    
    return generateActionItems(selectedRecordForActions, previousRecords, targets);
  };

  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Performance Tracking</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Performance Record
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Analyst</label>
            <select
              value={selectedAnalyst}
              onChange={(e) => setSelectedAnalyst(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
            >
              <option value="">All Analysts</option>
              {analysts.map((analyst) => (
                <option key={analyst.id} value={analyst.id}>{analyst.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[150px]"
            >
              <option value="">All Months</option>
              {months.map((month) => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Performance Records Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Performance Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Analyst</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month/Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outreaches</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Live Links</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">High DA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content Dist.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Blogs</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blog Opt.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Top Keywords</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overall Performance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {performanceRecords.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {record.analysts?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {months[parseInt(record.month) - 1]?.label} {record.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-col">
                      <span>{record.outreaches}</span>
                      <PerformanceIndicator 
                        achievementPercentage={calculateAchievementRate(record.outreaches, getTargetForKPI('outreaches'))}
                        showLabel={false}
                        size="sm"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-col">
                      <span>{record.live_links}</span>
                      <PerformanceIndicator 
                        achievementPercentage={calculateAchievementRate(record.live_links, getTargetForKPI('live_links'))}
                        showLabel={false}
                        size="sm"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-col">
                      <span>{record.high_da_links}</span>
                      <PerformanceIndicator 
                        achievementPercentage={calculateAchievementRate(record.high_da_links, getTargetForKPI('high_da_links'))}
                        showLabel={false}
                        size="sm"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-col">
                      <span>{record.content_distribution}</span>
                      <PerformanceIndicator 
                        achievementPercentage={calculateAchievementRate(record.content_distribution, getTargetForKPI('content_distribution'))}
                        showLabel={false}
                        size="sm"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-col">
                      <span>{record.new_blogs}</span>
                      <PerformanceIndicator 
                        achievementPercentage={calculateAchievementRate(record.new_blogs, getTargetForKPI('new_blogs'))}
                        showLabel={false}
                        size="sm"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-col">
                      <span>{record.blog_optimizations}</span>
                      <PerformanceIndicator 
                        achievementPercentage={calculateAchievementRate(record.blog_optimizations, getTargetForKPI('blog_optimizations'))}
                        showLabel={false}
                        size="sm"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-col">
                      <span>{record.top_5_keywords}</span>
                      <PerformanceIndicator 
                        achievementPercentage={calculateAchievementRate(record.top_5_keywords, getTargetForKPI('top_5_keywords'))}
                        showLabel={false}
                        size="sm"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(() => {
                      const kpiNames = ['outreaches', 'live_links', 'high_da_links', 'content_distribution', 'new_blogs', 'blog_optimizations', 'top_5_keywords'];
                      const achievements = kpiNames.map(kpiName => {
                        const target = targets.find(t => t.kpi_name === kpiName);
                        return target ? calculateAchievementRate(record[kpiName as keyof PerformanceRecord] as number, target.monthly_target) : 0;
                      });
                      const avgAchievement = Math.round(achievements.reduce((sum, val) => sum + val, 0) / achievements.length);
                      return (
                        <PerformanceIndicator 
                          achievementPercentage={avgAchievement}
                          showLabel={true}
                          size="sm"
                        />
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      onClick={() => handleEdit(record)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors mr-2"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleShowActionItems(record)}
                      className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
                      title="View Action Items"
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {performanceRecords.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No performance records found</p>
          </div>
        )}
      </div>

      {/* Action Items Panel */}
      {selectedRecordForActions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Performance Analysis & Action Items
              </h3>
              <button
                onClick={() => setSelectedRecordForActions(null)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <ActionItemsPanel
                actionItems={getActionItems()}
                analystName={selectedRecordForActions.analysts?.name}
                month={months[parseInt(selectedRecordForActions.month) - 1]?.label}
                year={selectedRecordForActions.year}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingRecord ? 'Edit Performance Record' : 'Add Performance Record'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Analyst</label>
                    <select
                      required
                      value={formData.analyst_id}
                      onChange={(e) => setFormData({ ...formData, analyst_id: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Analyst</option>
                      {analysts.map((analyst) => (
                        <option key={analyst.id} value={analyst.id}>{analyst.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                    <select
                      required
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {months.map((month) => (
                        <option key={month.value} value={month.value}>{month.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <select
                      required
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={2025}>2025</option>
                      <option value={2026}>2026</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Outreaches (Target: {getTargetForKPI('outreaches')})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.outreaches}
                      onChange={(e) => setFormData({ ...formData, outreaches: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Live Links (Target: {getTargetForKPI('live_links')})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.live_links}
                      onChange={(e) => setFormData({ ...formData, live_links: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      High DA Links (Target: {getTargetForKPI('high_da_links')})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.high_da_links}
                      onChange={(e) => setFormData({ ...formData, high_da_links: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content Distribution (Target: {getTargetForKPI('content_distribution')})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.content_distribution}
                      onChange={(e) => setFormData({ ...formData, content_distribution: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Blogs (Target: {getTargetForKPI('new_blogs')})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.new_blogs}
                      onChange={(e) => setFormData({ ...formData, new_blogs: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Blog Optimizations (Target: {getTargetForKPI('blog_optimizations')})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.blog_optimizations}
                      onChange={(e) => setFormData({ ...formData, blog_optimizations: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Top 5 Keywords (Target: {getTargetForKPI('top_5_keywords')})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.top_5_keywords}
                      onChange={(e) => setFormData({ ...formData, top_5_keywords: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingRecord ? 'Update' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceTracking;