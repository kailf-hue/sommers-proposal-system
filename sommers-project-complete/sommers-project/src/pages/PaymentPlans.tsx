/**
 * PaymentPlans Page
 * Payment plan management
 */

import { useState } from 'react';
import { CreditCard, Plus, Search, DollarSign, Calendar, User, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency, cn } from '@/lib/utils';

const mockPaymentPlans = [
  { id: '1', client: 'ABC Corp', proposal: 'SOM-2024-0042', total: 15000, paidAmount: 7500, installments: 3, nextDue: '2024-02-15', status: 'active' },
  { id: '2', client: 'Industrial LLC', proposal: 'SOM-2024-0035', total: 32000, paidAmount: 32000, installments: 4, nextDue: null, status: 'completed' },
  { id: '3', client: 'Springfield Schools', proposal: 'SOM-2024-0028', total: 125000, paidAmount: 25000, installments: 5, nextDue: '2024-01-20', status: 'overdue' },
  { id: '4', client: 'Sunset HOA', proposal: 'SOM-2024-0041', total: 22000, paidAmount: 0, installments: 2, nextDue: '2024-02-01', status: 'pending' },
];

const statusConfig = {
  active: { label: 'Active', color: 'bg-blue-100 text-blue-700', icon: Clock },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700', icon: Clock },
};

export default function PaymentPlans() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = mockPaymentPlans.filter((plan) => {
    const matchesSearch = plan.client.toLowerCase().includes(searchQuery.toLowerCase()) || plan.proposal.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalOutstanding = mockPaymentPlans.reduce((sum, p) => sum + (p.total - p.paidAmount), 0);
  const overdueCount = mockPaymentPlans.filter(p => p.status === 'overdue').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Payment Plans</h1><p className="text-gray-500">{mockPaymentPlans.length} active plans</p></div>
        <Button leftIcon={<Plus className="h-4 w-4" />}>Create Plan</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center"><DollarSign className="h-6 w-6 text-green-600" /></div>
          <div><p className="text-sm text-gray-500">Total Outstanding</p><p className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center"><CreditCard className="h-6 w-6 text-blue-600" /></div>
          <div><p className="text-sm text-gray-500">Active Plans</p><p className="text-2xl font-bold">{mockPaymentPlans.filter(p => p.status === 'active').length}</p></div>
        </CardContent></Card>
        <Card className={overdueCount > 0 ? 'border-red-200' : ''}><CardContent className="p-4 flex items-center gap-4">
          <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center', overdueCount > 0 ? 'bg-red-100' : 'bg-gray-100')}><AlertCircle className={cn('h-6 w-6', overdueCount > 0 ? 'text-red-600' : 'text-gray-400')} /></div>
          <div><p className="text-sm text-gray-500">Overdue</p><p className="text-2xl font-bold">{overdueCount}</p></div>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search plans..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead><tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Client</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Proposal</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Total</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Paid</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Remaining</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Next Due</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Status</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map((plan) => {
                const config = statusConfig[plan.status as keyof typeof statusConfig];
                const progress = (plan.paidAmount / plan.total) * 100;
                return (
                  <tr key={plan.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4"><div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-400" /><span className="font-medium">{plan.client}</span></div></td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-sm">{plan.proposal}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(plan.total)}</td>
                    <td className="py-3 px-4 text-right text-green-600">{formatCurrency(plan.paidAmount)}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(plan.total - plan.paidAmount)}</td>
                    <td className="py-3 px-4 text-center">{plan.nextDue ? new Date(plan.nextDue).toLocaleDateString() : '-'}</td>
                    <td className="py-3 px-4 text-center"><span className={cn('px-2 py-0.5 text-xs rounded-full font-medium', config.color)}>{config.label}</span></td>
                    <td className="py-3 px-4 text-right"><Button size="sm" variant="outline">View</Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
