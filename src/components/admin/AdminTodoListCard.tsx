// Yapılacaklar kartı — admin-todos.ts tek kaynağını çizer, her maddeye aksiyon butonları bağlar.
// Tamamlandı işareti KİŞİSELDİR: localStorage'da tutulur (updates-seen deseni) — DB yok,
// migration yok; ekipçe ortak durum istenirse sonradan tabloya taşınır.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink, ListTodo } from "lucide-react";
import { ADMIN_TODOS } from "@/lib/admin-shell/admin-todos";

const STORAGE_KEY = "corteqs.admin.todos-done.v1";

/** Bozuk/eski localStorage değerinde çökmez; dizi-dışı her şey boş sayılır. */
function readDoneIds(): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((value): value is string => typeof value === "string"));
  } catch {
    return new Set();
  }
}

export function AdminTodoListCard() {
  const [doneIds, setDoneIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setDoneIds(readDoneIds());
  }, []);

  const toggle = (id: string, checked: boolean) => {
    setDoneIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // Depolama dolu/kapalıysa işaret bu oturumda kalır — kritik değil.
      }
      return next;
    });
  };

  // Açıklar üstte, tamamlananlar altta — liste kendi kendini temizler.
  const sorted = [...ADMIN_TODOS].sort(
    (a, b) => Number(doneIds.has(a.id)) - Number(doneIds.has(b.id)),
  );
  const openCount = ADMIN_TODOS.filter((todo) => !doneIds.has(todo.id)).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ListTodo className="h-5 w-5" /> Yapılacaklar ({openCount} açık)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.map((todo) => {
          const done = doneIds.has(todo.id);
          return (
            <div
              key={todo.id}
              className={`rounded-lg border p-4 ${done ? "opacity-60" : ""}`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  className="mt-1"
                  checked={done}
                  onCheckedChange={(checked) => toggle(todo.id, checked === true)}
                  aria-label={`${todo.title} — tamamlandı`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-medium ${done ? "line-through" : ""}`}>{todo.title}</span>
                    {todo.priority === "kritik" && !done ? (
                      <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
                        kritik
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{todo.description}</p>
                  {!done && todo.actions.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {todo.actions.map((action) =>
                        action.to ? (
                          <Button key={action.label} asChild size="sm" variant="outline">
                            <Link to={action.to}>{action.label}</Link>
                          </Button>
                        ) : (
                          <Button key={action.label} asChild size="sm" variant="outline">
                            <a href={action.href} target="_blank" rel="noreferrer">
                              {action.label}
                              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                            </a>
                          </Button>
                        ),
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
