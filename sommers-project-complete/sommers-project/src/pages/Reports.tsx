/**
 * Reports Page
 * Custom report generation and management
 */

import { useState } from 'react';
import { FileText, Download, Plus, Calendar, Play, Trash2, DollarSign, TrendingUp, Users, Clock, RefreshCw, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const reportTypes = [
  { id: 'revenue', name: 'Revenue Report', description: 'Revenue trends and breakdowns', icon: DollarSign, color: 'green' },
  { id: 'proposals', name: 'Proposals Report', description: 'Proposal status and conversion', icon: FileText, color: 'blue' },
  { id: 'sales', name: 'Sales Performance', description: 'Rep performance metrics', icon: TrendingUp, color: 'purple' },
  { id: 'clients', name: 'Client Activity', description: 'Client engagement history', icon: Users, color: 'orange' },
];

const savedReports = [
  { id: '1', name: 'Monthly Revenue', type: 'revenue', lastRun: '2024-01-20', schedule: 'Monthly', icon: DollarSign, color: 'green' },
  { id: '2', name: 'Weekly Sales', type: 'proposals', lastRun: '2024-01-19', schedule: 'Weekly', icon: FileText, color: 'blue' },
  { id: '3', name: 'Q1 Performance', type: 'sales', lastRun: '2024-01-15', icon: TrendingUp, color: 'purple' },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'saved' | 'create'>('saved');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success('Report generated successfully');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Reports</h1><p className="text-gray-500">Generate and manage custom reports</p></div>
        <Button onClick={() => setActiveTab('create')} leftIcon={<Plus className="h-4 w-4" />}>New Report</Button>
      </div>

      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        <button onClick={() => setActiveTab('saved')} className={cn('px-4 py-2 text-sm font-medium rounded-md', activeTab === 'saved' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500')}>Saved Reports</button>
        <button onClick={() => setActiveTab('create')} className={cn('px-4 py-2 text-sm font-medium rounded-md', activeTab === 'create' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500')}>Create Report</button>
      </div>

      {activeTab === 'saved' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedReports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', report.color === 'green' && 'bg-green-100', report.color === 'blue' && 'bg-blue-100', report.color === 'purple' && 'bg-purple-100')}>
                    <report.icon className={cn('h-5 w-5', report.color === 'green' && 'text-green-600', report.color === 'blue' && 'text-blue-600', report.color === 'purple' && 'text-purple-600')} />
                  </div>
                  <button className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                </div>
                <h3 className="font-semibold mt-3">{report.name}</h3>
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Last: {report.lastRun}</span>
                  {report.schedule && <span className="flex items-center gap-1"><RefreshCw className="h-3.5 w-3.5" />{report.schedule}</span>}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={handleGenerateReport} isLoading={isGenerating} leftIcon={<Play className="h-3.5 w-3.5" />}>Run</Button>
                  <Button size="sm" variant="outline" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          <Card className="border-dashed cursor-pointer" onClick={() => setActiveTab('create')}>
            <CardContent className="p-5 flex flex-col items-center justify-center min-h-[200px]">
              <Plus className="h-8 w-8 text-gray-400 mb-2" />
              <p className="font-medium text-gray-500">Create New Report</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Report Type</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {reportTypes.map((type) => (
                <button key={type.id} onClick={() => setSelectedType(type.id)} className={cn('w-full flex items-center gap-3 p-3 rounded-lg text-left', selectedType === type.id ? 'bg-brand-red/10 border border-brand-red/30' : 'hover:bg-gray-100 dark:hover:bg-gray-800')}>
                  <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', selectedType === type.id ? 'bg-brand-red/20' : 'bg-gray-100 dark:bg-gray-800')}>
                    <type.icon className={cn('h-4 w-4', selectedType === type.id ? 'text-brand-red' : 'text-gray-500')} />
                  </div>
                  <div><p className="font-medium">{type.name}</p><p className="text-xs text-gray-500">{type.description}</p></div>
                </button>
              ))}
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Configure Report</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Report Name</label><Input placeholder="e.g., Monthly Revenue Report" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Start Date</label><Input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} /></div>
                <div><label className="block text-sm font-medium mb-1">End Date</label><Input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} /></div>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={handleGenerateReport} isLoading={isGenerating} disabled={!selectedType} leftIcon={<Play className="h-4 w-4" />}>Generate</Button>
                <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>Export CSV</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
