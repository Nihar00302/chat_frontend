import { useState } from 'react'
import { SocketProvider } from './context/SocketContext'
import Login from './components/Login'
import Chat from './components/Chat'
import './App.css'
import { useSocket } from './context/SocketContext'

function App() {
  return (
    <SocketProvider>
      <AppContent />
    </SocketProvider>
  )
}

function AppContent() {
  const { username } = useSocket()

  return (
    <div className="h-screen w-full flex flex-col bg-white">
      <main className="flex flex-col flex-1 w-full">
        <div className="flex flex-col h-full w-full">
          {username ? <Chat /> : <Login />}
        </div>
      </main>
    </div>
  )
}

export default App
