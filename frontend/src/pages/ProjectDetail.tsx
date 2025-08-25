import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../lib/api';

interface Project {
  id: string;
  name: string;
  product_info: string;
  offer_info: string;
  created_at: string;
}

interface Message {
  id: string;
  username: string;
  generated_message: string;
  user_info: any;
  created_at: string;
}

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!id) return;
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    if (!id) return;
    
    try {
      const [projectData, messagesData] = await Promise.all([
        apiService.getProject(id),
        apiService.getProjectMessages(id)
      ]);
      
      setProject(projectData);
      setMessages(messagesData);
    } catch (error: any) {
      if (error.response?.status === 404) {
        navigate('/projects');
      }
      console.error('Failed to fetch project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDM = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setGenerating(true);
    setError('');
    setSuccess('');

    try {
      const result = await apiService.generateDM(id!, username);
      
      if (result.success) {
        setSuccess('DM generated successfully!');
        setUsername('');
        fetchProjectData(); // Refresh messages
      } else {
        setError(result.error || 'Failed to generate DM');
      }
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to generate DM');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Message copied to clipboard!');
    setTimeout(() => setSuccess(''), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
        <Link to="/app/projects" className="text-blue-600 hover:text-blue-500">
          ← Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <Link to="/app/projects" className="text-blue-600 hover:text-blue-500 text-sm font-medium">
          ← Back to projects
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 font-inter">{project.name}</h1>
        <p className="mt-2 text-gray-600">Generate personalized Instagram DMs for this campaign</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          {/* Project Details */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Product/Service</p>
                <p className="text-sm text-gray-900 mt-1">{project.product_info}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Offer</p>
                <p className="text-sm text-gray-900 mt-1">{project.offer_info}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Created</p>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Generate DM */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate DM</h3>
            <form onSubmit={handleGenerateDM} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Instagram Username
                </label>
                <input
                  type="text"
                  id="username"
                  className="input-field mt-1"
                  placeholder="e.g., elonmusk (without @)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace('@', ''))}
                  disabled={generating}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-3 py-2 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={generating || !username.trim()}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </div>
                ) : (
                  'Generate DM'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Generated Messages */}
        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Generated Messages ({messages.length})
            </h3>
            
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-gray-500">No messages generated yet</p>
                <p className="text-sm text-gray-400 mt-1">Start by entering an Instagram username above</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {messages.map((message) => (
                  <div key={message.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-900">@{message.username}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.created_at).toLocaleString()}
                        </span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(message.generated_message)}
                        className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                      >
                        Copy
                      </button>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-gray-900 whitespace-pre-wrap">{message.generated_message}</p>
                    </div>
                    
                    {message.user_info && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-2">Target User Info:</p>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="font-medium">Name:</span> {message.user_info.fullName || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Followers:</span> {message.user_info.followersCount || 'N/A'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
