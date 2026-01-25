/**
 * Contact Step - Wizard Step 2
 * Client contact information
 */

import { User, Mail, Phone, Building } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useProposalStore } from '@/stores/proposalStore';
import { isValidEmail, isValidPhone } from '@/lib/utils';

export default function ContactStep() {
  const { formData, setFormField } = useProposalStore();

  const emailError = formData.contactEmail && !isValidEmail(formData.contactEmail);
  const phoneError = formData.contactPhone && !isValidPhone(formData.contactPhone);

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
          <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Contact Information
          </h2>
          <p className="text-sm text-gray-500">
            Enter the client's contact details
          </p>
        </div>
      </div>

      {/* Contact Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Contact Name <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="John Smith"
            value={formData.contactName}
            onChange={(e) => setFormField('contactName', e.target.value)}
            leftIcon={<User className="h-4 w-4" />}
          />
        </div>

        {/* Company */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Company Name
          </label>
          <Input
            placeholder="ABC Corporation"
            value={formData.contactCompany}
            onChange={(e) => setFormField('contactCompany', e.target.value)}
            leftIcon={<Building className="h-4 w-4" />}
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email Address <span className="text-red-500">*</span>
          </label>
          <Input
            type="email"
            placeholder="john@example.com"
            value={formData.contactEmail}
            onChange={(e) => setFormField('contactEmail', e.target.value)}
            leftIcon={<Mail className="h-4 w-4" />}
            error={emailError}
            errorMessage="Please enter a valid email address"
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Phone Number
          </label>
          <Input
            type="tel"
            placeholder="(555) 123-4567"
            value={formData.contactPhone}
            onChange={(e) => setFormField('contactPhone', e.target.value)}
            leftIcon={<Phone className="h-4 w-4" />}
            error={phoneError}
            errorMessage="Please enter a valid phone number"
          />
        </div>
      </div>

      {/* Existing Client Search */}
      <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          💡 <strong>Tip:</strong> Start typing to search existing clients, or enter new contact details above.
        </p>
      </div>

      {/* Validation Message */}
      {(!formData.contactName || !formData.contactEmail || emailError) && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          ⚠️ Please fill in all required fields with valid information to continue
        </p>
      )}
    </div>
  );
}
