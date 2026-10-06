import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen } from "lucide-react";

import BlogMarkdown from "@/components/blog/BlogMarkdown";
import {
  blogCategoryLabels,
  getPublishedBlogPostBySlug,
  listPublishedBlogPostSummaries,
  type BlogPostRow,
} from "@/lib/blog";
import {
  buildBlogBreadcrumbJsonLd,
  buildBlogPostingJsonLd,
  formatBlogDate,
  pickRelatedPosts,
  type BlogPostSummary,
} from "@/lib/blog-seo";
import { applySeo, SEO_DEFAULT_OG_IMAGE, SEO_SITE_NAME } from "@/lib/seo";

type LoadState = "loading" | "ready" | "notfound";

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostRow | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [related, setRelated] = useState<BlogPostSummary[]>([]);

  useEffect(() => {
    if (!slug) {
      setState("notfound");
      return;
    }
    let mounted = true;
    setState("loading");
    getPublishedBlogPostBySlug(slug)
      .then((data) => {
        if (!mounted) return;
        if (data) {
          setPost(data);
          setState("ready");
        } else {
          setState("notfound");
        }
      })
      .catch((error: unknown) => {
        console.error("Blog yazısı yüklenemedi", error);
        if (mounted) setState("notfound");
      });
    return () => {
      mounted = false;
    };
  }, [slug]);

  // SG07: bulunamayan yazı 200 + "index, follow" ile soft-404 oluyordu (05.10 ölçümü).
  useEffect(() => {
    if (state !== "notfound") return;
    return applySeo({
      title: `Yazı bulunamadı | ${SEO_SITE_NAME}`,
      description: "Aradığınız yazı yayından kaldırılmış veya adresi değişmiş olabilir.",
      robots: "noindex, follow",
    });
  }, [state]);

  useEffect(() => {
    if (!post) return;
    const ogImage = post.cover_image || SEO_DEFAULT_OG_IMAGE;

    // GEO: yapılandırılmış veri — AI cevap motorları (ChatGPT, Perplexity, Google AI
    // Overviews) BlogPosting şemasından, kırıntı ise site yapısından beslenir.
    return applySeo({
      title: `${SEO_SITE_NAME} Blog | ${post.title}`,
      description: post.excerpt || post.title,
      canonicalPath: `/blog/${post.slug}`,
      ogImage,
      ogType: "article",
      jsonLd: [buildBlogPostingJsonLd(post, ogImage), buildBlogBreadcrumbJsonLd(post)],
    });
  }, [post]);

  // İlgili yazılar İKİNCİL içeriktir: okunamazsa yazının kendisi yine görünür, bölüm çizilmez.
  useEffect(() => {
    if (!post) return;
    let mounted = true;
    listPublishedBlogPostSummaries()
      .then((all) => {
        if (mounted) setRelated(pickRelatedPosts(all, post));
      })
      .catch((error: unknown) => {
        console.warn("İlgili yazılar yüklenemedi", error);
        if (mounted) setRelated([]);
      });
    return () => {
      mounted = false;
    };
  }, [post]);

  const publishedLabel = post ? formatBlogDate(post.published_at ?? post.created_at) : null;
  const updatedLabel = post ? formatBlogDate(post.updated_at) : null;

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-8 md:py-12">
        <Link
          to="/radar/rehberler"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Tüm yazılar
        </Link>

        {state === "loading" ? (
          <div className="rounded-lg border border-border bg-card p-6 text-muted-foreground">
            Yükleniyor...
          </div>
        ) : state === "notfound" || !post ? (
          <div className="space-y-4 rounded-lg border border-border bg-card p-8 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
            <h1 className="text-xl font-bold text-foreground">Yazı bulunamadı</h1>
            <p className="text-muted-foreground">
              Aradığınız yazı yayından kaldırılmış veya adresi değişmiş olabilir.
            </p>
            <Link
              to="/radar/rehberler"
              className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Rehberler'e dön
            </Link>
          </div>
        ) : (
          <article className="space-y-6">
            <header className="space-y-3 border-b border-border pb-6">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {post.country_label && (
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 font-semibold text-secondary-foreground">
                    {post.country_label}
                  </span>
                )}
                <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 font-semibold text-primary">
                  {blogCategoryLabels[post.category]}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
              )}
              {publishedLabel && (
                <p className="text-sm text-muted-foreground">
                  Yayın: <time dateTime={post.published_at ?? post.created_at}>{publishedLabel}</time>
                  {updatedLabel && updatedLabel !== publishedLabel && (
                    <>
                      {" · "}Güncelleme: <time dateTime={post.updated_at}>{updatedLabel}</time>
                    </>
                  )}
                </p>
              )}
            </header>

            {post.cover_image && (
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full rounded-xl border border-border object-cover"
              />
            )}

            <BlogMarkdown content={post.content_markdown} />

            {related.length > 0 && (
              <nav aria-label="İlgili yazılar" className="space-y-3 border-t border-border pt-6">
                <h2 className="text-lg font-bold text-foreground">İlgili yazılar</h2>
                <ul className="space-y-3">
                  {related.map((item) => (
                    <li key={item.slug}>
                      <Link to={`/blog/${item.slug}`} className="font-semibold text-primary hover:underline">
                        {item.title}
                      </Link>
                      {item.excerpt && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">{item.excerpt}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </article>
        )}
      </div>
    </main>
  );
};

export default BlogPostPage;
