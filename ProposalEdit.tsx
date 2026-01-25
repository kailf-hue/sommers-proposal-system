/**
 * Sommer's Proposal System - Proposal Edit Page
 * Edit existing proposals with all fields
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, 
  ArrowLeft, 
  Loader2,
  FileText,
  User,
  Calendar,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Building,
  Ruler,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

// Types
interface Proposal {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_company: string;
  property_address: string;
  property_city: string;
  property_state: string;
  property_zip: string;
  square_footage: number;
  surface_condition: 'good' | 'fair' | 'poor';
  services: string[];
  subtotal: number;
  tax: number;
  total: number;
  notes: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected';
  valid_until: string;
  created_at: string;
}

// Service options
const serviceOptions = [
  { id: 'sealcoating', name: 'Sealcoating', rate: 0.25 },
  { id: 'crack_filling', name: 'Crack Filling', rate: 0.15 },
  { id: 'line_striping', name: 'Line Striping', rate: 0.10 },
  { id: 'pothole_repair', name: 'Pothole Repair', rate: 0.50 },
  { id: 'asphalt_overlay', name: 'Asphalt Overlay', rate: 1.50 },
];

export default function ProposalEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    client_company: '',
    property_address: '',
    property_city: '',
    property_state: '',
    property_zip: '',
    square_footage: 0,
    surface_condition: 'good' as 'good' | 'fair' | 'poor',
    services: [] as string[],
    notes: '',
    valid_until: '',
  });

  useEffect(() => {
    loadProposal();
  }, [id]);

  const loadProposal = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockProposal: Proposal = {
        id: id || '1',
        client_name: 'John Smith',
        client_email: 'john@example.com',
        client_phone: '555-123-4567',
        client_company: 'Smith Properties LLC',
        property_address: '123 Main Street',
        property_city: 'Columbus',
        property_state: 'OH',
        property_zip: '43215',
        square_footage: 5000,
        surface_condition: 'fair',
        services: ['sealcoating', 'crack_filling'],
        subtotal: 1500,
        tax: 120,
        total: 1620,
        notes: 'Customer requested work to be completed before winter.',
        status: 'draft',
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        created_at: new Date().toISOString(),
      };

      setProposal(mockProposal);
      setFormData({
        client_name: mockProposal.client_name,
        client_email: mockProposal.client_email,
        client_phone: mockProposal.client_phone,
        client_company: mockProposal.client_company,
        property_address: mockProposal.property_address,
        property_city: mockProposal.property_city,
        property_state: mockProposal.property_state,
        property_zip: mockProposal.property_zip,
        square_footage: mockProposal.square_footage,
        surface_condition: mockProposal.surface_condition,
        services: mockProposal.services,
        notes: mockProposal.notes,
        valid_until: mockProposal.valid_until,
      });
    } catch (error) {
      console.error('Error loading proposal:', error);
      toast.error('Failed to load proposal');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'square_footage' ? parseInt(value) || 0 : value,
    }));
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(s => s !== serviceId)
        : [...prev.services, serviceId],
    }));
  };

  const calculateTotal = () => {
    const conditionMultiplier = {
      good: 1.0,
      fair: 1.15,
      poor: 1.30,
    };

    let subtotal = 0;
    formData.services.forEach(serviceId => {
      const service = serviceOptions.find(s => s.id === serviceId);
      if (service) {
        subtotal += formData.square_footage * service.rate * conditionMultiplier[formData.surface_condition];
      }
    });

    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    return { subtotal, tax, total };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Mock save - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Proposal saved successfully');
      navigate(`/proposals/${id}`);
    } catch (error) {
      console.error('Error saving proposal:', error);
      toast.error('Failed to save proposal');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Proposal not found</h2>
        <button
          onClick={() => navigate('/proposals')}
          className="mt-4 text-red-600 hover:text-red-700"
        >
          Back to Proposals
        </button>
      </div>
    );
  }

  const { subtotal, tax, total } = calculateTotal();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Proposal</h1>
            <p className="text-gray-500">#{proposal.id}</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </button>
      </div>

      <div className="space-y-6">
        {/* Client Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-gray-400" />
            Client Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Name *
              </label>
              <input
                type="text"
                name="client_name"
                value={formData.client_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="client_company"
                  value={formData.client_company}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  name="client_email"
                  value={formData.client_email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  name="client_phone"
                  value={formData.client_phone}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Property Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-gray-400" />
            Property Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                name="property_address"
                value={formData.property_address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <input
                type="text"
                name="property_city"
                value={formData.property_city}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  name="property_state"
                  value={formData.property_state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  maxLength={2}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  name="property_zip"
                  value={formData.property_zip}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Square Footage *
              </label>
              <div className="relative">
                <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  name="square_footage"
                  value={formData.square_footage}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  min={0}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Surface Condition *
              </label>
              <select
                name="surface_condition"
                value={formData.surface_condition}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="good">Good (1.0x)</option>
                <option value="fair">Fair (1.15x)</option>
                <option value="poor">Poor (1.30x)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-400" />
            Services
          </h2>
          <div className="space-y-3">
            {serviceOptions.map(service => (
              <label
                key={service.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.services.includes(service.id)}
                    onChange={() => handleServiceToggle(service.id)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="font-medium text-gray-900">{service.name}</span>
                </div>
                <span className="text-gray-500">${service.rate.toFixed(2)}/sq ft</span>
              </label>
            ))}
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-gray-400" />
            Pricing Summary
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Valid Until & Notes */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            Additional Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid Until
              </label>
              <input
                type="date"
                name="valid_until"
                value={formData.valid_until}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Any additional notes or special instructions..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
