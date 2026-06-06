import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicProfileViewModel } from "@/lib/profile-view-model";

type Props = {
  model: PublicProfileViewModel;
  mode?: "preview" | "public";
};

const PublicProfileSummaryView = ({ model, mode = "public" }: Props) => {
  const initials =
    model.displayName
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "CQ";

  return (
    <Card className="border-slate-200 bg-white/90 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          {model.imageUrl ? (
            <img
              src={model.imageUrl}
              alt={model.displayName}
              className="h-20 w-20 rounded-[22px] object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-[22px] bg-gradient-to-br from-sky-500 to-cyan-500 text-xl font-bold text-white shadow-sm">
              {initials}
            </div>
          )}
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary">{model.roleLabel}</Badge>
              {mode === "preview" ? <Badge variant="outline">Public Önizleme</Badge> : null}
              {model.badges.slice(1).map((badge) => (
                <Badge key={badge} variant="outline" className="text-[10px]">
                  {badge}
                </Badge>
              ))}
            </div>
            <div>
              <CardTitle className="text-2xl">{model.displayName}</CardTitle>
              <CardDescription className="mt-1 text-sm">
                {model.headline || model.roleDescription || "Profil özeti henüz eklenmedi."}
              </CardDescription>
            </div>
            {model.locationLabel ? (
              <p className="text-xs text-muted-foreground">{model.locationLabel}</p>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {model.sections.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {model.sections.map((section) => (
              <div key={section.key} className="rounded-xl border bg-slate-50/70 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{section.label}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{section.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{model.emptyMessage}</p>
        )}

        {model.links.length ? (
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Bağlantılar</p>
            <div className="flex flex-wrap gap-2">
              {model.links.map((link) => (
                <a
                  key={`${link.label}-${link.url}`}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default PublicProfileSummaryView;
