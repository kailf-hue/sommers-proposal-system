/**
 * Templates Page
 * Proposal template management
 */

import { useState } from 'react';
import { FileText, Plus, Search, Copy, Edit, Trash2, Star, MoreVertical, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const templates = [
  { id: '1', name: 'Standard Sealcoating', description: 'Basic sealcoating proposal for residential', category: 'Residential', tier: 'standard', useCount: 145, isDefault: true },
  { id: '2', name: 'Commercial Full Service', description: 'Complete commercial maintenance package', category: 'Commercial', tier: 'premium', useCount: 89, isDefault: false },
  { id: '3', name: 'HOA Community Package', description: 'Multi-property HOA proposal', category: 'HOA', tier: 'standard', useCount: 67, isDefault: false },
  { id: '4', name: 'Quick Repair Quote', description: 'Fast quotes for crack/pothole repairs', category: 'Repairs', tier: 'economy', useCount: 234, isDefault: false },
  { id: '5', name: 'Industrial Park', description: 'Large-scale industrial projects', category: 'Commercial', tier: 'premium', useCount: 23, isDefault: false },
];

export default function Templates() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = ['all', ...new Set(templates.map((t) => t.category))];
  const filtered = templates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleDuplicate = (id: string) => toast.success('Template duplicated');
  const handleDelete = (id: string) => toast.success('Template deleted');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Templates</h1><p className="text-gray-500">Manage proposal templates</p></div>
        <Button leftIcon={<Plus className="h-4 w-4" />}>Create Template</Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search templates..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
          {categories.map((c) => (<option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((template) => (
          <Card key={template.id} className={cn('hover:shadow-md transition-shadow', template.isDefault && 'border-brand-red/30')}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-lg bg-brand-red/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-brand-red" />
                </div>
                <div className="flex items-center gap-1">
                  {template.isDefault && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                  <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><MoreVertical className="h-4 w-4 text-gray-400" /></button>
                </div>
              </div>
              <h3 className="font-semibold mt-3">{template.name}</h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{template.description}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700">{template.category}</span>
                <span className={cn('px-2 py-0.5 text-xs rounded-full capitalize', template.tier === 'economy' && 'bg-gray-100 text-gray-600', template.tier === 'standard' && 'bg-blue-100 text-blue-700', template.tier === 'premium' && 'bg-brand-red/10 text-brand-red')}>{template.tier}</span>
              </div>
              <div className="mt-3 text-sm text-gray-500">Used {template.useCount} times</div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" leftIcon={<Eye className="h-3.5 w-3.5" />}>Preview</Button>
                <Button size="sm" variant="outline" leftIcon={<Copy className="h-3.5 w-3.5" />} onClick={() => handleDuplicate(template.id)}>Duplicate</Button>
                <Button size="sm" variant="ghost"><Edit className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        <Card className="border-dashed cursor-pointer hover:border-brand-red/50">
          <CardContent className="p-5 flex flex-col items-center justify-center min-h-[250px]">
            <Plus className="h-8 w-8 text-gray-400 mb-2" />
            <p className="font-medium text-gray-500">Create New Template</p>
            <p className="text-sm text-gray-400 mt-1">Start from scratch</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
