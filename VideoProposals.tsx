/**
 * Sommer's Proposal System - Video Proposals Page
 * Create and manage video-enhanced proposals
 */

import { useState } from 'react';
import {
  Video,
  Plus,
  Play,
  Pause,
  Upload,
  Trash2,
  Eye,
  Send,
  Clock,
  CheckCircle,
  Film,
  Mic,
  Camera,
  Settings,
  Download,
  Share2,
  MoreVertical,
  Search,
  Filter,
  Loader2
} from 'lucide-react';

// Types
interface VideoProposal {
  id: string;
  title: string;
  client_name: string;
  client_email: string;
  thumbnail_url: string;
  video_url: string;
  duration: number;
  status: 'draft' | 'processing' | 'ready' | 'sent' | 'viewed';
  views: number;
  created_at: string;
  sent_at?: string;
}

// Mock data
const mockVideoProposals: VideoProposal[] = [
  {
    id: '1',
    title: 'Parking Lot Restoration - Smith Properties',
    client_name: 'John Smith',
    client_email: 'john@smithproperties.com',
    thumbnail_url: '/api/placeholder/320/180',
    video_url: '',
    duration: 145,
    status: 'sent',
    views: 3,
    created_at: '2024-01-15T10:00:00Z',
    sent_at: '2024-01-15T14:00:00Z',
  },
  {
    id: '2',
    title: 'Annual Maintenance Proposal - ABC Corp',
    client_name: 'Sarah Johnson',
    client_email: 'sarah@abccorp.com',
    thumbnail_url: '/api/placeholder/320/180',
    video_url: '',
    duration: 98,
    status: 'ready',
    views: 0,
    created_at: '2024-01-14T09:00:00Z',
  },
  {
    id: '3',
    title: 'Crack Sealing Quote - Downtown Plaza',
    client_name: 'Mike Williams',
    client_email: 'mike@downtownplaza.com',
    thumbnail_url: '/api/placeholder/320/180',
    video_url: '',
    duration: 0,
    status: 'draft',
    views: 0,
    created_at: '2024-01-13T16:00:00Z',
  },
];

export default function VideoProposals() {
  const [proposals] = useState<VideoProposal[]>(mockVideoProposals);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [recording, setRecording] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: VideoProposal['status']) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      processing: 'bg-yellow-100 text-yellow-800',
      ready: 'bg-blue-100 text-blue-800',
      sent: 'bg-green-100 text-green-800',
      viewed: 'bg-purple-100 text-purple-800',
    };

    const labels = {
      draft: 'Draft',
      processing: 'Processing',
      ready: 'Ready',
      sent: 'Sent',
      viewed: 'Viewed',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.client_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Video Proposals</h1>
          <p className="text-gray-500 mt-1">Create personalized video messages for your proposals</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Video Proposal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Video className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{proposals.length}</p>
              <p className="text-sm text-gray-500">Total Videos</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Send className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {proposals.filter(p => p.status === 'sent' || p.status === 'viewed').length}
              </p>
              <p className="text-sm text-gray-500">Sent</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Eye className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {proposals.reduce((acc, p) => acc + p.views, 0)}
              </p>
              <p className="text-sm text-gray-500">Total Views</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatDuration(proposals.reduce((acc, p) => acc + p.duration, 0))}
              </p>
              <p className="text-sm text-gray-500">Total Duration</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search video proposals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="processing">Processing</option>
            <option value="ready">Ready</option>
            <option value="sent">Sent</option>
            <option value="viewed">Viewed</option>
          </select>
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProposals.map(proposal => (
          <div key={proposal.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            {/* Thumbnail */}
            <div className="relative aspect-video bg-gray-100">
              <div className="absolute inset-0 flex items-center justify-center">
                <Film className="h-12 w-12 text-gray-300" />
              </div>
              {proposal.duration > 0 && (
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/75 text-white text-xs rounded">
                  {formatDuration(proposal.duration)}
                </div>
              )}
              {proposal.status === 'processing' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
              <button className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
                <div className="p-3 bg-white rounded-full">
                  <Play className="h-6 w-6 text-gray-900" />
                </div>
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 line-clamp-2">{proposal.title}</h3>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <MoreVertical className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              
              <p className="text-sm text-gray-500 mb-3">{proposal.client_name}</p>
              
              <div className="flex items-center justify-between">
                {getStatusBadge(proposal.status)}
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Eye className="h-4 w-4" />
                  {proposal.views} views
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <Eye className="h-4 w-4" />
                  Preview
                </button>
                {proposal.status === 'ready' && (
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors">
                    <Send className="h-4 w-4" />
                    Send
                  </button>
                )}
                {proposal.status === 'draft' && (
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors">
                    <Camera className="h-4 w-4" />
                    Record
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProposals.length === 0 && (
        <div className="text-center py-12">
          <Video className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No video proposals found</h3>
          <p className="text-gray-500 mb-4">Create your first video proposal to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Video Proposal
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Create Video Proposal</h2>
              <p className="text-gray-500 mt-1">Record a personalized video message for your client</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Recording Area */}
              <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
                {recording ? (
                  <div className="text-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse mx-auto mb-2" />
                    <p className="text-white">Recording...</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Camera className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Click record to start</p>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <button className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                  <Mic className="h-6 w-6 text-gray-600" />
                </button>
                <button 
                  onClick={() => setRecording(!recording)}
                  className={`p-4 rounded-full transition-colors ${
                    recording 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {recording ? (
                    <Pause className="h-8 w-8 text-white" />
                  ) : (
                    <Video className="h-8 w-8 text-white" />
                  )}
                </button>
                <button className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                  <Settings className="h-6 w-6 text-gray-600" />
                </button>
              </div>

              {/* Or Upload */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-white text-sm text-gray-500">or</span>
                </div>
              </div>

              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-red-500 hover:bg-red-50 transition-colors">
                <Upload className="h-5 w-5 text-gray-400" />
                <span className="text-gray-600">Upload existing video</span>
              </button>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proposal Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Parking Lot Restoration Proposal"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client Name
                    </label>
                    <input
                      type="text"
                      placeholder="John Smith"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client Email
                    </label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Save Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
