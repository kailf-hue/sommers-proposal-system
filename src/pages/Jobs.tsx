/**
 * Jobs Page
 * Job management and tracking
 */

import { useState } from 'react';
import { Plus, Search, Filter, Calendar, MapPin, Clock, User, Play, CheckCircle, Pause, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useJobs, useStartJob, useCompleteJob } from '@/hooks/useScheduling';
import { formatCurrency, cn } from '@/lib/utils';

const statusConfig = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700', icon: Calendar },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700', icon: Play },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  weather_hold: { label: 'Weather Hold', color: 'bg-purple-100 text-purple-700', icon: Pause },
};

// Mock data
const mockJobs = [
  { id: '1', title: 'Westside Shopping Center', client: 'ABC Corp', address: '123 Main St, Toledo, OH', scheduled_date: '2024-01-25', status: 'scheduled', crew: 'Crew A', value: 15000, sqft: 45000 },
  { id: '2', title: 'Oak Ridge HOA', client: 'Oak Ridge Association', address: '456 Oak Ave, Perrysburg, OH', scheduled_date: '2024-01-24', status: 'in_progress', crew: 'Crew B', value: 8500, sqft: 22000 },
  { id: '3', title: 'Industrial Park Lot B', client: 'Industrial LLC', address: '789 Industrial Blvd, Maumee, OH', scheduled_date: '2024-01-23', status: 'completed', crew: 'Crew A', value: 32000, sqft: 85000 },
  { id: '4', title: 'First Baptist Church', client: 'First Baptist', address: '321 Church St, Toledo, OH', scheduled_date: '2024-01-26', status: 'weather_hold', crew: 'Crew C', value: 12000, sqft: 30000 },
];

export default function Jobs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const startJob = useStartJob();
  const completeJob = useCompleteJob();

  const filtered = mockJobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || job.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    scheduled: mockJobs.filter(j => j.status === 'scheduled').length,
    inProgress: mockJobs.filter(j => j.status === 'in_progress').length,
    completed: mockJobs.filter(j => j.status === 'completed').length,
    onHold: mockJobs.filter(j => j.status === 'weather_hold').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Jobs</h1><p className="text-gray-500">{mockJobs.length} total jobs</p></div>
        <Button leftIcon={<Plus className="h-4 w-4" />}>Schedule Job</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(stats).map(([key, value]) => (
          <Card key={key} className="cursor-pointer hover:shadow-md" onClick={() => setStatusFilter(key === 'inProgress' ? 'in_progress' : key === 'onHold' ? 'weather_hold' : key)}>
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-sm text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p><p className="text-2xl font-bold">{value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search jobs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
          <option value="all">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="weather_hold">Weather Hold</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((job) => {
          const config = statusConfig[job.status as keyof typeof statusConfig];
          const StatusIcon = config.icon;
          return (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{job.title}</h3>
                      <span className={cn('px-2 py-0.5 text-xs rounded-full font-medium flex items-center gap-1', config.color)}>
                        <StatusIcon className="h-3 w-3" />{config.label}
                      </span>
                    </div>
                    <p className="text-gray-500">{job.client}</p>
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-500"><Calendar className="h-4 w-4" />{new Date(job.scheduled_date).toLocaleDateString()}</div>
                      <div className="flex items-center gap-2 text-gray-500"><MapPin className="h-4 w-4" />{job.address.split(',')[0]}</div>
                      <div className="flex items-center gap-2 text-gray-500"><User className="h-4 w-4" />{job.crew}</div>
                      <div className="flex items-center gap-2 text-gray-500"><Clock className="h-4 w-4" />{job.sqft.toLocaleString()} sqft</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-brand-red">{formatCurrency(job.value)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {job.status === 'scheduled' && <Button size="sm" onClick={() => startJob.mutate(job.id)}>Start</Button>}
                      {job.status === 'in_progress' && <Button size="sm" onClick={() => completeJob.mutate(job.id)}>Complete</Button>}
                      <Button size="sm" variant="ghost"><MoreVertical className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
