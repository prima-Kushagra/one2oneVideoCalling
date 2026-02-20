import React, { useState } from 'react';
import './styles/base.css';
import './styles/auth.css';
import './styles/dashboard.css';
import './styles/call.css';
import './styles/video.css';
import './styles/controls.css';
import './styles/responsive.css';
import { useWebRTC } from './hooks/useWebRTC';
import Dashboard from './components/Dashboard';
import VideoGrid from './components/VideoGrid';
import ControlBar from './components/ControlBar';
import Login from './components/Login';
import Signup from './components/Signup';
import Home from './components/Home';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/home.css';

/**
 * Main Application Logic
 */
const AppContent = () => {
  const [authMode, setAuthMode] = useState('home'); // 'home', 'login' or 'signup'
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

  // If NOT logged in, show Auth/Home screens
  if (!user) {
    if (authMode === 'home') {
      return <Home onNavigate={setAuthMode} />;
    }

    return (
      <div className="auth-container">
        {authMode === 'login' ? (
          <Login onSwitch={() => setAuthMode('signup')} />
        ) : (
          <Signup onSwitch={() => setAuthMode('login')} />
        )}
        <button className="back-to-home" onClick={() => setAuthMode('home')}>
          ← Back to Home
        </button>
      </div>
    );
  }

  // If LOGGED IN, show app content
  return (
    <div className="app-container">
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
              <span className="status-badge">
                <span className="dot"></span>
                Live
              </span>
            ) : (
              <span className="status-badge warning">
                <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.2" />
                  <path d="M12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4522" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
                Calling...
              </span>
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
        <div className="incoming-call-overlay glass">
          <div className="incoming-call-card">
            <div className="caller-avatar">
              {incomingCall.fromName.charAt(0).toUpperCase()}
            </div>
            <h2>Incoming Call</h2>
            <p>{incomingCall.fromName} is calling you...</p>
            <div className="incoming-call-actions">
              <button className="join-btn" onClick={answerCall}>
                Accept
              </button>
              <button className="reject-btn" onClick={rejectCall}>
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {callStatus === 'idle' && (
        <button
          className="back-to-home"
          onClick={() => {
            logout();
            setAuthMode('home');
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Logout
        </button>
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
