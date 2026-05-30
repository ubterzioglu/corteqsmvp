--
-- PostgreSQL database dump
--

\restrict e9AE7VCrt15CNTJ26qNTX2YhHiBdPnXdVdkJKwVOlj4gHMpYCAG4mpnLai4DNeZ

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: city_ambassador_applications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.city_ambassador_applications (id, user_id, full_name, email, phone, city, country, reach_count, reach_description, organized_events, known_professionals, first_week_plan, weekly_hours, motivation, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: consultant_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.consultant_categories (id, user_id, category, created_at) FROM stdin;
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.events (id, user_id, title, description, category, type, event_date, start_time, end_time, country, city, location, online_url, price, max_attendees, cover_image, tags, organizer_name, featured, status, created_at, updated_at, organizer_type) FROM stdin;
\.


--
-- Data for Name: interest_registrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.interest_registrations (id, category, name, email, phone, country, city, role, message, referral_code, source, created_at, organization, interest_area, supply_demand, heard_from, attachment_urls) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, type, title, message, related_id, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles (id, full_name, avatar_url, phone, created_at, updated_at, onboarding_completed, account_type, city, country) FROM stdin;
\.


--
-- Data for Name: service_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.service_requests (id, user_id, category, subcategory, title, description, city, country, budget_min, budget_max, preferred_time, urgency, attachment_urls, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: service_proposals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.service_proposals (id, request_id, consultant_id, message, price, estimated_duration, scope, payment_terms, status, created_at) FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_roles (id, user_id, role) FROM stdin;
\.


--
-- Data for Name: welcome_pack_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.welcome_pack_orders (id, user_id, country, city, arrival_date, adults, children, has_pet, pet_details, needs_baby_seat, needs_airport_transfer, needs_car_rental, needs_flight_discount, notes, status, created_at, updated_at, needs_mentor, mentor_type, needs_sim_card) FROM stdin;
\.


--
-- Data for Name: welcome_pack_proposals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.welcome_pack_proposals (id, order_id, provider_id, category, price, message, details, status, created_at) FROM stdin;
\.


--
-- Data for Name: whatsapp_landings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.whatsapp_landings (id, user_id, slug, group_name, category, country, city, mode, hero_image, tagline, call_to_action_text, conditions, whatsapp_link, admin_name, admin_contact, description, status, rejection_reason, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: whatsapp_join_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.whatsapp_join_requests (id, landing_id, user_id, full_name, email, phone, note, status, created_at, updated_at) FROM stdin;
\.


--
-- PostgreSQL database dump complete
--

\unrestrict e9AE7VCrt15CNTJ26qNTX2YhHiBdPnXdVdkJKwVOlj4gHMpYCAG4mpnLai4DNeZ

