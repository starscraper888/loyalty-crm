-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  budget numeric(10,2),
  target_points int,
  target_members int,
  status text CHECK (status IN ('draft', 'active', 'completed', 'cancelled')) DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Campaign participants tracking
CREATE TABLE IF NOT EXISTS campaign_participants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  points_earned int NOT NULL,
  participated_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, profile_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_participants_campaign ON campaign_participants(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_participants_profile ON campaign_participants(profile_id);

-- RLS Policies
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_participants ENABLE ROW LEVEL SECURITY;

-- Campaigns policies
CREATE POLICY "Staff can view campaigns in their tenant" ON campaigns
  FOR SELECT USING (
    tenant_id = get_my_tenant_id() AND
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('owner', 'manager', 'staff', 'admin')
    )
  );

CREATE POLICY "Staff can manage campaigns" ON campaigns
  FOR ALL USING (
    tenant_id = get_my_tenant_id() AND
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('owner', 'manager', 'admin')
    )
  );

-- Campaign participants policies
CREATE POLICY "Staff can view campaign participants" ON campaign_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_participants.campaign_id 
      AND c.tenant_id = get_my_tenant_id()
      AND EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role IN ('owner', 'manager', 'staff', 'admin')
      )
    )
  );

CREATE POLICY "Staff can manage campaign participants" ON campaign_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_participants.campaign_id 
      AND c.tenant_id = get_my_tenant_id()
      AND EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role IN ('owner', 'manager', 'staff', 'admin')
      )
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
