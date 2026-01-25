/**
 * Notifications Hooks
 * React Query hooks for notifications
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import * as notificationsService from '@/lib/notifications';

// Get notifications
export function useNotifications(limit?: number, unreadOnly?: boolean) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', user?.id, limit, unreadOnly],
    queryFn: () => notificationsService.getNotifications(user!.id, limit, unreadOnly),
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Get unread count
export function useUnreadCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications-unread-count', user?.id],
    queryFn: () => notificationsService.getUnreadCount(user!.id),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
}

// Mark as read
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationsService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}

// Mark all as read
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: () => notificationsService.markAllAsRead(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}
