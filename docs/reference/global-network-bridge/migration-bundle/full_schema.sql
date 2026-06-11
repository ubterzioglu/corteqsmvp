--
-- PostgreSQL database dump
--

\restrict QkKQ5cVRx3b6KckAnAIXaoc4wN4WSGttqLOR1BlmMnGI31IvIpnc4Oaal9ue9Vn

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'SQL_ASCII';
SET standard_conforming_strings = off;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET escape_string_warning = off;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'user',
    'consultant',
    'association',
    'blogger',
    'admin',
    'business',
    'ambassador'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: notify_admins_whatsapp_join(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_admins_whatsapp_join() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_group_name text;
BEGIN
  SELECT group_name INTO v_group_name FROM public.whatsapp_landings WHERE id = NEW.landing_id;

  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  SELECT ur.user_id,
         'whatsapp_join_request',
         'Yeni WhatsApp grubu giriş talebi',
         COALESCE(NEW.full_name, 'Bir kullanıcı') || ' "' || COALESCE(v_group_name, 'WhatsApp grubu') || '" grubuna katılmak istiyor.',
         NEW.id
  FROM public.user_roles ur
  WHERE ur.role = 'admin'::app_role;

  RETURN NEW;
END;
$$;


--
-- Name: notify_consultants_on_request(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_consultants_on_request() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Notify consultants whose categories match
  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  SELECT 
    cc.user_id,
    'new_service_request',
    'Yeni Teklif Talebi!',
    '"' || NEW.title || '" başlıklı yeni bir ' || NEW.category || ' talebi oluşturuldu.',
    NEW.id
  FROM public.consultant_categories cc
  WHERE cc.category = NEW.category
    AND cc.user_id != NEW.user_id;

  -- Notify all businesses (RFQs go to providers in general)
  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  SELECT 
    ur.user_id,
    'new_service_request',
    'Yeni Teklif Talebi!',
    '"' || NEW.title || '" başlıklı yeni bir ' || NEW.category || ' talebi oluşturuldu.',
    NEW.id
  FROM public.user_roles ur
  WHERE ur.role = 'business'::app_role
    AND ur.user_id != NEW.user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.consultant_categories cc
      WHERE cc.user_id = ur.user_id AND cc.category = NEW.category
    );

  RETURN NEW;
END;
$$;


--
-- Name: notify_providers_on_welcome_pack(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_providers_on_welcome_pack() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Notify businesses and consultants
  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  SELECT ur.user_id, 'welcome_pack_order', 'Yeni Hoşgeldin Paketi Talebi!',
    NEW.city || ', ' || NEW.country || ' için ' || NEW.adults || ' yetişkin, geliş: ' || NEW.arrival_date,
    NEW.id
  FROM public.user_roles ur
  WHERE ur.role IN ('business', 'consultant')
    AND ur.user_id != NEW.user_id;
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: city_ambassador_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.city_ambassador_applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    city text NOT NULL,
    country text NOT NULL,
    reach_count integer,
    reach_description text,
    organized_events text,
    known_professionals text,
    first_week_plan text,
    weekly_hours text,
    motivation text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: consultant_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consultant_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    category text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    category text NOT NULL,
    type text DEFAULT 'yüz yüze'::text NOT NULL,
    event_date date NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    country text,
    city text,
    location text,
    online_url text,
    price numeric DEFAULT 0,
    max_attendees integer,
    cover_image text,
    tags text[] DEFAULT '{}'::text[],
    organizer_name text,
    featured boolean DEFAULT false NOT NULL,
    status text DEFAULT 'published'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    organizer_type text DEFAULT 'community'::text NOT NULL
);


--
-- Name: interest_registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interest_registrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category text DEFAULT 'genel'::text NOT NULL,
    name text,
    email text,
    phone text,
    country text,
    city text,
    role text,
    message text,
    referral_code text,
    source text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    organization text,
    interest_area text,
    supply_demand text,
    heard_from text,
    attachment_urls text[] DEFAULT '{}'::text[]
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    related_id uuid,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    avatar_url text,
    phone text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    onboarding_completed boolean DEFAULT false NOT NULL,
    account_type text,
    city text,
    country text
);


--
-- Name: service_proposals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_proposals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    request_id uuid NOT NULL,
    consultant_id uuid NOT NULL,
    message text NOT NULL,
    price numeric,
    estimated_duration text,
    scope text,
    payment_terms text,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT service_proposals_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])))
);


--
-- Name: service_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    category text NOT NULL,
    subcategory text,
    title text NOT NULL,
    description text NOT NULL,
    city text,
    country text,
    budget_min numeric,
    budget_max numeric,
    preferred_time text,
    urgency text DEFAULT 'normal'::text,
    attachment_urls text[] DEFAULT '{}'::text[],
    status text DEFAULT 'open'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT service_requests_status_check CHECK ((status = ANY (ARRAY['open'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL
);


--
-- Name: welcome_pack_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.welcome_pack_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    country text NOT NULL,
    city text NOT NULL,
    arrival_date date NOT NULL,
    adults integer DEFAULT 1 NOT NULL,
    children integer DEFAULT 0 NOT NULL,
    has_pet boolean DEFAULT false NOT NULL,
    pet_details text,
    needs_baby_seat boolean DEFAULT false NOT NULL,
    needs_airport_transfer boolean DEFAULT false NOT NULL,
    needs_car_rental boolean DEFAULT false NOT NULL,
    needs_flight_discount boolean DEFAULT false NOT NULL,
    notes text,
    status text DEFAULT 'open'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    needs_mentor boolean DEFAULT false NOT NULL,
    mentor_type text,
    needs_sim_card boolean DEFAULT false NOT NULL
);


--
-- Name: welcome_pack_proposals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.welcome_pack_proposals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    provider_id uuid NOT NULL,
    category text NOT NULL,
    price numeric,
    message text NOT NULL,
    details text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: whatsapp_join_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.whatsapp_join_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    landing_id uuid NOT NULL,
    user_id uuid NOT NULL,
    full_name text,
    email text,
    phone text,
    note text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: whatsapp_landings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.whatsapp_landings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    slug text NOT NULL,
    group_name text NOT NULL,
    category text NOT NULL,
    country text NOT NULL,
    city text NOT NULL,
    mode text DEFAULT 'visual'::text NOT NULL,
    hero_image text,
    tagline text,
    call_to_action_text text,
    conditions text,
    whatsapp_link text NOT NULL,
    admin_name text,
    admin_contact text,
    description text,
    status text DEFAULT 'pending'::text NOT NULL,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT whatsapp_landings_category_check CHECK ((category = ANY (ARRAY['alumni'::text, 'hobi'::text, 'is'::text, 'doktor'::text]))),
    CONSTRAINT whatsapp_landings_mode_check CHECK ((mode = ANY (ARRAY['visual'::text, 'text'::text]))),
    CONSTRAINT whatsapp_landings_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: city_ambassador_applications city_ambassador_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city_ambassador_applications
    ADD CONSTRAINT city_ambassador_applications_pkey PRIMARY KEY (id);


--
-- Name: consultant_categories consultant_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultant_categories
    ADD CONSTRAINT consultant_categories_pkey PRIMARY KEY (id);


--
-- Name: consultant_categories consultant_categories_user_id_category_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultant_categories
    ADD CONSTRAINT consultant_categories_user_id_category_key UNIQUE (user_id, category);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: interest_registrations interest_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interest_registrations
    ADD CONSTRAINT interest_registrations_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: service_proposals service_proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_proposals
    ADD CONSTRAINT service_proposals_pkey PRIMARY KEY (id);


--
-- Name: service_requests service_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: welcome_pack_orders welcome_pack_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.welcome_pack_orders
    ADD CONSTRAINT welcome_pack_orders_pkey PRIMARY KEY (id);


--
-- Name: welcome_pack_proposals welcome_pack_proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.welcome_pack_proposals
    ADD CONSTRAINT welcome_pack_proposals_pkey PRIMARY KEY (id);


--
-- Name: whatsapp_join_requests whatsapp_join_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_join_requests
    ADD CONSTRAINT whatsapp_join_requests_pkey PRIMARY KEY (id);


--
-- Name: whatsapp_landings whatsapp_landings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_landings
    ADD CONSTRAINT whatsapp_landings_pkey PRIMARY KEY (id);


--
-- Name: whatsapp_landings whatsapp_landings_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_landings
    ADD CONSTRAINT whatsapp_landings_slug_key UNIQUE (slug);


--
-- Name: idx_events_country_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_country_city ON public.events USING btree (country, city);


--
-- Name: idx_events_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_date ON public.events USING btree (event_date);


--
-- Name: idx_events_organizer_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_organizer_type ON public.events USING btree (organizer_type);


--
-- Name: idx_events_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_user ON public.events USING btree (user_id);


--
-- Name: idx_interest_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interest_category ON public.interest_registrations USING btree (category);


--
-- Name: idx_interest_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interest_created ON public.interest_registrations USING btree (created_at DESC);


--
-- Name: idx_whatsapp_landings_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_whatsapp_landings_slug ON public.whatsapp_landings USING btree (slug);


--
-- Name: idx_whatsapp_landings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_whatsapp_landings_status ON public.whatsapp_landings USING btree (status);


--
-- Name: idx_whatsapp_landings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_whatsapp_landings_user_id ON public.whatsapp_landings USING btree (user_id);


--
-- Name: whatsapp_join_requests trg_notify_admins_whatsapp_join; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_notify_admins_whatsapp_join AFTER INSERT ON public.whatsapp_join_requests FOR EACH ROW EXECUTE FUNCTION public.notify_admins_whatsapp_join();


--
-- Name: whatsapp_join_requests trg_whatsapp_join_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_whatsapp_join_requests_updated_at BEFORE UPDATE ON public.whatsapp_join_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: service_requests trigger_notify_consultants_on_request; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_notify_consultants_on_request AFTER INSERT ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.notify_consultants_on_request();


--
-- Name: welcome_pack_orders trigger_notify_on_welcome_pack; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_notify_on_welcome_pack AFTER INSERT ON public.welcome_pack_orders FOR EACH ROW EXECUTE FUNCTION public.notify_providers_on_welcome_pack();


--
-- Name: events update_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: whatsapp_landings update_whatsapp_landings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_whatsapp_landings_updated_at BEFORE UPDATE ON public.whatsapp_landings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: service_proposals service_proposals_consultant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_proposals
    ADD CONSTRAINT service_proposals_consultant_id_fkey FOREIGN KEY (consultant_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: service_proposals service_proposals_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_proposals
    ADD CONSTRAINT service_proposals_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.service_requests(id) ON DELETE CASCADE;


--
-- Name: service_requests service_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: welcome_pack_proposals welcome_pack_proposals_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.welcome_pack_proposals
    ADD CONSTRAINT welcome_pack_proposals_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.welcome_pack_orders(id) ON DELETE CASCADE;


--
-- Name: whatsapp_join_requests whatsapp_join_requests_landing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_join_requests
    ADD CONSTRAINT whatsapp_join_requests_landing_id_fkey FOREIGN KEY (landing_id) REFERENCES public.whatsapp_landings(id) ON DELETE CASCADE;


--
-- Name: whatsapp_landings Admins can delete landings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete landings" ON public.whatsapp_landings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: events Admins can manage all events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all events" ON public.events TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: whatsapp_landings Admins can update all landings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all landings" ON public.whatsapp_landings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: city_ambassador_applications Admins can update applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update applications" ON public.city_ambassador_applications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: whatsapp_join_requests Admins can update join requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update join requests" ON public.whatsapp_join_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: city_ambassador_applications Admins can view all applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all applications" ON public.city_ambassador_applications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: whatsapp_join_requests Admins can view all join requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all join requests" ON public.whatsapp_join_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: whatsapp_landings Admins can view all landings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all landings" ON public.whatsapp_landings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: welcome_pack_orders Admins can view all orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all orders" ON public.welcome_pack_orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: welcome_pack_proposals Admins can view all proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all proposals" ON public.welcome_pack_proposals FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: whatsapp_landings Anyone can view approved landings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view approved landings" ON public.whatsapp_landings FOR SELECT TO authenticated, anon USING ((status = 'approved'::text));


--
-- Name: consultant_categories Anyone can view consultant categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view consultant categories" ON public.consultant_categories FOR SELECT TO authenticated USING (true);


--
-- Name: events Anyone can view published events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view published events" ON public.events FOR SELECT TO authenticated, anon USING ((status = 'published'::text));


--
-- Name: notifications Authenticated users can insert notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: welcome_pack_orders Businesses and consultants can view open orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Businesses and consultants can view open orders" ON public.welcome_pack_orders FOR SELECT TO authenticated USING (((status = 'open'::text) AND (public.has_role(auth.uid(), 'business'::public.app_role) OR public.has_role(auth.uid(), 'consultant'::public.app_role))));


--
-- Name: consultant_categories Consultants can manage own categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Consultants can manage own categories" ON public.consultant_categories TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: service_proposals Consultants can view own proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Consultants can view own proposals" ON public.service_proposals FOR SELECT TO authenticated USING ((auth.uid() = consultant_id));


--
-- Name: welcome_pack_proposals Order owners can update proposal status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Order owners can update proposal status" ON public.welcome_pack_proposals FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.welcome_pack_orders
  WHERE ((welcome_pack_orders.id = welcome_pack_proposals.order_id) AND (welcome_pack_orders.user_id = auth.uid())))));


--
-- Name: welcome_pack_proposals Order owners can view proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Order owners can view proposals" ON public.welcome_pack_proposals FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.welcome_pack_orders
  WHERE ((welcome_pack_orders.id = welcome_pack_proposals.order_id) AND (welcome_pack_orders.user_id = auth.uid())))));


--
-- Name: service_proposals Providers can create proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can create proposals" ON public.service_proposals FOR INSERT TO authenticated WITH CHECK (((auth.uid() = consultant_id) AND (public.has_role(auth.uid(), 'consultant'::public.app_role) OR public.has_role(auth.uid(), 'business'::public.app_role))));


--
-- Name: welcome_pack_proposals Providers can create proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can create proposals" ON public.welcome_pack_proposals FOR INSERT TO authenticated WITH CHECK (((auth.uid() = provider_id) AND (public.has_role(auth.uid(), 'business'::public.app_role) OR public.has_role(auth.uid(), 'consultant'::public.app_role))));


--
-- Name: service_requests Providers can view open requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can view open requests" ON public.service_requests FOR SELECT TO authenticated USING (((status = 'open'::text) AND (public.has_role(auth.uid(), 'consultant'::public.app_role) OR public.has_role(auth.uid(), 'business'::public.app_role))));


--
-- Name: welcome_pack_proposals Providers can view own proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can view own proposals" ON public.welcome_pack_proposals FOR SELECT TO authenticated USING ((auth.uid() = provider_id));


--
-- Name: profiles Public can view profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view profiles" ON public.profiles FOR SELECT TO anon USING (true);


--
-- Name: city_ambassador_applications Users can create own applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own applications" ON public.city_ambassador_applications FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: events Users can create own events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own events" ON public.events FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: whatsapp_join_requests Users can create own join requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own join requests" ON public.whatsapp_join_requests FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: whatsapp_landings Users can create own landings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own landings" ON public.whatsapp_landings FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: welcome_pack_orders Users can create own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own orders" ON public.welcome_pack_orders FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: service_requests Users can create own requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own requests" ON public.service_requests FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: events Users can delete own events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own events" ON public.events FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: whatsapp_landings Users can delete own landings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own landings" ON public.whatsapp_landings FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = id));


--
-- Name: user_roles Users can insert own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: events Users can update own events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own events" ON public.events FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: whatsapp_landings Users can update own landings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own landings" ON public.whatsapp_landings FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: notifications Users can update own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: welcome_pack_orders Users can update own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own orders" ON public.welcome_pack_orders FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id));


--
-- Name: service_requests Users can update own requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own requests" ON public.service_requests FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: service_proposals Users can update proposals for their requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update proposals for their requests" ON public.service_proposals FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.service_requests
  WHERE ((service_requests.id = service_proposals.request_id) AND (service_requests.user_id = auth.uid())))));


--
-- Name: city_ambassador_applications Users can view own applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own applications" ON public.city_ambassador_applications FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: events Users can view own events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own events" ON public.events FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: whatsapp_join_requests Users can view own join requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own join requests" ON public.whatsapp_join_requests FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: whatsapp_landings Users can view own landings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own landings" ON public.whatsapp_landings FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: notifications Users can view own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: welcome_pack_orders Users can view own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own orders" ON public.welcome_pack_orders FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id));


--
-- Name: service_requests Users can view own requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own requests" ON public.service_requests FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: service_proposals Users can view proposals for their requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view proposals for their requests" ON public.service_proposals FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.service_requests
  WHERE ((service_requests.id = service_proposals.request_id) AND (service_requests.user_id = auth.uid())))));


--
-- Name: interest_registrations admins can delete interest; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "admins can delete interest" ON public.interest_registrations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: interest_registrations admins can update interest; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "admins can update interest" ON public.interest_registrations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: interest_registrations admins can view interest; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "admins can view interest" ON public.interest_registrations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: interest_registrations anyone can insert interest; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "anyone can insert interest" ON public.interest_registrations FOR INSERT TO authenticated, anon WITH CHECK (true);


--
-- Name: city_ambassador_applications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.city_ambassador_applications ENABLE ROW LEVEL SECURITY;

--
-- Name: consultant_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.consultant_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

--
-- Name: interest_registrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.interest_registrations ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: service_proposals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.service_proposals ENABLE ROW LEVEL SECURITY;

--
-- Name: service_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: welcome_pack_orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.welcome_pack_orders ENABLE ROW LEVEL SECURITY;

--
-- Name: welcome_pack_proposals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.welcome_pack_proposals ENABLE ROW LEVEL SECURITY;

--
-- Name: whatsapp_join_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.whatsapp_join_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: whatsapp_landings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.whatsapp_landings ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict QkKQ5cVRx3b6KckAnAIXaoc4wN4WSGttqLOR1BlmMnGI31IvIpnc4Oaal9ue9Vn

