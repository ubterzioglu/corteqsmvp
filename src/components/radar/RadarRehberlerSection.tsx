import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  blogCategoryLabels,
  groupBlogPostsByCountry,
  listPublishedBlogPosts,
  type BlogPostRow,
} from "@/lib/blog";
import {
  ALL_GUIDE_COUNTRIES,
  collectGuideCountries,
  filterGuidePosts,
  type GuideCategoryFilter,
} from "@/lib/radar-guides";

const CATEGORY_FILTERS: { key: GuideCategoryFilter; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "giris-ulasim", label: blogCategoryLabels["giris-ulasim"] },
  { key: "gundelik-butce", label: blogCategoryLabels["gundelik-butce"] },
  { key: "kultur-sosyal", label: blogCategoryLabels["kultur-sosyal"] },
  { key: "oturum-izni", label: blogCategoryLabels["oturum-izni"] },
  { key: "calisma-vizesi", label: blogCategoryLabels["calisma-vizesi"] },
  { key: "vatandaslik", label: blogCategoryLabels["vatandaslik"] },
  { key: "is-bulma", label: blogCategoryLabels["is-bulma"] },
  { key: "yasam-sartlari", label: blogCategoryLabels["yasam-sartlari"] },
];

/**
 * "Rehberler" sekmesi — ülke/kategori bazlı blog rehberleri.
 * Eski BlogPage içeriğinin yeniden kullanılabilir hâli.
 */
const RadarRehberlerSection = () => {
  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<GuideCategoryFilter>("all");
  const [country, setCountry] = useState<string>(ALL_GUIDE_COUNTRIES);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    listPublishedBlogPosts()
      .then((data) => {
        if (mounted) setPosts(data);
      })
      .catch((error: unknown) => {
        console.error("Blog yazıları yüklenemedi", error);
        if (mounted) setPosts([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const countryOptions = useMemo(() => collectGuideCountries(posts), [posts]);

  const filteredGroups = useMemo(
    () => groupBlogPostsByCountry(filterGuidePosts(posts, { category: filter, country })),
    [posts, filter, country],
  );

  // Kategori değişince seçili ülkede yazı kalmayabilir; kullanıcıyı sessiz boş
  // ekranda bırakmamak için ülke seçimi geçersizleşirse "tümü"ne döner.
  useEffect(() => {
    if (country === ALL_GUIDE_COUNTRIES) return;
    if (!countryOptions.some((option) => option.value === country)) {
      setCountry(ALL_GUIDE_COUNTRIES);
    }
  }, [country, countryOptions]);

  return (
    <div>
      {countryOptions.length > 1 ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <label htmlFor="rehber-ulke" className="text-sm font-medium text-muted-foreground">
            Ülke
          </label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger id="rehber-ulke" className="h-9 w-full sm:w-64" aria-label="Ülke filtresi">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_GUIDE_COUNTRIES}>Tüm ülkeler</SelectItem>
              {countryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="mb-8 flex flex-wrap gap-2">
        {CATEGORY_FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={
              "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors " +
              (filter === item.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground")
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-lg border border-border bg-card p-6 text-muted-foreground">Yükleniyor...</div>
      ) : filteredGroups.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-6 text-muted-foreground">
          {country === ALL_GUIDE_COUNTRIES
            ? "Bu kategoride henüz yazı bulunmuyor."
            : "Seçilen ülke ve kategoride henüz yazı bulunmuyor."}
        </div>
      ) : (
        <div className="space-y-12">
          {filteredGroups.map((group) => (
            <div key={group.country} className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">{group.country_label}</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.posts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <span className="mb-2 inline-flex w-fit rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                      {blogCategoryLabels[post.category]}
                    </span>
                    <h3 className="mb-2 text-lg font-bold text-foreground group-hover:text-primary">{post.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4">{post.excerpt}</p>
                    <span className="mt-3 text-sm font-semibold text-primary">Devamını oku →</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RadarRehberlerSection;
