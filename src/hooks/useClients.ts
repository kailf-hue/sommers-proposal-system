/**
 * Clients Hooks
 * React Query hooks for contact and company management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import * as clientsService from '@/lib/clients';
import { toast } from 'sonner';

// Get contacts
export function useContacts(filters?: Parameters<typeof clientsService.getContacts>[1]) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['contacts', organization?.id, filters],
    queryFn: () => clientsService.getContacts(organization!.id, filters),
    enabled: !!organization?.id,
  });
}

// Get single contact
export function useContact(contactId: string | undefined) {
  return useQuery({
    queryKey: ['contact', contactId],
    queryFn: () => clientsService.getContact(contactId!),
    enabled: !!contactId,
  });
}

// Create contact
export function useCreateContact() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: (data: Parameters<typeof clientsService.createContact>[1]) =>
      clientsService.createContact(organization!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact created');
    },
    onError: () => toast.error('Failed to create contact'),
  });
}

// Update contact
export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof clientsService.updateContact>[1] }) =>
      clientsService.updateContact(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact', id] });
      toast.success('Contact updated');
    },
    onError: () => toast.error('Failed to update contact'),
  });
}

// Delete contact
export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clientsService.deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact deleted');
    },
    onError: () => toast.error('Failed to delete contact'),
  });
}

// Get companies
export function useCompanies(search?: string) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['companies', organization?.id, search],
    queryFn: () => clientsService.getCompanies(organization!.id, search),
    enabled: !!organization?.id,
  });
}

// Create company
export function useCreateCompany() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: (data: Parameters<typeof clientsService.createCompany>[1]) =>
      clientsService.createCompany(organization!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company created');
    },
    onError: () => toast.error('Failed to create company'),
  });
}
