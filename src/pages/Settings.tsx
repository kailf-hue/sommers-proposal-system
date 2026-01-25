/**
 * Settings Page
 * Application settings and configuration
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, Building, Palette, Bell, Shield, CreditCard, Globe,
  Mail, Key, Save, ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const settingsTabs = [
  { id: 'profile', label: 'Profile', icon: User, description: 'Personal information' },
  { id: 'organization', label: 'Organization', icon: Building, description: 'Company details' },
  { id: 'branding', label: 'Branding', icon: Palette, description: 'Colors and logo' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Email and alerts' },
  { id: 'security', label: 'Security', icon: Shield, description: 'Password and 2FA' },
  { id: 'billing', label: 'Billing', icon: CreditCard, description: 'Subscription and invoices' },
];

export default function Settings() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { user, organization } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const activeTab = tab || 'profile';

  const [profile, setProfile] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: '',
    timezone: 'America/New_York',
  });

  const [org, setOrg] = useState({
    name: organization?.name || "Sommer's Sealcoating",
    website: 'https://sommersealcoating.com',
    phone: '(555) 123-4567',
    email: 'info@sommersealcoating.com',
    address: '123 Industrial Way',
    city: 'Toledo',
    state: 'OH',
    zip: '43612',
  });

  const [branding, setBranding] = useState({
    primaryColor: '#C41E3A',
    accentColor: '#1F2937',
    logoUrl: '',
  });

  const [notifications, setNotifications] = useState({
    proposalViewed: true,
    proposalAccepted: true,
    proposalRejected: true,
    paymentReceived: true,
    weeklyReport: true,
    marketingEmails: false,
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <Input value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <Input value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              </div>
            </div>
          </div>
        );
      case 'organization':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Company Name</label>
                <Input value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Website</label>
                <Input value={org.website} onChange={(e) => setOrg({ ...org, website: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <Input value={org.phone} onChange={(e) => setOrg({ ...org, phone: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Address</label>
                <Input value={org.address} onChange={(e) => setOrg({ ...org, address: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <Input value={org.city} onChange={(e) => setOrg({ ...org, city: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <Input value={org.state} onChange={(e) => setOrg({ ...org, state: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ZIP</label>
                  <Input value={org.zip} onChange={(e) => setOrg({ ...org, zip: e.target.value })} />
                </div>
              </div>
            </div>
          </div>
        );
      case 'branding':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Logo</label>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Building className="h-8 w-8 text-gray-400" />
                </div>
                <Button variant="outline">Upload Logo</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={branding.primaryColor} onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })} className="h-10 w-20 rounded border cursor-pointer" />
                  <Input value={branding.primaryColor} onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })} className="w-28" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={branding.accentColor} onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })} className="h-10 w-20 rounded border cursor-pointer" />
                  <Input value={branding.accentColor} onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })} className="w-28" />
                </div>
              </div>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-4">
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={value} onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-brand-red/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-red"></div>
                </label>
              </div>
            ))}
          </div>
        );
      case 'security':
        return (
          <div className="space-y-6">
            <Card><CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader><CardContent className="space-y-4"><Input type="password" placeholder="Current password" /><Input type="password" placeholder="New password" /><Input type="password" placeholder="Confirm new password" /><Button>Update Password</Button></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">Two-Factor Authentication</CardTitle><CardDescription>Add extra security</CardDescription></CardHeader><CardContent><Button variant="outline">Enable 2FA</Button></CardContent></Card>
          </div>
        );
      case 'billing':
        return (
          <div className="space-y-6">
            <Card><CardHeader><CardTitle className="text-base">Current Plan</CardTitle></CardHeader><CardContent><div className="flex items-center justify-between"><div><p className="text-2xl font-bold text-brand-red">Professional</p><p className="text-gray-500">$99/month</p></div><Button variant="outline">Upgrade</Button></div></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">Payment Method</CardTitle></CardHeader><CardContent><div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800"><CreditCard className="h-8 w-8 text-gray-400" /><div><p className="font-medium">•••• 4242</p><p className="text-sm text-gray-500">Expires 12/25</p></div></div></CardContent></Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold">Settings</h1><p className="text-gray-500">Manage your account and preferences</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {settingsTabs.map((item) => (
              <button key={item.id} onClick={() => navigate(`/settings/${item.id}`)} className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left', activeTab === item.id ? 'bg-brand-red/10 text-brand-red' : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800')}>
                <item.icon className="h-5 w-5" /><div className="flex-1"><p className="font-medium">{item.label}</p></div><ChevronRight className="h-4 w-4 opacity-50" />
              </button>
            ))}
          </nav>
        </div>
        <div className="lg:col-span-3">
          <Card><CardHeader><CardTitle>{settingsTabs.find((t) => t.id === activeTab)?.label}</CardTitle></CardHeader><CardContent>{renderTabContent()}</CardContent></Card>
          <div className="flex justify-end mt-6"><Button onClick={handleSave} isLoading={isSaving} leftIcon={<Save className="h-4 w-4" />}>Save Changes</Button></div>
        </div>
      </div>
    </div>
  );
}
