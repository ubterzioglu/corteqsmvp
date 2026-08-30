create or replace function public.admin_finalize_whatsapp_reply(
  p_message_id uuid,
  p_success boolean,
  p_provider_message_id text default null,
  p_error_code text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_message public.whatsapp_customer_messages%rowtype;
begin
  if v_actor is null or not public.is_admin(v_actor) then
    raise exception 'admin_required' using errcode = '42501';
  end if;
  if p_success and (p_provider_message_id is null or p_provider_message_id !~ '^wamid\.') then
    raise exception 'valid_provider_message_id_required' using errcode = '22023';
  end if;

  select * into v_message from public.whatsapp_customer_messages
  where id = p_message_id and created_by = v_actor for update;
  if not found then raise exception 'reply_not_found' using errcode = 'P0002'; end if;

  update public.whatsapp_customer_messages set
    delivery_status = case when p_success then 'sent' else 'failed' end,
    provider_message_id = case when p_success then left(p_provider_message_id, 512) else null end,
    error_code = case when p_success then null else left(coalesce(p_error_code, 'provider_error'), 120) end
  where id = p_message_id;

  if not p_success then
    update public.whatsapp_customer_threads
    set status = 'in_progress'
    where id = v_message.thread_id and status = 'waiting_customer';
  end if;

  perform public.write_admin_audit_log(
    p_action => case when p_success then 'whatsapp.reply_sent' else 'whatsapp.reply_failed' end,
    p_target_entity_type => 'whatsapp_customer_message',
    p_target_entity_id => p_message_id,
    p_after_value => jsonb_build_object(
      'thread_id', v_message.thread_id,
      'message_type', v_message.message_type,
      'template_name', v_message.template_name,
      'error_code', case when p_success then null else left(coalesce(p_error_code, 'provider_error'), 120) end
    )
  );
end;
$$;

revoke all on function public.admin_finalize_whatsapp_reply(uuid, boolean, text, text) from public, anon, authenticated;
grant execute on function public.admin_finalize_whatsapp_reply(uuid, boolean, text, text) to authenticated;
