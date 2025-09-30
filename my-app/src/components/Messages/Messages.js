import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from '../../config/axios';

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Only scroll when we explicitly want to (after sending a message)
  useEffect(() => {
    if (shouldScroll && messages.length > 0) {
      scrollToBottom();
      setShouldScroll(false);
    }
  }, [messages, shouldScroll]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      // Get matches which represent potential conversations
      const response = await axios.get('/api/matches/my-matches');
      const matches = response.data || [];

      // Only show conversations for matches that have valid profiles (not "Unknown User")
      const convos = matches
        .map(match => {
          const otherProfile = user.role === 'MENTOR' ? match.menteeProfile : match.mentorProfile;

          // Skip matches without valid profile data
          if (!otherProfile || !otherProfile.user || !otherProfile.user.email) {
            return null;
          }

          return {
            id: match.id,
            matchId: match.id,
            participant: otherProfile.user.email,
            participantId: otherProfile.user.id,
            lastMessage: 'Start a conversation',
            timestamp: match.createdAt,
            unread: 0,
            profile: otherProfile
          };
        })
        .filter(convo => convo !== null); // Remove null entries

      // Check if userId is in URL params (from Send Message button)
      const userId = searchParams.get('userId');
      if (userId) {
        const targetUserId = parseInt(userId);
        let targetConvo = convos.find(c => c.participantId === targetUserId);

        // If conversation doesn't exist, fetch the user's profile and create it
        if (!targetConvo) {
          try {
            const profileResponse = await axios.get(`/api/profile/${targetUserId}`);
            const profile = profileResponse.data;

            if (profile && profile.user && profile.user.email) {
              // Create a new conversation object
              const newConvo = {
                id: `new-${targetUserId}`,
                matchId: null,
                participant: profile.user.email,
                participantId: profile.user.id,
                lastMessage: 'Start a conversation',
                timestamp: new Date().toISOString(),
                unread: 0,
                profile: profile
              };

              // Add to conversations list
              convos.unshift(newConvo);
              targetConvo = newConvo;
            }
          } catch (error) {
            console.error('Failed to load profile for new conversation:', error);
          }
        }

        // Select the conversation
        if (targetConvo) {
          setConversations(convos);
          setSelectedConversation(targetConvo);
        } else {
          setConversations(convos);
        }
      } else {
        setConversations(convos);
      }

      // Don't auto-select first conversation on initial load
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      // For now, use empty messages array - no mock messages
      // TODO: Replace with actual API call when backend is ready
      // const response = await axios.get(`/api/messages/${conversationId}`);
      // setMessages(response.data || []);

      setMessages([]);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);

      // TODO: Replace with actual API call when backend is ready
      // const response = await axios.post('/api/messages', {
      //   conversationId: selectedConversation.id,
      //   content: newMessage
      // });

      // Add message optimistically
      const newMsg = {
        id: Date.now(),
        senderId: user.id,
        content: newMessage,
        timestamp: new Date().toISOString(),
        isCurrentUser: true
      };

      setMessages([...messages, newMsg]);
      setNewMessage('');
      setShouldScroll(true); // Trigger scroll after sending message
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
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
      <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Sidebar - Conversations List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">No conversations yet</p>
                <button
                  onClick={() => navigate('/matches')}
                  className="mt-2 text-sm text-gray-900 hover:text-gray-700"
                >
                  View your matches
                </button>
              </div>
            ) : (
              conversations.map((convo) => (
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
                          {convo.participant.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {convo.participant}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTime(convo.timestamp)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {convo.lastMessage}
                      </p>
                    </div>
                    {convo.unread > 0 && (
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-gray-900 rounded-full">
                          {convo.unread}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col bg-gray-100">
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {selectedConversation.participant.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {selectedConversation.participant}
                    </h3>
                    <p className="text-xs text-gray-500">Active now</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/matches')}
                  className="text-gray-900 hover:text-gray-700 text-sm font-medium"
                >
                  View Profile
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-400">
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs mt-1">Start the conversation below</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-2xl ${
                          message.isCurrentUser
                            ? 'bg-gray-900 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.isCurrentUser ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        >
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <form onSubmit={sendMessage} className="flex items-center space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-gray-100 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                  disabled={sending}
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