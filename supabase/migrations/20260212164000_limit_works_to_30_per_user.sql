-- Keep only latest 30 works per user to control data volume.

create or replace function public.trim_works_to_latest_30()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  with to_prune as (
    select id, storage_bucket, storage_path
    from public.works
    where user_id = new.user_id
    order by created_at desc, id desc
    offset 30
  ),
  deleted as (
    delete from public.works w
    where w.id in (
      select id from to_prune
    )
    returning w.storage_bucket, w.storage_path
  )
  delete from storage.objects o
  using deleted d
  where d.storage_path is not null
    and o.bucket_id = coalesce(d.storage_bucket, 'works-assets')
    and o.name = d.storage_path;

  return new;
end;
$$;

drop trigger if exists works_trim_to_latest_30 on public.works;
create trigger works_trim_to_latest_30
after insert on public.works
for each row execute procedure public.trim_works_to_latest_30();

-- One-time cleanup for existing data (storage objects cleaned by trigger on next insert).
with ranked as (
  select
    id,
    row_number() over (partition by user_id order by created_at desc, id desc) as rn
  from public.works
)
delete from public.works
where id in (
  select id from ranked where rn > 30
);
