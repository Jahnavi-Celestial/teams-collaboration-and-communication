export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255),         
        google_id VARCHAR(255) UNIQUE, 
        avatar_url VARCHAR(500),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    `);

  pgm.sql(`
    CREATE TABLE teams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_public BOOLEAN NOT NULL DEFAULT TRUE,
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    `);

  pgm.sql(`
    CREATE TYPE team_role AS ENUM ('ADMIN', 'MEMBER');

    CREATE TABLE team_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role team_role NOT NULL DEFAULT 'MEMBER',
        joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (team_id, user_id)
    );

    CREATE INDEX idx_team_members_team ON team_members(team_id);
    CREATE INDEX idx_team_members_user ON team_members(user_id);
    `);

  pgm.sql(`
    CREATE TABLE messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        content_encrypted TEXT NOT NULL,
        initialization_vector VARCHAR(64) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_messages_team ON messages(team_id, created_at DESC);
    `);

  pgm.sql(`
    CREATE TYPE task_status AS ENUM (
        'PENDING',
        'IN_PROGRESS',
        'COMPLETED',
        'MISSED_DEADLINE'
    );

    CREATE TABLE tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        subject VARCHAR(255) NOT NULL,
        description TEXT,
        assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
        assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        status task_status NOT NULL DEFAULT 'PENDING',
        deadline TIMESTAMPTZ,
        deadline_missed_at TIMESTAMPTZ,  
        deadline_unlocked BOOLEAN NOT NULL DEFAULT FALSE, 
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_tasks_team ON tasks(team_id);
    CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
    CREATE INDEX idx_tasks_assigned_by ON tasks(assigned_by);
    CREATE INDEX idx_tasks_deadline ON tasks(deadline) WHERE status NOT IN ('COMPLETED');
    `);

  pgm.sql(`
    CREATE TYPE request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

    CREATE TABLE deadline_extension_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message TEXT,
        status request_status NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        resolved_at TIMESTAMPTZ
    );
    `);

  pgm.sql(`
    CREATE TYPE notification_type AS ENUM (
        'TEAM_JOINED',          
        'MEMBER_ADDED',        
        'ROLE_CHANGED',       
        'TASK_ASSIGNED',       
        'TASK_DEADLINE_MISSED',
        'EXTENSION_REQUESTED', 
        'EXTENSION_RESOLVED'   
    );

    CREATE TABLE notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type notification_type NOT NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT,
        team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
    `);
};

export const down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS notifications CASCADE;
    DROP TABLE IF EXISTS deadline_extension_requests CASCADE;
    DROP TABLE IF EXISTS tasks CASCADE;
    DROP TABLE IF EXISTS messages CASCADE;
    DROP TABLE IF EXISTS team_members CASCADE;
    DROP TABLE IF EXISTS teams CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TYPE IF EXISTS notification_type;
    DROP TYPE IF EXISTS request_status;
    DROP TYPE IF EXISTS task_status;
    DROP TYPE IF EXISTS team_role;
    `);
};
