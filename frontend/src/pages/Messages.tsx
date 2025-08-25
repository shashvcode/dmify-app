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
  const [success, setSuccess] = useState('');

  useEffect(() => {
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Message copied to clipboard!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const filteredMessages = messages.filter(message =>
    message.username.toLowerCase().includes(filter.toLowerCase()) ||
    message.generated_message.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 font-inter">All Messages</h1>
        <p className="mt-2 text-gray-600">
          View and manage all your generated Instagram DMs
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6">
        <div className="max-w-md">
          <input
            type="text"
            placeholder="Search messages or usernames..."
            className="input-field"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {filteredMessages.length === 0 && !loading ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter ? 'No messages found' : 'No messages yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {filter 
              ? 'Try adjusting your search terms' 
              : 'Start by creating a project and generating your first DM'
            }
          </p>
          {!filter && (
            <Link to="/app/projects" className="btn-primary">
              Create a project
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((message) => (
            <div key={message.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {message.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">@{message.username}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => copyToClipboard(message.generated_message)}
                  className="text-blue-600 hover:text-blue-500 text-sm font-medium flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy</span>
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-gray-900 whitespace-pre-wrap">{message.generated_message}</p>
              </div>
              
              {message.user_info && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-600 mb-3">Target User Info</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Full Name:</span>
                      <p className="text-gray-600">{message.user_info.fullName || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Followers:</span>
                      <p className="text-gray-600">
                        {message.user_info.followersCount ? message.user_info.followersCount.toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Posts:</span>
                      <p className="text-gray-600">
                        {message.user_info.postsCount ? message.user_info.postsCount.toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  {message.user_info.biography && (
                    <div className="mt-3">
                      <span className="font-medium text-gray-700">Bio:</span>
                      <p className="text-gray-600 text-sm mt-1">{message.user_info.biography}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {filteredMessages.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Showing {filteredMessages.length} of {messages.length} messages
          </p>
        </div>
      )}
    </div>
  );
};

export default Messages;
