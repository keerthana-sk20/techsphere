import { ArrowUpRight, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import { imageUrl } from "../api.js";

export function ArticleCard({ article, featured = false }) {
  return (
    <article className={`article-card ${featured ? "article-card-featured" : ""}`}>
      <Link to={`/blog/${article.slug}`} className="card-image">
        {article.featuredImage ? <img src={imageUrl(article.featuredImage)} alt={article.imageAlt || article.title} loading="lazy" /> : <div className="image-placeholder"><span>TECH<br />SPHERE</span></div>}
        {featured && <span className="image-label">EDITOR’S PICK</span>}
      </Link>
      <div className="card-copy">
        <div className="card-meta"><span>{article.category?.name || "Technology"}</span><span className="meta-dot" />{article.readingTime || 4} min read</div>
        <h3><Link to={`/blog/${article.slug}`}>{article.title}</Link></h3>
        <p>{article.excerpt}</p>
        <div className="card-author"><div className="avatar">{(article.author?.name || "N").slice(0, 1)}</div><span>{article.author?.name || "NexaByte Editorial"}</span><span className="meta-dot" /><time>{new Date(article.publishedAt || article.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</time><Link aria-label={`Read ${article.title}`} to={`/blog/${article.slug}`} className="card-arrow"><ArrowUpRight size={17} /></Link></div>
      </div>
    </article>
  );
}

export function CompactArticle({ article, index }) {
  return <Link to={`/blog/${article.slug}`} className="compact-article"><span className="compact-index">{String(index + 1).padStart(2, "0")}</span><span><span className="compact-category">{article.category?.name || "Technology"}</span><strong>{article.title}</strong><span className="compact-time"><Clock3 size={12} /> {article.readingTime || 4} min read</span></span><ArrowUpRight className="compact-arrow" size={16} /></Link>;
}
