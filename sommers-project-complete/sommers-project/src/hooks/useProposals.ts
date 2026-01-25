/**
 * Proposals Hooks
 * React Query hooks for proposal management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import * as proposalService from '@/lib/proposal';
import type { ProposalFilters, ProposalWithRelations } from '@/lib/proposal';
import { toast } from 'sonner';

// Get proposals list
export function useProposals(filters?: ProposalFilters) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['proposals', organization?.id, filters],
    queryFn: () => proposalService.getProposals(organization!.id, filters),
    enabled: !!organization?.id,
  });
}

// Get single proposal
export function useProposal(proposalId: string | undefined) {
  return useQuery({
    queryKey: ['proposal', proposalId],
    queryFn: () => proposalService.getProposal(proposalId!),
    enabled: !!proposalId,
  });
}

// Create proposal
export function useCreateProposal() {
  const queryClient = useQueryClient();
  const { organization, user } = useAuth();

  return useMutation({
    mutationFn: (data: Parameters<typeof proposalService.createProposal>[2]) =>
      proposalService.createProposal(organization!.id, user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposal created');
    },
    onError: () => toast.error('Failed to create proposal'),
  });
}

// Update proposal
export function useUpdateProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof proposalService.updateProposal>[1] }) =>
      proposalService.updateProposal(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposal', id] });
      toast.success('Proposal updated');
    },
    onError: () => toast.error('Failed to update proposal'),
  });
}

// Delete proposal
export function useDeleteProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: proposalService.deleteProposal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposal deleted');
    },
    onError: () => toast.error('Failed to delete proposal'),
  });
}

// Send proposal
export function useSendProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, email }: { id: string; email: string }) =>
      proposalService.sendProposal(id, email),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposal', id] });
      toast.success('Proposal sent!');
    },
    onError: () => toast.error('Failed to send proposal'),
  });
}

// Duplicate proposal
export function useDuplicateProposal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (proposalId: string) =>
      proposalService.duplicateProposal(proposalId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposal duplicated');
    },
    onError: () => toast.error('Failed to duplicate proposal'),
  });
}
