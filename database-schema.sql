-- Enable foreign key support and better concurrency
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- Users table - Stores persistent user information
CREATE TABLE users (
    user_id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    last_seen_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Games table - Stores game metadata and current state
CREATE TABLE games (
    game_id TEXT PRIMARY KEY,
    initiator_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('waiting', 'active', 'suspended', 'completed')),
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    started_at INTEGER,
    ended_at INTEGER,
    current_turn_index INTEGER,
    is_victory BOOLEAN,
    total_turns INTEGER DEFAULT 0,
    cards_played INTEGER DEFAULT 0,
    last_updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (initiator_id) REFERENCES users(user_id)
);

-- Game_players table - Tracks players in each game and their status
CREATE TABLE game_players (
    game_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    join_order INTEGER NOT NULL,  -- Determines turn order
    is_connected BOOLEAN NOT NULL DEFAULT 1,
    last_connection_time INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    PRIMARY KEY (game_id, user_id),
    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Player_hands table - Tracks cards in each player's hand
CREATE TABLE player_hands (
    game_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    card_value INTEGER NOT NULL,
    card_id INTEGER NOT NULL,  -- Unique identifier for each physical card (1-100, duplicated for 2 decks)
    received_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    PRIMARY KEY (game_id, user_id, card_id),
    FOREIGN KEY (game_id, user_id) REFERENCES game_players(game_id, user_id) ON DELETE CASCADE
);

-- Game_piles table - Tracks the state of the four piles
CREATE TABLE game_piles (
    game_id TEXT NOT NULL,
    pile_index INTEGER NOT NULL CHECK (pile_index IN (0,1,2,3)),  -- 0,1 ascending, 2,3 descending
    pile_type TEXT NOT NULL CHECK (pile_type IN ('ascending', 'descending')),
    last_card_value INTEGER NOT NULL,
    PRIMARY KEY (game_id, pile_index),
    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE
);

-- Pile_cards table - Tracks cards played on each pile
CREATE TABLE pile_cards (
    game_id TEXT NOT NULL,
    pile_index INTEGER NOT NULL,
    card_value INTEGER NOT NULL,
    card_id INTEGER NOT NULL,
    played_by TEXT NOT NULL,
    played_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    play_order INTEGER NOT NULL,  -- Tracks order of cards in pile
    PRIMARY KEY (game_id, pile_index, card_id),
    FOREIGN KEY (game_id, pile_index) REFERENCES game_piles(game_id, pile_index) ON DELETE CASCADE,
    FOREIGN KEY (played_by) REFERENCES users(user_id)
);

-- Draw_pile table - Tracks remaining cards in draw pile
CREATE TABLE draw_pile (
    game_id TEXT NOT NULL,
    card_value INTEGER NOT NULL,
    card_id INTEGER NOT NULL,
    position INTEGER NOT NULL,  -- Card's position from top of deck
    PRIMARY KEY (game_id, card_id),
    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE
);

-- Pile_preferences table - Tracks player's pile preferences
CREATE TABLE pile_preferences (
    game_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    pile_index INTEGER NOT NULL,
    preference TEXT CHECK (preference IN ('like', 'love', NULL)),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    PRIMARY KEY (game_id, user_id, pile_index),
    FOREIGN KEY (game_id, pile_index) REFERENCES game_piles(game_id, pile_index) ON DELETE CASCADE,
    FOREIGN KEY (game_id, user_id) REFERENCES game_players(game_id, user_id) ON DELETE CASCADE
);

-- Chat_messages table - Stores game chat history
CREATE TABLE chat_messages (
    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    message TEXT NOT NULL,
    sent_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Create indexes for common queries
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_game_players_connection ON game_players(game_id, is_connected);
CREATE INDEX idx_chat_messages_game ON chat_messages(game_id, sent_at);
CREATE INDEX idx_player_hands_game ON player_hands(game_id, user_id);
CREATE INDEX idx_pile_cards_game ON pile_cards(game_id, pile_index, play_order);
CREATE INDEX idx_draw_pile_game ON draw_pile(game_id, position);

-- Views for common queries
CREATE VIEW active_games AS
SELECT g.*, COUNT(gp.user_id) as player_count
FROM games g
JOIN game_players gp ON g.game_id = gp.game_id
WHERE g.status IN ('waiting', 'active', 'suspended')
GROUP BY g.game_id;

CREATE VIEW player_card_counts AS
SELECT game_id, user_id, COUNT(*) as card_count
FROM player_hands
GROUP BY game_id, user_id;
