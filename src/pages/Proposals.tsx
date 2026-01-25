/**
 * Sommer's Proposal System - Proposals List Page
 * Display and manage all proposals with filters and actions
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Send, Copy, FileText, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, Button, Badge, Input, Select, Avatar, Skeleton } from '@/components/ui';
import { cn, formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';

const statusConfig = {
  draft: { label: 'Draft', color: 'secondary', icon: FileText },
  pending_review: { label: 'Pending Review', color: 'warning', icon: AlertCircle },
  sent: { label: 'Sent', color: 'info', icon: Send },
  viewed: { label: 'Viewed', color: 'info', icon: Eye },
  accepted: { label: 'Accepted', color: 'success', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'error', icon: XCircle },
  expired: { label: 'Expired', color: 'secondary', icon: Clock },
};

const mockProposals = [
  { id: '1', proposalNumber: 'SOM-2026-0156', clientName: 'Acme Corporation', clientCompany: 'Acme Corp', total: 12500, status: 'sent', createdAt: '2026-01-23T10:00:00Z', tier: 'standard' },
  { id: '2', proposalNumber: 'SOM-2026-0155', clientName: 'John Smith', clientCompany: 'Smith Properties', total: 8750, status: 'viewed', createdAt: '2026-01-22T15:30:00Z', tier: 'premium' },
  { id: '3', proposalNumber: 'SOM-2026-0154', clientName: 'Downtown Mall LLC', clientCompany: 'Downtown Mall', total: 45000, status: 'accepted', createdAt: '2026-01-22T09:00:00Z', tier: 'standard' },
  { id: '4', proposalNumber: 'SOM-2026-0153', clientName: 'City Schools', clientCompany: 'City School District', total: 28000, status: 'pending_review', createdAt: '2026-01-21T14:00:00Z', tier: 'economy' },
  { id: '5', proposalNumber: 'SOM-2026-0152', clientName: 'Green Valley HOA', clientCompany: 'Green Valley', total: 15600, status: 'rejected', createdAt: '2026-01-21T11:00:00Z', tier: 'standard' },
];

export default function Proposals() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  const filteredProposals = mockProposals.filter((proposal) => {
    const matchesSearch = proposal.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         proposal.proposalNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Proposals</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your proposals and quotes</p>
        </div>
        <Link to="/proposals/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>New Proposal</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search proposals..."
                leftIcon={<Search className="h-4 w-4" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              options={[
                { value: 'all', label: 'All Status' },
                ...Object.entries(statusConfig).map(([value, config]) => ({
                  value,
                  label: config.label,
                })),
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Proposals Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Proposal</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProposals.map((proposal) => {
                  const status = statusConfig[proposal.status as keyof typeof statusConfig];
                  return (
                    <tr key={proposal.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-brand-red/10">
                            <FileText className="h-4 w-4 text-brand-red" />
                          </div>
                          <div>
                            <Link to={`/proposals/${proposal.id}`} className="font-medium text-gray-900 dark:text-white hover:text-brand-red">
                              {proposal.proposalNumber}
                            </Link>
                            <Badge variant={proposal.tier as 'economy' | 'standard' | 'premium'} className="ml-2 text-2xs">
                              {proposal.tier}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900 dark:text-white">{proposal.clientName}</p>
                        <p className="text-sm text-gray-500">{proposal.clientCompany}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(proposal.total)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={status.color as any}>{status.label}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-500">{formatDate(proposal.createdAt)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Link to={`/proposals/${proposal.id}`}>
                            <Button variant="ghost" size="icon-sm"><Eye className="h-4 w-4" /></Button>
                          </Link>
                          <Link to={`/proposals/${proposal.id}/edit`}>
                            <Button variant="ghost" size="icon-sm"><Edit className="h-4 w-4" /></Button>
                          </Link>
                          <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
