import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const rtcConfig = {
    iceServers: [
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
    ]
};

export const useWebRTC = () => {
    const { token, user } = useAuth();
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [targetId, setTargetId] = useState(null);
    const [callStatus, setCallStatus] = useState('idle'); 
    const [incomingCall, setIncomingCall] = useState(null);

    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);

    const socketRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const localStreamRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const pendingCandidatesRef = useRef([]);
    const targetIdRef = useRef(null);

    useEffect(() => {
        targetIdRef.current = targetId;
    }, [targetId]);

    
    useEffect(() => {
        if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
        }
    }, [callStatus]);

    
    useEffect(() => {
        if (!token) return;

        socketRef.current = io(import.meta.env.VITE_SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],   
            secure: true,
            reconnection: true
        });


        socketRef.current.on('update-user-list', (users) => {
           
            setOnlineUsers(users.filter(u => u.userId !== user.id));
        });

        socketRef.current.on('incoming-call', ({ fromId, fromName, offer }) => {
            if (callStatus !== 'idle') {
                
                return;
            }
            setIncomingCall({ fromId, fromName, offer });
            setCallStatus('receiving');
            setTargetId(fromId);
        });

        socketRef.current.on('call-answered', async ({ answer }) => {
            if (peerConnectionRef.current) {
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                setCallStatus('connected');
               
                while (pendingCandidatesRef.current.length > 0) {
                    const candidate = pendingCandidatesRef.current.shift();
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                }
            }
        });

        socketRef.current.on('ice-candidate', async ({ candidate }) => {
            if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } else {
                pendingCandidatesRef.current.push(candidate);
            }
        });

        socketRef.current.on('user-busy', () => {
            alert('User is currently in another call.');
            cleanup();
        });

        socketRef.current.on('call-ended', () => {
            handleCallEnded();
        });

        socketRef.current.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            cleanup();
        };
    }, [token, user?.id]);

    const cleanup = useCallback(() => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                console.log("Stopping track:", track.label);
                track.stop();
            });
            localStreamRef.current = null;
        }
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        if (localVideoRef.current) localVideoRef.current.srcObject = null;

        setCallStatus('idle');
        setIncomingCall(null);
        setTargetId(null);
        pendingCandidatesRef.current = [];
    }, []);

    const handleCallEnded = useCallback(() => {
        cleanup();
    }, [cleanup]);

    const getMedia = async () => {
        
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;

            
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            return stream;
        } catch (err) {
            console.error("Media access error:", err);
            return null;
        }
    };

    
    useEffect(() => {
        if (callStatus === 'connected' || callStatus === 'calling') {
            const timer = setTimeout(() => {
                if (localVideoRef.current && localStreamRef.current) {
                    localVideoRef.current.srcObject = localStreamRef.current;
                }
                if (remoteVideoRef.current && peerConnectionRef.current) {
                    const remoteStream = peerConnectionRef.current.getRemoteStreams()[0];
                    if (remoteStream) {
                        remoteVideoRef.current.srcObject = remoteStream;
                    }
                }
            }, 200); 
            return () => clearTimeout(timer);
        }
    }, [callStatus]);

    const createPeerConnection = (targetUserId) => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }

        const pc = new RTCPeerConnection(rtcConfig);

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current);
            });
        }

        pc.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit('ice-candidate', {
                    toId: targetUserId,
                    candidate: event.candidate
                });
            }
        };

        pc.onconnectionstatechange = () => {
            if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
                handleCallEnded();
            }
        };

        peerConnectionRef.current = pc;
        return pc;
    };

    const startCall = async (toUserId) => {
        setTargetId(toUserId);
        setCallStatus('calling');
        const stream = await getMedia();
        if (!stream) {
            setCallStatus('idle');
            return;
        }

        const pc = createPeerConnection(toUserId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socketRef.current.emit('call-user', { toId: toUserId, offer });
    };

    const answerCall = async () => {
        if (!incomingCall) return;

        setCallStatus('connected');
        const stream = await getMedia();
        if (!stream) {
            rejectCall();
            return;
        }

        const pc = createPeerConnection(incomingCall.fromId);
        await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketRef.current.emit('answer-call', { toId: incomingCall.fromId, answer });

        
        while (pendingCandidatesRef.current.length > 0) {
            const candidate = pendingCandidatesRef.current.shift();
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
    };

    const rejectCall = () => {
        if (incomingCall && socketRef.current) {
            socketRef.current.emit('end-call', { toId: incomingCall.fromId });
        }
        cleanup();
    };

    const endCall = () => {
        if (targetId && socketRef.current) {
            socketRef.current.emit('end-call', { toId: targetId });
        }
        cleanup();
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleCamera = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsCameraOff(!videoTrack.enabled);
            }
        }
    };

    return {
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
    };
};

