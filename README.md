# Just One Helper

A digital companion app for the board game "Just One" - a cooperative party game where players work together to guess mystery words.

## How to play Just One

### Game overview
Just One is a cooperative party game where one player (the guesser) tries to guess a mystery word based on one-word clues given by other players. The catch: duplicate clues are eliminated before the guesser sees them.

### Using this app

#### Setup
1. Open `index.html` in a web browser on your phone or tablet.
2. Select your language (English or Greek).
3. Use the fullscreen button (⛶) in the top-right corner for the best experience.

#### For the guesser
1. Click **"Get Word"** to display a random mystery word.
2. A 2-second countdown appears before revealing the word.
3. Show the screen to other players (not the guesser!) so they can see the word.
4. The other players write their one-word clues on paper or boards.
5. After removing duplicates, the remaining clues are shown to the guesser.

#### For clue givers
1. Click **"Type Clue"** to enter your one-word clue digitally.
2. Type your clue (only single words are allowed - no spaces).
3. The clue displays fullscreen for easy viewing.
4. Compare with other players to identify and remove duplicates.

### Game rules reminder
- Clues must be exactly one word.
- No variations of the mystery word.
- No translations or phonetic spellings.
- Duplicate clues (even if spelled differently) are removed.
- The guesser has only one attempt to guess the word.

### Navigation
- Use the back arrow (←) to return to the main menu at any time.
- When leaving a word display, you'll be asked to confirm to prevent accidental loss.

### Features
- 50 random words in each language.
- Fullscreen display for maximum visibility.
- Mobile-optimized interface.
- Festive animated background streamers.

## Multiplayer Network Protocol

The app uses Gweet (gweet.stavros.io) as a serverless message relay service to enable real-time multiplayer functionality. Gweet provides a simple HTTP-based streaming service that allows clients to post messages to channels and stream them using Server-Sent Events (SSE).

### Network Architecture

#### Channel System
- Players join rooms using 4-letter codes (e.g., "ABCD")
- Each room creates a unique Gweet channel: `justone-stavros-{roomcode}`
- The room badge displays the current room code and can be clicked to copy it
- Messages are posted to and streamed from these channels

#### Client Identification
- Each client generates a UUID on page load for unique identification
- The UUID is included with all messages to identify the sender
- Allows tracking which player holds the word vs who gives clues

#### Network States
The game manages three network states:
- **OFFLINE**: Playing without network connectivity (single device mode)
- **IN_PROGRESS**: Active game session with a word holder and clue givers
- **ENDED**: Game finished, waiting for someone to start a new round

### Message Protocol

#### Message Types
The protocol uses three message types sent via URL-encoded POST requests:

1. **New Game** (`type=newGame`)
   - Sent when a player starts a new round by clicking "Get Word"
   - Contains: `word` (the mystery word), `lang` (language), `user` (UUID)
   - Sets the sender as `wordHolder` and all others as `clueGiver`
   - Transitions network state to IN_PROGRESS

2. **Submit Word** (`type=submitWord`)
   - Sent when a clue-giver submits their one-word clue
   - Contains: `word` (the clue), `user` (UUID)
   - Collects all submitted clues for display with duplicate prevention

3. **End Round** (`type=endRound`)
   - Sent when any player clicks "End Round"
   - Clears all game state and returns players to main menu
   - Transitions network state to ENDED

#### Message Format
- Supports both JSON and URL-encoded formats
- All messages include the sender's UUID
- Messages are processed sequentially to maintain consistency

### Connection Flow

#### Initial Connection
1. Fetches last 50 historical messages from the channel
2. Filters out messages older than 10 minutes
3. Finds the last `endRound` message and only processes messages after it
4. Establishes SSE connection for real-time updates
5. Updates game state based on processed messages

#### Streaming Connection
- Uses fetch API with streaming response for real-time messages
- Maintains a buffer for handling incomplete message chunks
- Parses messages line by line from the SSE stream
- Automatically reconnects after 5 seconds on connection failure

### Synchronization Features

#### Historical Message Recovery
- When joining a room mid-game, recovers recent game state
- Only processes messages after the last round end
- Ensures new players see the current word and submitted clues

#### Role Management
- Tracks `wordHolderUUID` to identify who has the mystery word
- Each client knows their role: `wordHolder` or `clueGiver`
- UI buttons are enabled/disabled based on current role

#### Game Flow Control
- Prevents multiple simultaneous games in the same room
- Uses network state transitions to manage game lifecycle
- Ensures only appropriate actions are available based on game state

#### Duplicate Prevention
- Checks for duplicate word submissions before adding to list
- Displays submitted words with visual distance indicators
- Uses Levenshtein distance to show word similarity

### Offline Mode

The app supports a fully offline mode where:
- No network messages are sent or received
- Both "Get Word" and "Type Clue" buttons remain enabled
- No room code or multiplayer features are shown
- Perfect for single-device play with physical clue cards

### Technical Implementation

The netcode is implemented entirely client-side using vanilla JavaScript. Key features:
- Stateless server (Gweet only relays messages)
- All game logic lives in the clients
- Clients coordinate through message passing
- No persistent server-side state required
- Resilient to network interruptions with automatic reconnection

## State Management Architecture

The application uses a unified `GameState` object to manage all application state, providing a clean and maintainable architecture.

### State Structure

The state is organized into logical groups:

```javascript
GameState = {
  game: {
    word: '',           // Current mystery word
    language: 'en',     // Selected language ('en' or 'gr')
    wordDisplay: '',    // Display state: 'hidden', 'countdown', 'visible', 'blurred'
    countdownTimer: null // Timer ID for countdown
  },

  view: {
    current: 'menu'     // Current view: 'menu', 'word', 'clueIn', 'clue'
  },

  network: {
    status: 'ENDED',    // Network state: 'OFFLINE', 'IN_PROGRESS', 'ENDED'
    roomCode: '',       // 4-letter room code
    clientId: '',       // Unique client UUID
    userRole: null,     // Player role: 'wordHolder', 'clueGiver', or null
    controller: null    // WebSocket controller for connection management
  },

  submissions: []       // Array of submitted clues: {word: string, user: string}
}
```

### Helper Methods

The GameState object provides convenient helper methods:

- `isOffline()` - Check if in offline mode
- `isInProgress()` - Check if game is active
- `isWordHolder()` - Check if current player holds the word
- `isClueGiver()` - Check if current player gives clues
- `hasSubmitted()` - Check if player submitted a clue (derived from submissions)
- `getOwnSubmission()` - Get current player's submitted clue
- `reset()` - Clear all game state
- `startNewGame(word, language, role)` - Initialize new game

### State Benefits

This unified approach provides several advantages:
- **Single source of truth** - All state in one organized object
- **No duplicate tracking** - `hasSubmitted()` is derived from submissions array
- **Cleaner code** - Helper methods reduce repetitive state checks
- **Easier debugging** - Complete state visible in one place
- **Better maintainability** - Logical grouping makes updates simpler

The word display state combines what were previously separate `wordRevealed` and `wordBlurred` booleans into a single enum, preventing impossible states and making the display logic clearer.

Enjoy playing Just One with your friends and family!
