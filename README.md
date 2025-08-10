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

The app uses Gweet (a lightweight message streaming service) to enable real-time multiplayer functionality. Players can join the same room and share game state across devices.

### How it works

#### Room System
- Players join rooms using 4-letter codes (e.g., "ABCD")
- Each room creates a unique Gweet channel: `justone-stavros-{roomcode}`
- The room badge displays the current room code and can be clicked to copy it

#### Message Types

The protocol uses three message types sent via URL-encoded POST requests:

1. **New Game** (`type=newGame`)
   - Sent when a player starts a new round by clicking "Get Word"
   - Contains: `word` (the mystery word), `lang` (language), `user` (UUID)
   - Synchronizes the word across all players in the room

2. **Submit Word** (`type=submitWord`) 
   - Sent when a clue-giver submits their one-word clue
   - Contains: `word` (the clue), `user` (UUID)
   - Collects all submitted clues for display to the guesser

3. **End Round** (`type=endRound`)
   - Sent when any player clicks "End Round"
   - Clears the game state and returns all players to the main menu

#### Connection Management
- The app establishes a streaming connection to Gweet on room join
- Historical messages from the last hour are fetched on connection
- Automatic reconnection after 5 seconds if the connection drops
- Each client generates a unique UUID for identification

#### Game State Tracking
- Tracks timing of `newGame` and `endRound` events to determine if a game is in progress
- Prevents starting a new game while one is active
- Ensures proper state synchronization across all connected players

Enjoy playing Just One with your friends and family!