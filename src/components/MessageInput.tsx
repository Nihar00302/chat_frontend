import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { useSocket } from '../context/SocketContext';

export default function MessageInput() {
  const [message, setMessage] = useState('');
  const { socket, userId, username, isConnected } = useSocket();
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [sendAttempts, setSendAttempts] = useState(0);
  
  // Message queue for failed sends
  const [messageQueue, setMessageQueue] = useState<{text: string, timestamp: number}[]>([]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  // Retry sending queued messages when we re-establish connection
  useEffect(() => {
    if (isConnected && messageQueue.length > 0 && socket) {
      // Try to resend queued messages
      const newQueue = [...messageQueue];
      let success = true;
      
      for (let i = 0; i < newQueue.length; i++) {
        try {
          socket.emit('message:send', {
            text: newQueue[i].text,
            sender: username,
            userId
          });
        } catch (error) {
          console.error('Failed to send queued message:', error);
          success = false;
          break;
        }
      }
      
      if (success) {
        // All messages sent successfully
        setMessageQueue([]);
      }
    }
  }, [isConnected, socket, messageQueue, username, userId]);

  const handleSendMessage = () => {
    if (!message.trim() || !socket) return;
    
    try {
      if (isConnected) {
        // Send message with userId included
        socket.emit('message:send', {
          text: message.trim(),
          sender: username,
          userId
        });
        
        setMessage('');
        setSendAttempts(0);
        
        setIsTyping(false);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          socket.emit('user:typing', { userId, isTyping: false });
        }
      } else {
        // Queue message for later if disconnected
        setMessageQueue(prev => [...prev, { 
          text: message.trim(), 
          timestamp: Date.now() 
        }]);
        setMessage('');
        setSendAttempts(prev => prev + 1);
        
        // Alert user after multiple failed attempts
        if (sendAttempts > 2) {
          alert("You appear to be disconnected. Your messages will be sent when connection is restored.");
          setSendAttempts(0);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Queue message for later
      setMessageQueue(prev => [...prev, { 
        text: message.trim(), 
        timestamp: Date.now() 
      }]);
      setMessage('');
    }
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleTyping = () => {
    if (!isTyping && socket && isConnected) {
      setIsTyping(true);
      socket.emit('user:typing', { userId, isTyping: true });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      setIsTyping(false);
      if (socket && isConnected) {
        socket.emit('user:typing', { userId, isTyping: false });
      }
    }, 2000);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="border-t px-4 pt-4 pb-3 bg-white w-full">
      {messageQueue.length > 0 && (
        <div className="mb-2 text-sm text-amber-600">
          {messageQueue.length} message(s) will be sent when connection is restored
        </div>
      )}
      <div className="flex items-center w-full">
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          disabled={!username}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-l-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleSendMessage}
          disabled={!username || !message.trim()}
          className="px-6 py-3 bg-blue-500 text-white font-medium rounded-r-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
} 