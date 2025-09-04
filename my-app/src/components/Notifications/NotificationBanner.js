import React, { useState, useEffect } from 'react';
import axios from '../../config/axios';

const NotificationBanner = () => {
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
          message: `🎉 You've been matched with ${matches.length} potential ${response.data.userRole === 'MENTEE' ? 'mentor' : 'mentee'}${matches.length > 1 ? 's' : ''}!`,
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
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {visibleNotifications.map((notification) => (
        <div
          key={notification.id}
          className="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden"
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 w-0 flex-1 pt-0.5">
                <p className="text-sm font-medium text-gray-900">New Match!</p>
                <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                <div className="mt-3 flex space-x-7">
                  <button 
                    className="bg-white rounded-md text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => window.location.href = '/dashboard'}
                  >
                    View Matches
                  </button>
                  <button 
                    className="bg-white rounded-md text-sm font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => dismissNotification(notification.id)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
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