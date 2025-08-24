# Network Architecture

## Overview

The application uses a serverless, peer-to-peer messaging architecture built on top of Gweet, a lightweight streaming message service. The system supports both offline single-player mode and online multiplayer mode with real-time synchronization across all connected clients.

## Core Components

### Network State Management

The application maintains network state through a centralized `GameState` object with the following network-related properties:

- **status**: Tracks the connection state (`OFFLINE`, `IN_PROGRESS`, `ENDED`)
- **roomCode**: Four-letter alphabetic code identifying the game room
- **clientId**: Persistent UUID for each client, stored in localStorage
- **username**: Display name for the player
- **userRole**: Current role in the game (`wordHolder`, `clueGiver`, or `null`)
- **controller**: AbortController instance for managing the streaming connection

### Client Identification

Each client generates and persists a unique UUID on first launch. This UUID serves as the permanent identifier for the client across all sessions and is stored in localStorage under the key `justone-uuid`. The UUID follows standard v4 format and remains consistent even when joining different rooms or reconnecting.

## Connection Architecture

### Room System

Rooms are identified by four-letter alphabetic codes (case-insensitive). The room code serves multiple purposes:

1. **Channel Key Generation**: Converted to lowercase and prefixed with `justone-stavros-` to form the Gweet channel key
2. **Deterministic Word Selection**: Used as a seed for shuffling the word pool, ensuring all players in a room see words in the same order
3. **URL Sharing**: Room codes can be shared via URL parameters for direct room joining

### Connection Flow

1. **Initial Connection**: When joining a room, the client:
   - Stores the room code and username
   - Initiates connection to Gweet
   - Fetches the last 50 historical messages
   - Establishes a streaming connection for real-time updates

2. **Message History Retrieval**:
   - Fetches recent messages via GET request to `https://gweet.stavros.io/stream/{channel}/?latest=50`
   - Processes historical messages chronologically to rebuild game state
   - Handles race conditions by queuing streaming messages that arrive during history fetch

3. **Streaming Connection**:
   - Establishes long-lived connection to `https://gweet.stavros.io/stream/{channel}/?streaming=1`
   - Processes server-sent events in real-time
   - Maintains connection with automatic reconnection on failure

### Reconnection Strategy

The system implements exponential backoff for reconnection:

1. **Initial Delay**: 1 second
2. **Maximum Delay**: 30 seconds
3. **Backoff Multiplier**: 1.5x per attempt
4. **Maximum Attempts**: Unlimited (continues until successful or manually disconnected)

On connection failure, the system:
- Displays user-friendly error messages
- Schedules automatic reconnection
- Preserves game state during disconnection
- Resynchronizes upon successful reconnection

## Message Protocol

### Message Format

Messages are transmitted as URL-encoded form data with the following structure:

- **id**: Unique message identifier (UUID format)
- **type**: Message type identifier
- **user**: Sender's client UUID
- **username**: Sender's display name
- **Additional fields**: Type-specific data

### Message Types

1. **playerJoined**
   - Announces a player entering the room
   - Sent automatically when joining a room
   - No additional data fields

2. **newGame**
   - Initiates a new game round
   - Fields:
     - `word`: The secret word
     - `lang`: Language code (`en` or `gr`)
     - `wordIndex`: Position in the shuffled word array

3. **submitWord**
   - Submits a clue word from a clue giver
   - Fields:
     - `word`: The submitted clue

4. **endRound**
   - Concludes the current game round
   - Fields:
     - `score`: Points earned this round (optional)
     - `totalScore`: Cumulative score
     - `totalGames`: Total games played
     - `skipped`: Boolean flag if round was skipped

### Message Deduplication

The system maintains a message log with deduplication based on message IDs. When processing messages:

1. Checks if message ID already exists in the log
2. Ignores duplicate messages
3. Maintains chronological order based on timestamps
4. Prevents duplicate state updates

## State Synchronization

### Message Replay System

The application uses an event-sourcing approach where game state is reconstructed by replaying all messages in chronological order:

1. **State Reset**: Clears current game state while preserving network configuration
2. **Message Processing**: Iterates through all messages chronologically
3. **State Reconstruction**: Rebuilds game state based on message sequence
4. **View Updates**: Updates UI to reflect current state

### Authoritative Scoring

To handle simultaneous scoring submissions:

1. Identifies the most recent game session (between `newGame` and `endRound`)
2. Finds the first `endRound` message after the last `newGame`
3. Uses this message as the authoritative score for the round
4. Ignores subsequent `endRound` messages for the same game

### Active Player Tracking

Maintains a set of active players by:

1. Adding players when they send `playerJoined` or `submitWord` messages
2. Clearing the list when a new game starts
3. Displaying current participants in the UI
4. Marking the current user with a special indicator

## Message Transmission

### Sending Messages

Messages are sent via POST requests to `https://gweet.stavros.io/stream/{channel}/` with:

1. **URL-encoded body** containing message fields
2. **Automatic retry** on network failure
3. **Local state update** before transmission (optimistic updates)
4. **Message logging** for replay consistency

### Message Queuing

During the initial connection phase:

1. Streaming messages are queued if historical fetch is still processing
2. Queue is sorted by timestamp after history is loaded
3. All queued messages are processed in order
4. Normal streaming processing resumes after queue is cleared

## Error Handling

### Connection Errors

The system handles various connection failure scenarios:

1. **Network Unavailable**: Displays "check internet connection" message
2. **Room Not Found**: Shows "room expired" notification
3. **Server Errors**: Indicates "temporarily unavailable" status
4. **Stream Interruption**: Automatically attempts reconnection

### Message Validation

Incoming messages are validated for:

1. Required fields based on message type
2. Sender identification
3. Timestamp validity
4. Duplicate detection

Invalid messages are silently discarded without affecting game state.

## Offline Mode

The application supports a fully functional offline mode:

1. **Status**: Network status set to `OFFLINE`
2. **Word Selection**: Random instead of deterministic
3. **No Synchronization**: All network operations are bypassed
4. **UI Adaptations**: Hides multiplayer-specific elements
5. **Local-only State**: No message logging or replay

## Performance Optimizations

### Streaming Message Buffer

Uses a text buffer to handle partial message chunks:

1. Accumulates incoming data
2. Splits on newline boundaries
3. Processes complete messages
4. Retains partial messages for next chunk

### Batch Processing

During state replay:

1. Processes all messages without intermediate UI updates
2. Updates UI once after complete replay
3. Reduces rendering overhead
4. Maintains consistency during reconstruction

### Connection Pooling

Maintains a single streaming connection per room:

1. Aborts existing connections before establishing new ones
2. Prevents connection leaks
3. Ensures single source of truth for incoming messages
4. Cleans up on room exit or page unload
