import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { request, imageUrl } from "../api.js";
import { ArticleCard, CompactArticle } from "../components/ArticleCard.jsx";
import SEO from "../components/SEO.jsx";

export default function Home({ categories }) {
  const [articles, setArticles] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    request("/articles?limit=7").then(({ articles: items }) => {
      setArticles(items || []);
      setFeatured((items || []).find((item) => item.featured) || items?.[0] || null);
    }).catch(() => setArticles([])).finally(() => setLoading(false));
  }, []);

  const latest = articles.filter((item) => item._id !== featured?._id).slice(0, 3);
  const trending = articles.filter((item) => item._id !== featured?._id).slice(0, 4);
  const search = (event) => { event.preventDefault(); navigate(`/blog?q=${encodeURIComponent(query)}`); };

  return (
    <>
      <SEO />
      <main>
        <section className="hero-section">
          <div className="hero-grid-pattern" />
          <div className="container hero-inner">
            <div className="hero-copy"><span className="eyebrow hero-eyebrow"><span className="eyebrow-line" /> THE NEXABYTE JOURNAL</span><h1>Ideas for a world<br />in <span>progress.</span></h1><p>Perspectives, practical knowledge, and fresh thinking from the people building what’s next.</p>
              <form className="hero-search" onSubmit={search}><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ideas, topics, and more..." aria-label="Search articles" /><button aria-label="Submit search"><ArrowUpRight size={18} /></button></form>
              <div className="hero-bottom-note"><span>INDEPENDENT THINKING. PRACTICAL INSIGHT.</span><ArrowDownRight size={16} /></div>
            </div>
            <div className="hero-visual">
              <div className="hero-visual-image">{featured?.featuredImage ? <img src={imageUrl(featured.featuredImage)} alt="" /> : <div className="hero-art"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-core">N<span>×</span></div><div className="art-caption">EXPLORE<br />WHAT’S NEXT</div></div>}</div>
              <div className="hero-visual-label"><span>01 — INSIGHT</span><span>SCROLL TO EXPLORE ↓</span></div>
            </div>
          </div>
          <div className="hero-side-mark">TECHNOLOGY / IDEAS / PEOPLE</div>
        </section>

        <section className="section-block container featured-section">
          <div className="section-heading"><div><span className="eyebrow"><span className="eyebrow-line" /> SELECTED READING</span><h2>In the <span>spotlight.</span></h2></div><Link className="text-link" to="/blog">All stories <ArrowUpRight size={16} /></Link></div>
          {loading ? <div className="loading-line">Finding the latest stories…</div> : featured ? <div className="spotlight">
            <Link to={`/blog/${featured.slug}`} className="spotlight-image">{featured.featuredImage ? <img src={imageUrl(featured.featuredImage)} alt={featured.imageAlt || featured.title} /> : <div className="image-placeholder spotlight-placeholder"><span>NEXABYTE<br />INSIGHTS</span></div>}<span className="spotlight-image-caption">FEATURED STORY <ArrowUpRight size={15} /></span></Link>
            <div className="spotlight-copy"><div className="card-meta"><span>{featured.category?.name || "Technology"}</span><span className="meta-dot" />{featured.readingTime || 4} min read</div><h3><Link to={`/blog/${featured.slug}`}>{featured.title}</Link></h3><p>{featured.excerpt}</p><div className="spotlight-bottom"><span>BY {featured.author?.name || "NEXABYTE EDITORIAL"}<br /><time>{new Date(featured.publishedAt || featured.createdAt).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}</time></span><Link className="round-link" to={`/blog/${featured.slug}`} aria-label="Read featured article"><ArrowUpRight size={20} /></Link></div></div>
          </div> : <div className="empty-state"><h3>Good ideas are on the way.</h3><p>Our first stories are being prepared. Check back soon.</p></div>}
        </section>

        <section className="topic-strip"><div className="container topic-inner"><span className="eyebrow">EXPLORE BY TOPIC</span><div className="topic-links">{categories.slice(0, 6).map((category, index) => <Link key={category._id} to={`/blog?category=${encodeURIComponent(category.slug)}`}><span>0{index + 1}</span>{category.name}<ArrowUpRight size={14} /></Link>)}{!categories.length && <Link to="/blog">Explore every story <ArrowRight size={14} /></Link>}</div><Link to="/blog" className="topic-all">ALL TOPICS <ArrowUpRight size={13} /></Link></div></section>

        <section className="section-block container latest-section">
          <div className="section-heading"><div><span className="eyebrow"><span className="eyebrow-line" /> FRESH PERSPECTIVES</span><h2>Latest <span>stories.</span></h2></div><Link className="text-link" to="/blog">Explore the journal <ArrowUpRight size={16} /></Link></div>
          {loading ? <div className="loading-line">Loading articles…</div> : latest.length ? <div className="article-grid">{latest.map((article) => <ArticleCard key={article._id} article={article} />)}</div> : <p className="muted-copy">New perspectives are coming soon.</p>}
        </section>

        <section className="trending-section"><div className="container trending-inner"><div className="trending-intro"><span className="eyebrow"><span className="eyebrow-line" /> WORTH A READ</span><h2>On our<br /><span>radar.</span></h2><p>Ideas gaining momentum across the technology landscape.</p><Link className="text-link" to="/blog">View all stories <ArrowUpRight size={16} /></Link></div><div className="trending-list">{trending.length ? trending.map((article, index) => <CompactArticle key={article._id} article={article} index={index} />) : <p className="muted-copy">Trending stories will appear here as we publish.</p>}</div></div></section>

        <section className="closing-cta"><div className="container closing-inner"><div><span className="eyebrow">A NEXABYTE PUBLICATION</span><h2>Curiosity moves<br />everything <span>forward.</span></h2></div><Link to="/blog" className="round-link cta-round" aria-label="Explore the journal"><ArrowUpRight size={23} /></Link><span className="cta-watermark">N</span></div></section>
      </main>
    </>
  );
}
