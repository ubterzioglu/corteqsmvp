import AdminResourceLinksPage from "@/pages/admin/AdminResourceLinksPage";

const AdminSocialMediaLinksPage = () => (
  <AdminResourceLinksPage
    tableName="social_media_links"
    title="Sosyal Medya Linkleri"
    description="Genel sosyal medya kaynak linklerini yönetin."
    emptyMessage="Henüz sosyal medya kaydı yok."
  />
);

export default AdminSocialMediaLinksPage;
