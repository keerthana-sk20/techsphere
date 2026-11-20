import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Search, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { request } from "../api.js";
import { ArticleCard } from "../components/ArticleCard.jsx";
import SEO from "../components/SEO.jsx";

export default function Blog({ categories }) {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const [data, setData] = useState({ articles: [], page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const category = params.get("category") || "";
  const page = Number(params.get("page") || 1);
  const search = params.get("q") || "";

  useEffect(() => {
    setQuery(search);
    setLoading(true);
    const queryParams = new URLSearchParams({ page: String(page), limit: "9" });
    if (category) queryParams.set("category", category);
    if (search) queryParams.set("q", search);
    request(`/articles?${queryParams}`).then(setData).catch(() => setData({ articles: [], page: 1, pages: 1, total: 0 })).finally(() => setLoading(false));
  }, [category, page, search]);

  const applyFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    next.delete("page");
    setParams(next);
  };
  const submitSearch = (event) => { event.preventDefault(); applyFilter("q", query.trim()); };

  return <main className="listing-page">
    <SEO title="Explore the journal" description="Browse technology perspectives, practical guides, and fresh thinking from NexaByte Technologies." />
    <section className="listing-hero"><div className="container"><span className="eyebrow"><span className="eyebrow-line" /> THE NEXABYTE JOURNAL</span><h1>Ideas worth<br /><span>exploring.</span></h1><p>Technology, decoded. Stories and insights to help you see what’s next.</p><span className="listing-count">{data.total.toString().padStart(2, "0")} ARTICLES AND COUNTING</span></div></section>
    <section className="container listing-content">
      <div className="listing-controls"><form className="listing-search" onSubmit={submitSearch}><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the journal" aria-label="Search the journal" />{query && <button type="button" onClick={() => { setQuery(""); applyFilter("q", ""); }} aria-label="Clear search"><X size={16} /></button>}<button type="submit" className="search-submit">Search</button></form>
        <div className="filter-wrap"><label htmlFor="category-filter">TOPIC</label><select id="category-filter" value={category} onChange={(event) => applyFilter("category", event.target.value)}><option value="">All topics</option>{categories.map((item) => <option value={item.slug} key={item._id}>{item.name}</option>)}</select></div>
      </div>
      {(category || search) && <div className="active-filter">{search && <span>Search: “{search}” <button onClick={() => applyFilter("q", "")} aria-label="Remove search filter"><X size={13} /></button></span>}{category && <span>{categories.find((item) => item.slug === category)?.name || category}<button onClick={() => applyFilter("category", "")} aria-label="Remove category filter"><X size={13} /></button></span>}</div>}
      {loading ? <div className="loading-line">Loading the journal…</div> : data.articles.length ? <><div className="article-grid listing-grid">{data.articles.map((article) => <ArticleCard key={article._id} article={article} />)}</div><div className="pagination"><span>SHOWING {data.articles.length} OF {data.total} STORIES</span><div><button disabled={data.page <= 1} onClick={() => applyFilter("page", String(data.page - 1))}><ArrowLeft size={16} /> Previous</button><span>{data.page} / {data.pages}</span><button disabled={data.page >= data.pages} onClick={() => applyFilter("page", String(data.page + 1))}>Next <ArrowRight size={16} /></button></div></div></> : <div className="empty-state listing-empty"><h3>No stories found.</h3><p>Try a different search or topic, or explore all articles.</p><button className="button-outline" onClick={() => setParams({})}>Clear filters</button></div>}
    </section>
  </main>;
}
