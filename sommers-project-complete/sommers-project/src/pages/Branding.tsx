/**
 * Sommer's Proposal System - Branding Page
 * Customize brand colors, logos, and proposal appearance
 */

import { useState, useEffect, useRef } from 'react';
import {
  Palette,
  Image,
  Type,
  Eye,
  Save,
  Upload,
  Trash2,
  RefreshCw,
  Check,
  Sun,
  Moon,
  Layout,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Label,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Skeleton,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================================
// TYPES
// ============================================================================

interface BrandSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  companyName: string;
  tagline: string;
  fontFamily: string;
  headerStyle: 'minimal' | 'standard' | 'bold';
  proposalTheme: 'light' | 'dark' | 'auto';
  showPoweredBy: boolean;
}

const defaultSettings: BrandSettings = {
  primaryColor: '#C41E3A',
  secondaryColor: '#1F2937',
  accentColor: '#3B82F6',
  logoUrl: null,
  faviconUrl: null,
  companyName: "Sommer's Sealcoating",
  tagline: 'Professional Asphalt Maintenance',
  fontFamily: 'Inter',
  headerStyle: 'standard',
  proposalTheme: 'light',
  showPoweredBy: true,
};

const fontOptions = [
  { value: 'Inter', label: 'Inter (Modern)' },
  { value: 'Roboto', label: 'Roboto (Clean)' },
  { value: 'Open Sans', label: 'Open Sans (Friendly)' },
  { value: 'Lato', label: 'Lato (Professional)' },
  { value: 'Poppins', label: 'Poppins (Bold)' },
  { value: 'Playfair Display', label: 'Playfair Display (Elegant)' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function Branding() {
  const { organization } = useAuth();
  const [settings, setSettings] = useState<BrandSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load settings
    const timer = setTimeout(() => {
      // In production, load from API
      setSettings(defaultSettings);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = <K extends keyof BrandSettings>(
    key: K,
    value: BrandSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setHasChanges(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('logoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('faviconUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return <BrandingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Palette className="w-7 h-7 text-brand-red" />
            Branding
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Customize how your proposals look to clients
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-sm text-amber-600 dark:text-amber-400">
              Unsaved changes
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            leftIcon={isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="colors">
            <TabsList>
              <TabsTrigger value="colors" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Colors
              </TabsTrigger>
              <TabsTrigger value="logo" className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Logo & Images
              </TabsTrigger>
              <TabsTrigger value="typography" className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                Typography
              </TabsTrigger>
              <TabsTrigger value="layout" className="flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Layout
              </TabsTrigger>
            </TabsList>

            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Brand Colors</CardTitle>
                  <CardDescription>
                    Choose colors that represent your brand
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ColorPicker
                    label="Primary Color"
                    description="Main brand color used for buttons and highlights"
                    value={settings.primaryColor}
                    onChange={(v) => handleChange('primaryColor', v)}
                  />
                  <ColorPicker
                    label="Secondary Color"
                    description="Used for text and backgrounds"
                    value={settings.secondaryColor}
                    onChange={(v) => handleChange('secondaryColor', v)}
                  />
                  <ColorPicker
                    label="Accent Color"
                    description="Used for links and secondary actions"
                    value={settings.accentColor}
                    onChange={(v) => handleChange('accentColor', v)}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Color Presets</CardTitle>
                  <CardDescription>Quick start with a preset color scheme</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { name: 'Industrial Red', primary: '#C41E3A', secondary: '#1F2937', accent: '#3B82F6' },
                      { name: 'Ocean Blue', primary: '#0EA5E9', secondary: '#0F172A', accent: '#22D3EE' },
                      { name: 'Forest Green', primary: '#22C55E', secondary: '#1E3A2F', accent: '#A3E635' },
                      { name: 'Royal Purple', primary: '#8B5CF6', secondary: '#1E1B4B', accent: '#E879F9' },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          handleChange('primaryColor', preset.primary);
                          handleChange('secondaryColor', preset.secondary);
                          handleChange('accentColor', preset.accent);
                        }}
                        className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                      >
                        <div className="flex gap-1 mb-2">
                          <div className="w-6 h-6 rounded" style={{ backgroundColor: preset.primary }} />
                          <div className="w-6 h-6 rounded" style={{ backgroundColor: preset.secondary }} />
                          <div className="w-6 h-6 rounded" style={{ backgroundColor: preset.accent }} />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Logo Tab */}
            <TabsContent value="logo" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Logo</CardTitle>
                  <CardDescription>Upload your logo for proposals and documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-6">
                    <div className="w-40 h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                      {settings.logoUrl ? (
                        <img src={settings.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <Image className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                    <div className="space-y-3">
                      <input
                        type="file"
                        ref={logoInputRef}
                        onChange={handleLogoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => logoInputRef.current?.click()}
                        leftIcon={<Upload className="w-4 h-4" />}
                      >
                        Upload Logo
                      </Button>
                      {settings.logoUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleChange('logoUrl', null)}
                          leftIcon={<Trash2 className="w-4 h-4" />}
                          className="text-red-600"
                        >
                          Remove
                        </Button>
                      )}
                      <p className="text-xs text-gray-500">
                        Recommended: PNG or SVG, at least 400x400px
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Favicon</CardTitle>
                  <CardDescription>Browser tab icon for your proposal links</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                      {settings.faviconUrl ? (
                        <img src={settings.faviconUrl} alt="Favicon" className="w-8 h-8 object-contain" />
                      ) : (
                        <Image className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="space-y-3">
                      <input
                        type="file"
                        ref={faviconInputRef}
                        onChange={handleFaviconUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => faviconInputRef.current?.click()}
                        leftIcon={<Upload className="w-4 h-4" />}
                      >
                        Upload Favicon
                      </Button>
                      <p className="text-xs text-gray-500">
                        Recommended: 32x32px PNG
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Typography Tab */}
            <TabsContent value="typography" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Info</CardTitle>
                  <CardDescription>Text that appears on your proposals</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={settings.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input
                      id="tagline"
                      value={settings.tagline}
                      onChange={(e) => handleChange('tagline', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Font Family</CardTitle>
                  <CardDescription>Choose a font for your proposals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {fontOptions.map((font) => (
                      <button
                        key={font.value}
                        onClick={() => handleChange('fontFamily', font.value)}
                        className={cn(
                          'p-4 rounded-lg border text-left transition-colors',
                          settings.fontFamily === font.value
                            ? 'border-brand-red bg-brand-red/5'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        )}
                      >
                        <span
                          className="text-lg font-medium text-gray-900 dark:text-white"
                          style={{ fontFamily: font.value }}
                        >
                          {font.label}
                        </span>
                        <p
                          className="text-sm text-gray-500 mt-1"
                          style={{ fontFamily: font.value }}
                        >
                          The quick brown fox jumps over the lazy dog
                        </p>
                        {settings.fontFamily === font.value && (
                          <Check className="w-4 h-4 text-brand-red mt-2" />
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Layout Tab */}
            <TabsContent value="layout" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Proposal Theme</CardTitle>
                  <CardDescription>Default appearance for proposal viewer</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {[
                      { value: 'light', label: 'Light', icon: Sun },
                      { value: 'dark', label: 'Dark', icon: Moon },
                      { value: 'auto', label: 'Auto', icon: Eye },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => handleChange('proposalTheme', value as BrandSettings['proposalTheme'])}
                        className={cn(
                          'flex-1 p-4 rounded-lg border text-center transition-colors',
                          settings.proposalTheme === value
                            ? 'border-brand-red bg-brand-red/5'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        )}
                      >
                        <Icon className="w-6 h-6 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Header Style</CardTitle>
                  <CardDescription>How your header appears on proposals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: 'minimal', label: 'Minimal' },
                      { value: 'standard', label: 'Standard' },
                      { value: 'bold', label: 'Bold' },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => handleChange('headerStyle', value as BrandSettings['headerStyle'])}
                        className={cn(
                          'p-4 rounded-lg border transition-colors',
                          settings.headerStyle === value
                            ? 'border-brand-red bg-brand-red/5'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        )}
                      >
                        <div className={cn(
                          'h-12 mb-2 rounded',
                          value === 'minimal' && 'bg-gray-100 dark:bg-gray-800',
                          value === 'standard' && 'bg-gray-200 dark:bg-gray-700',
                          value === 'bold' && 'bg-gray-300 dark:bg-gray-600'
                        )} />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Live Preview
          </h2>
          <Card className="overflow-hidden">
            <div
              className="p-6"
              style={{
                backgroundColor: settings.proposalTheme === 'dark' ? '#1F2937' : '#FFFFFF',
                fontFamily: settings.fontFamily,
              }}
            >
              {/* Mini Header Preview */}
              <div
                className={cn(
                  'rounded-lg p-4 mb-4',
                  settings.headerStyle === 'minimal' && 'border',
                  settings.headerStyle === 'standard' && '',
                  settings.headerStyle === 'bold' && ''
                )}
                style={{
                  backgroundColor: settings.headerStyle === 'bold' ? settings.primaryColor : 'transparent',
                  borderColor: settings.headerStyle === 'minimal' ? settings.secondaryColor + '20' : undefined,
                }}
              >
                <div className="flex items-center gap-3">
                  {settings.logoUrl ? (
                    <img src={settings.logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: settings.primaryColor }}
                    >
                      S
                    </div>
                  )}
                  <div>
                    <h3
                      className="font-bold"
                      style={{
                        color: settings.headerStyle === 'bold' ? '#FFFFFF' : settings.secondaryColor,
                      }}
                    >
                      {settings.companyName}
                    </h3>
                    <p
                      className="text-xs"
                      style={{
                        color: settings.headerStyle === 'bold' ? '#FFFFFF80' : settings.secondaryColor + '80',
                      }}
                    >
                      {settings.tagline}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mini Content Preview */}
              <div className="space-y-3">
                <div
                  className="h-2 rounded"
                  style={{ backgroundColor: settings.secondaryColor + '20', width: '80%' }}
                />
                <div
                  className="h-2 rounded"
                  style={{ backgroundColor: settings.secondaryColor + '20', width: '60%' }}
                />
                <div
                  className="h-2 rounded"
                  style={{ backgroundColor: settings.secondaryColor + '20', width: '70%' }}
                />
              </div>

              {/* Mini Button Preview */}
              <div className="mt-4 flex gap-2">
                <button
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  Accept Proposal
                </button>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{
                    color: settings.accentColor,
                    backgroundColor: settings.accentColor + '10',
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ColorPicker({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <Label>{label}</Label>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer"
          style={{ backgroundColor: value }}
        />
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 p-0 border-0 cursor-pointer"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 font-mono text-sm"
        />
      </div>
    </div>
  );
}

function BrandingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <Skeleton className="h-96" />
        </div>
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}
