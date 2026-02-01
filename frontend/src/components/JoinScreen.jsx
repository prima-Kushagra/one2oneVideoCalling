import React from 'react';

const JoinScreen = ({ roomId, setRoomId, handleJoin }) => {
    return (
        <div className="join-screen">
            <div className="join-card glass">
                <h1>V2V Call</h1>
                <p>Enter a Room ID to start connecting</p>
                <div className="input-group">
                    <input
                        type="text"
                        placeholder="e.g. workspace-123"
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
