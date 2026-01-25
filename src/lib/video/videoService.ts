/**
 * Video Service
 * Video proposal recording and management
 */

import { supabase, uploadFile } from '@/lib/supabase';

export interface VideoProposal {
  id: string;
  org_id: string;
  proposal_id: string;
  title?: string;
  video_url: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  view_count: number;
  created_by: string;
  created_at: string;
}

// Get video proposals
export async function getVideoProposals(orgId: string): Promise<VideoProposal[]> {
  const { data, error } = await supabase
    .from('video_proposals')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get video for proposal
export async function getProposalVideo(proposalId: string): Promise<VideoProposal | null> {
  const { data, error } = await supabase
    .from('video_proposals')
    .select('*')
    .eq('proposal_id', proposalId)
    .single();

  if (error) return null;
  return data;
}

// Upload video
export async function uploadVideo(
  orgId: string,
  proposalId: string,
  userId: string,
  videoFile: File,
  thumbnailFile?: File
): Promise<VideoProposal> {
  const videoUrl = await uploadFile('proposal-videos', proposalId, videoFile);
  let thumbnailUrl: string | undefined;

  if (thumbnailFile) {
    thumbnailUrl = await uploadFile('proposal-videos', `${proposalId}-thumb`, thumbnailFile);
  }

  const { data, error } = await supabase
    .from('video_proposals')
    .insert({
      org_id: orgId,
      proposal_id: proposalId,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl,
      view_count: 0,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Record video view
export async function recordVideoView(videoId: string): Promise<void> {
  await supabase.rpc('increment_video_views', { video_id: videoId });
}

// Delete video
export async function deleteVideo(videoId: string): Promise<void> {
  const { error } = await supabase.from('video_proposals').delete().eq('id', videoId);
  if (error) throw error;
}

// Get recording token (for video recording service)
export async function getRecordingToken(proposalId: string): Promise<string> {
  // This would integrate with a video recording service like Daily.co or Loom
  return `recording_token_${proposalId}_${Date.now()}`;
}

export default {
  getVideoProposals,
  getProposalVideo,
  uploadVideo,
  recordVideoView,
  deleteVideo,
  getRecordingToken,
};
