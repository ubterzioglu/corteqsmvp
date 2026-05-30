// src/pages/admin/muhasebe/MuhasebeLayout.tsx
// /admin/muhasebe altındaki tab navigasyonu için layout

import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, TrendingDown, TrendingUp, LineChart } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: 'giderler', label: 'Giderler', icon: TrendingDown, end: false },
  { to: 'gelirler', label: 'Gelirler', icon: TrendingUp, end: false },
  { to: 'nakit-akisi', label: 'Nakit Akışı', icon: LineChart, end: false },
] as const;

export default function MuhasebeLayout() {
  return (
    <div className="space-y-6">
      <nav
        className="border-b flex gap-1 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0"
        aria-label="Muhasebe bölümleri"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  isActive
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted',
                )
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {tab.label}
            </NavLink>
          );
        })}
      </nav>

      <Outlet />
    </div>
  );
}
