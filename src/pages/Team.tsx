/**
 * Team Page
 * Team member management with RBAC
 */

import { useState } from 'react';
import { Plus, Search, Mail, Phone, Shield, MoreHorizontal, UserPlus, Settings, Trash2, Edit, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'owner' | 'admin' | 'manager' | 'sales' | 'viewer';
  avatar?: string;
  status: 'active' | 'inactive' | 'pending';
  lastActive?: string;
  proposalsSent?: number;
  revenue?: number;
}

const mockTeam: TeamMember[] = [
  { id: '1', firstName: 'James', lastName: 'Sommer', email: 'james@sommersealcoating.com', phone: '(555) 100-0001', role: 'owner', status: 'active', lastActive: '2024-01-22', proposalsSent: 156, revenue: 485000 },
  { id: '2', firstName: 'Mike', lastName: 'Johnson', email: 'mike@sommersealcoating.com', phone: '(555) 100-0002', role: 'admin', status: 'active', lastActive: '2024-01-22', proposalsSent: 45, revenue: 156000 },
  { id: '3', firstName: 'Sarah', lastName: 'Williams', email: 'sarah@sommersealcoating.com', phone: '(555) 100-0003', role: 'manager', status: 'active', lastActive: '2024-01-21', proposalsSent: 38, revenue: 142000 },
  { id: '4', firstName: 'Tom', lastName: 'Brown', email: 'tom@sommersealcoating.com', phone: '(555) 100-0004', role: 'sales', status: 'active', lastActive: '2024-01-22', proposalsSent: 42, revenue: 128000 },
  { id: '5', firstName: 'Lisa', lastName: 'Davis', email: 'lisa@sommersealcoating.com', phone: '(555) 100-0005', role: 'sales', status: 'active', lastActive: '2024-01-20', proposalsSent: 31, revenue: 98000 },
  { id: '6', firstName: 'New', lastName: 'User', email: 'newuser@sommersealcoating.com', role: 'viewer', status: 'pending', proposalsSent: 0, revenue: 0 },
];

const ROLE_CONFIG = {
  owner: { label: 'Owner', color: 'bg-purple-100 text-purple-700', description: 'Full access to all features' },
  admin: { label: 'Admin', color: 'bg-red-100 text-red-700', description: 'Manage team and settings' },
  manager: { label: 'Manager', color: 'bg-blue-100 text-blue-700', description: 'View all proposals, approve discounts' },
  sales: { label: 'Sales', color: 'bg-green-100 text-green-700', description: 'Create and manage own proposals' },
  viewer: { label: 'Viewer', color: 'bg-gray-100 text-gray-700', description: 'View-only access' },
};

const PERMISSIONS = {
  owner: ['all'],
  admin: ['manage_team', 'manage_settings', 'view_all_proposals', 'approve_discounts', 'create_proposals'],
  manager: ['view_all_proposals', 'approve_discounts', 'create_proposals'],
  sales: ['create_proposals', 'view_own_proposals'],
  viewer: ['view_reports'],
};

export default function Team() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);

  const filteredTeam = mockTeam.filter(member =>
    searchQuery === '' ||
    `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeMembers = mockTeam.filter(m => m.status === 'active').length;
  const pendingInvites = mockTeam.filter(m => m.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Team</h1>
          <p className="text-gray-500">Manage team members and permissions</p>
        </div>
        <Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setShowInviteModal(true)}>
          Invite Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-3xl font-bold">{mockTeam.length}</p>
            <p className="text-sm text-gray-500">Total Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-green-600">{activeMembers}</p>
            <p className="text-sm text-gray-500">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-amber-600">{pendingInvites}</p>
            <p className="text-sm text-gray-500">Pending Invites</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-3xl font-bold">{Object.keys(ROLE_CONFIG).length}</p>
            <p className="text-sm text-gray-500">Role Types</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Team Members</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search members..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTeam.map(member => (
                  <div key={member.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-brand-red/10 flex items-center justify-center">
                          {member.avatar ? (
                            <img src={member.avatar} alt="" className="h-12 w-12 rounded-full" />
                          ) : (
                            <span className="text-lg font-bold text-brand-red">
                              {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {member.firstName} {member.lastName}
                            </p>
                            <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', ROLE_CONFIG[member.role].color)}>
                              {ROLE_CONFIG[member.role].label}
                            </span>
                            {member.status === 'pending' && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                                Pending
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{member.email}</span>
                            {member.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{member.phone}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        {member.status === 'active' && (
                          <div className="text-right">
                            <p className="text-sm font-medium">{member.proposalsSent} proposals</p>
                            <p className="text-xs text-gray-500">${((member.revenue || 0) / 1000).toFixed(0)}k revenue</p>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                            <Edit className="h-4 w-4 text-gray-400" />
                          </button>
                          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                            <MoreHorizontal className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Roles & Permissions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Roles & Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                <div key={role} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', config.color)}>
                      {config.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {mockTeam.filter(m => m.role === role).length} members
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{config.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {PERMISSIONS[role as keyof typeof PERMISSIONS].slice(0, 3).map(perm => (
                      <span key={perm} className="px-2 py-0.5 text-xs bg-white dark:bg-gray-700 rounded">
                        {perm.replace(/_/g, ' ')}
                      </span>
                    ))}
                    {PERMISSIONS[role as keyof typeof PERMISSIONS].length > 3 && (
                      <span className="px-2 py-0.5 text-xs text-gray-500">
                        +{PERMISSIONS[role as keyof typeof PERMISSIONS].length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" leftIcon={<UserPlus className="h-4 w-4" />}>
                Invite New Member
              </Button>
              <Button variant="outline" className="w-full justify-start" leftIcon={<Shield className="h-4 w-4" />}>
                Manage Permissions
              </Button>
              <Button variant="outline" className="w-full justify-start" leftIcon={<Settings className="h-4 w-4" />}>
                Team Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
