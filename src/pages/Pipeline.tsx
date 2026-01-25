/**
 * Pipeline Page
 * Kanban-style deal pipeline
 */

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, DollarSign, User, Calendar, MoreHorizontal, Search, Filter, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';

interface Deal {
  id: string;
  name: string;
  value: number;
  contact: string;
  company?: string;
  probability: number;
  expectedClose?: string;
  createdAt: string;
}

interface Stage {
  id: string;
  name: string;
  color: string;
  deals: Deal[];
}

const initialStages: Stage[] = [
  {
    id: 'lead',
    name: 'Lead',
    color: '#6B7280',
    deals: [
      { id: '1', name: 'Parking Lot Reseal', value: 15000, contact: 'John Smith', company: 'ABC Corp', probability: 10, expectedClose: '2024-02-15', createdAt: '2024-01-10' },
      { id: '2', name: 'Driveway Project', value: 3500, contact: 'Mary Johnson', probability: 10, expectedClose: '2024-02-20', createdAt: '2024-01-12' },
    ],
  },
  {
    id: 'qualified',
    name: 'Qualified',
    color: '#3B82F6',
    deals: [
      { id: '3', name: 'Shopping Center Maintenance', value: 45000, contact: 'Bob Wilson', company: 'Retail Holdings', probability: 25, expectedClose: '2024-03-01', createdAt: '2024-01-05' },
    ],
  },
  {
    id: 'proposal',
    name: 'Proposal Sent',
    color: '#8B5CF6',
    deals: [
      { id: '4', name: 'Industrial Park Sealcoating', value: 78000, contact: 'Sarah Davis', company: 'Industrial LLC', probability: 50, expectedClose: '2024-02-28', createdAt: '2023-12-20' },
      { id: '5', name: 'HOA Community Project', value: 32000, contact: 'Mike Brown', company: 'Sunset HOA', probability: 50, expectedClose: '2024-03-10', createdAt: '2024-01-08' },
    ],
  },
  {
    id: 'negotiation',
    name: 'Negotiation',
    color: '#F59E0B',
    deals: [
      { id: '6', name: 'School District Contract', value: 125000, contact: 'Linda Green', company: 'Springfield Schools', probability: 75, expectedClose: '2024-02-01', createdAt: '2023-11-15' },
    ],
  },
  {
    id: 'won',
    name: 'Won',
    color: '#22C55E',
    deals: [
      { id: '7', name: 'Church Parking Lot', value: 18500, contact: 'Pastor James', company: 'First Baptist', probability: 100, expectedClose: '2024-01-15', createdAt: '2023-12-01' },
    ],
  },
];

export default function Pipeline() {
  const [stages, setStages] = useState<Stage[]>(initialStages);
  const [searchQuery, setSearchQuery] = useState('');

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceStageIndex = stages.findIndex(s => s.id === result.source.droppableId);
    const destStageIndex = stages.findIndex(s => s.id === result.destination!.droppableId);

    const newStages = [...stages];
    const [movedDeal] = newStages[sourceStageIndex].deals.splice(result.source.index, 1);
    newStages[destStageIndex].deals.splice(result.destination.index, 0, movedDeal);

    setStages(newStages);
  };

  const totalValue = stages.reduce((sum, stage) => sum + stage.deals.reduce((s, d) => s + d.value, 0), 0);
  const weightedValue = stages.reduce((sum, stage) => sum + stage.deals.reduce((s, d) => s + d.value * (d.probability / 100), 0), 0);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pipeline</h1>
          <p className="text-gray-500">Manage your sales opportunities</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-gray-500">Total Pipeline</p>
            <p className="text-xl font-bold text-brand-red">{formatCurrency(totalValue)}</p>
          </div>
          <div className="text-right border-l pl-3">
            <p className="text-sm text-gray-500">Weighted</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(weightedValue)}</p>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />}>Add Deal</Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search deals..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>Filter</Button>
      </div>

      {/* Pipeline Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 h-full pb-4" style={{ minWidth: stages.length * 300 }}>
            {stages.map((stage) => (
              <div key={stage.id} className="flex-shrink-0 w-72">
                {/* Stage Header */}
                <div className="flex items-center justify-between mb-3 px-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.color }} />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{stage.name}</h3>
                    <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                      {stage.deals.length}
                    </span>
                  </div>
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                  </button>
                </div>

                {/* Stage Value */}
                <div className="px-2 mb-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(stage.deals.reduce((sum, d) => sum + d.value, 0))}
                  </p>
                </div>

                {/* Deals List */}
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2 min-h-[200px] p-2 rounded-lg transition-colors ${
                        snapshot.isDraggingOver ? 'bg-gray-100 dark:bg-gray-800' : ''
                      }`}
                    >
                      {stage.deals.map((deal, index) => (
                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 cursor-move transition-shadow ${
                                snapshot.isDragging ? 'shadow-lg' : 'shadow-sm hover:shadow-md'
                              }`}
                            >
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{deal.name}</h4>
                              <p className="text-lg font-bold text-brand-red mb-2">{formatCurrency(deal.value)}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                <User className="h-3 w-3" />
                                <span>{deal.contact}</span>
                                {deal.company && <span className="text-gray-400">• {deal.company}</span>}
                              </div>
                              {deal.expectedClose && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Calendar className="h-3 w-3" />
                                  <span>Close: {new Date(deal.expectedClose).toLocaleDateString()}</span>
                                </div>
                              )}
                              <div className="mt-2 flex items-center justify-between">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  deal.probability >= 75 ? 'bg-green-100 text-green-700' :
                                  deal.probability >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {deal.probability}% probability
                                </span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {/* Add Deal Button */}
                <button className="w-full mt-2 p-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center justify-center gap-1">
                  <Plus className="h-4 w-4" /> Add deal
                </button>
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}
