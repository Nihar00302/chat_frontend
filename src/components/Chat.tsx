import { useState, useEffect, useRef, useCallback } from 'react';
import type { Message } from '../types';
import { useSocket } from '../context/SocketContext';
import ChatMessage from './ChatMessage';
import MessageInput from './MessageInput';
import UserList from './UserList';

// Maximum number of messages to display at once
const MAX_MESSAGES = 100;

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const { socket, username, userId } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Enhanced scroll handling
  const scrollToBottom = useCallback(() => {
    if (isAutoScrollEnabled && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setUnreadCount(0);
    }
  }, [isAutoScrollEnabled]);

  // Handle scroll events to detect when user manually scrolls up
  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    // If user is near bottom, enable auto-scroll
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    if (isNearBottom !== isAutoScrollEnabled) {
      setIsAutoScrollEnabled(isNearBottom);
      if (isNearBottom) setUnreadCount(0);
    }
  }, [isAutoScrollEnabled]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleExistingMessages = (messagesList: Message[]) => {
      // Keep only the most recent messages if there are too many
      const limitedMessages = messagesList.slice(-MAX_MESSAGES);
      setMessages(limitedMessages);
    };

    const handleNewMessage = (message: Message) => {
      setMessages(prev => {
        // Add new message and limit the total count
        const newMessages = [...prev, message];
        if (newMessages.length > MAX_MESSAGES) {
          return newMessages.slice(-MAX_MESSAGES);
        }
        return newMessages;
      });
      
      // Increment unread count if user has scrolled up
      if (!isAutoScrollEnabled) {
        setUnreadCount(prev => prev + 1);
      }
    };

    socket.on('message:get', handleExistingMessages);
    socket.on('message:new', handleNewMessage);

    // Reconnection handler
    socket.on('reconnect', () => {
      console.log('Reconnected to server');
      // Re-join the chat room
      if (username) {
        socket.emit('user:join', { userId, username });
      }
    });

    return () => {
      socket.off('message:get', handleExistingMessages);
      socket.off('message:new', handleNewMessage);
      socket.off('reconnect');
    };
  }, [socket, username, userId, isAutoScrollEnabled]);

  const scrollToNewest = () => {
    setIsAutoScrollEnabled(true);
    setTimeout(scrollToBottom, 0);
  };

  if (!username) {
    return null;
  }

  return (
    <div className="flex flex-1 h-full w-full">
      <div className="flex flex-col flex-1 overflow-hidden w-full">
        <div className="bg-gray-100 p-4 border-b">
          <h1 className="text-lg font-bold">Chat Room</h1>
          <p className="text-sm text-gray-500">Welcome, {username}!</p>
        </div>
        
        {/* Chat messages container with ref for scroll handling */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 max-w-full"
          onScroll={handleScroll}
        >
          {messages.length > 0 ? (
            messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isCurrentUser={message.sender === username}
              />
            ))
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Show new messages button when user has scrolled up */}
        {!isAutoScrollEnabled && unreadCount > 0 && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
            <button 
              onClick={scrollToNewest}
              className="bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg"
            >
              {unreadCount} new {unreadCount === 1 ? 'message' : 'messages'} ↓
            </button>
          </div>
        )}
        
        <MessageInput />
      </div>
      
      <div className="hidden md:block">
        <UserList />
      </div>
    </div>
  );
} 