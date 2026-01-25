/**
 * Notifications Page
 * View and manage notifications
 */

import { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, FileText, DollarSign, Eye, Calendar, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';

const mockNotifications = [
  { id: '1', type: 'proposal_viewed', title: 'Proposal Viewed', message: 'ABC Corp viewed proposal #SOM-2024-0042', link: '/proposals/42', isRead: false, createdAt: '2024-01-20T14:30:00Z' },
  { id: '2', type: 'proposal_accepted', title: 'Proposal Accepted', message: 'Oak Ridge HOA accepted proposal #SOM-2024-0038', link: '/proposals/38', isRead: false, createdAt: '2024-01-20T12:15:00Z' },
  { id: '3', type: 'payment_received', title: 'Payment Received', message: 'Payment of $4,500 received from First Baptist Church', link: '/payments', isRead: true, createdAt: '2024-01-19T16:45:00Z' },
  { id: '4', type: 'job_scheduled', title: 'Job Scheduled', message: 'New job scheduled for Jan 25 - Industrial Park', link: '/scheduling', isRead: true, createdAt: '2024-01-19T10:00:00Z' },
  { id: '5', type: 'low_stock', title: 'Low Stock Alert', message: 'Crack Filler is below minimum stock level', link: '/inventory', isRead: true, createdAt: '2024-01-18T09:00:00Z' },
];

const getIcon = (type: string) => {
  switch (type) {
    case 'proposal_viewed': return Eye;
    case 'proposal_accepted': return FileText;
    case 'payment_received': return DollarSign;
    case 'job_scheduled': return Calendar;
    case 'low_stock': return AlertTriangle;
    default: return Bell;
  }
};

const getIconColor = (type: string) => {
  switch (type) {
    case 'proposal_viewed': return 'bg-blue-100 text-blue-600';
    case 'proposal_accepted': return 'bg-green-100 text-green-600';
    case 'payment_received': return 'bg-emerald-100 text-emerald-600';
    case 'job_scheduled': return 'bg-purple-100 text-purple-600';
    case 'low_stock': return 'bg-amber-100 text-amber-600';
    default: return 'bg-gray-100 text-gray-600';
  }
};

export default function Notifications() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filtered = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Notifications</h1><p className="text-gray-500">{unreadCount} unread</p></div>
        <Button variant="outline" onClick={handleMarkAllAsRead} disabled={unreadCount === 0} leftIcon={<CheckCheck className="h-4 w-4" />}>Mark All Read</Button>
      </div>

      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        <button onClick={() => setFilter('all')} className={cn('px-4 py-2 text-sm font-medium rounded-md', filter === 'all' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500')}>All</button>
        <button onClick={() => setFilter('unread')} className={cn('px-4 py-2 text-sm font-medium rounded-md', filter === 'unread' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500')}>Unread ({unreadCount})</button>
      </div>

      <Card>
        <CardContent className="p-0 divide-y divide-gray-100 dark:divide-gray-800">
          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No notifications</p>
            </div>
          ) : (
            filtered.map((notification) => {
              const Icon = getIcon(notification.type);
              return (
                <div key={notification.id} className={cn('flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors', !notification.isRead && 'bg-brand-red/5')}>
                  <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0', getIconColor(notification.type))}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn('font-medium', !notification.isRead && 'text-gray-900 dark:text-gray-100')}>{notification.title}</p>
                      {!notification.isRead && <span className="h-2 w-2 rounded-full bg-brand-red" />}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatTime(notification.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!notification.isRead && (
                      <button onClick={() => handleMarkAsRead(notification.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Mark as read">
                        <Check className="h-4 w-4 text-gray-400" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(notification.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded" title="Delete">
                      <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
