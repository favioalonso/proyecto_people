import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import './App.css';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || window.location.origin;

function App() {
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState('disconnected'); // disconnected, searching, connected
  const [partnerId, setPartnerId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const iceServersRef = useRef(null);

  // Inicializar Socket.io y obtener configuración de ICE servers
  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    // Obtener configuración de ICE servers del backend
    fetch(`${SERVER_URL}/api/ice-config`)
      .then(res => res.json())
      .then(data => {
        iceServersRef.current = data.iceServers;
        console.log('ICE servers configurados:', data.iceServers);
      })
      .catch(err => {
        console.error('Error al obtener ICE config:', err);
        // Fallback a solo STUN
        iceServersRef.current = [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ];
      });

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      newSocket.close();
    };
  }, []);

  // Configurar event listeners del socket
  useEffect(() => {
    if (!socket) return;

    socket.on('searching', () => {
      setStatus('searching');
      setPartnerId(null);
      setMessages([]);
    });

    socket.on('match_found', ({ partnerId: newPartnerId }) => {
      setStatus('connected');
      setPartnerId(newPartnerId);
      setMessages([]);
      initializeWebRTC(newPartnerId, true);
    });

    socket.on('partner_disconnected', () => {
      setStatus('searching');
      setPartnerId(null);
      setMessages([]);
      cleanupPeer();
      socket.emit('find_match');
    });

    socket.on('webrtc_offer', async ({ offer, from }) => {
      await initializeWebRTC(from, false, offer);
    });

    socket.on('webrtc_answer', ({ answer }) => {
      if (peerRef.current) {
        peerRef.current.signal(answer);
      }
    });

    socket.on('webrtc_ice_candidate', ({ candidate }) => {
      if (peerRef.current) {
        peerRef.current.signal(candidate);
      }
    });

    socket.on('receive_message', ({ message }) => {
      setMessages(prev => [...prev, { text: message, isMine: false }]);
    });

    return () => {
      socket.off('searching');
      socket.off('match_found');
      socket.off('partner_disconnected');
      socket.off('webrtc_offer');
      socket.off('webrtc_answer');
      socket.off('webrtc_ice_candidate');
      socket.off('receive_message');
    };
  }, [socket]);

  // Inicializar WebRTC
  const initializeWebRTC = async (remoteId, initiator, offer = null) => {
    try {
      // Obtener stream local si no existe
      if (!localStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }

      // Crear peer con configuración de ICE servers (incluyendo TURN si está disponible)
      const peer = new Peer({
        initiator,
        trickle: true,
        stream: localStreamRef.current,
        config: {
          iceServers: iceServersRef.current || [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      peer.on('signal', (data) => {
        if (data.type === 'offer') {
          socket.emit('webrtc_offer', { offer: data, to: remoteId });
        } else if (data.type === 'answer') {
          socket.emit('webrtc_answer', { answer: data, to: remoteId });
        } else {
          socket.emit('webrtc_ice_candidate', { candidate: data, to: remoteId });
        }
      });

      peer.on('stream', (remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });

      peer.on('error', (err) => {
        console.error('Peer error:', err);
      });

      peer.on('close', () => {
        cleanupPeer();
      });

      if (offer) {
        peer.signal(offer);
      }

      peerRef.current = peer;
    } catch (error) {
      console.error('Error al inicializar WebRTC:', error);
      alert('No se pudo acceder a la cámara/micrófono. Verifica los permisos.');
    }
  };

  const cleanupPeer = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const handleFindMatch = () => {
    if (socket && status === 'disconnected') {
      setStatus('searching');
      socket.emit('find_match');
    }
  };

  const handleNext = () => {
    if (socket && partnerId) {
      cleanupPeer();
      socket.emit('next_user');
    }
  };

  const handleStop = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    cleanupPeer();
    setStatus('disconnected');
    setPartnerId(null);
    setMessages([]);
    if (socket) {
      socket.disconnect();
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim() && partnerId && socket) {
      socket.emit('send_message', { message: messageInput, to: partnerId });
      setMessages(prev => [...prev, { text: messageInput, isMine: true }]);
      setMessageInput('');
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Video Chat Aleatorio</h1>
        <div className="status">
          Estado: {status === 'disconnected' && 'Desconectado'}
          {status === 'searching' && 'Buscando...'}
          {status === 'connected' && 'Conectado'}
        </div>
      </header>

      <div className="main-content">
        <div className="video-container">
          <div className="video-wrapper">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="remote-video"
            />
            {status === 'searching' && (
              <div className="searching-overlay">
                <div className="spinner"></div>
                <p>Buscando persona...</p>
              </div>
            )}
            {status === 'disconnected' && (
              <div className="disconnected-overlay">
                <button onClick={handleFindMatch} className="start-button">
                  Comenzar
                </button>
              </div>
            )}
          </div>

          <div className="local-video-wrapper">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="local-video"
            />
          </div>
        </div>

        <div className="chat-container">
          <div className="messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.isMine ? 'mine' : 'theirs'}`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="message-form">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Escribe un mensaje..."
              disabled={status !== 'connected'}
              className="message-input"
            />
            <button
              type="submit"
              disabled={status !== 'connected'}
              className="send-button"
            >
              Enviar
            </button>
          </form>
        </div>
      </div>

      <div className="controls">
        <button
          onClick={toggleAudio}
          disabled={status === 'disconnected'}
          className={`control-button ${!audioEnabled ? 'disabled' : ''}`}
        >
          {audioEnabled ? '🎤 Audio' : '🔇 Audio'}
        </button>

        <button
          onClick={toggleVideo}
          disabled={status === 'disconnected'}
          className={`control-button ${!videoEnabled ? 'disabled' : ''}`}
        >
          {videoEnabled ? '📹 Video' : '🚫 Video'}
        </button>

        <button
          onClick={handleNext}
          disabled={status !== 'connected'}
          className="control-button next-button"
        >
          ⏭️ Siguiente
        </button>

        <button
          onClick={handleStop}
          disabled={status === 'disconnected'}
          className="control-button stop-button"
        >
          ⏹️ Detener
        </button>
      </div>
    </div>
  );
}

export default App;
