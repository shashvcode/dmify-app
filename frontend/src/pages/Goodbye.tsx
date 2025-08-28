import React from 'react';
import { Link } from 'react-router-dom';

const Goodbye: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl ring-1 ring-black/5 p-8">
          <div className="w-16 h-16 bg-gradient-to-r from-electric-blue to-neon-purple rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-primary-text mb-4">Account Successfully Deleted</h1>
          
          <p className="text-secondary-text mb-6 leading-relaxed">
            Your DMify account and all associated data have been permanently deleted.
          </p>
          
          <p className="text-sm text-secondary-text mb-8">
            Thank you for using DMify. We're sorry to see you go and hope you'll consider us again in the future.
          </p>
          
          <div className="space-y-3">
            <Link 
              to="/signup" 
              className="block w-full bg-gradient-to-r from-electric-blue to-neon-purple text-white py-3 px-6 rounded-full font-semibold hover:shadow-lg transition-all"
            >
              Create New Account
            </Link>
            
            <Link 
              to="/" 
              className="block w-full text-secondary-text hover:text-primary-text py-3 px-6 rounded-full transition-colors"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
        
        <p className="text-xs text-secondary-text mt-6">
          Thank you for using DMify. We're sorry to see you go.
        </p>
      </div>
    </div>
  );
};

export default Goodbye;
