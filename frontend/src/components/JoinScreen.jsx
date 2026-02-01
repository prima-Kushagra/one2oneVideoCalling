import React from 'react';

const JoinScreen = ({ roomId, setRoomId, handleJoin }) => {
    return (
        <div className="join-screen">
            <div className="join-card">
                <h1>Video Call</h1>
                <p>Enter a Room ID to start</p>
                <div className="input-group">
                    <input
                        type="text"
                        placeholder="e.g. room-123"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        className="input-field"
                    />
                    <button onClick={handleJoin} className="join-btn">
                        Join Room
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JoinScreen;
