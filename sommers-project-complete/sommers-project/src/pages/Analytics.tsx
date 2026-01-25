/**
 * Analytics Page
 * Comprehensive analytics dashboard with charts
 */

import { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, FileText, Users, Target, Download, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#C41E3A', '#3B82F6', '#22C55E', '#F59E0B'];
const TIER_COLORS = { Economy: '#6B7280', Standard: '#3B82F6', Premium: '#C41E3A' };

export default function Analytics() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Dashboard stats
  const stats = {
    totalRevenue: 485000, revenueGrowth: 12.5,
    totalProposals: 156, proposalGrowth: 8.3,
    winRate: 68.5, winRateChange: 2.1,
    activeClients: 89, clientGrowth: 5.2,
  };

  // Revenue data
  const revenueData = [
    { date: 'Jan', revenue: 32000, proposals: 12, accepted: 8 },
    { date: 'Feb', revenue: 45000, proposals: 15, accepted: 11 },
    { date: 'Mar', revenue: 38000, proposals: 14, accepted: 9 },
    { date: 'Apr', revenue: 52000, proposals: 18, accepted: 13 },
    { date: 'May', revenue: 48000, proposals: 16, accepted: 11 },
    { date: 'Jun', revenue: 61000, proposals: 22, accepted: 16 },
  ];

  // Tier distribution
  const tierData = [
    { name: 'Economy', value: 25, revenue: 62500 },
    { name: 'Standard', value: 45, revenue: 180000 },
    { name: 'Premium', value: 30, revenue: 243000 },
  ];

  // Funnel data
  const funnelData = [
    { status: 'Created', count: 200 },
    { status: 'Sent', count: 156 },
    { status: 'Viewed', count: 142 },
    { status: 'Accepted', count: 107 },
  ];

  // Sales reps
  const salesReps = [
    { id: '1', name: 'Mike Johnson', sent: 45, won: 32, winRate: 71.1, revenue: 156000 },
    { id: '2', name: 'Sarah Williams', sent: 38, won: 28, winRate: 73.7, revenue: 142000 },
    { id: '3', name: 'Tom Brown', sent: 42, won: 27, winRate: 64.3, revenue: 128000 },
    { id: '4', name: 'Lisa Davis', sent: 31, won: 20, winRate: 64.5, revenue: 98000 },
  ];

  const StatCard = ({ title, value, change, icon, prefix = '' }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold mt-1">{prefix}{typeof value === 'number' && value > 1000 ? `${(value / 1000).toFixed(0)}k` : value}</p>
            {change !== undefined && (
              <p className={`text-sm mt-2 flex items-center gap-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {Math.abs(change)}% vs last month
              </p>
            )}
          </div>
          <div className="h-12 w-12 rounded-xl bg-brand-red/10 flex items-center justify-center">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
          <p className="text-gray-500">Track your business performance</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <button key={range} onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${dateRange === range ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}>
                {range === '1y' ? '1 Year' : range}
              </button>
            ))}
          </div>
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>Export</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={stats.totalRevenue} change={stats.revenueGrowth} prefix="$" icon={<DollarSign className="h-6 w-6 text-brand-red" />} />
        <StatCard title="Proposals Sent" value={stats.totalProposals} change={stats.proposalGrowth} icon={<FileText className="h-6 w-6 text-blue-600" />} />
        <StatCard title="Win Rate" value={`${stats.winRate}%`} change={stats.winRateChange} icon={<Target className="h-6 w-6 text-green-600" />} />
        <StatCard title="Active Clients" value={stats.activeClients} change={stats.clientGrowth} icon={<Users className="h-6 w-6 text-purple-600" />} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C41E3A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#C41E3A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#C41E3A" strokeWidth={2} fill="url(#revenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Conversion Funnel</CardTitle></CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="status" type="category" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#C41E3A" radius={[0, 4, 4, 0]}>
                    {funnelData.map((_, index) => <Cell key={index} fill={COLORS[index]} fillOpacity={1 - index * 0.15} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier & Sales Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Tier Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tierData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {tierData.map((entry, index) => <Cell key={index} fill={Object.values(TIER_COLORS)[index]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {tierData.map((tier, i) => (
                <div key={tier.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: Object.values(TIER_COLORS)[i] }} />
                    <span>{tier.name}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(tier.revenue)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Sales Rep Performance</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3 font-medium">Rep</th>
                  <th className="pb-3 font-medium text-right">Sent</th>
                  <th className="pb-3 font-medium text-right">Won</th>
                  <th className="pb-3 font-medium text-right">Win Rate</th>
                  <th className="pb-3 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {salesReps.map((rep) => (
                  <tr key={rep.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 font-medium">{rep.name}</td>
                    <td className="py-3 text-right">{rep.sent}</td>
                    <td className="py-3 text-right">{rep.won}</td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rep.winRate >= 70 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {rep.winRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 text-right font-medium">{formatCurrency(rep.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Proposals Activity */}
      <Card>
        <CardHeader><CardTitle>Proposals Activity</CardTitle></CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="proposals" name="Sent" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="accepted" name="Accepted" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
