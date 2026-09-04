// Profil Workshop — /admin/workshop/profil.
// Kaynak: 03.09.2026 "Profiller" toplantısı (WS1). Aynı toplantının tamamı Komuta
// Merkezi'nde T19 meeting_note olarak da duruyor; bu pano yalnız PROFİL maddelerini
// Cadde workshop'uyla aynı formatta (madde + UBT/Burak onay kutusu) tutar.
// Pano davranışı ortak bileşende: src/components/admin/workshop/WorkshopBoard.tsx

import { WorkshopBoard } from "@/components/admin/workshop/WorkshopBoard";
import { WORKSHOP_LABELS } from "@/lib/admin-shell/workshop-items";

const AdminWorkshopProfilPage = () => (
  <WorkshopBoard
    workshopKey="profil"
    title={WORKSHOP_LABELS.profil}
    description="03.09.2026 Profiller toplantısı maddeleri. Bir madde UBT ve Burak onayını da aldığında bitmiş sayılır."
  />
);

export default AdminWorkshopProfilPage;
