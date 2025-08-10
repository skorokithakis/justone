// Unified game state management
const GameState = {
  // Core game state
  game: {
    word: '',           // Current word being guessed
    language: 'en',     // Selected language
    wordDisplay: 'hidden', // 'hidden', 'countdown', 'visible', 'blurred'
    countdownTimer: null,  // Timer ID for countdown
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
    if (this.game.countdownTimer) {
      clearInterval(this.game.countdownTimer);
      this.game.countdownTimer = null;
    }

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

// Initialize client ID on load
GameState.network.clientId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

// Export for use in main script
window.GameState = GameState;