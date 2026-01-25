/**
 * ClientDetail Page
 * View and manage individual client
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Building, Mail, Phone, MapPin, FileText, DollarSign, Calendar, Edit, Trash2, ChevronLeft, Plus, Clock, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useContact, useDeleteContact } from '@/hooks/useClients';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: contact, isLoading } = useContact(id!);
  const deleteContact = useDeleteContact();

  // Mock data for proposals and activity
  const proposals = [
    { id: '1', number: 'SOM-2024-0042', title: 'Parking Lot Sealcoating', status: 'accepted', total: 15000, date: '2024-01-15' },
    { id: '2', number: 'SOM-2024-0038', title: 'Crack Repair', status: 'sent', total: 3500, date: '2024-01-10' },
    { id: '3', number: 'SOM-2023-0156', title: 'Annual Maintenance', status: 'accepted', total: 22000, date: '2023-08-20' },
  ];

  const activities = [
    { type: 'proposal', action: 'Proposal sent', date: '2024-01-15T10:30:00Z' },
    { type: 'email', action: 'Follow-up email sent', date: '2024-01-12T14:00:00Z' },
    { type: 'call', action: 'Phone call - discussed scope', date: '2024-01-10T09:15:00Z' },
    { type: 'meeting', action: 'Site visit completed', date: '2024-01-08T11:00:00Z' },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-brand-red border-t-transparent rounded-full" /></div>;
  }

  if (!contact) {
    return <div className="text-center py-12"><p className="text-gray-500">Client not found</p></div>;
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this client?')) {
      deleteContact.mutate(id!, { onSuccess: () => { toast.success('Client deleted'); navigate('/clients'); } });
    }
  };

  const totalRevenue = proposals.filter(p => p.status === 'accepted').reduce((sum, p) => sum + p.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/clients')}><ChevronLeft className="h-5 w-5" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{contact.first_name} {contact.last_name}</h1>
          <p className="text-gray-500">{contact.company?.name || 'No company'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" leftIcon={<Edit className="h-4 w-4" />}>Edit</Button>
          <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Contact Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-500">Email</p><p className="font-medium">{contact.email || 'Not provided'}</p></div></div>
              <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-500">Phone</p><p className="font-medium">{contact.phone || 'Not provided'}</p></div></div>
              {contact.company && (
                <div className="flex items-center gap-3"><Building className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-500">Company</p><p className="font-medium">{contact.company.name}</p></div></div>
              )}
              {contact.address && (
                <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-500">Address</p><p className="font-medium">{contact.address}</p></div></div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Stats</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-green-600" /><span className="text-sm">Total Revenue</span></div>
                <span className="font-bold text-green-600">{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-2"><FileText className="h-5 w-5 text-blue-600" /><span className="text-sm">Proposals</span></div>
                <span className="font-bold">{proposals.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-2"><Star className="h-5 w-5 text-amber-500" /><span className="text-sm">Lead Score</span></div>
                <span className="font-bold">{contact.lead_score || 50}/100</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Proposals</CardTitle>
              <Button size="sm" onClick={() => navigate('/proposals/new')} leftIcon={<Plus className="h-4 w-4" />}>New Proposal</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {proposals.map((proposal) => (
                  <div key={proposal.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" onClick={() => navigate(`/proposals/${proposal.id}`)}>
                    <div>
                      <p className="font-medium">{proposal.number}</p>
                      <p className="text-sm text-gray-500">{proposal.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(proposal.total)}</p>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full capitalize', proposal.status === 'accepted' ? 'bg-green-100 text-green-700' : proposal.status === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600')}>{proposal.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Activity Timeline</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-gray-500">{new Date(activity.date).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
