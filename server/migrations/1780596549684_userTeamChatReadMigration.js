export const up = (pgm) => {
    pgm.sql(`
    CREATE TABLE user_team_chat_read (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_user_team_read UNIQUE (user_id, team_id)
    );

    CREATE INDEX idx_user_team_chat_read_lookup ON user_team_chat_read(user_id, team_id);
    `);
};

export const down = (pgm) => {
    pgm.sql(`
        DROP TABLE IF EXISTS user_team_chat_read CASCADE;
    `)
};