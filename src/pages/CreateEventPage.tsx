import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSeo } from "@/lib/seo";

export default function CreateEventPage() {
  const navigate = useNavigate();

  useSeo({
    title: "Etkinlik Oluştur | CorteQS",
    description: "Yeni bir etkinlik oluşturun.",
    canonicalPath: "/events",
    robots: "noindex, follow",
  });

  useEffect(() => {
    navigate("/events", { replace: true });
  }, [navigate]);

  return null;
}
