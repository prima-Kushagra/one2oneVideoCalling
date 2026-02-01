import React, { useState } from 'react';
import './App.css';
import { useWebRTC } from './hooks/useWebRTC';
import Dashboard from './components/Dashboard';
import VideoGrid from './components/VideoGrid';
import ControlBar from './components/ControlBar';
import Login from './components/Login';
import Signup from './components/Signup';
import { AuthProvider, useAuth } from './context/AuthContext';

/**
 * Main Application Logic
 */
const AppContent = () => {
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const { user, loading, logout } = useAuth();

  const {
    onlineUsers,
    callStatus,
    incomingCall,
    localVideoRef,
    remoteVideoRef,
    isMuted,
    isCameraOff,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera
  } = useWebRTC();

  if (loading) {
    return <div className="app-container"><p>Loading...</p></div>;
  }

  // If NOT logged in, show Auth screens
  if (!user) {
    return (
      <div className="auth-container">
        {authMode === 'login' ? (
          <Login onSwitch={() => setAuthMode('signup')} />
        ) : (
          <Signup onSwitch={() => setAuthMode('login')} />
        )}
      </div>
    );
  }

  // If LOGGED IN, show app content
  return (
    <div className="app-container">
      <div className="logout-container">
        <button className="logout-btn" onClick={logout}>Logout</button>
      </div>

      {callStatus === 'idle' && (
        <Dashboard
          onlineUsers={onlineUsers}
          startCall={startCall}
          user={user}
        />
      )}

      {(callStatus === 'calling' || callStatus === 'connected') && (
        <div className="call-screen">
          <div className="header">
            {callStatus === 'connected' ? (
              <span className="status-badge">Live</span>
            ) : (
              <span className="status-badge warning">Calling...</span>
            )}
          </div>

          <VideoGrid
            localVideoRef={localVideoRef}
            remoteVideoRef={remoteVideoRef}
            isMuted={isMuted}
          />

          <ControlBar
            isMuted={isMuted}
            toggleMute={toggleMute}
            isCameraOff={isCameraOff}
            toggleCamera={toggleCamera}
            leaveCall={endCall}
          />
        </div>
      )}

      {callStatus === 'receiving' && incomingCall && (
        <div className="incoming-call-overlay">
          <h2>📞 Incoming Call from {incomingCall.fromName}</h2>
          <div className="incoming-call-actions">
            <button className="join-btn" onClick={answerCall}>Accept ✅</button>
            <button className="reject-btn" onClick={rejectCall}>Reject ❌</button>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
