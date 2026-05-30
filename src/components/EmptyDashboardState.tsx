import { Inbox } from "lucide-react";

interface Props {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Standard "no data yet" placeholder for dashboard tabs.
 * Used after mock data was removed pre-launch — describes what real data
 * will appear here once users / forms / Supabase tables start populating it.
 */
const EmptyDashboardState = ({ title, description, icon: Icon = Inbox }: Props) => (
  <div className="rounded-2xl border-2 border-dashed border-border bg-muted/20 p-8 text-center">
    <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
      <Icon className="h-6 w-6 text-muted-foreground" />
    </div>
    <h3 className="font-semibold text-foreground mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground max-w-md mx-auto font-body">{description}</p>
  </div>
);

export default EmptyDashboardState;
