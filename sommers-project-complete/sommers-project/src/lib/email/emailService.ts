/**
 * Email Service
 * Transactional email sending
 */

const API_URL = import.meta.env.VITE_API_URL || '';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: string }>;
}

export interface ProposalEmailData {
  to: string;
  proposalId: string;
  proposalNumber: string;
  clientName: string;
  total: number;
  viewUrl: string;
}

// Send proposal email
export async function sendProposalEmail(data: ProposalEmailData): Promise<void> {
  const response = await fetch(`${API_URL}/api/email/send-proposal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to send proposal email');
}

// Send follow-up email
export async function sendFollowupEmail(data: {
  to: string;
  clientName: string;
  proposalNumber: string;
  daysSinceSent: number;
  viewUrl: string;
}): Promise<void> {
  const response = await fetch(`${API_URL}/api/email/send-followup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to send follow-up email');
}

// Send reminder email
export async function sendReminderEmail(data: {
  to: string;
  clientName: string;
  proposalNumber: string;
  expiresIn: number;
  viewUrl: string;
}): Promise<void> {
  const response = await fetch(`${API_URL}/api/email/send-reminder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to send reminder email');
}

// Send custom email
export async function sendCustomEmail(options: EmailOptions): Promise<void> {
  const response = await fetch(`${API_URL}/api/email/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
  if (!response.ok) throw new Error('Failed to send email');
}

export default {
  sendProposalEmail,
  sendFollowupEmail,
  sendReminderEmail,
  sendCustomEmail,
};
