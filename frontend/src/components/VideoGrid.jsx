import React from 'react';

const VideoGrid = ({ localVideoRef, remoteVideoRef, isMuted }) => {
    return (
        <div className="video-container">
            <div className="video-wrapper local">
                <video ref={localVideoRef} autoPlay playsInline muted />
                <span className="user-label">You {isMuted && "(Muted)"}</span>
            </div>
            <div className="video-wrapper remote">
                <video ref={remoteVideoRef} autoPlay playsInline />
                <span className="user-label">Remote</span>
            </div>
        </div>
    );
};

export default VideoGrid;
