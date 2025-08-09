# Product Requirements Document: Multiplayer Implementation for Just One Helper

## Executive Summary
This document outlines the technical implementation for adding multiplayer functionality to Just One Helper, a word guessing party game. The implementation uses Gweet, a lightweight real-time messaging service, to synchronize game state across multiple players without requiring a dedicated backend.

## Game Overview
Just One Helper is a collaborative word game where one player sees a secret word while others submit one-word clues to help a guesser identify the word. The app facilitates this gameplay through room-based multiplayer sessions.

## Technical Architecture

### Core Technology: Gweet API
Gweet (gweet.stavros.io) is a simple HTTP-based streaming service that enables real-time communication between clients through named channels.

#### API Endpoints

1. **POST Message to Channel**
   - Endpoint: `https://gweet.stavros.io/stream/{channel_key}/`
   - Method: POST
   - Content-Type: `application/x-www-form-urlencoded`
   - Body: URL-encoded key-value pairs
   - Purpose: Broadcasts messages to all listeners on the channel

2. **GET Historical Messages**
   - Endpoint: `https://gweet.stavros.io/stream/{channel_key}/?latest={n}`
   - Method: GET
   - Response Format:
   ```json
   {
     "messages": [
       {
         "created": "2025-08-09T22:34:06.602474122Z",
         "name": "channel_key",
         "values": {
           "key1": ["value1"],
           "key2": ["value2"]
         }
       }
     ]
   }
   ```
   - Purpose: Retrieves the last N messages from a channel

3. **GET Streaming Messages**
   - Endpoint: `https://gweet.stavros.io/stream/{channel_key}/?streaming=1`
   - Method: GET
   - Response: Newline-delimited JSON stream
   - Purpose: Opens a persistent connection for real-time message reception

## Implementation Details

### 1. Room System

On start, generate a UUID for the client (so each client knows its ID).

#### Room Code Generation
- Generate a 4-character alphabetic code (A-Z)
- Display prominently to room creator
- Allow manual entry for joining existing rooms

#### Channel Naming Convention
- Format: `justone-stavros-{room_code_lowercase}`
- Example: Room code "ABCD" → Channel "justone-stavros-abcd"
- Ensures namespace isolation and prevents collisions

### 2. Message Protocol

#### Message Types

**New Game Message**
```javascript
{
  user: 'user's uuid',
  type: 'newGame',
  word: 'Elephant',
  lang: 'en'  // or 'gr' for Greek
}
```

**Word Submission Message**
```javascript
{
  user: 'user's uuid',
  type: 'submitWord',
  word: 'Large'
}
```

### 3. Connection Management

#### Initial Connection Flow
1. Generate or input room code
2. Construct channel key
3. Fetch last 10 historical messages
4. Filter (ignore) messages older than 1 hour
5. Process valid messages to reconstruct game state
6. Establish streaming connection for real-time updates

#### Streaming Connection
```javascript
async function connectToGweet() {
  const channelKey = `justone-stavros-${roomCode.toLowerCase()}`;
  
  // Fetch historical messages
  const response = await fetch(`https://gweet.stavros.io/stream/${channelKey}/?latest=10`);
  const data = await response.json();
  
  // Process historical messages (filter by age)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  data.messages.forEach(msg => {
    if (new Date(msg.created) >= oneHourAgo) {
      handleGweetMessage(msg.values);
    }
  });
  
  // Establish streaming connection
  const streamResponse = await fetch(`https://gweet.stavros.io/stream/${channelKey}/?streaming=1`);
  const reader = streamResponse.body.getReader();
  
  // Process streaming messages
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    // Parse and handle incoming messages
  }
}
```

### 4. Message Handling

#### Parsing Strategy
Messages from Gweet can arrive in multiple formats:
1. Values object: `{ type: ["newGame"], word: ["Fall"] }`
2. JSON string: `'{"values": {"type": ["newGame"]}}'`
3. URL-encoded: `"type=newGame&word=Fall"`

The handler must accommodate all formats:
```javascript
function handleGweetMessage(data) {
  let type, word, lang;
  
  if (typeof data === 'object') {
    type = data.type?.[0];
    word = data.word?.[0];
    lang = data.lang?.[0];
  } else if (typeof data === 'string') {
    try {
      const jsonData = JSON.parse(data);
      // Extract from JSON
    } catch {
      // Parse as URL-encoded
      const params = new URLSearchParams(data);
      type = params.get('type');
      word = params.get('word');
    }
  }
  
  // Process based on message type
}
```

### 5. State Synchronization

#### Game State Management
- **Current Word**: Synchronized across all clients when "Get Word" is clicked
- **Submitted Words**: Each submission is broadcast and added to all clients' lists
- **Language Setting**: Included in new game messages
- **Player Identity**: Use the user's UUID to highlight own submission.

#### Conflict Resolution
- Last-write-wins for new game starts
- No conflict resolution for words
- Messages older than 1 hour are filtered out

### 6. Error Handling & Resilience

#### Automatic Reconnection
```javascript
catch (error) {
  if (error.name !== 'AbortError') {
    console.error('Gweet connection error:', error);
    setTimeout(() => {
      if (roomCode) {
        connectToGweet();
      }
    }, 5000);  // Retry after 5 seconds
  }
}
```

#### Connection Lifecycle
- Abort previous connections before establishing new ones
- Handle network interruptions gracefully
- Maintain local state during disconnections

## User Experience Flow

1. **Room Creation/Joining**
   - App generates room code on launch
   - User can use generated code or enter existing code
   - Connection established upon confirmation

2. **Game Flow**
   - Any player can start new game (select word)
   - All players receive word update instantly
   - Players submit clues independently
   - After a user has submitted their clue, they can see all other submitted clues for this word, with their clue at the top. They can also see the current room word.
   - Own submissions highlighted differently

3. **Visual Feedback**
   - Room code badge displayed persistently on the bottom left corner
   - Connection status implicit (messages appear)
   - Instant updates without refresh buttons

## Technical Considerations

### Advantages of Gweet
- No authentication required
- No server setup or maintenance
- Simple HTTP-based protocol
- Automatic message persistence
- Built-in streaming support

### Limitations & Mitigations
- Public channels (mitigated by random room codes)
- No built-in user management (handled client-side)
- Message age filtering required (1-hour window implemented)
- No guaranteed delivery (acceptable for this use case)

### Scalability
- Each room operates independently
- No cross-room communication required
- Linear scaling with number of active rooms
- Gweet handles connection pooling

## Security Considerations
- Room codes provide basic access control
- No sensitive data transmitted
- Client-side validation for game rules
- Messages are ephemeral (1-hour relevance window)
