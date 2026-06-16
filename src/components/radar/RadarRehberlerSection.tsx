import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";

import {
  blogCategoryLabels,
  groupBlogPostsByCountry,
  listPublishedBlogPosts,
  type BlogCategory,
  type BlogPostRow,
} from "@/lib/blog";

type CategoryFilter = BlogCategory | "all";

const CATEGORY_FILTERS: { key: CategoryFilter; label: string }[] = [
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
  const [filter, setFilter] = useState<CategoryFilter>("all");

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

  const filteredGroups = useMemo(() => {
    const filtered = filter === "all" ? posts : posts.filter((post) => post.category === filter);
    return groupBlogPostsByCountry(filtered);
  }, [posts, filter]);

  return (
    <div>
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
          Bu kategoride henüz yazı bulunmuyor.
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
