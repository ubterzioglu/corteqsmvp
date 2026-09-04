// Cadde Workshop — /admin/workshop/cadde.
// Kaynak: 30.07.2026 Cadde workshop transkripti (WS1) + 04.08.2026 ikinci oturum (WS2).
// Pano davranışı ortak bileşende: src/components/admin/workshop/WorkshopBoard.tsx

import { WorkshopBoard } from "@/components/admin/workshop/WorkshopBoard";
import { WORKSHOP_LABELS } from "@/lib/admin-shell/workshop-items";

const AdminWorkshopCaddePage = () => (
  <WorkshopBoard
    workshopKey="cadde"
    title={WORKSHOP_LABELS.cadde}
    description="30.07.2026 ve 04.08.2026 Cadde workshop maddeleri. Bir madde UBT ve Burak onayını da aldığında bitmiş sayılır."
  />
);

export default AdminWorkshopCaddePage;
