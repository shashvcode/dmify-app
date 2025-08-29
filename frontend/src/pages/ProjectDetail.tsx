import { useState, useEffect, useRef } from 'react';
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

interface CreditInfo {
  credits: number;
  total_earned: number;
  total_used: number;
}

interface DMJob {
  id: string;
  username: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  result?: {
    success: boolean;
    message?: string;
    user_info?: any;
    error?: string;
    message_id?: string;
  };
}



const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // State
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [credits, setCredits] = useState<CreditInfo | null>(null);
  const [dmJobs, setDmJobs] = useState<DMJob[]>([]);

  const [loading, setLoading] = useState(true);
  const [queueing, setQueueing] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Form state
  const [username, setUsername] = useState('');
  const [usernames, setUsernames] = useState<string[]>([]);
  
  // UI state
  const [error, setError] = useState('');
  // const [success, setSuccess] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'copied'; message: string } | null>(null);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // const [messageFilter, setMessageFilter] = useState<'all' | 'new' | 'copied'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'alphabetical'>('newest');
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!id) return;
    document.title = "DMify - Project Detail";
    fetchProjectData();
    startPolling();
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [id]);

  const fetchProjectData = async () => {
    if (!id) return;
    
    try {
      const [projectData, messagesData, creditsData, jobsData] = await Promise.all([
        apiService.getProject(id),
        apiService.getProjectMessages(id),
        apiService.getUserCredits(),
        apiService.getProjectDMJobs(id)
      ]);
      
      setProject(projectData);
      setMessages(messagesData);
      setCredits(creditsData);
      setDmJobs(jobsData);
    } catch (error: any) {
      if (error.response?.status === 404) {
        navigate('/app/projects');
      }
      console.error('Failed to fetch project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    
    pollingRef.current = setInterval(async () => {
      if (!id) return;
      
      try {
        const [jobsData, creditsData] = await Promise.all([
          apiService.getProjectDMJobs(id),
          apiService.getUserCredits()
        ]);
        
        setDmJobs(jobsData);
        setCredits(creditsData);
        
        const hasNewCompletedJobs = jobsData.some((job: DMJob) => 
          job.status === 'completed' && 
          !dmJobs.find(oldJob => oldJob.id === job.id && oldJob.status === 'completed')
        );
        
        if (hasNewCompletedJobs) {
          const messagesData = await apiService.getProjectMessages(id);
          setMessages(messagesData);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);
  };

  const showToast = (type: 'success' | 'error' | 'copied', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUsernameInput = (value: string) => {
    setUsername(value.replace('@', ''));
    
    // Handle comma-separated usernames
    if (value.includes(',')) {
      const newUsernames = value.split(',').map(u => u.trim().replace('@', '')).filter(u => u.length > 0);
      setUsernames(prev => [...new Set([...prev, ...newUsernames])]);
      setUsername('');
    }
  };

  // const addUsername = () => {
  //   if (username.trim() && !usernames.includes(username.trim())) {
  //     setUsernames(prev => [...prev, username.trim()]);
  //     setUsername('');
  //   }
  // };

  const removeUsername = (usernameToRemove: string) => {
    setUsernames(prev => prev.filter(u => u !== usernameToRemove));
  };

  const estimateCredits = () => {
    const totalUsernames = usernames.length + (username.trim() ? 1 : 0);
    return totalUsernames;
  };

  const handleGenerateDM = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const allUsernames = [...usernames];
    if (username.trim()) {
      allUsernames.push(username.trim());
    }

    if (allUsernames.length === 0) {
      setError('Please enter at least one username');
      return;
    }

    handleQueueDMs(allUsernames);
  };



  const handleQueueDMs = async (usernamesToQueue: string[]) => {
    setQueueing(true);
    setError('');

    try {
      for (const usernameToQueue of usernamesToQueue) {
        await apiService.queueDMGeneration(id!, usernameToQueue);
      }
      showToast('success', `${usernamesToQueue.length} username(s) queued for processing!`);
      setUsername('');
      setUsernames([]);
    } catch (error: any) {
      if (error.response?.status === 402) {
        setError(error.response?.data?.detail || 'Insufficient credits');
      } else {
        setError(error.response?.data?.detail || 'Failed to queue DM generation');
      }
    } finally {
      setQueueing(false);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await apiService.cancelDMJob(jobId);
      showToast('success', 'Job cancelled successfully');
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to cancel job');
    }
  };

  const handleExportMessages = async () => {
    if (!id || !project) return;

    if (messages.length === 0) {
      showToast('error', 'No messages to export. Generate some messages first.');
      return;
    }

    setExporting(true);
    
    try {
      const response = await apiService.exportProjectMessages(id);
      
      // Create download link
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from response headers or create default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `DMify_Messages_${project.name}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showToast('success', `Excel file downloaded successfully! (${messages.length} messages)`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        showToast('error', 'No messages found for this project.');
      } else {
        showToast('error', error.response?.data?.detail || 'Failed to export messages. Please try again.');
      }
    } finally {
      setExporting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('copied', 'Copied!');
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessage(message);
    setEditedContent(message.generated_message);
    setShowEditDrawer(true);
  };

  const handleSaveEdit = async () => {
    if (!editingMessage || !id || !editedContent.trim()) return;

    setIsUpdating(true);
    try {
      await apiService.updateMessage(id, editingMessage.id, editedContent.trim());
      
      // Update the messages state
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === editingMessage.id 
            ? { ...msg, generated_message: editedContent.trim() }
            : msg
        )
      );

      showToast('success', 'Message updated successfully');
      setShowEditDrawer(false);
      setEditingMessage(null);
      setEditedContent('');
    } catch (error) {
      console.error('Failed to update message:', error);
      showToast('error', 'Failed to update message');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditDrawer(false);
    setEditingMessage(null);
    setEditedContent('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getProjectTag = (productInfo: string) => {
    const lowerInfo = productInfo.toLowerCase();
    if (lowerInfo.includes('saas') || lowerInfo.includes('software')) return 'SaaS';
    if (lowerInfo.includes('shop') || lowerInfo.includes('store') || lowerInfo.includes('product')) return 'E-commerce';
    if (lowerInfo.includes('agency') || lowerInfo.includes('marketing')) return 'Agency';
    if (lowerInfo.includes('creator') || lowerInfo.includes('influencer')) return 'Creator';
    return 'B2B';
  };

  const filteredMessages = messages
    .filter(message => 
      message.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.generated_message.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return a.username.localeCompare(b.username);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const activeJobs = dmJobs.filter(job => job.status !== 'completed');
  const creditsUsed = credits ? credits.total_used : 0;
  const creditsTotal = credits ? credits.total_earned : 0;
  const creditsProgress = creditsTotal > 0 ? (creditsUsed / creditsTotal) * 100 : 0;

  if (loading) {
    return (
      <div className="project-view-container">
        <ProjectDetailSkeleton />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-view-container">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-primary-text mb-2">Project not found</h3>
          <Link to="/app/projects" className="text-electric-blue hover:text-neon-purple">
            ← Back to projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="project-view-container">
      {/* Toast Notifications */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              {toast.type === 'success' || toast.type === 'copied' ? (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              )}
            </svg>
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <Link to="/app/projects" className="text-electric-blue hover:text-neon-purple text-sm font-medium mb-4 inline-block">
          ← Back to projects
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-black text-primary-text font-space mb-2">{project.name}</h1>
            <p className="text-secondary-text text-lg">Generate personalized Instagram DMs for this campaign</p>
          </div>
          
          {/* Export Button */}
          {messages.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportMessages}
                disabled={exporting}
                className="btn-secondary flex items-center gap-2 text-sm"
                title="Export messages to Excel file"
              >
                {exporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-electric-blue"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export to Excel
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Layout */}
      <div className="project-view-grid">
        {/* Left Rail */}
        <div className="project-left-rail">
          {/* Project Details */}
          <div className="project-view-card accent">
            <div className="project-card-title">
              <span>Project Details</span>
              <button
                onClick={() => setShowEditDrawer(true)}
                className="text-secondary-text hover:text-primary-text transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
            
            <div className="project-field-row">
              <span className="project-field-label">Product/Service</span>
              <p className="project-field-content">{project.product_info}</p>
            </div>
            
            <div className="project-field-row">
              <span className="project-field-label">Offer</span>
              <p className="project-field-content">{project.offer_info}</p>
            </div>
            
            <div className="project-meta-row">
              <span className="project-tag">{getProjectTag(project.product_info)}</span>
              <span>•</span>
              <span>Created {formatDate(project.created_at)}</span>
            </div>
          </div>

          {/* Credits */}
          {credits && (
            <div className="project-view-card">
              <div className="credits-display">
                <div className="credits-number">{credits.credits}</div>
                <div className="credits-subcopy">Each DM uses 1 credit</div>
              </div>
              
              <div className="credits-bar">
                <div 
                  className="credits-progress" 
                  style={{ width: `${Math.min(creditsProgress, 100)}%` }}
                />
              </div>
              
              <Link to="/app/payments" className="credits-buy-btn">
                Buy More
              </Link>
            </div>
          )}

          {/* Generate DM */}
          <div className="project-view-card accent">
            <span className="project-card-title">Generate DM</span>

            <form onSubmit={handleGenerateDM} className="generate-form">
              <div>
                <label className="project-field-label">Instagram Username</label>
                <div className="username-input-wrapper">
                  <span className="username-at">@</span>
                  <input
                    type="text"
                    className="username-input"
                    placeholder="elonmusk  ·  multiple allowed"
                    value={username}
                    onChange={(e) => handleUsernameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleGenerateDM(e);
                      }
                    }}
                    disabled={queueing}
                  />
                </div>
                
                {usernames.length > 0 && (
                  <div className="username-chips">
                    {usernames.map((user, index) => (
                      <span key={index} className="username-chip">
                        @{user}
                        <button
                          type="button"
                          onClick={() => removeUsername(user)}
                          className="ml-2 text-electric-blue hover:text-neon-purple"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>



              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-16 text-red-800 text-sm">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={queueing || estimateCredits() === 0 || (credits?.credits ?? 0) <= 0}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {queueing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Queueing...
                    </div>
                  ) : (
                    'Add to Queue'
                  )}
                </button>
                
                {estimateCredits() > 0 && (
                  <p className="text-xs text-secondary-text text-center">
                    Est. credits: {estimateCredits()}
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Content */}
        <div className="space-y-6">
          {/* Processing Queue */}
          {activeJobs.length > 0 && (
            <div className="project-view-card">
              <h3 className="project-card-title" style={{ marginBottom: '1rem' }}>
                Processing Queue ({activeJobs.length} active)
              </h3>
              
              <div className="processing-queue max-h-64 overflow-y-auto">
                {activeJobs.slice(0, 3).map((job) => (
                  <div key={job.id} className="queue-item">
                    <div className="queue-status">
                      <div className={`queue-status-indicator ${job.status}`} />
                      <div>
                        <p className="message-username">@{job.username}</p>
                        <p className="text-sm text-secondary-text">
                          {job.status === 'pending' && '⏳ Queued'}
                          {job.status === 'processing' && '🔄 Analyzing profile...'}
                          {job.status === 'failed' && `❌ ${job.result?.error || 'Failed'}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="queue-actions">
                      <span className="text-xs text-secondary-text">
                        {formatDate(job.created_at)}
                      </span>
                      {job.status === 'pending' && (
                        <button
                          onClick={() => handleCancelJob(job.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium ml-3"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {activeJobs.length > 3 && (
                  <div className="text-center pt-2">
                    <button className="text-sm text-electric-blue hover:text-neon-purple font-medium">
                      View all queue ({activeJobs.length})
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Generated Messages */}
          <div className="project-view-card">
            <div className="message-header">
              <h3 className="project-card-title" style={{ marginBottom: 0 }}>
                Generated Messages ({messages.length})
              </h3>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 bg-white/70 border border-white/60 rounded-16 text-sm focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'alphabetical')}
                  className="px-3 py-2 bg-white/70 border border-white/60 rounded-16 text-sm"
                >
                  <option value="newest">Newest</option>
                  <option value="alphabetical">A-Z</option>
                </select>
              </div>
            </div>
            
            {filteredMessages.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-secondary-text mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-secondary-text text-lg mb-2">
                  {searchTerm ? 'No messages found' : 'No messages yet'}
                </p>
                <p className="text-secondary-text">
                  {searchTerm ? 'Try adjusting your search terms' : 'Add usernames to generate your first personalized DM'}
                </p>
              </div>
            ) : (
              <div className="message-feed max-h-96 overflow-y-auto">
                {filteredMessages.map((message) => (
                  <div key={message.id} className="message-item">
                    <div className="message-header">
                      <div className="message-meta">
                        <span className="message-username">@{message.username}</span>
                        <span className="message-timestamp">{formatDate(message.created_at)}</span>
                        {message.user_info?.followersCount && (
                          <span className="message-followers">
                            {formatFollowers(message.user_info.followersCount)} followers
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="message-bubble">
                      <p className="message-content">{message.generated_message}</p>
                    </div>
                    
                    {message.user_info && (
                      <div className="message-target-info">
                        {message.user_info.fullName && (
                          <span className="target-info-chip">
                            Name: {message.user_info.fullName}
                          </span>
                        )}
                        {message.user_info.category && (
                          <span className="target-info-chip">
                            {message.user_info.category}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="message-actions">
                      <button
                        onClick={() => copyToClipboard(message.generated_message)}
                        className="message-action primary"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => handleEditMessage(message)}
                        className="message-action secondary"
                      >
                        Edit ✎
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile FAB */}
      <button 
        onClick={() => {
          const generateForm = document.querySelector('.generate-form');
          generateForm?.scrollIntoView({ behavior: 'smooth' });
        }}
        className="mobile-fab"
      >
        Generate DM
      </button>

      {/* Edit Message Drawer */}
      {showEditDrawer && editingMessage && (
        <>
          <div 
            className="edit-drawer-overlay"
            onClick={handleCancelEdit}
          />
          <div className="edit-drawer">
            <div className="edit-drawer-header">
              <div>
                <h3 className="text-xl font-bold text-primary-text">Edit Message</h3>
                <p className="text-sm text-secondary-text mt-1">
                  Editing message for @{editingMessage.username}
                </p>
              </div>
              <button
                onClick={handleCancelEdit}
                className="text-secondary-text hover:text-primary-text p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="edit-drawer-content">
              <label className="block text-sm font-medium text-primary-text mb-2">
                Message Content
              </label>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-40 px-4 py-3 border border-gray-200 rounded-20 focus:ring-2 focus:ring-electric-blue focus:border-transparent resize-none"
                placeholder="Enter message content..."
                disabled={isUpdating}
              />
              <div className="text-xs text-secondary-text mt-1">
                {editedContent.length} characters
              </div>
            </div>

            <div className="edit-drawer-actions">
              <button
                onClick={handleCancelEdit}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="btn-primary"
                disabled={isUpdating || !editedContent.trim() || editedContent === editingMessage.generated_message}
              >
                {isUpdating ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Loading Skeleton Component
const ProjectDetailSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="mb-8">
      <div className="skeleton h-4 w-32 mb-4"></div>
      <div className="skeleton h-10 w-96 mb-2"></div>
      <div className="skeleton h-6 w-64"></div>
    </div>
    
    <div className="project-view-grid">
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-64 rounded-2xl"></div>
        ))}
      </div>
      <div className="space-y-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="skeleton h-96 rounded-2xl"></div>
        ))}
      </div>
    </div>
  </div>
);

export default ProjectDetail;