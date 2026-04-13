-- Create opportunity_contacts table if it doesn't exist
create table if not exists public.opportunity_contacts (
  id uuid not null default extensions.uuid_generate_v4 (),
  opportunity_id uuid not null,
  contact_id uuid null,
  is_primary boolean null default false,
  created_at timestamp with time zone null default now(),
  constraint opportunity_contacts_pkey primary key (id),
  constraint opportunity_contacts_opportunity_id_contact_id_key unique (opportunity_id, contact_id),
  constraint opportunity_contacts_contact_id_fkey foreign key (contact_id) references contacts (id) on delete cascade,
  constraint opportunity_contacts_opportunity_id_fkey foreign key (opportunity_id) references opportunities (id) on delete cascade
) tablespace pg_default;

-- Create indexes for better query performance
create index if not exists opportunity_contacts_opportunity_id_idx on opportunity_contacts(opportunity_id);
create index if not exists opportunity_contacts_contact_id_idx on opportunity_contacts(contact_id);
create index if not exists opportunity_contacts_is_primary_idx on opportunity_contacts(is_primary);

-- Enable Row Level Security
alter table public.opportunity_contacts enable row level security;

-- Create RLS policies for opportunity_contacts (assuming team_id based access like other tables)
-- Note: Adjust these policies based on your actual permission model
create policy "Users can view opportunity_contacts for their team's opportunities" on opportunity_contacts for select
  using (
    opportunity_id in (
      select id from opportunities where workspace_id = auth.jwt() -> 'workspace_id'::text
    )
  );

create policy "Users can insert opportunity_contacts for their team's opportunities" on opportunity_contacts for insert
  with check (
    opportunity_id in (
      select id from opportunities where workspace_id = auth.jwt() -> 'workspace_id'::text
    )
  );

create policy "Users can update opportunity_contacts for their team's opportunities" on opportunity_contacts for update
  using (
    opportunity_id in (
      select id from opportunities where workspace_id = auth.jwt() -> 'workspace_id'::text
    )
  );

create policy "Users can delete opportunity_contacts for their team's opportunities" on opportunity_contacts for delete
  using (
    opportunity_id in (
      select id from opportunities where workspace_id = auth.jwt() -> 'workspace_id'::text
    )
  );
