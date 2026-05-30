import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Globe, Sparkles, Users, Briefcase, Building2, MapPin,
  Rocket, CheckCircle2, Loader2, Upload, X, Languages, HeartHandshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import multiculturalHero from "@/assets/multicultural-diaspora-hero.jpg";

/**
 * EN landing — "Register Diaspora" — mirrors the Turkish hero structure
 * for any community. All category buttons are display-only (no navigation).
 * Submissions are written to interest_registrations with
 *   source = "register_diaspora_<community>"
 * so admin can sort applications by diaspora.
 */



const RegisterDiaspora = () => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [form, setForm] = useState({
    diaspora_community: "",
    name: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    organization: "",
    role: "general",
    links: "",
    message: "",
  });

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    if (files.length + list.length > 5) {
      toast({ title: "Max 5 files", variant: "destructive" });
      return;
    }
    const big = list.find((f) => f.size > 10 * 1024 * 1024);
    if (big) {
      toast({ title: "File too large", description: `${big.name} > 10MB`, variant: "destructive" });
      return;
    }
    setFiles((p) => [...p, ...list]);
  };

  const upload = async (tag: string) => {
    const urls: string[] = [];
    for (const f of files) {
      const ext = f.name.split(".").pop() || "bin";
      const path = `register_diaspora/${tag}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("interest-uploads").upload(path, f, { contentType: f.type });
      if (error) throw error;
      urls.push(path);
    }
    return urls;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.diaspora_community.trim()) {
      toast({ title: "Diaspora community, name and email are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const tag = form.diaspora_community
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/(^_|_$)/g, "")
        .slice(0, 40) || "unknown";
      const attachment_urls = await upload(tag);
      const { error } = await supabase.from("interest_registrations").insert({
        category: "register_diaspora",
        role: form.role,
        name: form.name,
        email: form.email,
        phone: form.phone,
        country: form.country,
        city: form.city,
        organization: form.organization,
        // Tag the desired diaspora community so admin can sort
        interest_area: form.diaspora_community.trim(),
        supply_demand: form.message,
        heard_from: form.links,
        source: `register_diaspora_${tag}`,
        attachment_urls,
        message: form.message,
      });
      if (error) throw error;
      setDone(true);
      toast({ title: "Thank you!", description: "Registration received. We'll be in touch shortly." });
    } catch (err: unknown) {
      toast({
        title: "Something went wrong",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* OPENING BANNER — multicultural hero, no national flags */}
      <section className="relative pt-16 min-h-[70vh] flex items-center bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 right-20 w-80 h-80 bg-turquoise/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-primary/15 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 pt-20 pb-12 relative z-10 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400/15 border border-amber-400/30 mb-6 shadow-md">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold text-amber-600">Register Your Diaspora — Pre-launch</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-4">
              Your diaspora's{" "}
              <span className="text-gradient-primary">consultants, businesses & associations</span>{" "}
              — under one roof
            </h1>

            <p className="text-base md:text-lg font-semibold text-foreground mb-3">
              One diaspora. One platform. One social & economic solidarity engine.
            </p>

            <p className="text-sm md:text-base text-muted-foreground max-w-xl mb-6 font-body">
              CorteQS gathers every consultant, business, association, school, event and WhatsApp
              community of your diaspora in one verified place — so your people can find help, find clients,
              find partners, and look out for each other, anywhere in the world.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Button
                size="lg"
                onClick={() => document.getElementById("register-form")?.scrollIntoView({ behavior: "smooth" })}
                className="bg-turquoise hover:bg-turquoise-light text-primary-foreground gap-2"
              >
                <Globe className="h-5 w-5" /> Register Your Diaspora
              </Button>
              <Link to="/">
                <Button size="lg" variant="outline" className="gap-2">
                  <Languages className="h-4 w-4" /> See it live
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-turquoise" /> 45+ Countries</span>
              <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-primary" /> 500+ Consultants</span>
              <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-turquoise" /> 200+ Organizations</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-turquoise/20 via-amber-300/10 to-primary/20 rounded-3xl blur-2xl" />
            <img
              src={multiculturalHero}
              alt="Global multicultural diaspora community"
              width={1536}
              height={1024}
              className="relative rounded-3xl shadow-2xl border border-border w-full h-auto object-cover"
            />
          </div>
        </div>
      </section>

      {/* SECTION — Solidarity engine (consultants + businesses + associations under one roof) */}
      <section className="py-14 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 mb-4">
              <HeartHandshake className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-semibold text-amber-700">Social + Economic Solidarity Engine</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">
              Everything your diaspora needs — together, not scattered
            </h2>
            <p className="text-muted-foreground font-body">
              Stop hunting through dozens of WhatsApp groups, Facebook pages and word-of-mouth lists.
              CorteQS unifies your community's professionals, businesses and organisations into one
              network that creates trust, referrals and real economic momentum.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            <div className="rounded-2xl border border-border p-5 bg-background">
              <div className="w-10 h-10 rounded-lg bg-turquoise/15 flex items-center justify-center mb-3">
                <Users className="h-5 w-5 text-turquoise" />
              </div>
              <h3 className="font-bold text-foreground mb-1">Consultants & Mentors</h3>
              <p className="text-xs text-muted-foreground font-body">
                Visa, legal, tax, real-estate, healthcare, education — every advisor your people need, verified.
              </p>
            </div>
            <div className="rounded-2xl border border-border p-5 bg-background">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center mb-3">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-1">Diaspora Businesses</h3>
              <p className="text-xs text-muted-foreground font-body">
                Restaurants, markets, services and B2B vendors — discoverable, reviewable, supportable.
              </p>
            </div>
            <div className="rounded-2xl border border-border p-5 bg-background">
              <div className="w-10 h-10 rounded-lg bg-amber-400/20 flex items-center justify-center mb-3">
                <Building2 className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-foreground mb-1">Associations & Schools</h3>
              <p className="text-xs text-muted-foreground font-body">
                Cultural centres, NGOs, weekend schools, alumni groups, media — all in one civic map.
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Button
              size="lg"
              onClick={() => document.getElementById("register-form")?.scrollIntoView({ behavior: "smooth" })}
              className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
            >
              <Sparkles className="h-5 w-5" /> Bring this to my diaspora
            </Button>
          </div>
        </div>
      </section>

      {/* REGISTRATION FORM */}
      <section id="register-form" className="py-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card">
            {done ? (
              <div className="flex flex-col items-center text-center py-10 gap-3">
                <CheckCircle2 className="h-14 w-14 text-turquoise" />
                <h3 className="text-2xl font-bold">Thank you!</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Your diaspora registration has been received. We'll be in touch shortly.
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold mb-1">Register Your Diaspora — Early Access</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Submissions are tagged by community so we can prioritise the most-requested diasporas.
                </p>
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <Label>Which diaspora community do you want to see here? *</Label>
                    <Input
                      value={form.diaspora_community}
                      onChange={(e) => setForm({ ...form, diaspora_community: e.target.value })}
                      placeholder="e.g. Indian, Chinese, Filipino, Greek, Lebanese, Brazilian…"
                      required
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      This tag will be used to group your registration with others from the same community.
                    </p>
                  </div>

                  <div>
                    <Label>I am joining as</Label>
                    <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General registration</SelectItem>
                        <SelectItem value="investment_partnership">Investment & Partnership</SelectItem>
                        <SelectItem value="founder_startup">Founder / Startup</SelectItem>
                        <SelectItem value="professional">Professional / Job seeker</SelectItem>
                        <SelectItem value="organization">Diaspora Organization / NGO</SelectItem>
                        <SelectItem value="city_ambassador">City Ambassador candidate</SelectItem>
                        <SelectItem value="media">Media / Blogger / Vlogger</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Full name *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Email *</Label>
                      <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                    </div>
                    <div>
                      <Label>Phone (with country code)</Label>
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+..." />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Country</Label>
                      <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                    </div>
                    <div>
                      <Label>City</Label>
                      <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <Label>Company / Organization (optional)</Label>
                    <Input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
                  </div>

                  <div>
                    <Label>Links (LinkedIn, website, deck URL)</Label>
                    <Input value={form.links} onChange={(e) => setForm({ ...form, links: e.target.value })} placeholder="https://..." />
                  </div>

                  <div>
                    <Label>What would you like to see / build for this diaspora?</Label>
                    <Textarea
                      rows={3}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="e.g. WhatsApp networking groups, consulate map, business directory, events…"
                    />
                  </div>

                  <div>
                    <Label>Documents (optional)</Label>
                    <label className="mt-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-turquoise/60 hover:bg-turquoise/5 transition-colors">
                      <Upload className="h-4 w-4 text-turquoise" />
                      <span className="text-xs text-muted-foreground">Deck / CV / one-pager (PDF, PPTX, DOCX — max 10MB each)</span>
                      <input type="file" multiple accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg" className="hidden" onChange={handleFiles} />
                    </label>
                    {files.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {files.map((f, i) => (
                          <li key={i} className="flex items-center justify-between text-xs bg-muted/50 px-2 py-1 rounded">
                            <span className="truncate">{f.name}</span>
                            <button type="button" onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))} className="text-destructive">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    By submitting you agree to our{" "}
                    <Link to="/legal/privacy" className="underline">Privacy Policy</Link> and{" "}
                    <Link to="/legal/terms" className="underline">Terms of Service</Link>.
                  </p>

                  <Button type="submit" disabled={submitting} className="w-full" size="lg">
                    {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Rocket className="h-4 w-4 mr-2" />}
                    Complete Registration
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default RegisterDiaspora;
