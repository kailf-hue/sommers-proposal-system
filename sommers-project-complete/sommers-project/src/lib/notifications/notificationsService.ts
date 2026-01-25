/**
 * Notifications Service
 * In-app and push notifications
 */

import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  org_id: string;
  user_id?: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

// Get user notifications
export async function getNotifications(
  userId: string,
  limit: number = 20,
  unreadOnly: boolean = false
): Promise<Notification[]> {
  let query = supabase
    .from('notifications')
    .select('*')
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Get unread count
export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .or(`user_id.eq.${userId},user_id.is.null`)
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
}

// Create notification
export async function createNotification(
  orgId: string,
  data: Omit<Notification, 'id' | 'org_id' | 'is_read' | 'created_at'>
): Promise<Notification> {
  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({ org_id: orgId, is_read: false, ...data })
    .select()
    .single();

  if (error) throw error;
  return notification;
}

// Mark as read
export async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) throw error;
}

// Mark all as read
export async function markAllAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .or(`user_id.eq.${userId},user_id.is.null`)
    .eq('is_read', false);

  if (error) throw error;
}

// Delete notification
export async function deleteNotification(notificationId: string): Promise<void> {
  const { error } = await supabase.from('notifications').delete().eq('id', notificationId);
  if (error) throw error;
}

// Subscribe to real-time notifications
export function subscribeToNotifications(
  userId: string,
  callback: (notification: Notification) => void
) {
  const subscription = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => callback(payload.new as Notification)
    )
    .subscribe();

  return () => subscription.unsubscribe();
}

export default {
  getNotifications,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  subscribeToNotifications,
};
