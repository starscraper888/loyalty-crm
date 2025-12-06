-- Add image_url column to rewards table
alter table rewards add column if not exists image_url text;

-- Create storage bucket for reward images (if not exists)
insert into storage.buckets (id, name, public)
values ('rewards', 'rewards', true)
on conflict (id) do nothing;

-- Storage policy: Anyone can view reward images
create policy "Public Access to Reward Images"
on storage.objects for select
using (bucket_id = 'rewards');

-- Storage policy: Authenticated users can upload
create policy "Authenticated users can upload reward images"
on storage.objects for insert
with check (
  bucket_id = 'rewards' and
  auth.role() = 'authenticated'
);

-- Storage policy: Users can update their tenant's images
create policy "Users can update their tenant reward images"
on storage.objects for update
using (bucket_id = 'rewards' and auth.role() = 'authenticated');

-- Storage policy: Users can delete their tenant's images
create policy "Users can delete their tenant reward images"
on storage.objects for delete
using (bucket_id = 'rewards' and auth.role() = 'authenticated');
