/**
 * Signature Page
 * Public page for clients to sign proposals
 */

import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SignaturePad from 'signature_pad';
import { Check, Trash2, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

// Consent items for signature
const consentItems = [
  {
    id: 'terms',
    label: 'I have read and agree to the terms and conditions',
    required: true,
  },
  {
    id: 'deposit',
    label: 'I authorize the deposit payment as specified',
    required: true,
  },
  {
    id: 'scope',
    label: 'I approve the scope of work as described',
    required: true,
  },
  {
    id: 'communication',
    label: 'I agree to receive project updates via email and SMS',
    required: false,
  },
];

export default function SignaturePage() {
  const { proposalId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signaturePad, setSignaturePad] = useState<SignaturePad | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize signature pad
  useState(() => {
    if (canvasRef.current) {
      const pad = new SignaturePad(canvasRef.current, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
      });
      setSignaturePad(pad);
    }
  });

  // Clear signature
  const handleClear = () => {
    signaturePad?.clear();
  };

  // Toggle consent
  const toggleConsent = (id: string) => {
    setConsents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Check if can submit
  const canSubmit = () => {
    if (!signerName.trim()) return false;
    if (!signerEmail.trim()) return false;
    if (!signaturePad || signaturePad.isEmpty()) return false;
    
    // Check required consents
    const requiredConsents = consentItems.filter((c) => c.required);
    return requiredConsents.every((c) => consents[c.id]);
  };

  // Submit signature
  const handleSubmit = async () => {
    if (!canSubmit()) return;

    setIsSubmitting(true);
    try {
      const signatureData = signaturePad!.toDataURL();

      // TODO: Submit to API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success('Proposal signed successfully!');
      navigate(`/p/${proposalId}/pay`);
    } catch (error) {
      toast.error('Failed to submit signature');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Back Link */}
        <button
          onClick={() => navigate(`/p/${proposalId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Proposal
        </button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-brand-red flex items-center justify-center">
                <Check className="h-5 w-5 text-white" />
              </div>
              Sign Proposal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Signer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="John Smith"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <Input
                  placeholder="Property Manager"
                  value={signerTitle}
                  onChange={(e) => setSignerTitle(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Consent Checkboxes */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Acknowledgements
              </label>
              {consentItems.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={consents[item.id] || false}
                    onChange={() => toggleConsent(item.id)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {item.label}
                    {item.required && <span className="text-red-500 ml-1">*</span>}
                  </span>
                </label>
              ))}
            </div>

            {/* Signature Pad */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Signature <span className="text-red-500">*</span>
                </label>
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </button>
              </div>
              <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  className="w-full touch-none"
                />
              </div>
              <p className="text-xs text-gray-500">
                Sign above using your mouse or finger
              </p>
            </div>

            {/* Legal Notice */}
            <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                By signing this document electronically, you acknowledge that your electronic
                signature is the legal equivalent of your manual signature on this document.
                You agree to be bound by the terms and conditions of this proposal upon signing.
              </p>
            </div>

            {/* Submit Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={!canSubmit()}
              isLoading={isSubmitting}
              leftIcon={<Check className="h-5 w-5" />}
            >
              Sign & Accept Proposal
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
