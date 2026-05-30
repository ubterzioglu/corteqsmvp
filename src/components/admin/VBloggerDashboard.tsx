import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  PenLine, Eye, Heart, Users, TrendingUp, DollarSign, Video,
  Search, Star, Award, ArrowUpRight, Share2, MessageSquare,
  Download, FileText, MapPin
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from "recharts";

// ─── Mock V/Blogger Data ─────────────────────────────────
const vbloggers = [
  { id: "vb1", name: "Elif Yılmaz", city: "Berlin", country: "Almanya", followers: 48200, videos: 124, blogs: 56, views: 892000, likes: 125000, engagement: 14.2, revenue: 3200, aiTwinSessions: 420, liveSessionRevenue: 1800, adCollabs: 8, gustos: ["Yemek", "Kültür", "Seyahat"], avatar: "👩‍💻", trend: "+18%", monthlyContent: [12, 15, 18, 14, 20, 22], monthlyEngagement: [11.5, 12.0, 13.2, 13.8, 14.0, 14.2] },
  { id: "vb2", name: "Cem Akgün", city: "Londra", country: "İngiltere", followers: 35600, videos: 89, blogs: 34, views: 654000, likes: 89000, engagement: 12.8, revenue: 2400, aiTwinSessions: 310, liveSessionRevenue: 1200, adCollabs: 5, gustos: ["Teknoloji", "Finans"], avatar: "👨‍🎤", trend: "+22%", monthlyContent: [8, 10, 12, 9, 14, 11], monthlyEngagement: [10.2, 11.0, 11.8, 12.2, 12.5, 12.8] },
  { id: "vb3", name: "Seda Nur", city: "Dubai", country: "BAE", followers: 62000, videos: 156, blogs: 78, views: 1240000, likes: 198000, engagement: 16.1, revenue: 4800, aiTwinSessions: 580, liveSessionRevenue: 2400, adCollabs: 12, gustos: ["Lifestyle", "Moda", "Yemek"], avatar: "👩‍🎨", trend: "+32%", monthlyContent: [18, 20, 22, 25, 28, 30], monthlyEngagement: [13.5, 14.2, 14.8, 15.3, 15.8, 16.1] },
  { id: "vb4", name: "Burak Deniz", city: "Amsterdam", country: "Hollanda", followers: 28400, videos: 67, blogs: 42, views: 456000, likes: 62000, engagement: 11.5, revenue: 1800, aiTwinSessions: 190, liveSessionRevenue: 900, adCollabs: 3, gustos: ["Spor", "Sağlık"], avatar: "🧑‍💼", trend: "+8%", monthlyContent: [6, 7, 8, 7, 9, 10], monthlyEngagement: [10.0, 10.5, 10.8, 11.0, 11.2, 11.5] },
  { id: "vb5", name: "Zehra Kaya", city: "Paris", country: "Fransa", followers: 41200, videos: 98, blogs: 51, views: 780000, likes: 105000, engagement: 13.5, revenue: 2900, aiTwinSessions: 350, liveSessionRevenue: 1500, adCollabs: 7, gustos: ["Sanat", "Kültür", "Seyahat"], avatar: "👩‍🎤", trend: "+15%", monthlyContent: [10, 12, 14, 11, 16, 13], monthlyEngagement: [12.0, 12.5, 13.0, 13.2, 13.4, 13.5] },
  { id: "vb6", name: "Murat Özcan", city: "Münih", country: "Almanya", followers: 19800, videos: 45, blogs: 28, views: 312000, likes: 42000, engagement: 10.2, revenue: 1200, aiTwinSessions: 140, liveSessionRevenue: 600, adCollabs: 2, gustos: ["Hukuk", "Finans"], avatar: "👨‍⚖️", trend: "+5%", monthlyContent: [4, 5, 6, 5, 7, 6], monthlyEngagement: [9.0, 9.5, 9.8, 10.0, 10.1, 10.2] },
  { id: "vb7", name: "Aylin Çetin", city: "Frankfurt", country: "Almanya", followers: 22600, videos: 58, blogs: 32, views: 398000, likes: 55000, engagement: 11.8, revenue: 1600, aiTwinSessions: 200, liveSessionRevenue: 800, adCollabs: 4, gustos: ["Eğitim", "Teknoloji"], avatar: "👩‍🏫", trend: "+12%", monthlyContent: [7, 8, 9, 8, 10, 9], monthlyEngagement: [10.5, 11.0, 11.2, 11.4, 11.6, 11.8] },
  { id: "vb8", name: "Kaan Yıldırım", city: "New York", country: "ABD", followers: 55400, videos: 132, blogs: 65, views: 1050000, likes: 156000, engagement: 15.0, revenue: 4200, aiTwinSessions: 520, liveSessionRevenue: 2200, adCollabs: 10, gustos: ["İş Dünyası", "Teknoloji", "Seyahat"], avatar: "👨‍💻", trend: "+28%", monthlyContent: [14, 16, 20, 18, 22, 24], monthlyEngagement: [13.0, 13.5, 14.0, 14.3, 14.8, 15.0] },
];

const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz"];

const contentTypeDistribution = [
  { name: "Video İçerik", value: 55, color: "hsl(var(--primary))" },
  { name: "Blog Yazısı", value: 25, color: "hsl(var(--chart-2))" },
  { name: "AI Twin Seans", value: 12, color: "hsl(var(--chart-3))" },
  { name: "Canlı Yayın", value: 8, color: "hsl(var(--chart-4))" },
];

const revenueBySource = [
  { name: "Ad Collab", value: 8200, color: "hsl(var(--primary))" },
  { name: "AI Twin", value: 5400, color: "hsl(var(--chart-1))" },
  { name: "Canlı Seans", value: 4200, color: "hsl(var(--chart-2))" },
  { name: "Sosyal Medya Paketi", value: 2800, color: "hsl(var(--chart-3))" },
  { name: "Sponsor İçerik", value: 1500, color: "hsl(var(--chart-4))" },
];

const chartTooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

const VBloggerDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("revenue");
  const [countryFilter, setCountryFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");

  const countries = useMemo(() => [...new Set(vbloggers.map(v => v.country))], []);
  const cities = useMemo(() => {
    const list = countryFilter === "all" ? vbloggers : vbloggers.filter(v => v.country === countryFilter);
    return [...new Set(list.map(v => v.city))];
  }, [countryFilter]);

  const filtered = useMemo(() => {
    let list = vbloggers;
    if (countryFilter !== "all") list = list.filter(v => v.country === countryFilter);
    if (cityFilter !== "all") list = list.filter(v => v.city === cityFilter);
    if (searchTerm) list = list.filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.city.toLowerCase().includes(searchTerm.toLowerCase()));
    return [...list].sort((a, b) => {
      if (sortBy === "revenue") return b.revenue - a.revenue;
      if (sortBy === "followers") return b.followers - a.followers;
      if (sortBy === "engagement") return b.engagement - a.engagement;
      if (sortBy === "views") return b.views - a.views;
      if (sortBy === "content") return (b.videos + b.blogs) - (a.videos + a.blogs);
      return b.revenue - a.revenue;
    });
  }, [searchTerm, sortBy, countryFilter, cityFilter]);

  const top3 = useMemo(() => [...vbloggers].sort((a, b) => b.revenue - a.revenue).slice(0, 3), []);

  const totalRevenue = filtered.reduce((s, v) => s + v.revenue, 0);
  const totalFollowers = filtered.reduce((s, v) => s + v.followers, 0);
  const totalViews = filtered.reduce((s, v) => s + v.views, 0);
  const avgEngagement = filtered.length > 0 ? (filtered.reduce((s, v) => s + v.engagement, 0) / filtered.length).toFixed(1) : "0";
  const totalContent = filtered.reduce((s, v) => s + v.videos + v.blogs, 0);

  // Monthly content & engagement aggregation for filtered bloggers
  const monthlyReport = useMemo(() => {
    return months.map((month, i) => {
      const totalContentMonth = filtered.reduce((s, v) => s + (v.monthlyContent[i] || 0), 0);
      const avgEng = filtered.length > 0
        ? (filtered.reduce((s, v) => s + (v.monthlyEngagement[i] || 0), 0) / filtered.length).toFixed(1)
        : "0";
      return { month, content: totalContentMonth, engagement: parseFloat(avgEng as string) };
    });
  }, [filtered]);

  const handleExportReport = () => {
    const header = "Ay,İçerik Sayısı,Ort. Etkileşim %\n";
    const rows = monthlyReport.map(r => `${r.month},${r.content},${r.engagement}`).join("\n");
    const bloggerRows = "\n\nV/Blogger,Şehir,Ülke,Takipçi,Video,Blog,Görüntülenme,Etkileşim %,Gelir €\n" +
      filtered.map(v => `${v.name},${v.city},${v.country},${v.followers},${v.videos},${v.blogs},${v.views},${v.engagement},${v.revenue}`).join("\n");
    const csv = header + rows + bloggerRows;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vblogger-rapor-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "V/Blogger", value: filtered.length.toString(), icon: PenLine, color: "text-primary", change: "+3" },
          { label: "Takipçi", value: `${(totalFollowers / 1000).toFixed(1)}K`, icon: Users, color: "text-chart-2", change: "+12%" },
          { label: "Görüntülenme", value: `${(totalViews / 1000000).toFixed(1)}M`, icon: Eye, color: "text-chart-3", change: "+24%" },
          { label: "Toplam İçerik", value: totalContent.toString(), icon: FileText, color: "text-chart-4", change: "+18%" },
          { label: "Gelir", value: `€${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-success", change: "+22%" },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                  <span className="text-xs text-emerald-500 font-semibold flex items-center gap-0.5">
                    <ArrowUpRight className="h-3 w-3" /> {kpi.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters row */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <MapPin className="h-4 w-4 text-primary" /> Filtrele:
            </div>
            <Select value={countryFilter} onValueChange={(v) => { setCountryFilter(v); setCityFilter("all"); }}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Ülke" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Ülkeler</SelectItem>
                {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Şehir" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Şehirler</SelectItem>
                {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Sırala" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Gelir</SelectItem>
                <SelectItem value="followers">Takipçi</SelectItem>
                <SelectItem value="engagement">Etkileşim</SelectItem>
                <SelectItem value="views">Görüntülenme</SelectItem>
                <SelectItem value="content">İçerik Sayısı</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-[150px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="İsim veya şehir ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 h-8 text-xs" />
            </div>
            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={handleExportReport}>
              <Download className="h-3.5 w-3.5" /> Rapor İndir
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Top 3 */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-500" /> En İyi 3 V/Blogger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {top3.map((vb, i) => (
              <div key={vb.id} className={`rounded-xl p-4 border ${i === 0 ? "border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10" : "border-border"}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">{vb.avatar}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{vb.name}</p>
                      {i === 0 && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{vb.city}, {vb.country}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted/50 rounded p-2">
                    <p className="text-muted-foreground">Takipçi</p>
                    <p className="font-bold text-foreground">{(vb.followers / 1000).toFixed(1)}K</p>
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <p className="text-muted-foreground">İçerik</p>
                    <p className="font-bold text-foreground">{vb.videos + vb.blogs}</p>
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <p className="text-muted-foreground">Etkileşim</p>
                    <p className="font-bold text-foreground">%{vb.engagement}</p>
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <p className="text-muted-foreground">Gelir</p>
                    <p className="font-bold text-primary">€{vb.revenue.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {vb.gustos.map(g => <Badge key={g} variant="secondary" className="text-[10px]">{g}</Badge>)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Content & Engagement Report Chart */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Aylık İçerik & Etkileşim Raporu
              {(countryFilter !== "all" || cityFilter !== "all") && (
                <Badge variant="outline" className="text-[10px] ml-2">
                  {countryFilter !== "all" ? countryFilter : ""}{cityFilter !== "all" ? ` · ${cityFilter}` : ""}
                </Badge>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyReport} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} domain={[0, 20]} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar yAxisId="left" dataKey="content" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="İçerik Sayısı" />
              <Line yAxisId="right" type="monotone" dataKey="engagement" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Ort. Etkileşim %" dot={{ r: 3 }} />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-chart-2" /> Gelir Kaynakları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={revenueBySource} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {revenueBySource.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} formatter={(val: number) => `€${val.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Video className="h-4 w-4 text-chart-3" /> İçerik Türü Dağılımı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={contentTypeDistribution} cx="50%" cy="50%" outerRadius={75} dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                  {contentTypeDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* V/Blogger List */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <PenLine className="h-4 w-4 text-primary" /> V/Blogger Listesi
            <Badge variant="secondary" className="text-[10px] ml-1">{filtered.length} kişi</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[480px]">
            <div className="divide-y divide-border">
              {filtered.map(vb => (
                <div key={vb.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{vb.avatar}</span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{vb.name}</p>
                        <p className="text-xs text-muted-foreground">{vb.city}, {vb.country}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-500 flex items-center gap-0.5">
                      <ArrowUpRight className="h-3 w-3" /> {vb.trend}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Takipçi</p>
                      <p className="font-semibold">{(vb.followers / 1000).toFixed(1)}K</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Video</p>
                      <p className="font-semibold">{vb.videos}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Blog</p>
                      <p className="font-semibold">{vb.blogs}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Etkileşim</p>
                      <p className="font-semibold">%{vb.engagement}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">AI Twin</p>
                      <p className="font-semibold">{vb.aiTwinSessions}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ad Collab</p>
                      <p className="font-semibold">{vb.adCollabs}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Gelir</p>
                      <p className="font-bold text-primary">€{vb.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {vb.gustos.map(g => <Badge key={g} variant="outline" className="text-[10px]">{g}</Badge>)}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">Sonuç bulunamadı</div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default VBloggerDashboard;
