import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../config/axios';

const NotificationBanner = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    checkForMatches();
  }, []);

  const checkForMatches = async () => {
    try {
      const response = await axios.get('/api/profile/matches?limit=1');
      const matches = response.data.matches || [];
      
      if (matches.length > 0) {
        const notification = {
          id: `match-${Date.now()}`,
          type: 'match',
          message: `You've been matched with ${matches.length} potential ${response.data.userRole === 'MENTEE' ? 'mentor' : 'mentee'}${matches.length > 1 ? 's' : ''}!`,
          matches: matches
        };
        
        setNotifications([notification]);
      }
    } catch (error) {
      console.error('Failed to check for matches:', error);
    }
  };

  const dismissNotification = (notificationId) => {
    setDismissed([...dismissed, notificationId]);
  };

  const visibleNotifications = notifications.filter(n => !dismissed.includes(n.id));

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-40 space-y-3 w-96">
      {visibleNotifications.map((notification) => (
        <div
          key={notification.id}
          className="w-full bg-white shadow-xl rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5"
        >
          <div className="p-5">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <svg className="h-7 w-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-base font-semibold text-gray-900 mb-2">New Match!</p>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{notification.message}</p>
                <div className="flex space-x-3">
                  <button
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    onClick={() => navigate('/dashboard')}
                  >
                    View Matches
                  </button>
                  <button
                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    onClick={() => dismissNotification(notification.id)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <div className="ml-3 flex-shrink-0">
                <button
                  className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => dismissNotification(notification.id)}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationBanner;