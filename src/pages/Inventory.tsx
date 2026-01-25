/**
 * Inventory Page
 * Material and product inventory management
 */

import { useState } from 'react';
import { Package, Plus, Search, AlertTriangle, TrendingDown, TrendingUp, Edit, Trash2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn, formatCurrency } from '@/lib/utils';

const materials = [
  { id: '1', name: 'Coal Tar Sealcoat', sku: 'CTS-001', category: 'Sealcoat', unit: 'gallon', currentStock: 250, minStock: 100, costPerUnit: 25, coverageRate: 80 },
  { id: '2', name: 'Hot Pour Crack Filler', sku: 'HCF-001', category: 'Crack Repair', unit: 'gallon', currentStock: 45, minStock: 50, costPerUnit: 35, coverageRate: 150 },
  { id: '3', name: 'Silica Sand', sku: 'SND-001', category: 'Additives', unit: 'lb', currentStock: 500, minStock: 200, costPerUnit: 0.50, coverageRate: 10 },
  { id: '4', name: 'Traffic Paint - White', sku: 'TPW-001', category: 'Striping', unit: 'gallon', currentStock: 30, minStock: 20, costPerUnit: 55, coverageRate: 200 },
  { id: '5', name: 'Traffic Paint - Yellow', sku: 'TPY-001', category: 'Striping', unit: 'gallon', currentStock: 15, minStock: 20, costPerUnit: 55, coverageRate: 200 },
  { id: '6', name: 'Asphalt Patch', sku: 'APT-001', category: 'Repair', unit: 'bag', currentStock: 75, minStock: 30, costPerUnit: 18, coverageRate: 5 },
];

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = ['all', ...new Set(materials.map((m) => m.category))];
  const lowStockItems = materials.filter((m) => m.currentStock <= m.minStock);
  const totalValue = materials.reduce((sum, m) => sum + m.currentStock * m.costPerUnit, 0);

  const filtered = materials.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Inventory</h1><p className="text-gray-500">Manage materials and supplies</p></div>
        <Button leftIcon={<Plus className="h-4 w-4" />}>Add Material</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><Package className="h-6 w-6 text-blue-600" /></div>
          <div><p className="text-sm text-gray-500">Total Items</p><p className="text-2xl font-bold">{materials.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><TrendingUp className="h-6 w-6 text-green-600" /></div>
          <div><p className="text-sm text-gray-500">Inventory Value</p><p className="text-2xl font-bold">{formatCurrency(totalValue)}</p></div>
        </CardContent></Card>
        <Card className={lowStockItems.length > 0 ? 'border-amber-200 dark:border-amber-800' : ''}><CardContent className="p-4 flex items-center gap-4">
          <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center', lowStockItems.length > 0 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-gray-100 dark:bg-gray-800')}>
            <AlertTriangle className={cn('h-6 w-6', lowStockItems.length > 0 ? 'text-amber-600' : 'text-gray-400')} />
          </div>
          <div><p className="text-sm text-gray-500">Low Stock Alerts</p><p className="text-2xl font-bold">{lowStockItems.length}</p></div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search materials..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
          {categories.map((c) => (<option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>))}
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead><tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Material</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">SKU</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Category</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Stock</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Unit Cost</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Value</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {item.currentStock <= item.minStock && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500 font-mono text-sm">{item.sku}</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700">{item.category}</span></td>
                  <td className="py-3 px-4 text-right">
                    <span className={cn('font-medium', item.currentStock <= item.minStock ? 'text-amber-600' : '')}>{item.currentStock}</span>
                    <span className="text-gray-400 text-sm"> / {item.minStock} {item.unit}</span>
                  </td>
                  <td className="py-3 px-4 text-right">{formatCurrency(item.costPerUnit)}</td>
                  <td className="py-3 px-4 text-right font-medium">{formatCurrency(item.currentStock * item.costPerUnit)}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><RefreshCw className="h-4 w-4 text-gray-400" /></button>
                      <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Edit className="h-4 w-4 text-gray-400" /></button>
                      <button className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
