import { useState } from "react";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ReviewDecision } from "@/lib/catalog-import-schemas";

const ImportReviewSection = ({
  onReview,
}: {
  onReview: (decision: ReviewDecision, note: string | null) => void;
}) => {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handle = async (decision: ReviewDecision) => {
    setSubmitting(true);
    await onReview(decision, note.trim() || null);
    setSubmitting(false);
  };

  return (
    <Card className="border-amber-300 bg-amber-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-amber-600" />
          İçe Aktarma Onayı
        </CardTitle>
        <CardDescription>
          Bu kayıt bir toplu içe aktarmadan geldi ve incelemede. Onaylarsanız yayına alınır (herkese açık),
          reddederseniz gizli kalır.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Karar notu (opsiyonel)"
        />
        <div className="flex gap-2">
          <Button className="flex-1" disabled={submitting} onClick={() => void handle("approved")}>
            {submitting ? "İşleniyor..." : "Onayla ve Yayınla"}
          </Button>
          <Button className="flex-1" variant="outline" disabled={submitting} onClick={() => void handle("rejected")}>
            Reddet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportReviewSection;
