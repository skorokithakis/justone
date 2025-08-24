# Frontend Architecture

## Overview

The application is a single-page Progressive Web App (PWA) built with vanilla JavaScript, HTML5, and CSS3. It provides both offline single-player and online multiplayer modes for playing the "Just One" word-guessing game. The interface is optimized for mobile devices with touch interactions, fullscreen support, and responsive design.

## Application Structure

### Core HTML Structure

The application uses a single HTML file (`index.html`) that contains all views as separate div containers. Views are shown/hidden dynamically through CSS classes rather than DOM manipulation. The main structural elements include:

1. **Main Menu** - Central hub for game actions and player information
2. **Word Display** - Fullscreen view for showing the secret word
3. **Clue Input** - Form for submitting one-word clues
4. **Clue Display** - Fullscreen view for showing submitted clues
5. **Modal Overlays** - Room joining, scoring, and submitted words display
6. **Notification Areas** - Connection errors and score notifications

### State Management

The application maintains all state in a centralized `GameState` object loaded from `game.js`. This object serves as the single source of truth and contains:

#### Core Game State
- **word**: Current word being guessed
- **language**: Selected language (English or Greek)
- **wordDisplay**: Visual state of the word ('hidden', 'countdown', 'visible', 'blurred')
- **wordIndex**: Position in the deterministically shuffled word list
- **countdownTimer**: Timer ID for the 2-second countdown before word reveal
- **holdTimer**: Timer for the 500ms hold duration to toggle blur
- **holdProgress**: Animation progress value (0-100) for hold indicator
- **isHolding**: Boolean tracking current hold interaction state
- **holdAnimationFrame**: Animation frame ID for smooth progress animation

#### View State
- **current**: Active view identifier ('menu', 'word', 'clueIn', 'clue')

#### Network State
- **status**: Connection state ('OFFLINE', 'IN_PROGRESS', 'ENDED')
- **roomCode**: Four-letter room identifier
- **clientId**: Persistent UUID for the client
- **username**: Player's display name
- **userRole**: Current game role ('wordHolder', 'clueGiver', or null)
- **controller**: AbortController for managing WebSocket connections

#### Game Data
- **submissions**: Array of submitted clues with word, user ID, and username
- **scoring**: Object containing totalScore and totalGames counters

### Client Identification

Each client generates a UUID v4 identifier on first launch, which is persisted in localStorage under the key `justone-uuid`. This identifier remains constant across sessions and room changes, providing consistent player tracking.

## View Management

### View System

The application uses a simple view switching mechanism where all views exist in the DOM simultaneously. View transitions are managed by:

1. Adding/removing the `hidden` CSS class on view containers
2. Updating the `GameState.view.current` property
3. Managing browser history for back button support
4. Updating button visibility based on current state

### View Transitions

Views transition through specific flows based on user role:

**Word Holder Flow**:
1. Menu → Word Display (with countdown)
2. Word Display → Menu (via back button)
3. Can toggle word blur with tap (instant) or hold (500ms)

**Clue Giver Flow**:
1. Menu → Clue Input
2. Clue Input → Submitted Words Display (after submission)
3. Submitted Words → Clue Display (showing own clue)
4. Any view → Menu (via back button or round end)

### Fullscreen Management

The application automatically enters fullscreen mode when displaying words or clues, except on iOS devices where programmatic fullscreen is not supported. Fullscreen is exited when returning to the menu or when a round ends.

## User Interface Components

### Main Menu

The main menu serves as the game's control center, displaying:

1. **Score Display** - Shows cumulative score and games played (hidden in offline mode)
2. **Language Picker** - Radio buttons for English/Greek selection
3. **Player List** - Active players in the current room with "You" indicator
4. **Action Buttons**:
   - "Get Word" - Starts new round or returns to existing word
   - "Type Clue" - Opens clue input for clue givers

Button states are dynamically updated based on:
- Network status (offline/online)
- Game progress (ended/in-progress)
- User role (word holder/clue giver)

### Word Display

The word display view provides a fullscreen presentation with:

1. **Countdown Mode** - Shows numbers 2, 1 before revealing word
2. **Visible Mode** - Displays the actual word
3. **Blurred Mode** - Shows word with CSS blur filter

Word text automatically scales to fit the viewport using a binary search algorithm that finds the optimal font size between 20px and 300px.

### Hold-to-Toggle Blur

The word display implements a sophisticated blur toggle system:

1. **Instant Toggle** - Tap when word is visible immediately applies blur
2. **Hold to Reveal** - When blurred, must hold for 500ms to reveal
3. **Visual Feedback** - Circular progress indicator shows hold progress
4. **Haptic Feedback** - Vibration on supported devices
5. **Audio Feedback** - 800Hz tone plays when blur state changes

### Clue Input

The clue submission interface includes:

1. **Text Input** - Single-word validation with 30-character limit
2. **Submit Button** - Arrow button for submission
3. **Pattern Validation** - Prevents spaces in submissions
4. **Auto-focus** - Input field receives focus automatically

### Submitted Words Display

After submitting a clue, players see:

1. **Current Word** - The secret word being guessed
2. **Submitted Clues List** - All submitted clues with usernames
3. **Distance-Based Coloring** - Visual similarity indicators:
   - Red background: Levenshtein distance 0 (identical)
   - Orange background: Levenshtein distance 1
   - Yellow background: Levenshtein distance 2
   - Grey background: Distance > 2 (different words)
4. **Own Submission** - Highlighted with special styling and "(You)" label

### Levenshtein Distance Calculation

The application uses an optimized Levenshtein distance algorithm with:

1. **Maximum Distance Threshold** - Set to 2 for performance
2. **Early Termination** - Stops calculation if distance exceeds threshold
3. **Case-Insensitive Comparison** - All comparisons ignore case
4. **Efficient Matrix Computation** - Only calculates necessary cells

## Room Management

### Room Modal

The room joining interface appears on application load and provides:

1. **Name Input** - Player name with 20-character limit, persisted in localStorage
2. **Room Code Input** - Four-letter alphabetic code, case-insensitive
3. **Action Buttons**:
   - "New Room" - Generates random room code
   - "Join Room" - Connects to existing room
   - "Play Offline" - Starts single-player mode

### URL-Based Room Sharing

Rooms can be shared via URL parameters:
- Format: `https://example.com/?room=ABCD`
- Auto-join occurs if valid room code and saved username exist
- Pre-fills room code if only code is present in URL

### Room Badge

Active room display in top-right corner:
- Shows current room code
- Click to copy code to clipboard
- Visual feedback shows "Copied!" on successful copy

## Scoring System

### Scoring Modal

The scoring interface presents after each round with:

1. **Word Display** - Shows the word that was being guessed
2. **Scoring Options**:
   - Correct (+1 point) - Green button
   - Pass (0 points) - Neutral button
   - Fail (-1 point) - Red button
   - Skip Round - Doesn't affect score or game count
3. **Cancel Option** - Returns to game without scoring

### Score Notifications

Temporary notifications appear for 4 seconds showing:
- Score change with appropriate icon (✓, →, ✗, ⊘)
- Word that was scored
- Player who initiated the scoring
- Color-coded backgrounds (green, neutral, red)

## Word Selection

### Deterministic Shuffling

In multiplayer mode, words are selected deterministically:

1. **Seed Generation** - Room code converted to numeric seed
2. **Array Shuffling** - Fisher-Yates shuffle with seeded random
3. **Sequential Selection** - Words picked in order from shuffled array
4. **Wraparound** - Returns to start after exhausting word pool

This ensures all players in a room see words in the same sequence.

### Offline Mode

In offline mode, words are selected randomly without deterministic ordering, allowing for a more varied single-player experience.

## Dynamic Text Scaling

The application implements a FitText-like algorithm for responsive text sizing:

1. **Binary Search** - Efficiently finds optimal font size
2. **Container Awareness** - Considers both width and height constraints
3. **Safety Margins** - Uses 90% of container dimensions
4. **Range Limits** - Constrains size between min and max values

## Progressive Web App Features

### Manifest Configuration

The PWA manifest enables:
- Home screen installation
- Custom app icon (192x192px)
- Fullscreen display mode
- Theme color matching app design
- Offline capability

### Mobile Optimizations

1. **Viewport Configuration** - Prevents zooming and ensures proper scaling
2. **Touch Optimization** - All interactive elements meet 44x44px minimum
3. **iOS Compatibility** - Apple-specific meta tags for web app behavior
4. **Orientation Support** - Works in both portrait and landscape

## Event Handling

### Touch and Mouse Events

The application handles both touch and mouse interactions:

1. **Touch Events** - Primary interaction method for mobile
2. **Mouse Events** - Fallback for desktop browsers
3. **Unified Handlers** - Same logic for both input types
4. **Gesture Prevention** - Disables unwanted browser gestures

### Keyboard Support

1. **Enter Key** - Submits forms and confirms actions
2. **Browser Back Button** - Returns to previous view or menu
3. **Form Inputs** - Standard keyboard interaction for text entry

### History Management

Browser history is managed to support natural back button behavior:

1. **State Pushing** - New states added when changing views
2. **State Replacement** - Menu state replaces rather than stacks
3. **Popstate Handling** - Responds to browser back/forward buttons

## Connection Error Handling

### Error Display

Connection errors are shown in a dismissible notification bar:

1. **Error Types** - Different messages for various failure modes
2. **Auto-Dismiss** - Errors hide after timeout (configurable)
3. **Manual Dismiss** - X button allows immediate dismissal
4. **Reconnection Status** - Shows countdown to next retry attempt

### Reconnection Strategy

Implements exponential backoff with:
1. **Immediate Retry** - First reconnection attempt has no delay
2. **Progressive Delays** - 0ms, 1s, 2s, then 5s maximum
3. **Persistent Attempts** - Continues until successful
4. **User Feedback** - Shows retry countdown in error message

## Performance Optimizations

### Efficient Rendering

1. **Class-Based Toggling** - Uses CSS classes rather than inline styles
2. **Hidden Display** - Uses `display: none` for invisible elements
3. **Batch Updates** - Groups DOM modifications where possible
4. **Animation Frames** - Uses requestAnimationFrame for smooth animations

### Memory Management

1. **Timer Cleanup** - Clears all intervals and timeouts when not needed
2. **Event Listener Management** - Properly removes listeners on cleanup
3. **AbortController Usage** - Cancels fetch requests on navigation
4. **State Reset** - Clears unnecessary data between rounds

### Network Optimization

1. **Message Deduplication** - Prevents processing duplicate messages
2. **Batch Processing** - Processes message history without intermediate updates
3. **Queue Management** - Handles race conditions during initial connection
4. **Streaming Buffer** - Efficiently processes partial message chunks

## Accessibility Considerations

### Visual Design

1. **High Contrast** - Clear color differentiation for game states
2. **Large Touch Targets** - Minimum 44x44px for all buttons
3. **Readable Fonts** - Monospace font for clarity
4. **Color Coding** - Semantic colors with additional text indicators

### Interaction Patterns

1. **Clear Feedback** - Visual, haptic, and audio feedback for actions
2. **Loading States** - Countdown timers show progress
3. **Error Messages** - Clear, actionable error descriptions
4. **Status Indicators** - Room badges and player counts