-- Ensure whatsapp_rates table has data
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
ON CONFLICT DO NOTHING;
