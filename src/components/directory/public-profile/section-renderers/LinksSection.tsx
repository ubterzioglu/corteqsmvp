import { ExternalLink } from "lucide-react";

import type { LinkRowViewModel } from "@/lib/public-catalog-profile-view-model";

import type { PublicSectionRendererProps } from "./renderer-registry";

const isLinkRow = (row: unknown): row is LinkRowViewModel =>
  typeof row === "object" &&
  row !== null &&
  typeof (row as LinkRowViewModel).url === "string" &&
  typeof (row as LinkRowViewModel).label === "string";

const LinksSection = ({ section }: PublicSectionRendererProps) => {
  const links = Array.isArray(section.content.links)
    ? section.content.links.filter(isLinkRow)
    : [];
  if (links.length === 0) return null;

  return (
    <ul className="space-y-2.5 text-sm">
      {links.map((link) => (
        <li key={link.key ?? link.url}>
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="group flex items-start gap-2"
          >
            <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-muted-foreground">{link.label}</span>
              <span className="break-all font-medium text-primary underline-offset-4 group-hover:underline">
                {link.url}
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
};

export default LinksSection;
