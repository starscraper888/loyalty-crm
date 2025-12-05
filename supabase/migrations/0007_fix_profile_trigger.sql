-- Fix: Add missing trigger to create profile on user signup

-- 1. Create the function
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, tenant_id)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'member'),
    (new.raw_user_meta_data->>'tenant_id')::uuid -- Allow passing tenant_id in metadata
  );
  return new;
end;
$$ language plpgsql security definer;

-- 2. Create the trigger
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
