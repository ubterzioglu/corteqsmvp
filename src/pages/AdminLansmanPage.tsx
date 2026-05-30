import AdminLansmanTable from "@/components/AdminLansmanTable";

const AdminLansmanPage = () => {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Lansman Yönetimi</h1>
        <p className="text-sm text-muted-foreground">
          Tüm başvuruları görüntüleyin, onaylayın veya reddedin.
        </p>
      </div>

      <AdminLansmanTable />
    </div>
  );
};

export default AdminLansmanPage;
