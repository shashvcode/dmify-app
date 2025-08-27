import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../lib/api';

interface Project {
  id: string;
  name: string;
  product_info: string;
  offer_info: string;
  created_at: string;
}

type SortOption = 'newest' | 'alphabetical' | 'messages';

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const [formData, setFormData] = useState({
    name: '',
    product_info: '',
    offer_info: '',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await apiService.getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.product_info.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.offer_info.toLowerCase().includes(searchTerm.toLowerCase())
    );

    switch (sortBy) {
      case 'alphabetical':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'messages':
        // For now, sort by creation date as we don't have message counts
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return filtered;
  }, [projects, searchTerm, sortBy]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.product_info.trim() || !formData.offer_info.trim()) {
      setError('All fields are required');
      return;
    }

    setCreating(true);
    setError('');

    try {
      await apiService.createProject(formData.name, formData.product_info, formData.offer_info);
      setShowCreateDrawer(false);
      setFormData({ name: '', product_info: '', offer_info: '' });
      setSuccess('Project created successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchProjects();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    const confirmText = `DELETE ${name}`;
    const userInput = window.prompt(
      `Are you sure you want to delete "${name}"? This will also delete all associated messages.\n\nType "${confirmText}" to confirm:`
    );
    
    if (userInput !== confirmText) {
      return;
    }

    try {
      await apiService.deleteProject(id);
      setSuccess('Project deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchProjects();
    } catch (error) {
      setError('Failed to delete project');
      setTimeout(() => setError(''), 3000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getProjectTag = (productInfo: string) => {
    const tags = ['SaaS', 'E-commerce', 'Agency', 'Creator', 'B2B', 'B2C'];
    // Simple logic to assign tags based on keywords
    const lowerInfo = productInfo.toLowerCase();
    if (lowerInfo.includes('saas') || lowerInfo.includes('software')) return 'SaaS';
    if (lowerInfo.includes('shop') || lowerInfo.includes('store') || lowerInfo.includes('product')) return 'E-commerce';
    if (lowerInfo.includes('agency') || lowerInfo.includes('marketing')) return 'Agency';
    if (lowerInfo.includes('creator') || lowerInfo.includes('influencer')) return 'Creator';
    return 'B2B';
  };

  if (loading) {
    return (
      <div className="projects-container">
        <ProjectsSkeleton />
      </div>
    );
  }

  return (
    <div className="projects-container">
      {/* Success/Error Toast */}
      {(success || error) && (
        <div className={`fixed top-4 right-4 px-6 py-4 rounded-20 shadow-lg backdrop-blur-md z-50 transition-all duration-300 ${
          success ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              {success ? (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              )}
            </svg>
            <span className="font-medium">{success || error}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="projects-header">
        <h1 className="projects-title">Projects</h1>
        <p className="projects-subtitle">
          Manage your Instagram DM campaigns and product offerings
        </p>
      </div>

      {/* Controls Row */}
      <div className="projects-controls">
        {/* Search */}
        <div className="projects-search-wrapper">
          <svg 
            className="projects-search-icon" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search projects..."
            className="projects-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters & New Button */}
        <div className="flex gap-4 items-center">
          <div className="projects-filters">
            <button
              onClick={() => setSortBy('newest')}
              className={`projects-filter-btn ${sortBy === 'newest' ? 'active' : ''}`}
            >
              Newest
            </button>
            <button
              onClick={() => setSortBy('alphabetical')}
              className={`projects-filter-btn ${sortBy === 'alphabetical' ? 'active' : ''}`}
            >
              A-Z
            </button>

          </div>
          
          <button
            onClick={() => setShowCreateDrawer(true)}
            className="projects-new-btn flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        </div>
      </div>

      {/* Content */}
      {filteredAndSortedProjects.length === 0 ? (
        <div className="projects-empty">
          <div className="projects-empty-icon">
            <svg className="w-12 h-12 text-secondary-text" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          {searchTerm ? (
            <>
              <h3 className="text-xl font-semibold text-primary-text mb-2">No projects found</h3>
              <p className="text-secondary-text mb-6">Try adjusting your search terms or create a new project</p>
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold text-primary-text mb-2">You don't have any projects yet</h3>
              <p className="text-secondary-text mb-6">Create a project to start generating personalized Instagram DMs</p>
            </>
          )}
          <button
            onClick={() => setShowCreateDrawer(true)}
            className="btn-primary"
          >
            {searchTerm ? 'Create New Project' : 'Create your first project'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedProjects.map((project, index) => (
            <ProjectListItem
              key={project.id}
              project={project}
              onDelete={handleDeleteProject}
              tag={getProjectTag(project.product_info)}
              index={index}
            />
          ))}
        </div>
      )}

      {/* Create Project Drawer */}
      {showCreateDrawer && (
        <>
          <div 
            className="projects-drawer-overlay"
            onClick={() => setShowCreateDrawer(false)}
          />
          <div className="projects-drawer">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-primary-text font-space">Create New Project</h2>
                  <button
                    onClick={() => setShowCreateDrawer(false)}
                    className="text-secondary-text hover:text-primary-text transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-secondary-text mt-2">
                  Set up your campaign details to start generating personalized DMs
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateProject} className="flex-1 flex flex-col">
                <div className="flex-1 p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-primary-text mb-2">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      className="input-field w-full"
                      placeholder="e.g., SaaS Outreach Campaign"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                    <p className="text-xs text-secondary-text mt-1">
                      {formData.name.length}/50 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary-text mb-2">
                      Product/Service Information *
                    </label>
                    <textarea
                      className="input-field w-full"
                      rows={4}
                      placeholder="Describe your product or service in detail. This helps our AI understand what you're offering..."
                      value={formData.product_info}
                      onChange={(e) => setFormData(prev => ({ ...prev, product_info: e.target.value }))}
                      required
                    />
                    <p className="text-xs text-secondary-text mt-1">
                      {formData.product_info.length}/500 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary-text mb-2">
                      Offer Details *
                    </label>
                    <textarea
                      className="input-field w-full"
                      rows={3}
                      placeholder="What specific offer are you making? (e.g., free trial, discount, consultation, etc.)"
                      value={formData.offer_info}
                      onChange={(e) => setFormData(prev => ({ ...prev, offer_info: e.target.value }))}
                      required
                    />
                    <p className="text-xs text-secondary-text mt-1">
                      {formData.offer_info.length}/300 characters
                    </p>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-16 text-red-800 text-sm">
                      {error}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateDrawer(false);
                      setFormData({ name: '', product_info: '', offer_info: '' });
                      setError('');
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Save Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Project Card Component
const ProjectCard: React.FC<{
  project: Project;
  onDelete: (id: string, name: string) => void;
  tag: string;
  index: number;
}> = ({ project, onDelete, tag, index }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isActive = index === 0; // Mark first project as active for demo

  return (
    <div 
      className={`project-card ${isActive ? 'active' : ''}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="project-card-header">
        <h3 className="project-card-title">{project.name}</h3>
        <p className="project-card-label">Product Info</p>
        <div className="project-card-description">
          {project.product_info}
          {project.offer_info && ` ${project.offer_info}`}
        </div>
      </div>

      <div className="project-card-footer">
        <div className="project-card-meta">
          <span className="project-card-badge">{tag}</span>
          <span className="project-card-date">{formatDate(project.created_at)}</span>
        </div>
        <Link
          to={`/app/projects/${project.id}`}
          className="project-card-action"
        >
          Open
        </Link>
      </div>
    </div>
  );
};

// Project List Item Component
const ProjectListItem: React.FC<{
  project: Project;
  onDelete: (id: string, name: string) => void;
  tag: string;
  index: number;
}> = ({ project, onDelete, tag, index }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div 
      className="flex items-center p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl ring-1 ring-black/5 hover:shadow-2xl transition-all duration-300 relative"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-electric-blue to-neon-purple rounded-t-2xl" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-xl font-bold text-primary-text truncate">{project.name}</h3>
          <span className="project-card-badge">{tag}</span>
        </div>
        <p className="text-sm text-secondary-text mb-1">
          <span className="font-medium text-neutral-500">Product Info:</span> {project.product_info}
        </p>
        {project.offer_info && (
          <p className="text-sm text-secondary-text mb-1">
            <span className="font-medium text-neutral-500">Offer:</span> {project.offer_info}
          </p>
        )}
        <p className="text-xs text-neutral-500">Created {formatDate(project.created_at)}</p>
      </div>

      <div className="flex items-center gap-3 ml-4">
        <Link
          to={`/app/projects/${project.id}`}
          className="project-card-action"
        >
          Open
        </Link>
        <button
          onClick={() => onDelete(project.id, project.name)}
          className="text-secondary-text hover:text-red-600 transition-colors p-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Loading Skeleton Component
const ProjectsSkeleton: React.FC = () => (
  <div>
    <div className="projects-header">
      <div>
        <div className="skeleton h-8 w-32 mb-2"></div>
        <div className="skeleton h-4 w-96"></div>
      </div>
      <div className="skeleton h-12 w-32"></div>
    </div>
    
    <div className="skeleton h-16 w-full mb-8 rounded-20"></div>
    
    <div className="projects-grid">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="projects-skeleton-card">
          <div className="skeleton h-6 w-3/4 mb-3"></div>
          <div className="skeleton h-4 w-full mb-2"></div>
          <div className="skeleton h-4 w-2/3 mb-3"></div>
          <div className="skeleton h-4 w-full mb-2"></div>
          <div className="skeleton h-4 w-1/2 mb-4"></div>
          <div className="flex justify-between items-center mt-auto">
            <div className="skeleton h-6 w-16"></div>
            <div className="skeleton h-8 w-20"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Projects;