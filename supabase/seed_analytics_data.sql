-- Seed Data for Analytics Testing
-- This creates 10 test customers with realistic transaction history

-- Get the first tenant_id (assuming you have one)
DO $$
DECLARE
    test_tenant_id uuid;
BEGIN
    SELECT id INTO test_tenant_id FROM tenants LIMIT 1;
    
    IF test_tenant_id IS NULL THEN
        -- Create a test tenant if none exists
        INSERT INTO tenants (name) VALUES ('Demo Shop') RETURNING id INTO test_tenant_id;
    END IF;

    -- Create 10 test members
    INSERT INTO profiles (id, tenant_id, role, phone, full_name, points_balance, created_at) VALUES
    (gen_random_uuid(), test_tenant_id, 'member', '+60123456001', 'Alice Tan', 0, NOW() - INTERVAL '6 months'),
    (gen_random_uuid(), test_tenant_id, 'member', '+60123456002', 'Bob Lee', 0, NOW() - INTERVAL '5 months'),
    (gen_random_uuid(), test_tenant_id, 'member', '+60123456003', 'Charlie Wong', 0, NOW() - INTERVAL '4 months'),
    (gen_random_uuid(), test_tenant_id, 'member', '+60123456004', 'Diana Lim', 0, NOW() - INTERVAL '3 months'),
    (gen_random_uuid(), test_tenant_id, 'member', '+60123456005', 'Ethan Ng', 0, NOW() - INTERVAL '90 days'),
    (gen_random_uuid(), test_tenant_id, 'member', '+60123456006', 'Fiona Chen', 0, NOW() - INTERVAL '60 days'),
    (gen_random_uuid(), test_tenant_id, 'member', '+60123456007', 'George Ooi', 0, NOW() - INTERVAL '45 days'),
    (gen_random_uuid(), test_tenant_id, 'member', '+60123456008', 'Hannah Tan', 0, NOW() - INTERVAL '30 days'),
    (gen_random_uuid(), test_tenant_id, 'member', '+60123456009', 'Isaac Koh', 0, NOW() - INTERVAL '14 days'),
    (gen_random_uuid(), test_tenant_id, 'member', '+60123456010', 'Julia Loh', 0, NOW() - INTERVAL '7 days')
    ON CONFLICT (id) DO NOTHING;

    -- Generate realistic transaction history
    -- Alice: Frequent earner and redeemer
    INSERT INTO points_ledger (tenant_id, profile_id, points, type, description, created_at)
    SELECT 
        test_tenant_id,
        (SELECT id FROM profiles WHERE phone = '+60123456001'),
        50, 'earn', 'Purchase - Coffee & Pastry', NOW() - INTERVAL '6 months'
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456001'), 30, 'earn', 'Purchase - Lunch Set', NOW() - INTERVAL '5 months 20 days'
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456001'), -50, 'redeem', 'Reward: Free Coffee', NOW() - INTERVAL '5 months 15 days'
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456001'), 100, 'earn', 'Purchase - Catering Order', NOW() - INTERVAL '4 months'
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456001'), 25, 'earn', 'Purchase - Breakfast', NOW() - INTERVAL '3 months'
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456001'), -80, 'redeem', 'Reward: Cake Voucher', NOW() - INTERVAL '2 months'
    
    -- Bob: Steady earner
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456002'), 40, 'earn', 'Purchase - Dinner', NOW() - INTERVAL '5 months'
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456002'), 35, 'earn', 'Purchase - Lunch', NOW() - INTERVAL '4 months'
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456002'), 60, 'earn', 'Purchase - Weekend Brunch', NOW() - INTERVAL '3 months'
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456002'), 45, 'earn', 'Purchase - Takeout', NOW() - INTERVAL '1 month'
    
    -- Charlie: Big spender, recent redeemer
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456003'), 150, 'earn', 'Purchase - Party Catering', NOW() - INTERVAL '4 months'
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456003'), 80, 'earn', 'Purchase - Family Dinner', NOW() - INTERVAL '2 months'
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456003'), -100, 'redeem', 'Reward: Premium Gift Set', NOW() - INTERVAL '1 month'
    
    -- Diana: Recent joiner, active
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456004'), 55, 'earn', 'Purchase - Coffee Meeting', NOW() - INTERVAL '3 months'
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456004'), 40, 'earn', 'Purchase - Lunch', NOW() - INTERVAL '2 months'
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456004'), 30, 'earn', 'Purchase - Breakfast', NOW() - INTERVAL '1 month'
    
    -- Ethan: Moderate activity
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456005'), 70, 'earn', 'Purchase - Date Night', NOW() - INTERVAL '90 days'
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456005'), -50, 'redeem', 'Reward: Discount Voucher', NOW() - INTERVAL '60 days'
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456005'), 35, 'earn', 'Purchase - Quick Lunch', NOW() - INTERVAL '30 days'
    
    -- Fiona: Very active recent user
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456006'), 45, 'earn', 'Purchase - Breakfast', NOW() - INTERVAL '60 days'
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456006'), 55, 'earn', 'Purchase - Dinner', NOW() - INTERVAL '45 days'
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456006'), 65, 'earn', 'Purchase - Weekend Meal', NOW() - INTERVAL '30 days'
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456006'), 40, 'earn', 'Purchase - Coffee', NOW() - INTERVAL '14 days'
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456006'), -100, 'redeem', 'Reward: Birthday Cake', NOW() - INTERVAL '7 days'
    
    -- George: Sporadic user
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456007'), 90, 'earn', 'Purchase - Big Order', NOW() - INTERVAL '45 days'
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456007'), 25, 'earn', 'Purchase - Snack', NOW() - INTERVAL '20 days'
    
    -- Hannah: New but engaged
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456008'), 50, 'earn', 'Purchase - Welcome Order', NOW() - INTERVAL '30 days'
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456008'), 40, 'earn', 'Purchase - Lunch', NOW() - INTERVAL '20 days'
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456008'), 35, 'earn', 'Purchase - Breakfast', NOW() - INTERVAL '10 days'
    
    -- Isaac: Very recent, testing waters
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456009'), 30, 'earn', 'Purchase - First Time', NOW() - INTERVAL '14 days'
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456009'), 25, 'earn', 'Purchase - Second Visit', NOW() - INTERVAL '7 days'
    
    -- Julia: Brand new
    UNION ALL
    SELECT test_tenant_id, (SELECT id FROM profiles WHERE phone = '+60123456010'), 45, 'earn', 'Purchase - Grand Opening', NOW() - INTERVAL '7 days';

END $$;
