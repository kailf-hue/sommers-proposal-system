/**
 * Gallery Service
 * Project gallery and photo management
 */

import { supabase, uploadFile, deleteFile } from '@/lib/supabase';

export interface GalleryProject {
  id: string;
  org_id: string;
  title: string;
  description?: string;
  client_name?: string;
  location?: string;
  completed_date?: string;
  services: string[];
  square_footage?: number;
  is_featured: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface GalleryPhoto {
  id: string;
  project_id: string;
  url: string;
  thumbnail_url?: string;
  caption?: string;
  photo_type: 'before' | 'after' | 'progress' | 'detail';
  position: number;
  created_at: string;
}

export interface ProjectWithPhotos extends GalleryProject {
  photos: GalleryPhoto[];
}

// Get projects
export async function getProjects(orgId: string, publicOnly: boolean = false): Promise<ProjectWithPhotos[]> {
  let query = supabase
    .from('gallery_projects')
    .select(`*, photos:gallery_photos(*)`)
    .eq('org_id', orgId)
    .order('completed_date', { ascending: false });

  if (publicOnly) {
    query = query.eq('is_public', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Get featured projects
export async function getFeaturedProjects(orgId: string): Promise<ProjectWithPhotos[]> {
  const { data, error } = await supabase
    .from('gallery_projects')
    .select(`*, photos:gallery_photos(*)`)
    .eq('org_id', orgId)
    .eq('is_featured', true)
    .eq('is_public', true)
    .order('completed_date', { ascending: false })
    .limit(6);

  if (error) throw error;
  return data || [];
}

// Create project
export async function createProject(orgId: string, data: Partial<GalleryProject>): Promise<GalleryProject> {
  const { data: project, error } = await supabase
    .from('gallery_projects')
    .insert({
      org_id: orgId,
      title: data.title || 'New Project',
      services: data.services || [],
      is_featured: false,
      is_public: false,
      ...data,
    })
    .select()
    .single();

  if (error) throw error;
  return project;
}

// Update project
export async function updateProject(projectId: string, data: Partial<GalleryProject>): Promise<GalleryProject> {
  const { data: project, error } = await supabase
    .from('gallery_projects')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;
  return project;
}

// Delete project
export async function deleteProject(projectId: string): Promise<void> {
  // Delete photos first
  const { data: photos } = await supabase
    .from('gallery_photos')
    .select('url')
    .eq('project_id', projectId);

  if (photos) {
    for (const photo of photos) {
      await deleteFile(photo.url);
    }
  }

  const { error } = await supabase.from('gallery_projects').delete().eq('id', projectId);
  if (error) throw error;
}

// Add photo
export async function addPhoto(
  projectId: string,
  file: File,
  photoType: GalleryPhoto['photo_type'],
  caption?: string
): Promise<GalleryPhoto> {
  const url = await uploadFile('gallery', projectId, file);

  const { data: existing } = await supabase
    .from('gallery_photos')
    .select('position')
    .eq('project_id', projectId)
    .order('position', { ascending: false })
    .limit(1);

  const position = (existing?.[0]?.position || 0) + 1;

  const { data: photo, error } = await supabase
    .from('gallery_photos')
    .insert({ project_id: projectId, url, photo_type: photoType, caption, position })
    .select()
    .single();

  if (error) throw error;
  return photo;
}

// Delete photo
export async function deletePhoto(photoId: string): Promise<void> {
  const { data: photo } = await supabase
    .from('gallery_photos')
    .select('url')
    .eq('id', photoId)
    .single();

  if (photo) {
    await deleteFile(photo.url);
  }

  const { error } = await supabase.from('gallery_photos').delete().eq('id', photoId);
  if (error) throw error;
}

// Reorder photos
export async function reorderPhotos(projectId: string, photoIds: string[]): Promise<void> {
  const updates = photoIds.map((id, index) => ({
    id,
    position: index + 1,
  }));

  for (const update of updates) {
    await supabase
      .from('gallery_photos')
      .update({ position: update.position })
      .eq('id', update.id);
  }
}

export default {
  getProjects,
  getFeaturedProjects,
  createProject,
  updateProject,
  deleteProject,
  addPhoto,
  deletePhoto,
  reorderPhotos,
};
