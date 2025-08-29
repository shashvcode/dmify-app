import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../lib/api';

interface Message {
  id: string;
  username: string;
  generated_message: string;
  user_info: any;
  created_at: string;
}

const Messages: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success'; message: string } | null>(null);

  useEffect(() => {
    document.title = "DMify - Messages";
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const data = await apiService.getAllMessages();
      setMessages(data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string) => {
    setToast({ type: 'success', message });
    setTimeout(() => setToast(null), 3000);
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      showToast('Message copied to clipboard!');
      
      // Reset "Copied!" text after 1.5s
      setTimeout(() => setCopiedMessageId(null), 1500);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const filteredMessages = messages.filter(message =>
    message.username.toLowerCase().includes(filter.toLowerCase()) ||
    message.generated_message.toLowerCase().includes(filter.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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

  const getUserInitial = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="messages-container">
        <MessagesSkeleton />
      </div>
    );
  }

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div className="toast success">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="messages-container">
        {/* Header */}
        <div className="messages-header">
          <h1 className="messages-title">All Messages</h1>
          <p className="messages-subtitle">
            View and manage all your generated Instagram DMs
          </p>
        </div>

      {/* Search Bar */}
      <div className="messages-search-wrapper">
        <svg 
          className="messages-search-icon" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search messages or usernames…"
          className="messages-search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* Messages List */}
      {filteredMessages.length === 0 && !loading ? (
        <div className="messages-empty">
          <div className="messages-empty-card">
            <div className="messages-empty-icon">
              <svg className="w-8 h-8 text-secondary-text" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-primary-text mb-2">
              {filter ? 'No messages found' : 'No messages yet'}
            </h3>
            <p className="text-secondary-text mb-6">
              {filter 
                ? 'Try adjusting your search terms' 
                : 'Generate your first personalized DM from a project'
              }
            </p>
            {!filter && (
              <Link to="/app/projects" className="btn-primary">
                Create a project
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="messages-list">
          {filteredMessages.map((message, index) => (
            <MessageCard
              key={message.id}
              message={message}
              isNewest={index === 0}
              isCopied={copiedMessageId === message.id}
              onCopy={(text) => copyToClipboard(text, message.id)}
              formatDate={formatDate}
              formatFollowers={formatFollowers}
              getUserInitial={getUserInitial}
            />
          ))}
        </div>
      )}

      {/* Messages Count */}
      {filteredMessages.length > 0 && (
        <div className="messages-count">
          Showing {filteredMessages.length} of {messages.length} messages
        </div>
      )}
      </div>
    </>
  );
};

// Message Card Component
const MessageCard: React.FC<{
  message: Message;
  isNewest: boolean;
  isCopied: boolean;
  onCopy: (text: string) => void;
  formatDate: (date: string) => string;
  formatFollowers: (count: number) => string;
  getUserInitial: (username: string) => string;
}> = ({ message, isNewest, isCopied, onCopy, formatDate, formatFollowers, getUserInitial }) => {
  
  const formatMessageText = (text: string) => {
    // Split by double newlines to create paragraphs
    return text.split('\n\n').map((paragraph, index) => (
      <p key={index} className="mb-3 last:mb-0">
        {paragraph}
      </p>
    ));
  };

  return (
    <div className={`message-card ${isNewest ? 'newest' : ''}`}>
      {/* Meta Row */}
      <div className="message-meta-row">
        <div className="message-meta-left">
          <div 
            className="message-avatar"
            aria-label={`User: @${message.username}`}
          >
            {getUserInitial(message.username)}
          </div>
          <div>
            <div className="message-username">@{message.username}</div>
            <div className="message-timestamp">{formatDate(message.created_at)}</div>
          </div>
        </div>
        
        <button
          onClick={() => onCopy(message.generated_message)}
          className="message-copy-action"
          aria-live="polite"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span>{isCopied ? 'Copied!' : 'Copy'}</span>
          <div className="message-copy-underline" />
        </button>
      </div>

      {/* DM Bubble */}
      <div className="message-bubble-container">
        <div className="message-bubble">
          <div className="message-text">
            {formatMessageText(message.generated_message)}
          </div>
        </div>
      </div>

      {/* Profile Snapshot */}
      {message.user_info && (
        <div className="message-profile-section">
          <div className="message-profile-title">Target User Info</div>
          <div className="message-profile-grid">
            <div className="message-profile-field">
              <div className="message-profile-label">Full Name</div>
              <div className="message-profile-value">
                {message.user_info.fullName || 'N/A'}
              </div>
            </div>
            <div className="message-profile-field">
              <div className="message-profile-label">Industry</div>
              <div className="message-profile-value">
                {message.user_info.category || 'N/A'}
              </div>
            </div>
            <div className="message-profile-field">
              <div className="message-profile-label">Followers</div>
              <div className="message-profile-value">
                {message.user_info.followersCount ? formatFollowers(message.user_info.followersCount) : 'N/A'}
              </div>
            </div>
            <div className="message-profile-field">
              <div className="message-profile-label">Posts</div>
              <div className="message-profile-value">
                {message.user_info.postsCount ? message.user_info.postsCount.toLocaleString() : 'N/A'}
              </div>
            </div>
          </div>
          
          {message.user_info.biography && (
            <div className="message-bio-section">
              <div className="message-bio-label">Bio</div>
              <div className="message-bio-text">
                {message.user_info.biography}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Loading Skeleton Component
const MessagesSkeleton: React.FC = () => (
  <div>
    <div className="messages-header">
      <div className="skeleton h-10 w-64 mb-2"></div>
      <div className="skeleton h-5 w-96"></div>
    </div>
    
    <div className="messages-search-wrapper">
      <div className="skeleton h-12 w-full rounded-full"></div>
    </div>
    
    <div className="messages-list">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="messages-skeleton-card">
          <div className="flex items-start justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="skeleton w-10 h-10 rounded-full"></div>
              <div>
                <div className="skeleton h-4 w-20 mb-1"></div>
                <div className="skeleton h-3 w-16"></div>
              </div>
            </div>
            <div className="skeleton h-6 w-12"></div>
          </div>
          
          <div className="pt-3 pb-4">
            <div className="skeleton h-20 w-full max-w-prose rounded-xl"></div>
          </div>
          
          <div className="pt-4 border-t border-neutral-100">
            <div className="skeleton h-3 w-24 mb-3"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, j) => (
                <div key={j}>
                  <div className="skeleton h-3 w-16 mb-1"></div>
                  <div className="skeleton h-4 w-12"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Messages;