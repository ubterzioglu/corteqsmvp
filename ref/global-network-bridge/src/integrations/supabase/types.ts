export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ambassador_applications: {
        Row: {
          admin_note: string | null
          city: string | null
          country: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          email: string
          full_name: string
          id: string
          motivation: string | null
          phone: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          email: string
          full_name: string
          id?: string
          motivation?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          email?: string
          full_name?: string
          id?: string
          motivation?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          client_email: string | null
          client_id: string
          client_name: string | null
          client_timezone: string
          created_at: string
          duration_minutes: number
          id: string
          meeting_url: string | null
          notes: string | null
          provider_id: string
          provider_kind: string
          scheduled_at: string
          status: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          client_email?: string | null
          client_id: string
          client_name?: string | null
          client_timezone: string
          created_at?: string
          duration_minutes?: number
          id?: string
          meeting_url?: string | null
          notes?: string | null
          provider_id: string
          provider_kind?: string
          scheduled_at: string
          status?: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          client_email?: string | null
          client_id?: string
          client_name?: string | null
          client_timezone?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          meeting_url?: string | null
          notes?: string | null
          provider_id?: string
          provider_kind?: string
          scheduled_at?: string
          status?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      approval_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          payload: Json
          request_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          payload?: Json
          request_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          payload?: Json
          request_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cafe_memberships: {
        Row: {
          answer: string | null
          approved: boolean
          cafe_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          approved?: boolean
          cafe_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          answer?: string | null
          approved?: boolean
          cafe_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cafe_memberships_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
        ]
      }
      cafes: {
        Row: {
          audience_scope: string
          capacity: number | null
          city: string | null
          closes_at: string
          continent: string | null
          country: string | null
          created_at: string
          created_by: string
          duration_hours: number
          entry_question: string | null
          extra_links: Json | null
          id: string
          kind: string
          linkedin_url: string
          member_count: number
          name: string
          open_entry: boolean
          opens_at: string
          referral_code: string | null
          theme: string
        }
        Insert: {
          audience_scope?: string
          capacity?: number | null
          city?: string | null
          closes_at: string
          continent?: string | null
          country?: string | null
          created_at?: string
          created_by: string
          duration_hours?: number
          entry_question?: string | null
          extra_links?: Json | null
          id?: string
          kind?: string
          linkedin_url: string
          member_count?: number
          name: string
          open_entry?: boolean
          opens_at?: string
          referral_code?: string | null
          theme: string
        }
        Update: {
          audience_scope?: string
          capacity?: number | null
          city?: string | null
          closes_at?: string
          continent?: string | null
          country?: string | null
          created_at?: string
          created_by?: string
          duration_hours?: number
          entry_question?: string | null
          extra_links?: Json | null
          id?: string
          kind?: string
          linkedin_url?: string
          member_count?: number
          name?: string
          open_entry?: boolean
          opens_at?: string
          referral_code?: string | null
          theme?: string
        }
        Relationships: []
      }
      city_ambassador_applications: {
        Row: {
          city: string
          country: string
          created_at: string
          email: string
          first_week_plan: string | null
          full_name: string
          id: string
          known_professionals: string | null
          motivation: string | null
          organized_events: string | null
          phone: string
          reach_count: number | null
          reach_description: string | null
          status: string
          updated_at: string
          user_id: string
          weekly_hours: string | null
        }
        Insert: {
          city: string
          country: string
          created_at?: string
          email: string
          first_week_plan?: string | null
          full_name: string
          id?: string
          known_professionals?: string | null
          motivation?: string | null
          organized_events?: string | null
          phone: string
          reach_count?: number | null
          reach_description?: string | null
          status?: string
          updated_at?: string
          user_id: string
          weekly_hours?: string | null
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          email?: string
          first_week_plan?: string | null
          full_name?: string
          id?: string
          known_professionals?: string | null
          motivation?: string | null
          organized_events?: string | null
          phone?: string
          reach_count?: number | null
          reach_description?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          weekly_hours?: string | null
        }
        Relationships: []
      }
      consultant_categories: {
        Row: {
          category: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          message: string | null
          status: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          message?: string | null
          status?: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          status?: string
        }
        Relationships: []
      }
      coupon_purchases: {
        Row: {
          business_name: string | null
          business_user_id: string | null
          buyer_email: string | null
          buyer_id: string
          buyer_name: string | null
          coupon_code: string
          coupon_title: string | null
          created_at: string
          currency: string
          id: string
          price: number
          status: string
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          business_name?: string | null
          business_user_id?: string | null
          buyer_email?: string | null
          buyer_id: string
          buyer_name?: string | null
          coupon_code: string
          coupon_title?: string | null
          created_at?: string
          currency?: string
          id?: string
          price?: number
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          business_name?: string | null
          business_user_id?: string | null
          buyer_email?: string | null
          buyer_id?: string
          buyer_name?: string | null
          coupon_code?: string
          coupon_title?: string | null
          created_at?: string
          currency?: string
          id?: string
          price?: number
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          category: string
          city: string | null
          country: string | null
          cover_image: string | null
          created_at: string
          description: string
          end_time: string | null
          event_date: string
          featured: boolean
          id: string
          location: string | null
          max_attendees: number | null
          online_url: string | null
          organizer_name: string | null
          organizer_type: string
          price: number | null
          registration_url: string | null
          start_time: string | null
          status: string
          tags: string[] | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          city?: string | null
          country?: string | null
          cover_image?: string | null
          created_at?: string
          description: string
          end_time?: string | null
          event_date: string
          featured?: boolean
          id?: string
          location?: string | null
          max_attendees?: number | null
          online_url?: string | null
          organizer_name?: string | null
          organizer_type?: string
          price?: number | null
          registration_url?: string | null
          start_time?: string | null
          status?: string
          tags?: string[] | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          city?: string | null
          country?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string
          end_time?: string | null
          event_date?: string
          featured?: boolean
          id?: string
          location?: string | null
          max_attendees?: number | null
          online_url?: string | null
          organizer_name?: string | null
          organizer_type?: string
          price?: number | null
          registration_url?: string | null
          start_time?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feed_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_posts: {
        Row: {
          author_role: string | null
          cafe_id: string | null
          city: string | null
          comment_count: number
          content: string
          country: string | null
          created_at: string
          id: string
          image_url: string | null
          like_count: number
          media: Json
          status: string
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          author_role?: string | null
          cafe_id?: string | null
          city?: string | null
          comment_count?: number
          content: string
          country?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          like_count?: number
          media?: Json
          status?: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          author_role?: string | null
          cafe_id?: string | null
          city?: string | null
          comment_count?: number
          content?: string
          country?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          like_count?: number
          media?: Json
          status?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_posts_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
        ]
      }
      founding_1000_signups: {
        Row: {
          account_type: string
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          status: string
          user_id: string
        }
        Insert: {
          account_type: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          account_type?: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_posts: {
        Row: {
          created_at: string
          created_by: string
          expertise: string | null
          id: string
          image_url: string
          logo_url: string | null
          platforms: string[]
          recipient_name: string
          share_text: string | null
          tagline: string | null
          template_type: string
          thumbnail_url: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          expertise?: string | null
          id?: string
          image_url: string
          logo_url?: string | null
          platforms?: string[]
          recipient_name: string
          share_text?: string | null
          tagline?: string | null
          template_type: string
          thumbnail_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          expertise?: string | null
          id?: string
          image_url?: string
          logo_url?: string | null
          platforms?: string[]
          recipient_name?: string
          share_text?: string | null
          tagline?: string | null
          template_type?: string
          thumbnail_url?: string | null
        }
        Relationships: []
      }
      interest_registrations: {
        Row: {
          attachment_urls: string[] | null
          category: string
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          heard_from: string | null
          id: string
          interest_area: string | null
          message: string | null
          name: string | null
          organization: string | null
          phone: string | null
          referral_code: string | null
          role: string | null
          source: string | null
          supply_demand: string | null
        }
        Insert: {
          attachment_urls?: string[] | null
          category?: string
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          heard_from?: string | null
          id?: string
          interest_area?: string | null
          message?: string | null
          name?: string | null
          organization?: string | null
          phone?: string | null
          referral_code?: string | null
          role?: string | null
          source?: string | null
          supply_demand?: string | null
        }
        Update: {
          attachment_urls?: string[] | null
          category?: string
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          heard_from?: string | null
          id?: string
          interest_area?: string | null
          message?: string | null
          name?: string | null
          organization?: string | null
          phone?: string | null
          referral_code?: string | null
          role?: string | null
          source?: string | null
          supply_demand?: string | null
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applicant_email: string | null
          applicant_id: string
          applicant_name: string | null
          applicant_phone: string | null
          attachment_name: string | null
          attachment_url: string | null
          created_at: string
          id: string
          link_url: string | null
          listing_id: string
          message: string | null
          status: string
          updated_at: string
        }
        Insert: {
          applicant_email?: string | null
          applicant_id: string
          applicant_name?: string | null
          applicant_phone?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          created_at?: string
          id?: string
          link_url?: string | null
          listing_id: string
          message?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          applicant_email?: string | null
          applicant_id?: string
          applicant_name?: string | null
          applicant_phone?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          created_at?: string
          id?: string
          link_url?: string | null
          listing_id?: string
          message?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_listings: {
        Row: {
          business_name: string | null
          city: string | null
          country: string | null
          created_at: string
          currency: string
          department: string | null
          description: string | null
          employment_type: string
          expires_at: string | null
          hide_business_name: boolean
          id: string
          location: string | null
          location_type: string
          package: string
          requirements: string | null
          salary_max: number | null
          salary_min: number | null
          status: string
          title: string
          total_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          business_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          department?: string | null
          description?: string | null
          employment_type?: string
          expires_at?: string | null
          hide_business_name?: boolean
          id?: string
          location?: string | null
          location_type?: string
          package?: string
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: string
          title: string
          total_price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          business_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          department?: string | null
          description?: string | null
          employment_type?: string
          expires_at?: string | null
          hide_business_name?: boolean
          id?: string
          location?: string | null
          location_type?: string
          package?: string
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: string
          title?: string
          total_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      may19_submissions: {
        Row: {
          attachment_urls: string[] | null
          bio: string | null
          city: string | null
          consent: boolean | null
          country: string | null
          created_at: string
          description: string | null
          email: string | null
          full_name: string | null
          id: string
          kind: string
          link: string | null
          livestream_participation: string | null
          livestream_time_slot: string | null
          livestream_topic: string | null
          message: string | null
          metadata: Json | null
          phone: string | null
          show_on_map: boolean | null
          social_handle: string | null
          status: string
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          attachment_urls?: string[] | null
          bio?: string | null
          city?: string | null
          consent?: boolean | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          kind: string
          link?: string | null
          livestream_participation?: string | null
          livestream_time_slot?: string | null
          livestream_topic?: string | null
          message?: string | null
          metadata?: Json | null
          phone?: string | null
          show_on_map?: boolean | null
          social_handle?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          attachment_urls?: string[] | null
          bio?: string | null
          city?: string | null
          consent?: boolean | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          kind?: string
          link?: string | null
          livestream_participation?: string | null
          livestream_time_slot?: string | null
          livestream_topic?: string | null
          message?: string | null
          metadata?: Json | null
          phone?: string | null
          show_on_map?: boolean | null
          social_handle?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          context_url: string | null
          created_at: string
          id: string
          is_read: boolean
          recipient_kind: string
          recipient_name: string | null
          recipient_slug: string | null
          recipient_user_id: string | null
          sender_id: string
          sender_name: string | null
          subject: string | null
          thread_id: string
        }
        Insert: {
          body: string
          context_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_kind?: string
          recipient_name?: string | null
          recipient_slug?: string | null
          recipient_user_id?: string | null
          sender_id: string
          sender_name?: string | null
          subject?: string | null
          thread_id?: string
        }
        Update: {
          body?: string
          context_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_kind?: string
          recipient_name?: string | null
          recipient_slug?: string | null
          recipient_user_id?: string | null
          sender_id?: string
          sender_name?: string | null
          subject?: string | null
          thread_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      phone_verifications: {
        Row: {
          attempts: number
          code: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          code: string
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      profile_views: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          viewer_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          viewer_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          viewer_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string | null
          address: string | null
          ambassador_referral_code: string | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          birthday_reminder_enabled: boolean
          business_description: string | null
          business_license_admin_note: string | null
          business_license_name: string | null
          business_license_path: string | null
          business_license_status: string
          business_license_uploaded_at: string | null
          business_name: string | null
          business_sector: string | null
          business_subtype: string | null
          business_website: string | null
          city: string | null
          countries_lived: Json
          country: string | null
          created_at: string
          cv_name: string | null
          cv_path: string | null
          education_level: string | null
          founded_year: number | null
          full_name: string | null
          gift_acceptance_enabled: boolean
          hiring_mode: boolean
          id: string
          is_verified: boolean
          is_volunteer_mentor: boolean
          languages_spoken: string[]
          mentor_topics: string | null
          mentor_weekly_hours: string | null
          onboarding_completed: boolean
          phone: string | null
          phone_verified: boolean
          presentation_name: string | null
          presentation_path: string | null
          profession: string | null
          referral_discount_pct: number
          referred_by_code: string | null
          school: string | null
          show_on_map: boolean
          social_links: Json
          tag_line: string | null
          theme: string | null
          updated_at: string
          websites: Json
          whatsapp_cta_enabled: boolean
          years_in_current_city: number | null
        }
        Insert: {
          account_type?: string | null
          address?: string | null
          ambassador_referral_code?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          birthday_reminder_enabled?: boolean
          business_description?: string | null
          business_license_admin_note?: string | null
          business_license_name?: string | null
          business_license_path?: string | null
          business_license_status?: string
          business_license_uploaded_at?: string | null
          business_name?: string | null
          business_sector?: string | null
          business_subtype?: string | null
          business_website?: string | null
          city?: string | null
          countries_lived?: Json
          country?: string | null
          created_at?: string
          cv_name?: string | null
          cv_path?: string | null
          education_level?: string | null
          founded_year?: number | null
          full_name?: string | null
          gift_acceptance_enabled?: boolean
          hiring_mode?: boolean
          id: string
          is_verified?: boolean
          is_volunteer_mentor?: boolean
          languages_spoken?: string[]
          mentor_topics?: string | null
          mentor_weekly_hours?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          phone_verified?: boolean
          presentation_name?: string | null
          presentation_path?: string | null
          profession?: string | null
          referral_discount_pct?: number
          referred_by_code?: string | null
          school?: string | null
          show_on_map?: boolean
          social_links?: Json
          tag_line?: string | null
          theme?: string | null
          updated_at?: string
          websites?: Json
          whatsapp_cta_enabled?: boolean
          years_in_current_city?: number | null
        }
        Update: {
          account_type?: string | null
          address?: string | null
          ambassador_referral_code?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          birthday_reminder_enabled?: boolean
          business_description?: string | null
          business_license_admin_note?: string | null
          business_license_name?: string | null
          business_license_path?: string | null
          business_license_status?: string
          business_license_uploaded_at?: string | null
          business_name?: string | null
          business_sector?: string | null
          business_subtype?: string | null
          business_website?: string | null
          city?: string | null
          countries_lived?: Json
          country?: string | null
          created_at?: string
          cv_name?: string | null
          cv_path?: string | null
          education_level?: string | null
          founded_year?: number | null
          full_name?: string | null
          gift_acceptance_enabled?: boolean
          hiring_mode?: boolean
          id?: string
          is_verified?: boolean
          is_volunteer_mentor?: boolean
          languages_spoken?: string[]
          mentor_topics?: string | null
          mentor_weekly_hours?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          phone_verified?: boolean
          presentation_name?: string | null
          presentation_path?: string | null
          profession?: string | null
          referral_discount_pct?: number
          referred_by_code?: string | null
          school?: string | null
          show_on_map?: boolean
          social_links?: Json
          tag_line?: string | null
          theme?: string | null
          updated_at?: string
          websites?: Json
          whatsapp_cta_enabled?: boolean
          years_in_current_city?: number | null
        }
        Relationships: []
      }
      service_proposals: {
        Row: {
          consultant_id: string
          created_at: string
          estimated_duration: string | null
          id: string
          message: string
          payment_terms: string | null
          price: number | null
          request_id: string
          scope: string | null
          status: string | null
        }
        Insert: {
          consultant_id: string
          created_at?: string
          estimated_duration?: string | null
          id?: string
          message: string
          payment_terms?: string | null
          price?: number | null
          request_id: string
          scope?: string | null
          status?: string | null
        }
        Update: {
          consultant_id?: string
          created_at?: string
          estimated_duration?: string | null
          id?: string
          message?: string
          payment_terms?: string | null
          price?: number | null
          request_id?: string
          scope?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_proposals_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          attachment_urls: string[] | null
          budget_max: number | null
          budget_min: number | null
          category: string
          city: string | null
          country: string | null
          created_at: string
          description: string
          id: string
          preferred_time: string | null
          status: string | null
          subcategory: string | null
          title: string
          updated_at: string
          urgency: string | null
          user_id: string
        }
        Insert: {
          attachment_urls?: string[] | null
          budget_max?: number | null
          budget_min?: number | null
          category: string
          city?: string | null
          country?: string | null
          created_at?: string
          description: string
          id?: string
          preferred_time?: string | null
          status?: string | null
          subcategory?: string | null
          title: string
          updated_at?: string
          urgency?: string | null
          user_id: string
        }
        Update: {
          attachment_urls?: string[] | null
          budget_max?: number | null
          budget_min?: number | null
          category?: string
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string
          id?: string
          preferred_time?: string | null
          status?: string | null
          subcategory?: string | null
          title?: string
          updated_at?: string
          urgency?: string | null
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          brand_name: string | null
          email_header_html: string | null
          favicon_url: string | null
          id: number
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          brand_name?: string | null
          email_header_html?: string | null
          favicon_url?: string | null
          id?: number
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          brand_name?: string | null
          email_header_html?: string | null
          favicon_url?: string | null
          id?: number
          logo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_connections: {
        Row: {
          block_reason: string | null
          created_at: string
          decided_at: string | null
          id: string
          recipient_id: string
          requester_id: string
          status: string
        }
        Insert: {
          block_reason?: string | null
          created_at?: string
          decided_at?: string | null
          id?: string
          recipient_id: string
          requester_id: string
          status?: string
        }
        Update: {
          block_reason?: string | null
          created_at?: string
          decided_at?: string | null
          id?: string
          recipient_id?: string
          requester_id?: string
          status?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      welcome_pack_orders: {
        Row: {
          adults: number
          arrival_date: string
          children: number
          city: string
          country: string
          created_at: string
          has_pet: boolean
          id: string
          mentor_type: string | null
          needs_airport_transfer: boolean
          needs_baby_seat: boolean
          needs_car_rental: boolean
          needs_flight_discount: boolean
          needs_mentor: boolean
          needs_sim_card: boolean
          notes: string | null
          pet_details: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          adults?: number
          arrival_date: string
          children?: number
          city: string
          country: string
          created_at?: string
          has_pet?: boolean
          id?: string
          mentor_type?: string | null
          needs_airport_transfer?: boolean
          needs_baby_seat?: boolean
          needs_car_rental?: boolean
          needs_flight_discount?: boolean
          needs_mentor?: boolean
          needs_sim_card?: boolean
          notes?: string | null
          pet_details?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          adults?: number
          arrival_date?: string
          children?: number
          city?: string
          country?: string
          created_at?: string
          has_pet?: boolean
          id?: string
          mentor_type?: string | null
          needs_airport_transfer?: boolean
          needs_baby_seat?: boolean
          needs_car_rental?: boolean
          needs_flight_discount?: boolean
          needs_mentor?: boolean
          needs_sim_card?: boolean
          notes?: string | null
          pet_details?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      welcome_pack_proposals: {
        Row: {
          category: string
          created_at: string
          details: string | null
          id: string
          message: string
          order_id: string
          price: number | null
          provider_id: string
          status: string
        }
        Insert: {
          category: string
          created_at?: string
          details?: string | null
          id?: string
          message: string
          order_id: string
          price?: number | null
          provider_id: string
          status?: string
        }
        Update: {
          category?: string
          created_at?: string
          details?: string | null
          id?: string
          message?: string
          order_id?: string
          price?: number | null
          provider_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "welcome_pack_proposals_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "welcome_pack_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_join_requests: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          landing_id: string
          note: string | null
          phone: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          landing_id: string
          note?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          landing_id?: string
          note?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_join_requests_landing_id_fkey"
            columns: ["landing_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_landings"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_landing_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          landing_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          landing_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          landing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_landing_comments_landing_id_fkey"
            columns: ["landing_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_landings"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_landing_follows: {
        Row: {
          created_at: string
          id: string
          landing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          landing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          landing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_landing_follows_landing_id_fkey"
            columns: ["landing_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_landings"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_landing_likes: {
        Row: {
          created_at: string
          id: string
          landing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          landing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          landing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_landing_likes_landing_id_fkey"
            columns: ["landing_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_landings"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_landings: {
        Row: {
          accept_form_enabled: boolean
          accept_form_questions: string | null
          admin_contact: string | null
          admin_name: string | null
          call_to_action_text: string | null
          category: string
          central_city: string | null
          central_country: string | null
          city: string
          conditions: string | null
          country: string
          created_at: string
          description: string | null
          founded_year: number | null
          group_name: string
          hero_image: string | null
          id: string
          member_count: number | null
          mode: string
          primary_language: string | null
          rejection_reason: string | null
          slug: string
          status: string
          tagline: string | null
          theme: string | null
          updated_at: string
          user_id: string
          whatsapp_link: string
        }
        Insert: {
          accept_form_enabled?: boolean
          accept_form_questions?: string | null
          admin_contact?: string | null
          admin_name?: string | null
          call_to_action_text?: string | null
          category: string
          central_city?: string | null
          central_country?: string | null
          city: string
          conditions?: string | null
          country: string
          created_at?: string
          description?: string | null
          founded_year?: number | null
          group_name: string
          hero_image?: string | null
          id?: string
          member_count?: number | null
          mode?: string
          primary_language?: string | null
          rejection_reason?: string | null
          slug: string
          status?: string
          tagline?: string | null
          theme?: string | null
          updated_at?: string
          user_id: string
          whatsapp_link: string
        }
        Update: {
          accept_form_enabled?: boolean
          accept_form_questions?: string | null
          admin_contact?: string | null
          admin_name?: string | null
          call_to_action_text?: string | null
          category?: string
          central_city?: string | null
          central_country?: string | null
          city?: string
          conditions?: string | null
          country?: string
          created_at?: string
          description?: string | null
          founded_year?: number | null
          group_name?: string
          hero_image?: string | null
          id?: string
          member_count?: number | null
          mode?: string
          primary_language?: string | null
          rejection_reason?: string | null
          slug?: string
          status?: string
          tagline?: string | null
          theme?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_link?: string
        }
        Relationships: []
      }
      whatsapp_link_requests: {
        Row: {
          category: string | null
          city: string | null
          country: string | null
          created_at: string
          group_name: string | null
          id: string
          note: string | null
          status: string
          submitter_contact: string | null
          submitter_name: string | null
          user_id: string | null
          whatsapp_link: string
        }
        Insert: {
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          group_name?: string | null
          id?: string
          note?: string | null
          status?: string
          submitter_contact?: string | null
          submitter_name?: string | null
          user_id?: string | null
          whatsapp_link: string
        }
        Update: {
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          group_name?: string | null
          id?: string
          note?: string | null
          status?: string
          submitter_contact?: string | null
          submitter_name?: string | null
          user_id?: string | null
          whatsapp_link?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_ambassador_referral_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      notify_birthday_followers: { Args: never; Returns: undefined }
      notify_followers: {
        Args: {
          _author_id: string
          _message: string
          _related_id: string
          _title: string
          _type: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "user"
        | "consultant"
        | "association"
        | "blogger"
        | "admin"
        | "business"
        | "ambassador"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "user",
        "consultant",
        "association",
        "blogger",
        "admin",
        "business",
        "ambassador",
      ],
    },
  },
} as const
