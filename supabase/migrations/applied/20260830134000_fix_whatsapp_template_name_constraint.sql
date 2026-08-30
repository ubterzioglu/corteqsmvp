alter table public.whatsapp_customer_messages
drop constraint whatsapp_customer_messages_template_name_check;

alter table public.whatsapp_customer_messages
add constraint whatsapp_customer_messages_template_name_check check (
  template_name is null
  or (char_length(template_name) between 1 and 512 and template_name ~ '^[a-z0-9_]+$')
);

alter table public.whatsapp_message_templates
drop constraint whatsapp_message_templates_name_check;

alter table public.whatsapp_message_templates
add constraint whatsapp_message_templates_name_check check (
  char_length(name) between 1 and 512 and name ~ '^[a-z0-9_]+$'
);
