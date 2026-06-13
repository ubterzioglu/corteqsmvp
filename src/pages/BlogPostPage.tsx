import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen } from "lucide-react";

import BlogMarkdown from "@/components/blog/BlogMarkdown";
import { blogCategoryLabels, getPublishedBlogPostBySlug, type BlogPostRow } from "@/lib/blog";

type LoadState = "loading" | "ready" | "notfound";

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostRow | null>(null);
  const [state, setState] = useState<LoadState>("loading");

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

  useEffect(() => {
    if (!post) return;
    const previousTitle = document.title;
    let meta = document.querySelector('meta[name="description"]');
    const previousDescription = meta?.getAttribute("content");

    document.title = `CorteQS Blog | ${post.title}`;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", post.excerpt || post.title);
    document.dispatchEvent(new Event("render-complete"));

    return () => {
      document.title = previousTitle;
      if (previousDescription) meta?.setAttribute("content", previousDescription);
    };
  }, [post]);

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-8 md:py-12">
        <Link
          to="/blog"
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
              to="/blog"
              className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Blog'a dön
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
            </header>

            {post.cover_image && (
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full rounded-xl border border-border object-cover"
              />
            )}

            <BlogMarkdown content={post.content_markdown} />
          </article>
        )}
      </div>
    </main>
  );
};

export default BlogPostPage;
