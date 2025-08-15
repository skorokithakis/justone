// Unified game state management
const GameState = {
  // Core game state
  game: {
    word: '',           // Current word being guessed
    language: 'en',     // Selected language
    wordDisplay: 'hidden', // 'hidden', 'countdown', 'visible', 'blurred'
    wordIndex: 0,       // Current index in the shuffled word list
    countdownTimer: null,  // Timer ID for countdown
    holdTimer: null,       // Timer for 500ms hold duration
    holdProgress: 0,       // Progress value (0-100) for animation
    isHolding: false,      // Track current hold state
    holdAnimationFrame: null, // Animation frame ID for progress animation
  },

  // View state
  view: {
    current: 'menu',    // 'menu', 'word', 'clueIn', 'clue'
  },

  // Network state
  network: {
    status: 'ENDED',    // 'OFFLINE', 'IN_PROGRESS', 'ENDED'
    roomCode: '',
    clientId: '',
    username: '',       // User's display name
    userRole: null,     // 'wordHolder', 'clueGiver', or null
    controller: null,   // WebSocket controller
  },

  // Submissions state
  submissions: [],      // Array of {word: string, user: string, username: string}

  // Helper methods
  isOffline() {
    return this.network.status === 'OFFLINE';
  },

  isInProgress() {
    return this.network.status === 'IN_PROGRESS';
  },

  isWordHolder() {
    return this.network.userRole === 'wordHolder';
  },

  isClueGiver() {
    return this.network.userRole === 'clueGiver';
  },

  hasSubmitted() {
    return this.submissions.some(s => s.user === this.network.clientId);
  },

  getOwnSubmission() {
    return this.submissions.find(s => s.user === this.network.clientId);
  },

  reset() {
    // Reset game state
    this.game.word = '';
    this.game.wordDisplay = 'hidden';
    // Don't reset wordIndex - it persists for the room session.
    if (this.game.countdownTimer) {
      clearInterval(this.game.countdownTimer);
      this.game.countdownTimer = null;
    }
    // Reset hold state
    if (this.game.holdTimer) {
      clearTimeout(this.game.holdTimer);
      this.game.holdTimer = null;
    }
    if (this.game.holdAnimationFrame) {
      cancelAnimationFrame(this.game.holdAnimationFrame);
      this.game.holdAnimationFrame = null;
    }
    this.game.holdProgress = 0;
    this.game.isHolding = false;

    // Reset network state (keep connection info)
    this.network.userRole = null;
    if (this.network.status !== 'OFFLINE') {
      this.network.status = 'ENDED';
    }

    // Clear submissions
    this.submissions = [];
  },

  startNewGame(word, language, role) {
    this.game.word = word;
    this.game.language = language;
    this.network.status = 'IN_PROGRESS';
    this.network.userRole = role;
    this.submissions = [];
  }
};

// Initialize client ID on load - persist in localStorage
function getOrCreateUUID() {
  const storageKey = 'justone-uuid';
  let uuid = localStorage.getItem(storageKey);

  if (!uuid) {
    // Generate new UUID if not found
    uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    localStorage.setItem(storageKey, uuid);
  }

  return uuid;
}

GameState.network.clientId = getOrCreateUUID();

// Export for use in main script
window.GameState = GameState;