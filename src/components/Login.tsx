import { useState } from 'react';
import type { FormEvent } from 'react';
import { useSocket } from '../context/SocketContext';

export default function Login() {
  const [inputName, setInputName] = useState('');
  const { setUsername, isConnected } = useSocket();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputName.trim() || !isConnected) return;
    setUsername(inputName.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Join the Chat
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your username to start chatting
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-white bg-gray-800 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your username"
                disabled={!isConnected}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={!inputName.trim() || !isConnected}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {!isConnected ? 'Connecting...' : 'Join Chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 