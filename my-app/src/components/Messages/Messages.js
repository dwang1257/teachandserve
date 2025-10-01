import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from '../../config/axios';
import websocketService from '../../services/websocketService';

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [acceptedMatches, setAcceptedMatches] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [error, setError] = useState(null);

  const subscriptionsRef = useRef([]);

  // Initialize WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      websocketService.connect(
        token,
        () => {
          console.log('WebSocket connected');
          setWsConnected(true);
          // Subscribe to user's conversation updates
          const subId = websocketService.subscribe(
            `/topic/users.${user.id}.conversations`,
            handleConversationUpdate
          );
          if (subId) subscriptionsRef.current.push(subId);
        },
        (error) => {
          console.error('WebSocket connection error:', error);
          setWsConnected(false);
        }
      );
    }

    return () => {
      // Cleanup subscriptions
      subscriptionsRef.current.forEach(id => websocketService.unsubscribe(id));
      subscriptionsRef.current = [];
    };
  }, [user.id]);

  // Load conversations and matches on mount
  useEffect(() => {
    loadConversations();
    loadAcceptedMatches();
  }, []);

  // Subscribe to selected conversation's messages
  useEffect(() => {
    if (selectedConversation && wsConnected) {
      loadMessages(selectedConversation.id);

      // Subscribe to new messages in this conversation
      const subId = websocketService.subscribe(
        `/topic/conversations.${selectedConversation.id}.messages`,
        handleNewMessage
      );
      if (subId) subscriptionsRef.current.push(subId);

      // Mark messages as read when opening conversation
      markAsRead();

      return () => {
        if (subId) websocketService.unsubscribe(subId);
        subscriptionsRef.current = subscriptionsRef.current.filter(id => id !== subId);
      };
    }
  }, [selectedConversation, wsConnected]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldScroll && messages.length > 0) {
      scrollToBottom();
      setShouldScroll(false);
    }
  }, [messages, shouldScroll]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNewMessage = (message) => {
    setMessages(prev => [...prev, message]);
    setShouldScroll(true);

    // Mark as read if conversation is selected
    if (selectedConversation && selectedConversation.id === message.conversationId) {
      markAsRead();
    }
  };

  const handleConversationUpdate = (update) => {
    // Reload conversations when there's an update
    loadConversations();
  };

  const loadAcceptedMatches = async () => {
    try {
      const response = await axios.get('/api/matches/my-matches');
      const matches = response.data || [];

      // Filter for accepted matches only
      const accepted = matches.filter(m => m.status === 'ACCEPTED');
      setAcceptedMatches(accepted);
    } catch (error) {
      console.error('Failed to load matches:', error);
    }
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load conversations from API
      const response = await axios.get('/api/conversations');
      const apiConversations = response.data || [];

      setConversations(apiConversations);

      // Check if userId is in URL params (from Send Message button)
      const userId = searchParams.get('userId');
      if (userId && userId.trim()) {
        const targetUserId = parseInt(userId);

        // Only proceed if we have a valid number
        if (!isNaN(targetUserId) && targetUserId > 0) {
          let targetConvo = apiConversations.find(c =>
            c.participants.some(p => p.id === targetUserId)
          );

          // If conversation doesn't exist, create it
          if (!targetConvo) {
            try {
              console.log('Creating conversation with peerUserId:', targetUserId);
              const createResponse = await axios.post('/api/conversations', {
                peerUserId: targetUserId
              });
              console.log('Conversation created:', createResponse.data);

              // Reload conversations to get the new one
              const reloadResponse = await axios.get('/api/conversations');
              const updatedConversations = reloadResponse.data || [];
              setConversations(updatedConversations);

              targetConvo = updatedConversations.find(c =>
                c.participants.some(p => p.id === targetUserId)
              );
            } catch (error) {
              console.error('Failed to create conversation:', error);
              console.error('Error response:', error.response?.data);
              setError(error.response?.data?.error || error.response?.data?.message || 'Failed to create conversation');
            }
          }

          // Select the conversation
          if (targetConvo) {
            setSelectedConversation(targetConvo);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setError(error.response?.data?.error || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const startConversationWithMatch = async (matchUserId) => {
    try {
      setError(null);

      if (!matchUserId) {
        setError('Invalid user ID');
        return;
      }

      // Check if conversation already exists
      // Note: participants array only contains OTHER participants, not current user
      let existingConvo = conversations.find(c =>
        c.participants.some(p => p.id === matchUserId)
      );

      if (existingConvo) {
        setSelectedConversation(existingConvo);
        return;
      }

      // Create new conversation
      const createResponse = await axios.post('/api/conversations', {
        peerUserId: matchUserId
      });

      // The created conversation is returned in the response
      const createdConvoId = createResponse.data.id;

      // Reload conversations
      const reloadResponse = await axios.get('/api/conversations');
      const updatedConversations = reloadResponse.data || [];
      setConversations(updatedConversations);

      // Select the newly created conversation by ID
      const newConvo = updatedConversations.find(c => c.id === createdConvoId);

      if (newConvo) {
        setSelectedConversation(newConvo);
      } else {
        setError('Conversation created but could not be loaded. Please refresh the page.');
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to start conversation';
      setError(errorMsg);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      console.log('Loading messages for conversation:', conversationId);
      const response = await axios.get(`/api/conversations/${conversationId}`, {
        params: { limit: 50 }
      });
      console.log('Messages response:', response.data);

      const messagesData = response.data.messages || [];
      console.log('Messages data:', messagesData);
      // Reverse messages to show oldest first
      setMessages(messagesData.reverse());
      setShouldScroll(true);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setError(error.response?.data?.error || 'Failed to load messages');
      setMessages([]);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);

      const response = await axios.post(
        `/api/conversations/${selectedConversation.id}/messages`,
        { body: newMessage }
      );

      // Message will be received via WebSocket, but add optimistically for better UX
      if (!wsConnected) {
        setMessages(prev => [...prev, response.data]);
        setShouldScroll(true);
      }

      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      setError(error.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async () => {
    if (!selectedConversation || messages.length === 0) return;

    try {
      const lastMessageId = messages[messages.length - 1]?.id;
      if (lastMessageId) {
        await axios.post(`/api/conversations/${selectedConversation.id}/read`, {
          lastMessageId
        });
      }
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
  };

  const getParticipantName = (conversation) => {
    if (!conversation || !conversation.participants || conversation.participants.length === 0) {
      return 'Unknown';
    }
    const otherParticipant = conversation.participants[0]; // API only returns other participant
    return otherParticipant?.email || otherParticipant?.name || 'Unknown';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Sidebar - Conversations List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
            <p className="text-xs text-gray-500 mt-1">
              {wsConnected ? '● Connected' : '○ Offline'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Accepted Matches Section */}
            {acceptedMatches.length > 0 && (
              <div className="border-b border-gray-200">
                <div className="px-4 py-2 bg-gray-50">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase">Accepted Matches</h3>
                </div>
                {acceptedMatches.map((match) => {
                  const profile = user.role === 'MENTOR' ? match.menteeProfile : match.mentorProfile;
                  const matchUserId = profile?.userId;
                  const name = profile?.email || 'Unknown';

                  // Skip if matchUserId is not valid
                  if (!matchUserId) {
                    return null;
                  }

                  const hasConversation = conversations.some(c =>
                    c.participants.some(p => p.id === matchUserId)
                  );

                  return (
                    <div
                      key={match.id}
                      onClick={() => startConversationWithMatch(matchUserId)}
                      className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-lg">
                              {name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {hasConversation ? 'Continue conversation' : 'Start messaging'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Active Conversations Section */}
            {conversations.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-gray-50">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase">Active Conversations</h3>
                </div>
                {conversations.map((convo) => {
                  const participant = getParticipantName(convo);
                  return (
                    <div
                      key={convo.id}
                      onClick={() => setSelectedConversation(convo)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation?.id === convo.id ? 'bg-gray-100' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-lg">
                              {participant.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {participant}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatTime(convo.updatedAt)}
                            </p>
                          </div>
                          <p className="text-sm text-gray-500 truncate mt-1">
                            {convo.lastMessage?.body || 'Start a conversation'}
                          </p>
                        </div>
                        {convo.unreadCount > 0 && (
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-gray-900 rounded-full">
                              {convo.unreadCount}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {conversations.length === 0 && acceptedMatches.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">No matches or conversations yet</p>
                <button
                  onClick={() => navigate('/matches')}
                  className="mt-2 text-sm text-gray-900 hover:text-gray-700"
                >
                  View your matches
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col bg-gray-100 min-h-0">
            {/* Chat Header */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {getParticipantName(selectedConversation).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {getParticipantName(selectedConversation)}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {wsConnected ? 'Active now' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-400">
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs mt-1">Start the conversation below</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => {
                    const isCurrentUser = message.senderId === user.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-2xl ${
                            isCurrentUser
                              ? 'bg-gray-900 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <p className="text-sm break-words">{message.body}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isCurrentUser ? 'text-gray-400' : 'text-gray-500'
                            }`}
                          >
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4">
              <form onSubmit={sendMessage} className="flex items-center space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-gray-100 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                  disabled={sending}
                  maxLength={5000}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="p-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-100">
            <div className="text-center text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="mt-2 text-sm font-medium">Select a conversation</p>
              <p className="text-xs text-gray-400">Choose from your existing conversations</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
