// ============================================================================
// DANTE QUEST — Application Entry Point
// ============================================================================

import { GameEngine } from './core/Engine.js';
import { HUDSystem } from './ui/HUD.js';
import { MenuSystem } from './ui/Menus.js';
import { NetworkSystem } from './core/Network.js';
import { sound } from './core/Audio.js';
import { Player } from './entities/Player.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const hud = new HUDSystem();
  const network = new NetworkSystem();

  let engine = null;

  const menus = new MenuSystem({
    onStartSolo: (charId, mapId) => {
      engine.startSession(charId, mapId);
    },

    onToggleSound: () => {
      return sound.toggleSound();
    },

    onOpenLobby: () => {
      setupLobbyUI();
    }
  });

  engine = new GameEngine(canvas, hud, menus);

  // HUD Pause Button Listener (Desktop and Mobile)
  const btnHudPause = document.getElementById('btn-hud-pause');
  if (btnHudPause) {
    let lastPauseTime = 0;
    const handlePause = (e) => {
      e.stopPropagation();
      if (e.cancelable && e.type === 'touchstart') {
        e.preventDefault();
      }
      const now = performance.now();
      if (now - lastPauseTime < 350) return;
      lastPauseTime = now;
      if (engine) engine.togglePause();
    };

    btnHudPause.addEventListener('click', handlePause);
    btnHudPause.addEventListener('touchstart', handlePause, { passive: false });
  }

  // Setup Multiplayer Lobby
  function setupLobbyUI() {
    const btnHost = document.getElementById('btn-host-room');
    const hostCodeDisplay = document.getElementById('host-code-display');
    const roomCodeText = document.getElementById('room-code-text');
    const btnJoin = document.getElementById('btn-join-room');
    const inputCode = document.getElementById('input-room-code');
    const btnStartLobby = document.getElementById('btn-lobby-start');
    const playersGrid = document.getElementById('lobby-players-grid');

    const updateLobbyPlayers = (playerList) => {
      if (!playersGrid) return;
      let html = '';
      for (let i = 0; i < 4; i++) {
        const p = playerList[i];
        if (p) {
          html += `
            <div class="lobby-player-slot occupied">
              <strong>${p.name}</strong><br>
              <small>${p.charClass}</small>
            </div>
          `;
        } else {
          html += `
            <div class="lobby-player-slot">
              <span>Vacío</span>
            </div>
          `;
        }
      }
      playersGrid.innerHTML = html;
    };

    updateLobbyPlayers([{ name: 'Tú (Líder)', charClass: menus.selectedCharId.toUpperCase() }]);

    // Host Room
    btnHost?.addEventListener('click', () => {
      btnHost.disabled = true;
      btnHost.textContent = 'Creando sala...';

      network.hostRoom((code) => {
        btnHost.classList.add('hidden');
        hostCodeDisplay?.classList.remove('hidden');
        if (roomCodeText) roomCodeText.textContent = code;
        btnStartLobby?.classList.remove('hidden');

        // On companion joins
        network.onPlayerJoined = (peerId) => {
          const remotePlayer = new Player(peerId, 'lyra', 40, 0, false);
          engine.players.push(remotePlayer);
          updateLobbyPlayers([
            { name: 'Tú (Líder)', charClass: menus.selectedCharId.toUpperCase() },
            { name: `Compañero (${peerId.slice(-4)})`, charClass: 'HECHICERA' }
          ]);
        };
      });
    });

    // Join Room
    btnJoin?.addEventListener('click', () => {
      const code = inputCode?.value.trim();
      if (!code) {
        alert('Por favor introduce un código de 4 caracteres.');
        return;
      }
      btnJoin.disabled = true;
      btnJoin.textContent = 'Conectando...';

      network.joinRoom(
        code,
        (joinedCode) => {
          btnJoin.textContent = '¡CONECTADO!';
          engine.startSession(menus.selectedCharId, menus.selectedMapId);
        },
        (errorMsg) => {
          alert(errorMsg);
          btnJoin.disabled = false;
          btnJoin.textContent = 'UNIRSE';
        }
      );
    });

    // Start Lobby Expedition
    btnStartLobby?.addEventListener('click', () => {
      engine.startSession(menus.selectedCharId, menus.selectedMapId);
    });
  }

  // Main 60 FPS Animation Loop
  function gameLoop(time) {
    engine.update(time);
    engine.render();
    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
});
