# 02 — Flat Role Inventory

> **Date:** 2026-06-09 · Source: live `public.roles`. Group prefixes (User_/Admin_/Consultant_/…) are **display groupings only — NOT database families**. No `family_key`/`parent_role_id` in the target schema.

## Final count: **76** independent flat roles (+ 6 legacy DROP)

### Legacy — DROP (sort_order 10–60, not seeded into new system)
| key | label | sort |
|---|---|---|
| `bireysel` | Bireysel Kullanıcı | 10 |
| `danisman` | Danışman | 20 |
| `isletme` | İşletme | 30 |
| `kurulus-dernek` | Kuruluş / Dernek | 40 |
| `blogger-vlogger-youtuber` | Blogger / Vlogger / YouTuber | 50 |
| `sehir-elcisi` | Şehir Elçisi | 60 |

> Resolution (report 00 §3): no phantom replacement roles. New equivalents already exist (e.g. `User_CityAmbassador` for `sehir-elcisi`, `User_BloggerVlogger` for `blogger-vlogger-youtuber`).

### Keep — 76 flat roles (sort_order 1000+)
**User (5):** User_Standard, User_DiasporaMember, User_Contributor, User_CityAmbassador, User_BloggerVlogger
**Admin (3):** Admin_ContentModerator, Admin_PlatformAdmin, Admin_SuperAdmin
**Consultant (11):** Consultant_RealEstate, _VisaImmigration, _BusinessSetupWork, _LawTax, _TrademarkPatent, _Financial, _LifeRelocation, _FamilyChildren, _PsychologistCoach, _Education, _PracticalLife
**Organization (8):** Organization_AssociationFoundation, _ChamberCouncil, _AcademicUnit, _EducationInstitution, _TurkishMedia, _EmbassyConsulate, _HealthcareInstitution, _DigitalCommunity
**Business (24):** Business_RestaurantCafe, _MarketGrocery, _BakeryPatisserie, _HairdresserBeauty, _Barber, _HealthcareClinic, _Pharmacy, _LawOffice, _AccountingFinance, _RealEstateOffice, _TravelAgency, _HotelAccommodation, _EducationInstitution, _LanguageSchool, _ITSoftware, _DesignAdvertising, _ConstructionRenovation, _TransportLogistics, _Automotive, _Gym, _ChildrenFamily, _Insurance, _RetailStore, _ECommerce, _Wholesale
**Healthcare (7):** Healthcare_Doctor, _Dentist, _Psychologist, _Hospital, _Clinic, _Pharmacy, _AppointmentProvider
**Event (3):** Event_Organizer, _Venue, _Sponsor
**Job (4):** Job_Employer, _Recruiter, _Candidate, _Agency
**Community (5):** Community_GroupAdmin, _WhatsAppAdmin, _TelegramAdmin, _DiscordAdmin, _SocialMediaAdmin
**Marketplace (5):** Marketplace_IndividualSeller, _BusinessSeller, _ServiceProvider, _CourseProvider, _Landlord

Total: 5+3+11+8+24+7+3+4+5+5 = **76**. ✓ Matches plan §7.2 exactly.
