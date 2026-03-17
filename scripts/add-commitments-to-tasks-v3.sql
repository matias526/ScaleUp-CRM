-- Add commitment tracking fields to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS meeting_id UUID REFERENCES internal_weekly_meetings(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_commitment BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reviewed_in_meeting_id UUID REFERENCES internal_weekly_meetings(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS commitment_status VARCHAR(20) CHECK (commitment_status IN ('completed', 'not_completed', 'partial')),
ADD COLUMN IF NOT EXISTS comments TEXT;

-- Add previous meeting reference to internal_weekly_meetings table
ALTER TABLE internal_weekly_meetings
ADD COLUMN IF NOT EXISTS previous_meeting_id UUID REFERENCES internal_weekly_meetings(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_meeting_id ON tasks(meeting_id);
CREATE INDEX IF NOT EXISTS idx_tasks_is_commitment ON tasks(is_commitment);
CREATE INDEX IF NOT EXISTS idx_tasks_reviewed_in_meeting ON tasks(reviewed_in_meeting_id);
CREATE INDEX IF NOT EXISTS idx_meetings_previous_meeting ON internal_weekly_meetings(previous_meeting_id);

-- Add comment explaining the new fields
COMMENT ON COLUMN tasks.meeting_id IS 'ID of the meeting where this commitment was created';
COMMENT ON COLUMN tasks.is_commitment IS 'Flag to identify if this task is a commitment from a meeting';
COMMENT ON COLUMN tasks.reviewed_in_meeting_id IS 'ID of the meeting where this commitment was reviewed';
COMMENT ON COLUMN tasks.commitment_status IS 'Status of commitment completion: completed, not_completed, or partial';
COMMENT ON COLUMN tasks.comments IS 'General comments about the task or commitment';
COMMENT ON COLUMN internal_weekly_meetings.previous_meeting_id IS 'Reference to the previous meeting in the sequence';
