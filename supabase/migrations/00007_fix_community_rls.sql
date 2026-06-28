-- Allow any authenticated user to create community posts (centro_id IS NULL)
drop policy if exists "posts_insert_community" on public.posts;
create policy "posts_insert_community"
  on public.posts for insert
  to authenticated
  with check (
    centro_id is null and user_id = auth.uid()
  );
