create or replace function public.get_public_status_metrics()
returns table (
  total_scans bigint,
  active_scans bigint,
  total_users bigint,
  avg_response_time double precision,
  error_rate double precision
)
language sql
stable
security definer
set search_path = ''
as $$
  with totals as (
    select
      count(*) as total_scans,
      count(*) filter (where status = 'running') as active_scans,
      count(distinct user_id) as total_users,
      coalesce(avg(elapsed_ms) filter (where status = 'completed' and elapsed_ms is not null) / 1000.0, 45) as avg_response_time
    from public.user_scans
  ), recent as (
    select
      count(*) filter (where status = 'failed') as failed,
      count(*) filter (where status in ('completed', 'failed')) as finished
    from public.user_scans
    where "timestamp" >= extract(epoch from now() - interval '24 hours') * 1000
  )
  select
    totals.total_scans,
    totals.active_scans,
    totals.total_users,
    totals.avg_response_time,
    case when recent.finished > 0 then recent.failed::double precision / recent.finished * 100 else 0 end
  from totals cross join recent;
$$;

revoke all on function public.get_public_status_metrics() from public;
grant execute on function public.get_public_status_metrics() to anon, authenticated;
