-- Fix: Remove direct storage.objects deletion from trim trigger.
-- Supabase does not allow direct DELETE on storage.objects table.
-- Storage cleanup will be handled by the application layer instead.

create or replace function public.trim_works_to_latest_30()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.works
  where id in (
    select id
    from public.works
    where user_id = new.user_id
    order by created_at desc, id desc
    offset 30
  );

  return new;
end;
$$;
