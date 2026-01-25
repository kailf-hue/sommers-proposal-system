/**
 * Sommer's Proposal System - E-Signature Service
 * Phase 44: Legally-binding electronic signatures with audit trail
 */

import { supabase } from '../supabase';
import { entitlementsService } from '../entitlements/entitlementsService';

// ============================================================================
// TYPES
// ============================================================================

export interface SignatureRequest {
  id: string;
  orgId: string;
  proposalId: string;
  documentHash: string;
  status: SignatureStatus;
  signatureType: SignatureType;
  signers: Signer[];
  settings: SignatureSettings;
  expiresAt: string | null;
  createdAt: string;
  completedAt: string | null;
}

export type SignatureStatus = 'pending' | 'in_progress' | 'completed' | 'expired' | 'cancelled';

export type SignatureType = 'typed' | 'drawn' | 'uploaded' | 'legal_grade';

export interface Signer {
  id: string;
  email: string;
  name: string;
  role: SignerRole;
  order: number;
  status: 'pending' | 'viewed' | 'signed' | 'declined';
  signedAt: string | null;
  signatureData: SignatureData | null;
  ipAddress: string | null;
  userAgent: string | null;
  location: string | null;
  accessCode: string | null;
}

export type SignerRole = 'client' | 'contractor' | 'witness' | 'approver';

export interface SignatureData {
  type: SignatureType;
  value: string; // Base64 for drawn/uploaded, text for typed
  fontFamily?: string;
  timestamp: string;
}

export interface SignatureSettings {
  requireAccessCode: boolean;
  requireIdentityVerification: boolean;
  allowDecline: boolean;
  reminderDays: number[];
  customMessage?: string;
  redirectUrl?: string;
  signingOrder: 'sequential' | 'parallel';
}

export interface SignatureAuditEntry {
  id: string;
  requestId: string;
  action: AuditAction;
  performedBy: string;
  performedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  details: Record<string, unknown>;
}

export type AuditAction =
  | 'request_created'
  | 'document_sent'
  | 'document_viewed'
  | 'signature_started'
  | 'signature_completed'
  | 'signature_declined'
  | 'reminder_sent'
  | 'request_cancelled'
  | 'request_expired';

export interface SignatureCertificate {
  id: string;
  requestId: string;
  proposalId: string;
  documentHash: string;
  signers: {
    name: string;
    email: string;
    signedAt: string;
    ipAddress: string;
  }[];
  certificateHash: string;
  issuedAt: string;
  pdfUrl: string;
}

export interface SignatureVerification {
  isValid: boolean;
  documentHash: string;
  certificateHash: string;
  signedAt: string;
  signers: string[];
  tamperDetected: boolean;
}

// ============================================================================
// E-SIGNATURE SERVICE
// ============================================================================

export const eSignatureService = {
  // --------------------------------------------------------------------------
  // Signature Requests
  // --------------------------------------------------------------------------

  /**
   * Create a signature request
   */
  async createSignatureRequest(
    orgId: string,
    proposalId: string,
    signers: Omit<Signer, 'id' | 'status' | 'signedAt' | 'signatureData' | 'ipAddress' | 'userAgent' | 'location'>[],
    settings?: Partial<SignatureSettings>
  ): Promise<SignatureRequest> {
    // Check plan for legal grade signatures
    const plan = await entitlementsService.getEffectivePlan(orgId);
    const canUseLegalGrade = ['business', 'enterprise'].includes(plan.id);

    // Get document content for hashing
    const { data: proposal } = await supabase
      .from('proposals')
      .select('content, total_amount')
      .eq('id', proposalId)
      .single();

    if (!proposal) throw new Error('Proposal not found');

    // Create document hash
    const documentHash = await this.hashDocument(JSON.stringify(proposal.content));

    // Default settings
    const finalSettings: SignatureSettings = {
      requireAccessCode: settings?.requireAccessCode || false,
      requireIdentityVerification: settings?.requireIdentityVerification || false,
      allowDecline: settings?.allowDecline !== false,
      reminderDays: settings?.reminderDays || [3, 7],
      customMessage: settings?.customMessage,
      redirectUrl: settings?.redirectUrl,
      signingOrder: settings?.signingOrder || 'sequential',
    };

    // Generate access codes if required
    const signersWithCodes = signers.map((signer, index) => ({
      ...signer,
      id: crypto.randomUUID(),
      status: 'pending' as const,
      signedAt: null,
      signatureData: null,
      ipAddress: null,
      userAgent: null,
      location: null,
      accessCode: finalSettings.requireAccessCode ? this.generateAccessCode() : null,
      order: signer.order ?? index + 1,
    }));

    // Create request
    const { data, error } = await supabase
      .from('signature_requests')
      .insert({
        org_id: orgId,
        proposal_id: proposalId,
        document_hash: documentHash,
        status: 'pending',
        signature_type: canUseLegalGrade ? 'legal_grade' : 'typed',
        signers: signersWithCodes,
        settings: finalSettings,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit entry
    await this.logAudit(data.id, 'request_created', 'system', {
      signerCount: signers.length,
      settings: finalSettings,
    });

    return transformSignatureRequest(data);
  },

  /**
   * Get a signature request
   */
  async getSignatureRequest(requestId: string): Promise<SignatureRequest | null> {
    const { data, error } = await supabase
      .from('signature_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? transformSignatureRequest(data) : null;
  },

  /**
   * Get signature request by proposal
   */
  async getSignatureRequestByProposal(proposalId: string): Promise<SignatureRequest | null> {
    const { data, error } = await supabase
      .from('signature_requests')
      .select('*')
      .eq('proposal_id', proposalId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? transformSignatureRequest(data) : null;
  },

  /**
   * Send signature request
   */
  async sendSignatureRequest(requestId: string): Promise<void> {
    const request = await this.getSignatureRequest(requestId);
    if (!request) throw new Error('Request not found');

    // Update status
    await supabase
      .from('signature_requests')
      .update({
        status: 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    // Send emails to signers based on signing order
    const signersToNotify = request.settings.signingOrder === 'sequential'
      ? [request.signers.find((s) => s.order === 1)]
      : request.signers;

    for (const signer of signersToNotify.filter(Boolean)) {
      await this.sendSignerNotification(request, signer!);
    }

    await this.logAudit(requestId, 'document_sent', 'system', {
      recipientCount: signersToNotify.length,
    });
  },

  /**
   * Cancel a signature request
   */
  async cancelSignatureRequest(requestId: string, reason?: string): Promise<void> {
    await supabase
      .from('signature_requests')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    await this.logAudit(requestId, 'request_cancelled', 'system', { reason });
  },

  // --------------------------------------------------------------------------
  // Signing Process
  // --------------------------------------------------------------------------

  /**
   * Record document view
   */
  async recordDocumentView(
    requestId: string,
    signerId: string,
    metadata: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    const request = await this.getSignatureRequest(requestId);
    if (!request) throw new Error('Request not found');

    const signers = request.signers.map((s) =>
      s.id === signerId && s.status === 'pending'
        ? { ...s, status: 'viewed' as const }
        : s
    );

    await supabase
      .from('signature_requests')
      .update({ signers, updated_at: new Date().toISOString() })
      .eq('id', requestId);

    await this.logAudit(requestId, 'document_viewed', signerId, {
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });
  },

  /**
   * Submit signature
   */
  async submitSignature(
    requestId: string,
    signerId: string,
    signatureData: Omit<SignatureData, 'timestamp'>,
    metadata: {
      ipAddress?: string;
      userAgent?: string;
      location?: string;
      accessCode?: string;
    }
  ): Promise<{ success: boolean; allSigned: boolean; certificate?: SignatureCertificate }> {
    const request = await this.getSignatureRequest(requestId);
    if (!request) throw new Error('Request not found');

    const signer = request.signers.find((s) => s.id === signerId);
    if (!signer) throw new Error('Signer not found');

    // Verify access code if required
    if (request.settings.requireAccessCode && signer.accessCode !== metadata.accessCode) {
      throw new Error('Invalid access code');
    }

    // Check if signer can sign (based on order)
    if (request.settings.signingOrder === 'sequential') {
      const previousSigners = request.signers.filter((s) => s.order < signer.order);
      const allPreviousSigned = previousSigners.every((s) => s.status === 'signed');
      if (!allPreviousSigned) {
        throw new Error('Waiting for previous signers');
      }
    }

    // Update signer
    const updatedSigners = request.signers.map((s) =>
      s.id === signerId
        ? {
            ...s,
            status: 'signed' as const,
            signedAt: new Date().toISOString(),
            signatureData: { ...signatureData, timestamp: new Date().toISOString() },
            ipAddress: metadata.ipAddress || null,
            userAgent: metadata.userAgent || null,
            location: metadata.location || null,
          }
        : s
    );

    const allSigned = updatedSigners.every((s) => s.status === 'signed');

    await supabase
      .from('signature_requests')
      .update({
        signers: updatedSigners,
        status: allSigned ? 'completed' : 'in_progress',
        completed_at: allSigned ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    await this.logAudit(requestId, 'signature_completed', signerId, {
      signatureType: signatureData.type,
      ipAddress: metadata.ipAddress,
    });

    // If sequential and not all signed, notify next signer
    if (request.settings.signingOrder === 'sequential' && !allSigned) {
      const nextSigner = updatedSigners.find(
        (s) => s.status === 'pending' && s.order === signer.order + 1
      );
      if (nextSigner) {
        await this.sendSignerNotification(request, nextSigner);
      }
    }

    // If all signed, generate certificate and update proposal
    let certificate: SignatureCertificate | undefined;
    if (allSigned) {
      certificate = await this.generateCertificate(requestId);
      await this.updateProposalStatus(request.proposalId, 'signed');
    }

    return { success: true, allSigned, certificate };
  },

  /**
   * Decline to sign
   */
  async declineSignature(
    requestId: string,
    signerId: string,
    reason?: string
  ): Promise<void> {
    const request = await this.getSignatureRequest(requestId);
    if (!request) throw new Error('Request not found');

    if (!request.settings.allowDecline) {
      throw new Error('Declining is not allowed for this request');
    }

    const updatedSigners = request.signers.map((s) =>
      s.id === signerId
        ? { ...s, status: 'declined' as const }
        : s
    );

    await supabase
      .from('signature_requests')
      .update({
        signers: updatedSigners,
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    await this.logAudit(requestId, 'signature_declined', signerId, { reason });
  },

  // --------------------------------------------------------------------------
  // Certificates & Verification
  // --------------------------------------------------------------------------

  /**
   * Generate signature certificate
   */
  async generateCertificate(requestId: string): Promise<SignatureCertificate> {
    const request = await this.getSignatureRequest(requestId);
    if (!request) throw new Error('Request not found');
    if (request.status !== 'completed') throw new Error('Request not completed');

    const certificateData = {
      requestId,
      proposalId: request.proposalId,
      documentHash: request.documentHash,
      signers: request.signers
        .filter((s) => s.status === 'signed')
        .map((s) => ({
          name: s.name,
          email: s.email,
          signedAt: s.signedAt!,
          ipAddress: s.ipAddress || 'unknown',
        })),
      issuedAt: new Date().toISOString(),
    };

    const certificateHash = await this.hashDocument(JSON.stringify(certificateData));

    const { data, error } = await supabase
      .from('signature_certificates')
      .insert({
        request_id: requestId,
        proposal_id: request.proposalId,
        document_hash: request.documentHash,
        signers: certificateData.signers,
        certificate_hash: certificateHash,
        issued_at: certificateData.issuedAt,
      })
      .select()
      .single();

    if (error) throw error;

    // Generate PDF certificate (would integrate with PDF service)
    const pdfUrl = `/api/certificates/${data.id}/download`;

    return {
      id: data.id,
      requestId: data.request_id,
      proposalId: data.proposal_id,
      documentHash: data.document_hash,
      signers: data.signers,
      certificateHash: data.certificate_hash,
      issuedAt: data.issued_at,
      pdfUrl,
    };
  },

  /**
   * Verify a signature
   */
  async verifySignature(
    requestId: string,
    documentContent: string
  ): Promise<SignatureVerification> {
    const request = await this.getSignatureRequest(requestId);
    if (!request) throw new Error('Request not found');

    const { data: certificate } = await supabase
      .from('signature_certificates')
      .select('*')
      .eq('request_id', requestId)
      .single();

    const currentHash = await this.hashDocument(documentContent);
    const tamperDetected = currentHash !== request.documentHash;

    return {
      isValid: !tamperDetected && request.status === 'completed',
      documentHash: request.documentHash,
      certificateHash: certificate?.certificate_hash || '',
      signedAt: request.completedAt || '',
      signers: request.signers.filter((s) => s.status === 'signed').map((s) => s.name),
      tamperDetected,
    };
  },

  /**
   * Get certificate by request
   */
  async getCertificate(requestId: string): Promise<SignatureCertificate | null> {
    const { data, error } = await supabase
      .from('signature_certificates')
      .select('*')
      .eq('request_id', requestId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    return {
      id: data.id,
      requestId: data.request_id,
      proposalId: data.proposal_id,
      documentHash: data.document_hash,
      signers: data.signers,
      certificateHash: data.certificate_hash,
      issuedAt: data.issued_at,
      pdfUrl: `/api/certificates/${data.id}/download`,
    };
  },

  // --------------------------------------------------------------------------
  // Audit Trail
  // --------------------------------------------------------------------------

  /**
   * Log audit entry
   */
  async logAudit(
    requestId: string,
    action: AuditAction,
    performedBy: string,
    details: Record<string, unknown> = {},
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await supabase.from('signature_audit_log').insert({
      request_id: requestId,
      action,
      performed_by: performedBy,
      performed_at: new Date().toISOString(),
      ip_address: metadata?.ipAddress,
      user_agent: metadata?.userAgent,
      details,
    });
  },

  /**
   * Get audit trail for a request
   */
  async getAuditTrail(requestId: string): Promise<SignatureAuditEntry[]> {
    const { data, error } = await supabase
      .from('signature_audit_log')
      .select('*')
      .eq('request_id', requestId)
      .order('performed_at', { ascending: true });

    if (error) throw error;

    return (data || []).map((entry) => ({
      id: entry.id,
      requestId: entry.request_id,
      action: entry.action as AuditAction,
      performedBy: entry.performed_by,
      performedAt: entry.performed_at,
      ipAddress: entry.ip_address,
      userAgent: entry.user_agent,
      details: entry.details || {},
    }));
  },

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  /**
   * Hash document content using SHA-256
   */
  async hashDocument(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Generate access code
   */
  generateAccessCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  },

  /**
   * Send notification to signer
   */
  async sendSignerNotification(
    request: SignatureRequest,
    signer: Signer
  ): Promise<void> {
    // In production, integrate with email service
    console.log(`Sending signature request to ${signer.email}`, {
      requestId: request.id,
      proposalId: request.proposalId,
      accessCode: signer.accessCode,
    });

    // Would call emailService.sendSignatureRequest()
  },

  /**
   * Update proposal status
   */
  async updateProposalStatus(
    proposalId: string,
    status: string
  ): Promise<void> {
    await supabase
      .from('proposals')
      .update({
        status,
        signed_at: status === 'signed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', proposalId);
  },

  // --------------------------------------------------------------------------
  // Reminders
  // --------------------------------------------------------------------------

  /**
   * Send reminder to pending signers
   */
  async sendReminders(requestId: string): Promise<number> {
    const request = await this.getSignatureRequest(requestId);
    if (!request || request.status !== 'in_progress') return 0;

    const pendingSigners = request.signers.filter((s) => s.status === 'pending');
    
    for (const signer of pendingSigners) {
      await this.sendSignerNotification(request, signer);
    }

    await this.logAudit(requestId, 'reminder_sent', 'system', {
      recipientCount: pendingSigners.length,
    });

    return pendingSigners.length;
  },

  /**
   * Process expired requests
   */
  async processExpiredRequests(): Promise<number> {
    const now = new Date().toISOString();

    const { data: expiredRequests } = await supabase
      .from('signature_requests')
      .select('id')
      .in('status', ['pending', 'in_progress'])
      .lt('expires_at', now);

    if (!expiredRequests?.length) return 0;

    for (const request of expiredRequests) {
      await supabase
        .from('signature_requests')
        .update({ status: 'expired', updated_at: now })
        .eq('id', request.id);

      await this.logAudit(request.id, 'request_expired', 'system', {});
    }

    return expiredRequests.length;
  },
};

// ============================================================================
// HELPERS
// ============================================================================

function transformSignatureRequest(row: Record<string, unknown>): SignatureRequest {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    proposalId: row.proposal_id as string,
    documentHash: row.document_hash as string,
    status: row.status as SignatureStatus,
    signatureType: row.signature_type as SignatureType,
    signers: (row.signers || []) as Signer[],
    settings: (row.settings || {}) as SignatureSettings,
    expiresAt: row.expires_at as string | null,
    createdAt: row.created_at as string,
    completedAt: row.completed_at as string | null,
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export default eSignatureService;
