/**
 * Pipeline Hooks
 * React Query hooks for CRM pipeline
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import * as pipelineService from '@/lib/pipeline';
import { toast } from 'sonner';

// Get stages
export function useStages() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['deal-stages', organization?.id],
    queryFn: () => pipelineService.getStages(organization!.id),
    enabled: !!organization?.id,
  });
}

// Get deals
export function useDeals(stageId?: string) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['deals', organization?.id, stageId],
    queryFn: () => pipelineService.getDeals(organization!.id, stageId),
    enabled: !!organization?.id,
  });
}

// Create deal
export function useCreateDeal() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: (data: Parameters<typeof pipelineService.createDeal>[1]) =>
      pipelineService.createDeal(organization!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal created');
    },
    onError: () => toast.error('Failed to create deal'),
  });
}

// Update deal
export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof pipelineService.updateDeal>[1] }) =>
      pipelineService.updateDeal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal updated');
    },
  });
}

// Move deal to stage
export function useMoveDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dealId, stageId }: { dealId: string; stageId: string }) =>
      pipelineService.moveDealToStage(dealId, stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

// Pipeline summary
export function usePipelineSummary() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['pipeline-summary', organization?.id],
    queryFn: () => pipelineService.getPipelineSummary(organization!.id),
    enabled: !!organization?.id,
  });
}
