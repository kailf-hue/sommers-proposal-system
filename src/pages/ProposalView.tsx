/**
 * ProposalView Page
 * View proposal details with actions
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Send, Edit, Copy, Download, Trash2, Clock, Eye, Check, X, DollarSign, Calendar, User, MapPin, ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useProposal, useSendProposal, useDuplicateProposal } from '@/hooks/useProposals';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-purple-100 text-purple-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-amber-100 text-amber-700',
};

export default function ProposalView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: proposal, isLoading } = useProposal(id!);
  const sendProposal = useSendProposal();
  const duplicateProposal = useDuplicateProposal();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-brand-red border-t-transparent rounded-full" /></div>;
  }

  if (!proposal) {
    return <div className="text-center py-12"><p className="text-gray-500">Proposal not found</p></div>;
  }

  const handleSend = () => {
    sendProposal.mutate(id!, { onSuccess: () => toast.success('Proposal sent!') });
  };

  const handleDuplicate = () => {
    duplicateProposal.mutate(id!, { onSuccess: (newId) => navigate(`/proposals/${newId}`) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/proposals')}><ChevronLeft className="h-5 w-5" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{proposal.proposal_number}</h1>
            <span className={cn('px-3 py-1 rounded-full text-sm font-medium capitalize', statusColors[proposal.status as keyof typeof statusColors])}>{proposal.status}</span>
          </div>
          <p className="text-gray-500">{proposal.title || 'Untitled Proposal'}</p>
        </div>
        <div className="flex items-center gap-2">
          {proposal.status === 'draft' && <Button onClick={handleSend} isLoading={sendProposal.isPending} leftIcon={<Send className="h-4 w-4" />}>Send</Button>}
          <Button variant="outline" onClick={() => navigate(`/proposals/${id}/edit`)} leftIcon={<Edit className="h-4 w-4" />}>Edit</Button>
          <Button variant="outline" onClick={handleDuplicate} leftIcon={<Copy className="h-4 w-4" />}>Duplicate</Button>
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full">
                <thead><tr className="border-b">
                  <th className="text-left py-2 text-sm font-medium text-gray-500">Service</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-500">Qty</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-500">Rate</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-500">Amount</th>
                </tr></thead>
                <tbody>
                  {(proposal.line_items || []).map((item: any, i: number) => (
                    <tr key={i} className="border-b">
                      <td className="py-3"><p className="font-medium">{item.description}</p></td>
                      <td className="py-3 text-right">{item.quantity} {item.unit}</td>
                      <td className="py-3 text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><td colSpan={3} className="py-3 text-right font-medium">Subtotal</td><td className="py-3 text-right">{formatCurrency(proposal.subtotal || 0)}</td></tr>
                  {proposal.discount_amount > 0 && <tr><td colSpan={3} className="py-2 text-right text-green-600">Discount</td><td className="py-2 text-right text-green-600">-{formatCurrency(proposal.discount_amount)}</td></tr>}
                  <tr className="text-lg"><td colSpan={3} className="py-3 text-right font-bold">Total</td><td className="py-3 text-right font-bold text-brand-red">{formatCurrency(proposal.total || 0)}</td></tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>

          {proposal.scope_of_work && (
            <Card>
              <CardHeader><CardTitle>Scope of Work</CardTitle></CardHeader>
              <CardContent><p className="text-gray-600 whitespace-pre-wrap">{proposal.scope_of_work}</p></CardContent>
            </Card>
          )}

          {proposal.terms_conditions && (
            <Card>
              <CardHeader><CardTitle>Terms & Conditions</CardTitle></CardHeader>
              <CardContent><p className="text-gray-600 whitespace-pre-wrap">{proposal.terms_conditions}</p></CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Client Info</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {proposal.contact && (
                <div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-400" /><span>{proposal.contact.first_name} {proposal.contact.last_name}</span></div>
              )}
              {proposal.company && (
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" /><span>{proposal.company.name}</span></div>
              )}
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-400" /><span>Created {new Date(proposal.created_at).toLocaleDateString()}</span></div>
              {proposal.valid_until && (
                <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-gray-400" /><span>Valid until {new Date(proposal.valid_until).toLocaleDateString()}</span></div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center"><FileText className="h-4 w-4 text-gray-500" /></div>
                <div><p className="font-medium">Created</p><p className="text-gray-500">{new Date(proposal.created_at).toLocaleString()}</p></div>
              </div>
              {proposal.sent_at && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center"><Send className="h-4 w-4 text-blue-600" /></div>
                  <div><p className="font-medium">Sent</p><p className="text-gray-500">{new Date(proposal.sent_at).toLocaleString()}</p></div>
                </div>
              )}
              {proposal.viewed_at && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center"><Eye className="h-4 w-4 text-purple-600" /></div>
                  <div><p className="font-medium">Viewed</p><p className="text-gray-500">{new Date(proposal.viewed_at).toLocaleString()}</p></div>
                </div>
              )}
              {proposal.accepted_at && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center"><Check className="h-4 w-4 text-green-600" /></div>
                  <div><p className="font-medium">Accepted</p><p className="text-gray-500">{new Date(proposal.accepted_at).toLocaleString()}</p></div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
