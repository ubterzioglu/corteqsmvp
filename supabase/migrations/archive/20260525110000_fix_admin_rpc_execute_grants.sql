begin;

grant execute on function public.admin_set_role_feature_flag(text, text, boolean) to authenticated;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;
grant execute on function public.admin_set_user_feature_override(uuid, text, boolean) to authenticated;
grant execute on function public.admin_clear_user_feature_override(uuid, text) to authenticated;
grant execute on function public.admin_set_user_feature_override_detailed(uuid, text, boolean, text) to authenticated;

commit;
