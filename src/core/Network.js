// ============================================================================
// DANTE QUEST — Multiplayer System (WebRTC P2P Room Codes with PeerJS)
// ============================================================================

import Peer from 'peerjs';

export class NetworkSystem {
  constructor() {
    this.peer = null;
    this.isHost = false;
    this.roomCode = null;
    this.connections = []; // Connections to clients if host
    this.hostConnection = null; // Connection to host if client

    this.onPlayerJoined = () => {};
    this.onPlayerLeft = () => {};
    this.onStateReceived = () => {};
    this.onClientInput = () => {};

    this.isConnected = false;
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  hostRoom(onReady) {
    this.isHost = true;
    this.roomCode = this.generateRoomCode();
    const peerId = `dante-quest-${this.roomCode.toLowerCase()}`;

    try {
      this.peer = new Peer(peerId, {
        debug: 1
      });

      this.peer.on('open', (id) => {
        this.isConnected = true;
        onReady(this.roomCode);
      });

      this.peer.on('connection', (conn) => {
        this.setupHostConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.warn('PeerJS Host Error:', err);
        // Fallback retry with new code if ID taken
        if (err.type === 'unavailable-id') {
          this.hostRoom(onReady);
        }
      });
    } catch (e) {
      console.warn('PeerJS init failed:', e);
      onReady(this.roomCode);
    }
  }

  setupHostConnection(conn) {
    this.connections.push(conn);

    conn.on('open', () => {
      this.onPlayerJoined(conn.peer);
    });

    conn.on('data', (data) => {
      if (data.type === 'client_update') {
        this.onClientInput(conn.peer, data);
      }
    });

    conn.on('close', () => {
      this.connections = this.connections.filter(c => c !== conn);
      this.onPlayerLeft(conn.peer);
    });
  }

  joinRoom(code, onJoined, onError) {
    this.isHost = false;
    this.roomCode = code.toUpperCase().trim();
    const targetPeerId = `dante-quest-${this.roomCode.toLowerCase()}`;

    try {
      this.peer = new Peer({ debug: 1 });

      this.peer.on('open', () => {
        this.hostConnection = this.peer.connect(targetPeerId, {
          reliable: false // UDP-like for fast game state updates
        });

        this.hostConnection.on('open', () => {
          this.isConnected = true;
          onJoined(this.roomCode);
        });

        this.hostConnection.on('data', (data) => {
          if (data.type === 'world_sync') {
            this.onStateReceived(data);
          }
        });

        this.hostConnection.on('error', (err) => {
          onError('Error conectando a la sala.');
        });
      });

      this.peer.on('error', (err) => {
        onError('No se encontró la sala especificada.');
      });
    } catch (e) {
      onError('Error al inicializar conexión multijugador.');
    }
  }

  broadcastWorldState(state) {
    if (!this.isHost || this.connections.length === 0) return;
    const payload = {
      type: 'world_sync',
      ...state
    };
    for (const conn of this.connections) {
      if (conn.open) {
        conn.send(payload);
      }
    }
  }

  sendClientUpdate(playerData) {
    if (this.isHost || !this.hostConnection || !this.hostConnection.open) return;
    this.hostConnection.send({
      type: 'client_update',
      ...playerData
    });
  }
}
