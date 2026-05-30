import { useNavigate } from "react-router-dom";
import SurveyBuilder from "@/components/admin/surveys/SurveyBuilder";

export default function AdminSurveyCreatePage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Yeni Anket Oluştur</h1>
      <SurveyBuilder onSaved={(id) => navigate(`/admin/surveys/${id}/edit`)} />
    </div>
  );
}
