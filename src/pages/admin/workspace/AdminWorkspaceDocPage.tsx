import { Navigate, useParams } from "react-router-dom";

import AccordionCard from "@/components/dashboard/AccordionCard";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { getWorkspaceDocPage } from "@/lib/dashboard/workspace-doc-pages";

const AdminWorkspaceDocPage = () => {
  const params = useParams<{ slug: string }>();
  const page = params.slug ? getWorkspaceDocPage(params.slug) : null;

  if (!page) {
    return <Navigate to="/admin/workspace" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {page.badge.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700"
            >
              {chip}
            </span>
          ))}
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{page.title}</h2>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">{page.description}</p>
        </div>
      </div>

      <AccordionCard
        defaultOpenId={page.sections[0]?.id}
        items={page.sections.map((section) => ({
          id: section.id,
          title: section.title,
          accentColor: section.accentColor,
          children: section.content,
        }))}
      />
    </div>
  );
};

export default AdminWorkspaceDocPage;
