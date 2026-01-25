/**
 * Sommer's Proposal System - New Proposal Page
 * Multi-step wizard for creating proposals
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Save, Send, Building2, User, Ruler, DollarSign, FileText, Pen } from 'lucide-react';
import { Card, CardContent, Button, Badge, Progress } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useProposalStore } from '@/stores/proposalStore';

// Wizard Steps
import PropertyStep from '@/components/proposal/wizard-steps/PropertyStep';
import ContactStep from '@/components/proposal/wizard-steps/ContactStep';
import MeasurementsStep from '@/components/proposal/wizard-steps/MeasurementsStep';
import ServicesStep from '@/components/proposal/wizard-steps/ServicesStep';
import ReviewStep from '@/components/proposal/wizard-steps/ReviewStep';
import SignatureStep from '@/components/proposal/wizard-steps/SignatureStep';

const STEPS = [
  { id: 'property', title: 'Property', icon: Building2, description: 'Property details' },
  { id: 'contact', title: 'Contact', icon: User, description: 'Client information' },
  { id: 'measurements', title: 'Measurements', icon: Ruler, description: 'Surface measurements' },
  { id: 'services', title: 'Services', icon: DollarSign, description: 'Select services & pricing' },
  { id: 'review', title: 'Review', icon: FileText, description: 'Review proposal' },
  { id: 'signature', title: 'Signature', icon: Pen, description: 'E-signature' },
];

export default function NewProposal() {
  const navigate = useNavigate();
  const { currentStep, setStep, nextStep, prevStep, formData, pricing, resetForm } = useProposalStore();
  
  const canProceed = () => {
    switch (currentStep) {
      case 0: return formData.propertyName && formData.address && formData.city && formData.state && formData.zip;
      case 1: return formData.contactName && formData.contactEmail;
      case 2: return formData.measurements.netSqft > 0;
      case 3: return formData.selectedServices.length > 0;
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <PropertyStep />;
      case 1: return <ContactStep />;
      case 2: return <MeasurementsStep />;
      case 3: return <ServicesStep />;
      case 4: return <ReviewStep />;
      case 5: return <SignatureStep />;
      default: return null;
    }
  };

  const handleSaveDraft = () => {
    console.log('Saving draft...');
  };

  const handleSubmit = () => {
    console.log('Submitting proposal...', formData, pricing);
    navigate('/proposals');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Proposal</h1>
          <p className="text-gray-500 dark:text-gray-400">{formData.proposalNumber}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSaveDraft} leftIcon={<Save className="h-4 w-4" />}>
            Save Draft
          </Button>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => {
              const isActive = currentStep === index;
              const isCompleted = currentStep > index;
              const Icon = step.icon;
              return (
                <button
                  key={step.id}
                  onClick={() => setStep(index)}
                  className={cn(
                    'flex flex-col items-center gap-2 flex-1 transition-all',
                    isActive || isCompleted ? 'opacity-100' : 'opacity-50'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                    isCompleted ? 'bg-green-500 text-white' :
                    isActive ? 'bg-brand-red text-white' :
                    'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  )}>
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={cn(
                    'text-xs font-medium hidden sm:block',
                    isActive ? 'text-brand-red' : 'text-gray-500 dark:text-gray-400'
                  )}>
                    {step.title}
                  </span>
                </button>
              );
            })}
          </div>
          <Progress value={((currentStep + 1) / STEPS.length) * 100} />
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent className="py-6">
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Previous
        </Button>
        
        <div className="flex gap-3">
          {currentStep === STEPS.length - 1 ? (
            <Button onClick={handleSubmit} leftIcon={<Send className="h-4 w-4" />}>
              Send Proposal
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
