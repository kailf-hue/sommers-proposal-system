/**
 * Gallery Page
 * Project portfolio and before/after photos
 */

import { useState } from 'react';
import { Plus, Search, Filter, Grid, List, MapPin, Calendar, Ruler, Star, Trash2, Eye, Image, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn, formatCurrency } from '@/lib/utils';

interface GalleryProject {
  id: string;
  title: string;
  client: string;
  location: string;
  completedDate: string;
  services: string[];
  squareFootage: number;
  isFeatured: boolean;
  photos: { id: string; url: string; type: 'before' | 'after' | 'progress'; caption?: string }[];
}

const mockProjects: GalleryProject[] = [
  {
    id: '1',
    title: 'Westside Shopping Center',
    client: 'ABC Properties',
    location: 'Toledo, OH',
    completedDate: '2024-01-15',
    services: ['Sealcoating', 'Line Striping', 'Crack Filling'],
    squareFootage: 45000,
    isFeatured: true,
    photos: [
      { id: '1a', url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800', type: 'before', caption: 'Before sealcoating' },
      { id: '1b', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', type: 'after', caption: 'After completion' },
    ],
  },
  {
    id: '2',
    title: 'Oak Ridge HOA Community',
    client: 'Oak Ridge HOA',
    location: 'Perrysburg, OH',
    completedDate: '2024-01-10',
    services: ['Sealcoating', 'Pothole Repair'],
    squareFootage: 28000,
    isFeatured: false,
    photos: [
      { id: '2a', url: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800', type: 'before' },
      { id: '2b', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', type: 'after' },
    ],
  },
  {
    id: '3',
    title: 'Industrial Park Complex',
    client: 'Industrial LLC',
    location: 'Maumee, OH',
    completedDate: '2023-12-20',
    services: ['Sealcoating', 'Line Striping', 'ADA Compliance'],
    squareFootage: 120000,
    isFeatured: true,
    photos: [
      { id: '3a', url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800', type: 'before' },
      { id: '3b', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', type: 'after' },
    ],
  },
];

export default function Gallery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProject, setSelectedProject] = useState<GalleryProject | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'featured'>('all');

  const filteredProjects = mockProjects.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'featured' && p.isFeatured);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Project Gallery</h1>
          <p className="text-gray-500">{mockProjects.length} completed projects</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />}>Add Project</Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setFilter('all')}
            className={cn('px-3 py-1.5 text-sm rounded-md', filter === 'all' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500')}
          >
            All
          </button>
          <button
            onClick={() => setFilter('featured')}
            className={cn('px-3 py-1.5 text-sm rounded-md', filter === 'featured' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500')}
          >
            Featured
          </button>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button onClick={() => setViewMode('grid')} className={cn('p-2 rounded-md', viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500')}>
            <Grid className="h-4 w-4" />
          </button>
          <button onClick={() => setViewMode('list')} className={cn('p-2 rounded-md', viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500')}>
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className={cn('grid gap-6', viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1')}>
        {filteredProjects.map((project) => (
          <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedProject(project)}>
            {/* Cover Image */}
            <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
              {project.photos[1] ? (
                <img src={project.photos[1].url} alt={project.title} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full"><Image className="h-12 w-12 text-gray-400" /></div>
              )}
              {project.isFeatured && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-brand-red text-white text-xs font-medium rounded-full flex items-center gap-1">
                  <Star className="h-3 w-3" /> Featured
                </div>
              )}
              <div className="absolute bottom-2 left-2 flex gap-1">
                {project.photos.length > 0 && (
                  <span className="px-2 py-1 bg-black/60 text-white text-xs rounded">{project.photos.length} photos</span>
                )}
              </div>
            </div>

            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{project.title}</h3>
              <p className="text-sm text-gray-500">{project.client}</p>

              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="h-3.5 w-3.5" />
                  {project.location}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(project.completedDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Ruler className="h-3.5 w-3.5" />
                  {project.squareFootage.toLocaleString()} sq ft
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {project.services.map((service) => (
                  <span key={service} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">
                    {service}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedProject(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selectedProject.title}</h2>
                  <p className="text-gray-500">{selectedProject.client}</p>
                </div>
                <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Before/After Comparison */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {selectedProject.photos.filter((p) => p.type === 'before').map((photo) => (
                  <div key={photo.id} className="relative">
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">Before</div>
                    <img src={photo.url} alt="Before" className="w-full h-64 object-cover rounded-lg cursor-pointer" onClick={() => setLightboxImage(photo.url)} />
                  </div>
                ))}
                {selectedProject.photos.filter((p) => p.type === 'after').map((photo) => (
                  <div key={photo.id} className="relative">
                    <div className="absolute top-2 left-2 px-2 py-1 bg-green-600 text-white text-xs rounded">After</div>
                    <img src={photo.url} alt="After" className="w-full h-64 object-cover rounded-lg cursor-pointer" onClick={() => setLightboxImage(photo.url)} />
                  </div>
                ))}
              </div>

              {/* Project Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{selectedProject.location}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="font-medium">{new Date(selectedProject.completedDate).toLocaleDateString()}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500">Square Footage</p>
                  <p className="font-medium">{selectedProject.squareFootage.toLocaleString()} sq ft</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500">Services</p>
                  <p className="font-medium">{selectedProject.services.length} services</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60]" onClick={() => setLightboxImage(null)}>
          <img src={lightboxImage} alt="Full size" className="max-w-[90vw] max-h-[90vh] object-contain" />
          <button onClick={() => setLightboxImage(null)} className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full">
            <X className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  );
}
