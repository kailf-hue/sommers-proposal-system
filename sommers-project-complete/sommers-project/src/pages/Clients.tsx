/**
 * Clients Page
 * Contact and company management
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Building2, User, Mail, Phone, MapPin, MoreHorizontal, FileText, DollarSign, Calendar, Star, Upload, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency, cn } from '@/lib/utils';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  totalProposals: number;
  totalRevenue: number;
  lastContact?: string;
  leadScore: number;
  tags?: string[];
}

const mockContacts: Contact[] = [
  { id: '1', firstName: 'John', lastName: 'Smith', email: 'john@abccorp.com', phone: '(555) 123-4567', company: 'ABC Corporation', address: '123 Business Ave', city: 'Toledo', state: 'OH', totalProposals: 5, totalRevenue: 45000, lastContact: '2024-01-15', leadScore: 85, tags: ['Commercial', 'Priority'] },
  { id: '2', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah@retailholdings.com', phone: '(555) 234-5678', company: 'Retail Holdings LLC', address: '456 Commerce Blvd', city: 'Toledo', state: 'OH', totalProposals: 3, totalRevenue: 78000, lastContact: '2024-01-18', leadScore: 92, tags: ['Commercial', 'VIP'] },
  { id: '3', firstName: 'Michael', lastName: 'Brown', email: 'mbrown@sunsetoa.org', phone: '(555) 345-6789', company: 'Sunset HOA', address: '789 Sunset Dr', city: 'Perrysburg', state: 'OH', totalProposals: 2, totalRevenue: 32000, lastContact: '2024-01-10', leadScore: 68, tags: ['HOA'] },
  { id: '4', firstName: 'Emily', lastName: 'Davis', email: 'edavis@springfieldschools.edu', phone: '(555) 456-7890', company: 'Springfield Schools', address: '321 Education Way', city: 'Springfield', state: 'OH', totalProposals: 1, totalRevenue: 125000, lastContact: '2024-01-20', leadScore: 95, tags: ['Municipal', 'Priority'] },
  { id: '5', firstName: 'Robert', lastName: 'Wilson', email: 'rwilson@industrialllc.com', phone: '(555) 567-8901', company: 'Industrial LLC', address: '555 Industrial Pkwy', city: 'Maumee', state: 'OH', totalProposals: 4, totalRevenue: 156000, lastContact: '2024-01-12', leadScore: 88, tags: ['Industrial', 'VIP'] },
  { id: '6', firstName: 'Lisa', lastName: 'Anderson', email: 'lisa@firstbaptist.org', phone: '(555) 678-9012', company: 'First Baptist Church', address: '777 Faith Ave', city: 'Toledo', state: 'OH', totalProposals: 2, totalRevenue: 18500, lastContact: '2024-01-08', leadScore: 72, tags: ['Religious'] },
];

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allTags = Array.from(new Set(mockContacts.flatMap(c => c.tags || [])));
  
  const filteredContacts = mockContacts.filter(contact => {
    const matchesSearch = searchQuery === '' || 
      `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => contact.tags?.includes(tag));
    
    return matchesSearch && matchesTags;
  });

  const totalRevenue = mockContacts.reduce((sum, c) => sum + c.totalRevenue, 0);
  const avgLeadScore = Math.round(mockContacts.reduce((sum, c) => sum + c.leadScore, 0) / mockContacts.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Clients</h1>
          <p className="text-gray-500">Manage your contacts and companies</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" leftIcon={<Upload className="h-4 w-4" />}>Import</Button>
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>Export</Button>
          <Button leftIcon={<Plus className="h-4 w-4" />}>Add Contact</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockContacts.length}</p>
              <p className="text-sm text-gray-500">Total Contacts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              <p className="text-sm text-gray-500">Lifetime Value</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockContacts.reduce((sum, c) => sum + c.totalProposals, 0)}</p>
              <p className="text-sm text-gray-500">Total Proposals</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Star className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgLeadScore}</p>
              <p className="text-sm text-gray-500">Avg Lead Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search contacts..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                  className={cn(
                    'px-3 py-1 text-sm rounded-full transition-colors',
                    selectedTags.includes(tag)
                      ? 'bg-brand-red text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left p-4 text-sm font-medium text-gray-500">Contact</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Company</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Contact Info</th>
                <th className="text-right p-4 text-sm font-medium text-gray-500">Proposals</th>
                <th className="text-right p-4 text-sm font-medium text-gray-500">Revenue</th>
                <th className="text-center p-4 text-sm font-medium text-gray-500">Score</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Tags</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map(contact => (
                <tr key={contact.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-4">
                    <Link to={`/clients/${contact.id}`} className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-brand-red/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-brand-red">
                          {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 hover:text-brand-red">
                          {contact.firstName} {contact.lastName}
                        </p>
                        {contact.lastContact && (
                          <p className="text-xs text-gray-500">
                            Last: {new Date(contact.lastContact).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="p-4">
                    {contact.company && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{contact.company}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Mail className="h-3 w-3" />{contact.email}
                      </div>
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Phone className="h-3 w-3" />{contact.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right font-medium">{contact.totalProposals}</td>
                  <td className="p-4 text-right font-medium text-brand-red">{formatCurrency(contact.totalRevenue)}</td>
                  <td className="p-4 text-center">
                    <span className={cn(
                      'inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                      contact.leadScore >= 80 ? 'bg-green-100 text-green-700' :
                      contact.leadScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    )}>
                      {contact.leadScore}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      {contact.tags?.map(tag => (
                        <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                      <MoreHorizontal className="h-4 w-4 text-gray-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
