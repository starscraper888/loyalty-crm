-- Promote admin@example.com to admin role
UPDATE profiles
SET role = 'admin'
FROM auth.users
WHERE profiles.id = auth.users.id
AND auth.users.email = 'admin@example.com';
