// Admin Panel V2 — breadcrumb.
// Zincir registry + route meta üzerinden otomatik çözülür
// (useAdminBreadcrumbs -> buildAdminBreadcrumbs).

import { Fragment } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import { useAdminBreadcrumbs } from "@/hooks/admin/useAdminBreadcrumbs";

const AdminBreadcrumbs = () => {
  const breadcrumbs = useAdminBreadcrumbs();

  if (breadcrumbs.length === 0) return null;

  return (
    <nav aria-label="breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <Fragment key={`${crumb.label}-${index}`}>
              {index > 0 && <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0 opacity-60" />}
              <li className="min-w-0">
                {isLast || !crumb.to ? (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={isLast ? "block truncate font-medium text-foreground" : "block truncate"}
                  >
                    {crumb.label}
                  </span>
                ) : (
                  <Link to={crumb.to} className="block truncate transition-colors hover:text-foreground">
                    {crumb.label}
                  </Link>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
};

export default AdminBreadcrumbs;
