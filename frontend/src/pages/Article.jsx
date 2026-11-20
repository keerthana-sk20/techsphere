import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Clock3, Copy, Facebook, Linkedin, List } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { request, imageUrl } from "../api.js";
import { ArticleCard } from "../components/ArticleCard.jsx";
import SEO from "../components/SEO.jsx";

export default function Article() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    setArticle(null);
    request(`/articles/${encodeURIComponent(slug)}`).then((data) => { setArticle(data.article); setRelated(data.related || []); }).catch((err) => setError(err.message));
  }, [slug]);

  const headings = useMemo(() => {
    if (!article?.content) return [];
    return article.content.split("\n").filter((line) => /^#{2,3}\s/.test(line)).map((line, index) => ({ id: `section-${index}`, text: line.replace(/^#{2,3}\s/, "") }));
  }, [article]);

  if (error) return <main className="container article-error"><h1>We couldn’t find that story.</h1><p>{error}</p><Link to="/blog">Back to the journal</Link></main>;
  if (!article) return <main className="container article-loading"><div className="loading-line">Loading story…</div></main>;

  const shareUrl = window.location.href;
  const share = (network) => {
    const urls = { linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` };
    window.open(urls[network], "_blank", "noopener,noreferrer,width=640,height=560");
  };
  const copyLink = async () => { await navigator.clipboard.writeText(shareUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1800); };
  const renderInline = (value) => {
    const pattern = /(!?\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`)/g;
    return value.split(pattern).filter(Boolean).map((part, index) => {
      const image = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (image) return <img className="inline-article-image" key={index} src={imageUrl(image[2])} alt={image[1]} loading="lazy" />;
      if (link) {
        const href = safeUrl(link[2]);
        return <a key={index} href={href} target="_blank" rel="noreferrer">{link[1]}</a>;
      }
      if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
      if (part.startsWith("`") && part.endsWith("`")) return <code key={index}>{part.slice(1, -1)}</code>;
      return part;
    });
  };
  const renderBody = (text) => {
    let headingIndex = 0;
    return text.split(/\n{2,}/).map((block, index) => {
    const trimmed = block.trim();
    if (!trimmed) return null;
    if (/^#{2,3}\s/.test(trimmed)) { const id = `section-${headingIndex++}`; return trimmed.startsWith("###") ? <h3 id={id} key={index}>{renderInline(trimmed.replace(/^###\s/, ""))}</h3> : <h2 id={id} key={index}>{renderInline(trimmed.replace(/^##\s/, ""))}</h2>; }
    if (/^```/.test(trimmed)) return <pre key={index}><code>{trimmed.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, "")}</code></pre>;
    if (/^>\s/.test(trimmed)) return <blockquote key={index}>{renderInline(trimmed.replace(/^>\s?/, ""))}</blockquote>;
    if (/^-\s/m.test(trimmed)) return <ul key={index}>{trimmed.split("\n").map((line, i) => <li key={i}>{renderInline(line.replace(/^-\s/, ""))}</li>)}</ul>;
    if (/^\|.+\|\n\|[\s:|-]+\|/.test(trimmed)) {
      const rows = trimmed.split("\n").filter((line) => !/^\|[\s:|-]+\|$/.test(line)).map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()));
      return <div className="article-table-wrap" key={index}><table><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => rowIndex === 0 ? <th key={cellIndex}>{renderInline(cell)}</th> : <td key={cellIndex}>{renderInline(cell)}</td>)}</tr>)}</tbody></table></div>;
    }
    const video = trimmed.match(/^@\[video\]\((https?:\/\/[^)]+)\)$/);
    if (video) {
      const embed = videoEmbedUrl(video[1]);
      return embed ? <div className="article-video" key={index}><iframe src={embed} title="Embedded article video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div> : <p key={index}><a href={safeUrl(video[1])} target="_blank" rel="noreferrer">Watch video</a></p>;
    }
    return <p key={index}>{renderInline(trimmed)}</p>;
    });
  };

  const articleSchema = { "@context": "https://schema.org", "@type": "BlogPosting", headline: article.title, description: article.excerpt, image: article.featuredImage ? imageUrl(article.featuredImage) : undefined, datePublished: article.publishedAt, author: { "@type": "Person", name: article.author?.name || "NexaByte Editorial" }, publisher: { "@type": "Organization", name: "NexaByte Technologies" }, mainEntityOfPage: shareUrl };

  return <main className="article-page">
    <SEO title={article.seoTitle || article.title} description={article.seoDescription || article.excerpt} image={article.featuredImage ? imageUrl(article.featuredImage) : undefined} type="article" />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c") }} />
    <div className="container article-container">
      <Link to="/blog" className="back-link"><ArrowLeft size={15} /> BACK TO JOURNAL</Link>
      <header className="article-header"><div className="card-meta"><span>{article.category?.name || "Technology"}</span><span className="meta-dot" />{article.readingTime || 4} min read</div><h1>{article.title}</h1><p className="article-deck">{article.excerpt}</p>
        <div className="article-byline"><div className="avatar">{(article.author?.name || "N").slice(0, 1)}</div><div><strong>{article.author?.name || "NexaByte Editorial"}</strong><span>{new Date(article.publishedAt || article.createdAt).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}</span></div><span className="byline-read"><Clock3 size={14} /> {article.readingTime || 4} min read</span></div>
      </header>
      <div className="article-cover">{article.featuredImage ? <img src={imageUrl(article.featuredImage)} alt={article.imageAlt || article.title} /> : <div className="image-placeholder"><span>NEXABYTE<br />TECHSPHERE</span></div>}</div>
      <div className="article-layout">
        <aside className="article-share"><span>SHARE</span><button onClick={() => share("linkedin")} aria-label="Share on LinkedIn"><Linkedin size={16} /></button><button onClick={() => share("facebook")} aria-label="Share on Facebook"><Facebook size={16} /></button><button onClick={copyLink} aria-label="Copy article link"><Copy size={15} /></button>{copied && <small>Copied</small>}</aside>
        <article className="article-content">
          {headings.length > 1 && <nav className="table-of-contents"><div><List size={16} /> IN THIS ARTICLE</div>{headings.map((heading) => <a key={heading.id} href={`#${heading.id}`}>{heading.text}</a>)}</nav>}
          <div className="rich-content">{renderBody(article.content)}</div>
          {!!article.tags?.length && <div className="article-tags">{article.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>}
        </article>
      </div>
      {related.length > 0 && <section className="related-section"><div className="section-heading"><div><span className="eyebrow"><span className="eyebrow-line" /> KEEP EXPLORING</span><h2>Related <span>stories.</span></h2></div><Link className="text-link" to="/blog">All stories <ArrowUpRight size={16} /></Link></div><div className="article-grid">{related.slice(0, 3).map((item) => <ArticleCard key={item._id} article={item} />)}</div></section>}
      <ArticleNeighbors article={article} />
    </div>
  </main>;
}

function safeUrl(value) {
  try {
    const url = new URL(value, window.location.origin);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "#";
  } catch { return "#"; }
}

function videoEmbedUrl(value) {
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(url.pathname.slice(1))}`;
    if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname) && url.pathname === "/watch" && url.searchParams.get("v")) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(url.searchParams.get("v"))}`;
    if (["vimeo.com", "www.vimeo.com"].includes(url.hostname) && /^\d+$/.test(url.pathname.slice(1))) return `https://player.vimeo.com/video/${url.pathname.slice(1)}`;
    return null;
  } catch { return null; }
}

function ArticleNeighbors({ article }) {
  const [neighbors, setNeighbors] = useState(null);
  useEffect(() => { request(`/articles/${encodeURIComponent(article.slug)}/neighbors`).then(setNeighbors).catch(() => setNeighbors({})); }, [article.slug]);
  return <nav className="article-neighbors">{neighbors?.previous ? <Link to={`/blog/${neighbors.previous.slug}`}><span><ArrowLeft size={14} /> PREVIOUS STORY</span><strong>{neighbors.previous.title}</strong></Link> : <span />}{neighbors?.next ? <Link to={`/blog/${neighbors.next.slug}`}><span>NEXT STORY <ArrowRight size={14} /></span><strong>{neighbors.next.title}</strong></Link> : <span />}</nav>;
}
