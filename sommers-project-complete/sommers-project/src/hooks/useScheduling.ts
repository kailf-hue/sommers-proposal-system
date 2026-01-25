/**
 * Scheduling Hooks
 * React Query hooks for job scheduling
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import * as schedulingService from '@/lib/scheduling';
import { toast } from 'sonner';

// Get jobs
export function useJobs(startDate: string, endDate: string) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['jobs', organization?.id, startDate, endDate],
    queryFn: () => schedulingService.getJobs(organization!.id, startDate, endDate),
    enabled: !!organization?.id,
  });
}

// Create job
export function useCreateJob() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: (data: Parameters<typeof schedulingService.createJob>[1]) =>
      schedulingService.createJob(organization!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job scheduled');
    },
    onError: () => toast.error('Failed to schedule job'),
  });
}

// Update job
export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof schedulingService.updateJob>[1] }) =>
      schedulingService.updateJob(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job updated');
    },
    onError: () => toast.error('Failed to update job'),
  });
}

// Delete job
export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: schedulingService.deleteJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job deleted');
    },
    onError: () => toast.error('Failed to delete job'),
  });
}

// Get crews
export function useCrews() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['crews', organization?.id],
    queryFn: () => schedulingService.getCrews(organization!.id),
    enabled: !!organization?.id,
  });
}

// Start job
export function useStartJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: schedulingService.startJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job started');
    },
  });
}

// Complete job
export function useCompleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      schedulingService.completeJob(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job completed');
    },
  });
}
