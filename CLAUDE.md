# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Random video chat application (similar to Omegle) that connects users anonymously for video/audio conversations and text chat. Users are randomly paired with others worldwide, with the ability to skip to the next person or disconnect entirely.

## Architecture

**Client-Server Architecture with WebRTC**

- **Client** (`/client`): React SPA using Vite
- **Server** (`/server`): Node.js Express server with Socket.io for signaling
- **Communication**:
  - Socket.io for signaling and matchmaking
  - WebRTC (via simple-peer) for peer-to-peer video/audio
  - Text chat messages routed through Socket.io server

**Key Components:**

1. **Matchmaking System** (`server/index.js`):
   - `waitingQueue`: Array of socket IDs waiting for a match
   - `activeConnections`: Map tracking paired users and their connection status
   - `matchUsers()`: Pairs first two available users in queue
   - `disconnectPair()`: Handles cleanup when users disconnect

2. **WebRTC Connection** (`client/src/App.jsx`):
   - Uses simple-peer library for WebRTC abstraction
   - Initiator/receiver pattern for establishing connections
   - STUN servers for NAT traversal (Google's public STUN servers)
   - Signaling via Socket.io events: `webrtc_offer`, `webrtc_answer`, `webrtc_ice_candidate`

3. **State Management** (`client/src/App.jsx`):
   - Three connection states: `disconnected`, `searching`, `connected`
   - Refs for video elements, peer connection, and local stream
   - React hooks for Socket.io event listeners

## Development Commands

**Server:**
```bash
cd server
npm install
npm run dev     # Development with nodemon auto-reload
npm start       # Production
```

**Client:**
```bash
cd client
npm install
npm run dev     # Start dev server on http://localhost:5173
npm run build   # Production build
```

**Run Both:**
Open two terminals and run server and client separately. Server runs on port 3000, client on port 5173.

## Key Socket.io Events

**Client → Server:**
- `find_match`: User requests to be added to matchmaking queue
- `next_user`: User skips current partner, rejoins queue
- `webrtc_offer`, `webrtc_answer`, `webrtc_ice_candidate`: WebRTC signaling
- `send_message`: Send text message to partner
- `disconnect`: User closes app or loses connection

**Server → Client:**
- `searching`: User is in queue waiting for match
- `match_found`: Match found, includes `partnerId`
- `partner_disconnected`: Current partner disconnected
- `webrtc_offer`, `webrtc_answer`, `webrtc_ice_candidate`: WebRTC signaling relay
- `receive_message`: Receive text message from partner

## Connection Flow

1. User clicks "Comenzar" → emits `find_match`
2. Server adds to `waitingQueue`, calls `matchUsers()`
3. When 2+ users in queue → Server pairs them, emits `match_found` to both
4. Both clients receive `partnerId`, initiator creates WebRTC offer
5. Offer/answer/ICE candidates exchanged via Socket.io
6. WebRTC peer connection established, video/audio streams directly between peers
7. Text chat messages routed through server (not peer-to-peer)
8. User clicks "Siguiente" → `disconnectPair()` cleans up, both rejoin queue
9. User clicks "Detener" → disconnect socket, stop media streams

## Important Implementation Details

- **Local video mirrored** (`transform: scaleX(-1)`) for natural user experience
- **Peer cleanup critical**: Always destroy peer and clear refs when disconnecting
- **Stream persistence**: Local stream reused across multiple matches until user stops
- **Partner verification**: Server checks both sockets still connected before pairing
- **Auto-reconnect**: If partner disconnects, user automatically rejoins queue

## Configuration

- **Server URL**: Hardcoded in `client/src/App.jsx` as `http://localhost:3000`
- **STUN servers**: Using Google's public STUN servers (no TURN configured)
- **CORS**: Configured to allow `http://localhost:5173`

## Potential Improvements

- Add TURN server for connections behind strict NATs/firewalls
- Implement room-based system or interest matching
- Add user reporting/moderation features
- Replace in-memory queue with Redis for horizontal scaling
- Add reconnection logic for network interruptions
- Implement typing indicators in chat
- Add connection quality indicators
