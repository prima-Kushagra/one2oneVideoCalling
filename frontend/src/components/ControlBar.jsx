import React from 'react';

const ControlBar = ({ isMuted, toggleMute, isCameraOff, toggleCamera, leaveCall }) => {
    return (
        <div className="controls">
            <button
                onClick={toggleMute}
                className={`control-btn ${isMuted ? "active" : ""}`}
                title={isMuted ? "Unmute" : "Mute"}
            >
                {isMuted ? "🔇" : "🎤"}
            </button>

            <button
                onClick={toggleCamera}
                className={`control-btn ${isCameraOff ? "active" : ""}`}
                title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
            >
                {isCameraOff ? "📵" : "📷"}
            </button>

            <button onClick={leaveCall} className="control-btn leave" title="Leave Call">
                📞
            </button>
        </div>
    );
};

export default ControlBar;
