import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, MapPin } from "lucide-react";

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

const BlogPage = () => {
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

  useEffect(() => {
    const previousTitle = document.title;
    const description =
      "Türkiye'den çıkış yapacak okur için on ülke hakkında giriş, bütçe ve kültür rehberleri.";
    let meta = document.querySelector('meta[name="description"]');
    const previousDescription = meta?.getAttribute("content");

    document.title = "CorteQS Blog | Ülke Rehberleri";
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
    document.dispatchEvent(new Event("render-complete"));

    return () => {
      document.title = previousTitle;
      if (previousDescription) meta?.setAttribute("content", previousDescription);
    };
  }, []);

  const filteredGroups = useMemo(() => {
    const filtered = filter === "all" ? posts : posts.filter((post) => post.category === filter);
    return groupBlogPostsByCountry(filtered);
  }, [posts, filter]);

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border bg-[linear-gradient(90deg,hsl(var(--background)),hsl(var(--secondary)),hsl(var(--background)))]">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              <BookOpen className="h-4 w-4" />
              CorteQS Blog
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
                Ülke Rehberleri
              </h1>
              <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                Türkiye'den çıkış yapacak okur için on ülke hakkında giriş ve ulaşım, gündelik hayat
                ve bütçe, kültür ve sosyal akış başlıklarında kısa rehberler.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 md:py-12">
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
          <div className="rounded-lg border border-border bg-card p-6 text-muted-foreground">
            Yükleniyor...
          </div>
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
                      <h3 className="mb-2 text-lg font-bold text-foreground group-hover:text-primary">
                        {post.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4">
                        {post.excerpt}
                      </p>
                      <span className="mt-3 text-sm font-semibold text-primary">Devamını oku →</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default BlogPage;
