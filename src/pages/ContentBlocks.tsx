/**
 * Sommer's Proposal System - Content Blocks Page
 * Manage reusable content blocks and templates
 */

import { useState, useEffect } from 'react';
import {
  Blocks,
  Plus,
  Search,
  Grid3X3,
  List,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Star,
  Lock,
  Type,
  Image,
  DollarSign,
  FileSignature,
  Sparkles,
  Columns,
  Video,
  Calculator,
  CreditCard,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Badge,
  Skeleton,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface Block {
  id: string;
  code: string;
  name: string;
  description: string;
  category: 'content' | 'media' | 'pricing' | 'legal' | 'interactive';
  icon: string;
  minPlan: string;
  usageCount: number;
  isSystem: boolean;
  isFavorite: boolean;
}

interface BlockTemplate {
  id: string;
  name: string;
  blockCode: string;
  description: string;
  createdAt: string;
  usageCount: number;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockBlocks: Block[] = [
  { id: '1', code: 'text', name: 'Text', description: 'Rich text content', category: 'content', icon: 'Type', minPlan: 'free', usageCount: 156, isSystem: true, isFavorite: true },
  { id: '2', code: 'heading', name: 'Heading', description: 'Section heading', category: 'content', icon: 'Heading', minPlan: 'free', usageCount: 142, isSystem: true, isFavorite: true },
  { id: '3', code: 'image', name: 'Image', description: 'Single image with caption', category: 'media', icon: 'Image', minPlan: 'free', usageCount: 89, isSystem: true, isFavorite: false },
  { id: '4', code: 'image_gallery', name: 'Image Gallery', description: 'Multiple images in grid', category: 'media', icon: 'Grid', minPlan: 'pro', usageCount: 34, isSystem: true, isFavorite: false },
  { id: '5', code: 'video', name: 'Video', description: 'Embedded video', category: 'media', icon: 'Video', minPlan: 'pro', usageCount: 23, isSystem: true, isFavorite: false },
  { id: '6', code: 'pricing_table', name: 'Pricing Table', description: 'Service pricing breakdown', category: 'pricing', icon: 'DollarSign', minPlan: 'free', usageCount: 178, isSystem: true, isFavorite: true },
  { id: '7', code: 'pricing_options', name: 'Pricing Options', description: 'Tiered pricing selection', category: 'pricing', icon: 'Layers', minPlan: 'pro', usageCount: 67, isSystem: true, isFavorite: false },
  { id: '8', code: 'signature', name: 'Signature', description: 'E-signature capture', category: 'legal', icon: 'FileSignature', minPlan: 'free', usageCount: 145, isSystem: true, isFavorite: true },
  { id: '9', code: 'terms', name: 'Terms & Conditions', description: 'Legal terms acceptance', category: 'legal', icon: 'FileText', minPlan: 'free', usageCount: 134, isSystem: true, isFavorite: false },
  { id: '10', code: 'before_after', name: 'Before/After', description: 'Image comparison slider', category: 'interactive', icon: 'Columns', minPlan: 'pro', usageCount: 28, isSystem: true, isFavorite: false },
  { id: '11', code: 'calculator', name: 'Calculator', description: 'Interactive calculator', category: 'interactive', icon: 'Calculator', minPlan: 'business', usageCount: 12, isSystem: true, isFavorite: false },
  { id: '12', code: 'payment', name: 'Payment', description: 'Payment button/form', category: 'interactive', icon: 'CreditCard', minPlan: 'pro', usageCount: 45, isSystem: true, isFavorite: true },
];

const mockTemplates: BlockTemplate[] = [
  { id: '1', name: 'Standard Introduction', blockCode: 'text', description: 'Professional intro paragraph', createdAt: '2026-01-15', usageCount: 45 },
  { id: '2', name: 'Service Guarantee', blockCode: 'text', description: 'Our quality guarantee statement', createdAt: '2026-01-10', usageCount: 38 },
  { id: '3', name: 'Payment Terms', blockCode: 'terms', description: 'Standard payment terms and conditions', createdAt: '2026-01-08', usageCount: 56 },
  { id: '4', name: 'Project Gallery', blockCode: 'image_gallery', description: 'Before/after project showcase', createdAt: '2026-01-05', usageCount: 23 },
];

const categoryIcons: Record<string, React.ElementType> = {
  content: Type,
  media: Image,
  pricing: DollarSign,
  legal: FileSignature,
  interactive: Sparkles,
};

const blockIcons: Record<string, React.ElementType> = {
  Type: Type,
  Heading: Type,
  Image: Image,
  Grid: Grid3X3,
  Video: Video,
  DollarSign: DollarSign,
  Layers: Blocks,
  FileSignature: FileSignature,
  FileText: FileSignature,
  Columns: Columns,
  Calculator: Calculator,
  CreditCard: CreditCard,
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function ContentBlocks() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [templates, setTemplates] = useState<BlockTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBlocks(mockBlocks);
      setTemplates(mockTemplates);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredBlocks = blocks.filter((block) => {
    const matchesSearch = block.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || block.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'content', name: 'Content', count: blocks.filter((b) => b.category === 'content').length },
    { id: 'media', name: 'Media', count: blocks.filter((b) => b.category === 'media').length },
    { id: 'pricing', name: 'Pricing', count: blocks.filter((b) => b.category === 'pricing').length },
    { id: 'legal', name: 'Legal', count: blocks.filter((b) => b.category === 'legal').length },
    { id: 'interactive', name: 'Interactive', count: blocks.filter((b) => b.category === 'interactive').length },
  ];

  const toggleFavorite = (blockId: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId ? { ...b, isFavorite: !b.isFavorite } : b
      )
    );
  };

  if (isLoading) {
    return <ContentBlocksSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Blocks className="w-7 h-7 text-brand-red" />
            Content Blocks
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Drag-and-drop building blocks for your proposals
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Create Template
        </Button>
      </div>

      <Tabs defaultValue="blocks">
        <TabsList>
          <TabsTrigger value="blocks">Block Library</TabsTrigger>
          <TabsTrigger value="templates">Saved Templates</TabsTrigger>
        </TabsList>

        {/* Blocks Tab */}
        <TabsContent value="blocks" className="mt-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search blocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {categories.map((cat) => {
                const Icon = categoryIcons[cat.id];
                return (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                    className="gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {cat.name}
                    <Badge variant="secondary" className="ml-1">
                      {cat.count}
                    </Badge>
                  </Button>
                );
              })}
            </div>
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2',
                  viewMode === 'grid'
                    ? 'bg-gray-100 dark:bg-gray-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2',
                  viewMode === 'list'
                    ? 'bg-gray-100 dark:bg-gray-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Favorites */}
          {blocks.some((b) => b.isFavorite) && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                Favorites
              </h3>
              <div className="flex flex-wrap gap-2">
                {blocks.filter((b) => b.isFavorite).map((block) => {
                  const Icon = blockIcons[block.icon] || Blocks;
                  return (
                    <button
                      key={block.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-brand-red transition-colors"
                    >
                      <Icon className="w-4 h-4 text-brand-red" />
                      <span className="text-sm font-medium">{block.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Blocks Grid/List */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredBlocks.map((block) => (
                <BlockCard
                  key={block.id}
                  block={block}
                  onToggleFavorite={() => toggleFavorite(block.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredBlocks.map((block) => (
                <BlockListItem
                  key={block.id}
                  block={block}
                  onToggleFavorite={() => toggleFavorite(block.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Block Template</DialogTitle>
            <DialogDescription>
              Save a configured block as a reusable template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Template Name</label>
              <Input placeholder="e.g., Standard Introduction" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Block Type</label>
              <select className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-700 p-2">
                {blocks.map((block) => (
                  <option key={block.id} value={block.code}>{block.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input placeholder="Brief description" className="mt-1" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowCreateDialog(false)}>
              Create Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function BlockCard({ block, onToggleFavorite }: { block: Block; onToggleFavorite: () => void }) {
  const Icon = blockIcons[block.icon] || Blocks;
  const isPremium = block.minPlan !== 'free';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <div className={cn(
            'p-2 rounded-lg',
            block.category === 'content' && 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
            block.category === 'media' && 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
            block.category === 'pricing' && 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
            block.category === 'legal' && 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
            block.category === 'interactive' && 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'
          )}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-1">
            {isPremium && (
              <Badge variant="secondary" className="text-xs">
                <Lock className="w-3 h-3 mr-1" />
                {block.minPlan}
              </Badge>
            )}
            <button onClick={onToggleFavorite} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              <Star className={cn('w-4 h-4', block.isFavorite ? 'fill-amber-500 text-amber-500' : 'text-gray-400')} />
            </button>
          </div>
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white">{block.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{block.description}</p>
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>{block.usageCount} uses</span>
          <Badge variant="outline" className="capitalize">{block.category}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function BlockListItem({ block, onToggleFavorite }: { block: Block; onToggleFavorite: () => void }) {
  const Icon = blockIcons[block.icon] || Blocks;
  const isPremium = block.minPlan !== 'free';

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      <div className={cn(
        'p-2 rounded-lg',
        block.category === 'content' && 'bg-blue-100 text-blue-600',
        block.category === 'media' && 'bg-purple-100 text-purple-600',
        block.category === 'pricing' && 'bg-green-100 text-green-600',
        block.category === 'legal' && 'bg-amber-100 text-amber-600',
        block.category === 'interactive' && 'bg-pink-100 text-pink-600'
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900 dark:text-white">{block.name}</h3>
          {isPremium && (
            <Badge variant="secondary" className="text-xs">
              <Lock className="w-3 h-3 mr-1" />
              {block.minPlan}
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-500">{block.description}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">{block.usageCount} uses</span>
        <button onClick={onToggleFavorite} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
          <Star className={cn('w-4 h-4', block.isFavorite ? 'fill-amber-500 text-amber-500' : 'text-gray-400')} />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function TemplateCard({ template }: { template: BlockTemplate }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <Badge variant="outline" className="capitalize">{template.blockCode}</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{template.description}</p>
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>{template.usageCount} uses</span>
          <span>{new Date(template.createdAt).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ContentBlocksSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    </div>
  );
}
