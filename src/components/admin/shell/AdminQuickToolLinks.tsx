// Admin Panel V2 — sık kullanılan dış araçlara hızlı erişim butonları.
// Arama kutusunun solunda sabit üç link: Clarity, Search Console, Drive.

import { FolderOpen, LineChart, SearchCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type QuickTool = {
  id: string;
  label: string;
  href: string;
  icon: typeof LineChart;
  className: string;
};

const quickTools: QuickTool[] = [
  {
    id: "clarity",
    label: "Microsoft Clarity",
    href: "https://clarity.microsoft.com/projects/view/wdkgdje6rb/dashboard?date=Last%203%20days",
    icon: LineChart,
    className: "hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:hover:border-violet-800 dark:hover:bg-violet-950 dark:hover:text-violet-300",
  },
  {
    id: "search-console",
    label: "Google Search Console",
    href: "https://search.google.com/u/1/search-console/performance/search-analytics?resource_id=sc-domain%3Acorteqs.net&hl=de&pageId=none",
    icon: SearchCheck,
    className: "hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:border-blue-800 dark:hover:bg-blue-950 dark:hover:text-blue-300",
  },
  {
    id: "drive",
    label: "Google Drive Klasörü",
    href: "https://drive.google.com/drive/u/0/folders/1TYFEdjDPOLOMWAf_MScs6XJXRW9FHh-r",
    icon: FolderOpen,
    className: "hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:hover:border-amber-800 dark:hover:bg-amber-950 dark:hover:text-amber-300",
  },
];

const AdminQuickToolLinks = () => (
  <TooltipProvider delayDuration={200}>
    <div className="hidden items-center gap-1 border-r border-border pr-2 mr-1 sm:flex">
      {quickTools.map((tool) => (
        <Tooltip key={tool.id}>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn("border-transparent bg-muted/50 text-muted-foreground transition-colors", tool.className)}
              asChild
            >
              <a href={tool.href} target="_blank" rel="noreferrer" aria-label={tool.label}>
                <tool.icon aria-hidden="true" className="h-4 w-4" />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{tool.label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  </TooltipProvider>
);

export default AdminQuickToolLinks;
