-- W04 · WhatsApp bot foundation — acceptance test
-- Tests: grant matrix, single-row lock, idempotency, 24h window, CHECK constraints

begin;

-- Test 1: Grant matrix — anon/authenticated cannot call bot functions
do $$
declare
  v_can_anon_prepare boolean;
  v_can_anon_finalize boolean;
  v_can_auth_prepare boolean;
  v_can_auth_finalize boolean;
  v_can_service_prepare boolean;
  v_can_service_finalize boolean;
begin
  -- Check anon privileges
  select has_function_privilege('anon', 'bot_prepare_whatsapp_reply(uuid, uuid, text, text, text)', 'execute')
  into v_can_anon_prepare;
  
  select has_function_privilege('anon', 'bot_finalize_whatsapp_reply(uuid, boolean, text, text)', 'execute')
  into v_can_anon_finalize;
  
  -- Check authenticated privileges
  select has_function_privilege('authenticated', 'bot_prepare_whatsapp_reply(uuid, uuid, text, text, text)', 'execute')
  into v_can_auth_prepare;
  
  select has_function_privilege('authenticated', 'bot_finalize_whatsapp_reply(uuid, boolean, text, text)', 'execute')
  into v_can_auth_finalize;
  
  -- Check service_role privileges
  select has_function_privilege('service_role', 'bot_prepare_whatsapp_reply(uuid, uuid, text, text, text)', 'execute')
  into v_can_service_prepare;
  
  select has_function_privilege('service_role', 'bot_finalize_whatsapp_reply(uuid, boolean, text, text)', 'execute')
  into v_can_service_finalize;
  
  -- Assertions
  if v_can_anon_prepare then
    raise exception 'FAIL: anon can execute bot_prepare_whatsapp_reply';
  end if;
  
  if v_can_anon_finalize then
    raise exception 'FAIL: anon can execute bot_finalize_whatsapp_reply';
  end if;
  
  if v_can_auth_prepare then
    raise exception 'FAIL: authenticated can execute bot_prepare_whatsapp_reply';
  end if;
  
  if v_can_auth_finalize then
    raise exception 'FAIL: authenticated can execute bot_finalize_whatsapp_reply';
  end if;
  
  if not v_can_service_prepare then
    raise exception 'FAIL: service_role cannot execute bot_prepare_whatsapp_reply';
  end if;
  
  if not v_can_service_finalize then
    raise exception 'FAIL: service_role cannot execute bot_finalize_whatsapp_reply';
  end if;
  
  raise notice 'PASS: grant matrix correct (anon/authenticated denied, service_role allowed)';
end $$;

-- Test 2: whatsapp_bot_settings single-row lock
do $$
declare
  v_count integer;
begin
  -- Should have exactly 1 row
  select count(*) into v_count from whatsapp_bot_settings;
  if v_count <> 1 then
    raise exception 'FAIL: whatsapp_bot_settings has % rows, expected 1', v_count;
  end if;
  
  -- Try to insert second row — should fail
  begin
    insert into whatsapp_bot_settings (id, enabled) values (true, true);
    raise exception 'FAIL: second insert succeeded (should be rejected by PK)';
  exception when unique_violation then
    -- Expected
    raise notice 'PASS: single-row lock enforced (second insert rejected)';
  end;
end $$;

-- Test 3: enabled DEFAULT false
do $$
declare
  v_enabled boolean;
begin
  select enabled into v_enabled from whatsapp_bot_settings where id = true;
  if v_enabled is distinct from false then
    raise exception 'FAIL: enabled default is %, expected false', v_enabled;
  end if;
  raise notice 'PASS: enabled DEFAULT false';
end $$;

-- Test 4: anon cannot read whatsapp_bot_settings
do $$
declare
  v_can_select boolean;
begin
  select has_table_privilege('anon', 'whatsapp_bot_settings', 'select')
  into v_can_select;
  
  if v_can_select then
    raise exception 'FAIL: anon can select from whatsapp_bot_settings';
  end if;
  
  raise notice 'PASS: anon cannot read whatsapp_bot_settings';
end $$;

-- Test 5: ai_assistant_usage.function_name CHECK accepts 'whatsapp-autoreply'
do $$
begin
  -- Try to insert with 'whatsapp-autoreply' — should succeed
  insert into ai_assistant_usage (
    user_id, function_name, provider, input_tokens, output_tokens, total_tokens, status, http_status
  ) values (
    null, 'whatsapp-autoreply', 'gemini', 10, 20, 30, 'success', 200
  );
  
  -- Clean up
  delete from ai_assistant_usage where function_name = 'whatsapp-autoreply';
  
  raise notice 'PASS: ai_assistant_usage accepts whatsapp-autoreply';
end $$;

-- Test 6: ai_assistant_usage.function_name CHECK rejects fake values
do $$
begin
  -- Try to insert with fake function name — should fail
  begin
    insert into ai_assistant_usage (
      user_id, function_name, provider, input_tokens, output_tokens, total_tokens, status, http_status
    ) values (
      null, 'fake-assistant', 'gemini', 10, 20, 30, 'success', 200
    );
    raise exception 'FAIL: fake function name accepted (should be rejected)';
  exception when check_violation then
    -- Expected
    raise notice 'PASS: ai_assistant_usage rejects fake function names';
  end;
end $$;

-- Test 7: Idempotency — same request_id returns should_send=false
do $$
declare
  v_thread_id uuid;
  v_request_id uuid := gen_random_uuid();
  v_should_send_1 boolean;
  v_should_send_2 boolean;
  v_recipient text;
begin
  -- Create test thread
  insert into whatsapp_customer_threads (wa_id_hash, recipient_ciphertext, status)
  values (
    encode(sha256('test-phone-123'::bytea), 'hex'),
    'v1.test.encrypted',
    'new'
  )
  returning id into v_thread_id;
  
  -- First call — should_send=true
  select should_send, recipient_ciphertext into v_should_send_1, v_recipient
  from bot_prepare_whatsapp_reply(v_request_id, v_thread_id, 'Test message', null, null);
  
  if not v_should_send_1 then
    raise exception 'FAIL: first call returned should_send=false';
  end if;
  
  -- Second call with same request_id — should_send=false
  select should_send into v_should_send_2
  from bot_prepare_whatsapp_reply(v_request_id, v_thread_id, 'Test message', null, null);
  
  if v_should_send_2 then
    raise exception 'FAIL: second call returned should_send=true (idempotency broken)';
  end if;
  
  -- Clean up
  delete from whatsapp_customer_messages where id = v_request_id;
  delete from whatsapp_customer_threads where id = v_thread_id;
  
  raise notice 'PASS: idempotency works (second call returns should_send=false)';
end $$;

-- Test 8: 24-hour window enforcement
do $$
declare
  v_thread_id uuid;
  v_request_id uuid := gen_random_uuid();
begin
  -- Create test thread with old last_inbound_at (>24h ago)
  insert into whatsapp_customer_threads (wa_id_hash, recipient_ciphertext, status, last_inbound_at)
  values (
    encode(sha256('test-phone-old'::bytea), 'hex'),
    'v1.test.encrypted',
    'new',
    now() - interval '25 hours'
  )
  returning id into v_thread_id;
  
  -- Try to send text message — should fail (outside 24h window)
  begin
    perform * from bot_prepare_whatsapp_reply(v_request_id, v_thread_id, 'Test message', null, null);
    raise exception 'FAIL: text message accepted outside 24h window';
  exception when others then
    if sqlerrm not like '%template_required_outside_service_window%' then
      raise exception 'FAIL: wrong error: %', sqlerrm;
    end if;
    raise notice 'PASS: 24h window enforced (text rejected, template required)';
  end;
  
  -- Clean up
  delete from whatsapp_customer_threads where id = v_thread_id;
end $$;

-- Test 9: bot_handed_over_at prevents bot from writing
do $$
declare
  v_thread_id uuid;
  v_request_id uuid := gen_random_uuid();
begin
  -- Create test thread with bot_handed_over_at set
  insert into whatsapp_customer_threads (wa_id_hash, recipient_ciphertext, status, bot_handed_over_at)
  values (
    encode(sha256('test-phone-handed'::bytea), 'hex'),
    'v1.test.encrypted',
    'in_progress',
    now()
  )
  returning id into v_thread_id;
  
  -- Try to send message — should fail (bot handed over)
  begin
    perform * from bot_prepare_whatsapp_reply(v_request_id, v_thread_id, 'Test message', null, null);
    raise exception 'FAIL: bot wrote after handover';
  exception when others then
    if sqlerrm not like '%bot_handed_over%' then
      raise exception 'FAIL: wrong error: %', sqlerrm;
    end if;
    raise notice 'PASS: bot_handed_over_at prevents bot from writing';
  end;
  
  -- Clean up
  delete from whatsapp_customer_threads where id = v_thread_id;
end $$;

-- Test 10: admin_prepare_whatsapp_reply unchanged (regression test)
do $$
declare
  v_thread_id uuid;
  v_request_id uuid := gen_random_uuid();
  v_should_send boolean;
begin
  -- Create test thread
  insert into whatsapp_customer_threads (wa_id_hash, recipient_ciphertext, status)
  values (
    encode(sha256('test-phone-admin'::bytea), 'hex'),
    'v1.test.encrypted',
    'new'
  )
  returning id into v_thread_id;
  
  -- Set role to authenticated (admin function requires auth.uid())
  set local role authenticated;
  
  -- This should fail because auth.uid() is null in test context
  -- But the function should still be callable (regression: signature unchanged)
  begin
    perform * from admin_prepare_whatsapp_reply(v_request_id, v_thread_id, 'Test', null, null);
  exception when others then
    -- Expected: admin_required or similar (not "function does not exist")
    if sqlerrm like '%does not exist%' then
      raise exception 'FAIL: admin_prepare_whatsapp_reply signature changed';
    end if;
  end;
  
  reset role;
  
  -- Clean up
  delete from whatsapp_customer_messages where id = v_request_id;
  delete from whatsapp_customer_threads where id = v_thread_id;
  
  raise notice 'PASS: admin_prepare_whatsapp_reply signature unchanged';
end $$;

-- Test 11: is_automated column exists and defaults to false
do $$
declare
  v_thread_id uuid;
  v_request_id uuid := gen_random_uuid();
  v_is_automated boolean;
begin
  -- Create test thread
  insert into whatsapp_customer_threads (wa_id_hash, recipient_ciphertext, status)
  values (
    encode(sha256('test-phone-automated'::bytea), 'hex'),
    'v1.test.encrypted',
    'new'
  )
  returning id into v_thread_id;
  
  -- Call bot_prepare (sets is_automated=true)
  perform * from bot_prepare_whatsapp_reply(v_request_id, v_thread_id, 'Test', null, null);
  
  -- Check is_automated
  select is_automated into v_is_automated
  from whatsapp_customer_messages where id = v_request_id;
  
  if v_is_automated is distinct from true then
    raise exception 'FAIL: is_automated is %, expected true', v_is_automated;
  end if;
  
  -- Clean up
  delete from whatsapp_customer_messages where id = v_request_id;
  delete from whatsapp_customer_threads where id = v_thread_id;
  
  raise notice 'PASS: is_automated column works (set to true by bot_prepare)';
end $$;

-- Test 12: bot_finalize updates delivery_status correctly
do $$
declare
  v_thread_id uuid;
  v_request_id uuid := gen_random_uuid();
  v_delivery_status text;
begin
  -- Create test thread
  insert into whatsapp_customer_threads (wa_id_hash, recipient_ciphertext, status)
  values (
    encode(sha256('test-phone-finalize'::bytea), 'hex'),
    'v1.test.encrypted',
    'new'
  )
  returning id into v_thread_id;
  
  -- Prepare message
  perform * from bot_prepare_whatsapp_reply(v_request_id, v_thread_id, 'Test', null, null);
  
  -- Finalize with success
  perform bot_finalize_whatsapp_reply(v_request_id, true, 'wamid.test123', null);
  
  -- Check delivery_status
  select delivery_status into v_delivery_status
  from whatsapp_customer_messages where id = v_request_id;
  
  if v_delivery_status <> 'sent' then
    raise exception 'FAIL: delivery_status is %, expected sent', v_delivery_status;
  end if;
  
  -- Clean up
  delete from whatsapp_customer_messages where id = v_request_id;
  delete from whatsapp_customer_threads where id = v_thread_id;
  
  raise notice 'PASS: bot_finalize updates delivery_status correctly';
end $$;

rollback;
