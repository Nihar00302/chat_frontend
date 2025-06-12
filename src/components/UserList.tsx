import { useState, useEffect } from 'react';
import type { User, TypingUser } from '../types';
import { useSocket } from '../context/SocketContext';

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const { socket, userId } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleUserList = (userList: User[]) => {
      setUsers(userList);
    };

    const handleTypingStatus = ({ userId, isTyping }: TypingUser) => {
      setTypingUsers(prev => ({
        ...prev,
        [userId]: isTyping
      }));
    };

    socket.on('user:list', handleUserList);
    socket.on('user:typing', handleTypingStatus);

    return () => {
      socket.off('user:list', handleUserList);
      socket.off('user:typing', handleTypingStatus);
    };
  }, [socket]);

  return (
    <div className="border-l w-60 p-4 h-full bg-gray-50">
      <h2 className="text-lg font-semibold mb-3">Online Users ({users.length})</h2>
      <ul className="space-y-2">
        {users.map((user) => (
          <li key={user.userId} className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm">
              {user.username} {user.userId === userId ? '(You)' : ''}
            </span>
            {typingUsers[user.userId] && (
              <span className="ml-2 text-xs text-gray-500">typing...</span>
            )}
          </li>
        ))}
        {users.length === 0 && (
          <li className="text-sm text-gray-500">No users online</li>
        )}
      </ul>
    </div>
  );
} 
 