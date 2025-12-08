-- Create whatsapp_rates table for cost calculator
CREATE TABLE IF NOT EXISTS whatsapp_rates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_code text NOT NULL,
  category text NOT NULL,
  rate decimal(10, 4) NOT NULL,
  currency text NOT NULL DEFAULT 'MYR',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(country_code, category)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_rates_country_category ON whatsapp_rates(country_code, category);

-- Insert default rates
INSERT INTO whatsapp_rates (country_code, category, rate, currency) VALUES
('MY', 'marketing', 0.0433, 'MYR'),
('MY', 'utility', 0.0289, 'MYR'),
('MY', 'authentication', 0.0357, 'MYR'),
('SG', 'marketing', 0.0542, 'SGD'),
('SG', 'utility', 0.0205, 'SGD'),
('SG', 'authentication', 0.0410, 'SGD'),
('ID', 'marketing', 0.0550, 'USD'),
('ID', 'utility', 0.0263, 'USD'),
('ID', 'authentication', 0.0389, 'USD')
ON CONFLICT (country_code, category) DO NOTHING;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_whatsapp_rates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_whatsapp_rates_updated_at
    BEFORE UPDATE ON whatsapp_rates
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_rates_updated_at();
