import { useEffect, useState } from "react";
import { ArrowLeft, FilePlus2, LayoutDashboard, LogOut, Pencil, Plus, Tags, Trash2, Upload, Users, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { imageUrl, request } from "../api.js";

const blank = { title: "", excerpt: "", content: "", category: "", tags: "", status: "draft", featured: false, seoTitle: "", seoDescription: "", scheduledAt: "", imageAlt: "" };

export default function Admin({ categories, onCategories }) {
  const [user, setUser] = useState(null);
  const [articles, setArticles] = useState([]);
  const [stats, setStats] = useState({});
  const [tab, setTab] = useState("articles");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    const [me, posts, summary] = await Promise.all([request("/auth/me"), request("/admin/articles?limit=100"), request("/admin/stats")]);
    setUser(me.user); setArticles(posts.articles || []); setStats(summary.stats || {});
  };
  useEffect(() => { load().catch(() => { localStorage.removeItem("techsphere_token"); navigate("/admin/login"); }).finally(() => setLoading(false)); }, []);

  const logout = () => { localStorage.removeItem("techsphere_token"); navigate("/admin/login"); };
  const startNew = () => { setEditing("new"); setForm({ ...blank, category: categories[0]?._id || "" }); setImage(null); setError(""); setMessage(""); };
  const startEdit = (article) => {
    setEditing(article._id); setImage(null); setError(""); setMessage("");
    setForm({ title: article.title, excerpt: article.excerpt, content: article.content, category: article.category?._id || "", tags: (article.tags || []).join(", "), status: article.status, featured: article.featured, seoTitle: article.seoTitle || "", seoDescription: article.seoDescription || "", scheduledAt: article.scheduledAt ? new Date(article.scheduledAt).toISOString().slice(0, 16) : "", imageAlt: article.imageAlt || "" });
  };
  const save = async (event) => {
    event.preventDefault(); setError(""); setMessage("");
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      if (image) body.append("featuredImage", image);
      const path = editing === "new" ? "/admin/articles" : `/admin/articles/${editing}`;
      await request(path, { method: editing === "new" ? "POST" : "PUT", body });
      setMessage("Article saved successfully."); setEditing(null); await load();
    } catch (err) { setError(err.message); }
  };
  const removeArticle = async (article) => {
    if (!window.confirm(`Delete “${article.title}”? This cannot be undone.`)) return;
    try { await request(`/admin/articles/${article._id}`, { method: "DELETE" }); setMessage("Article deleted."); await load(); }
    catch (err) { setError(err.message); }
  };
  const changeStatus = async (article, status) => {
    try { await request(`/admin/articles/${article._id}`, { method: "PUT", body: JSON.stringify({ status }) }); await load(); }
    catch (err) { setError(err.message); }
  };

  if (loading) return <main className="admin-loading">Loading your workspace…</main>;
  if (tab === "categories") return <CategoryManager categories={categories} onCategories={onCategories} onBack={() => setTab("articles")} user={user} logout={logout} />;
  if (tab === "authors") return <AuthorManager onBack={() => setTab("articles")} user={user} logout={logout} />;

  return <main className="admin-shell">
    <aside className="admin-sidebar"><Link className="brand admin-brand" to="/"><span className="brand-mark">N</span><span className="brand-name">tech<span>sphere</span></span></Link><span className="admin-label">WORKSPACE</span><button className="admin-side-link selected"><LayoutDashboard size={17} /> Journal</button><button className="admin-side-link" onClick={() => setTab("categories")}><Tags size={17} /> Categories</button>{user?.role === "admin" && <button className="admin-side-link" onClick={() => setTab("authors")}><Users size={17} /> Authors</button>}<div className="admin-sidebar-bottom"><div className="admin-user-avatar">{user?.name?.slice(0, 1) || "N"}</div><div><strong>{user?.name}</strong><span>{user?.role}</span></div><button onClick={logout} aria-label="Sign out"><LogOut size={17} /></button></div></aside>
    <section className="admin-main"><header className="admin-topbar"><div><span className="eyebrow">NEXABYTE / CONTENT</span><h1>Journal workspace</h1></div><Link to="/" className="admin-view-site"><ArrowLeft size={15} /> View site</Link></header>
      {error && <div className="admin-alert error-alert">{error}<button onClick={() => setError("")}><X size={15} /></button></div>}{message && <div className="admin-alert success-alert">{message}<button onClick={() => setMessage("")}><X size={15} /></button></div>}
      <div className="stats-grid">{[["Total articles", stats.total || 0], ["Published", stats.published || 0], ["Drafts", stats.drafts || 0], ["Scheduled", stats.scheduled || 0]].map(([label, number]) => <div className="stat-card" key={label}><span>{label}</span><strong>{number}</strong></div>)}</div>
      {editing ? <section className="editor-panel"><div className="editor-header"><div><button className="back-link" onClick={() => setEditing(null)}><ArrowLeft size={15} /> ALL ARTICLES</button><h2>{editing === "new" ? "Create an article" : "Edit article"}</h2></div><button className="icon-button" onClick={() => setEditing(null)} aria-label="Close editor"><X size={20} /></button></div>
        <form className="article-form" onSubmit={save}>
          <div className="editor-fields">
            <label>Article title<input required maxLength="160" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
            <label>Short description<textarea required rows="3" maxLength="320" value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} /></label>
            <label>Article content <span className="field-note">Markdown headings supported: ## Section, ### Subsection</span><textarea required className="content-input" rows="16" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} /></label>
            <InlineImageControl onInsert={(markdown) => setForm((current) => ({ ...current, content: `${current.content}${current.content ? "\n\n" : ""}${markdown}` }))} />
            <div className="form-two-col">
              <label>Category<select required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option value="">Choose category</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select></label>
              <label>Tags <span className="field-note">Comma separated</span><input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} /></label>
            </div>
            <label className="upload-field">Featured image <span className="field-note">JPEG, PNG, GIF or WebP (max 5 MB)</span><span className="upload-control"><Upload size={18} />{image ? image.name : "Choose an image"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setImage(event.target.files?.[0] || null)} /></span></label>
            {image && <ImagePreview file={image} />}
            <label>Image alt text<input value={form.imageAlt} onChange={(event) => setForm({ ...form, imageAlt: event.target.value })} /></label>
            <div className="form-two-col">
              <label>Publication status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="draft">Draft</option><option value="published">Publish now</option><option value="scheduled">Schedule</option></select></label>
              {form.status === "scheduled" && <label>Publish date & time<input required type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} /></label>}
            </div>
            <label>SEO title<input maxLength="70" value={form.seoTitle} onChange={(event) => setForm({ ...form, seoTitle: event.target.value })} /></label>
            <label>SEO description<textarea rows="2" maxLength="180" value={form.seoDescription} onChange={(event) => setForm({ ...form, seoDescription: event.target.value })} /></label>
            <label className="checkbox-field"><input type="checkbox" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} /> Feature this article</label>
            <div className="editor-actions"><button type="button" className="button-outline" onClick={() => setEditing(null)}>Cancel</button><button className="button-primary"><FilePlus2 size={16} /> Save article</button></div>
          </div>
        </form></section> :
      <section className="posts-panel"><div className="posts-heading"><div><span className="eyebrow">YOUR CONTENT</span><h2>Articles</h2></div><button className="button-primary" onClick={startNew}><Plus size={17} /> New article</button></div><div className="posts-table-wrap"><table className="posts-table"><thead><tr><th>ARTICLE</th><th>STATUS</th><th>UPDATED</th><th>ACTIONS</th></tr></thead><tbody>{articles.map((article) => <tr key={article._id}><td><div className="post-name">{article.featuredImage && <img src={imageUrl(article.featuredImage)} alt="" />}<span><strong>{article.title}</strong><small>{article.category?.name || "Uncategorized"}</small></span></div></td><td><span className={`status-badge status-${article.status}`}>{article.status}</span></td><td>{new Date(article.updatedAt).toLocaleDateString()}</td><td><div className="post-actions">{article.status !== "published" && <button title="Publish now" onClick={() => changeStatus(article, "published")}><FilePlus2 size={16} /></button>}<button title="Edit article" onClick={() => startEdit(article)}><Pencil size={16} /></button><button title="Delete article" onClick={() => removeArticle(article)}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table>{!articles.length && <div className="admin-empty">No articles yet. Create your first story to get started.</div>}</div></section>}
    </section>
  </main>;
}

function CategoryManager({ categories, onCategories, onBack, user, logout }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const save = async (event) => {
    event.preventDefault(); setError("");
    try { const result = await request(editId ? `/admin/categories/${editId}` : "/admin/categories", { method: editId ? "PUT" : "POST", body: JSON.stringify({ name: editId ? editName : name }) }); onCategories(result.categories); setName(""); setEditId(""); setEditName(""); }
    catch (err) { setError(err.message); }
  };
  const remove = async (category) => {
    if (!window.confirm(`Delete category “${category.name}”?`)) return;
    try { const result = await request(`/admin/categories/${category._id}`, { method: "DELETE" }); onCategories(result.categories); }
    catch (err) { setError(err.message); }
  };
  return <main className="admin-shell"><aside className="admin-sidebar"><Link className="brand admin-brand" to="/"><span className="brand-mark">N</span><span className="brand-name">tech<span>sphere</span></span></Link><span className="admin-label">WORKSPACE</span><button className="admin-side-link" onClick={onBack}><LayoutDashboard size={17} /> Journal</button><button className="admin-side-link selected"><Tags size={17} /> Categories</button><div className="admin-sidebar-bottom"><div className="admin-user-avatar">{user?.name?.slice(0, 1) || "N"}</div><div><strong>{user?.name}</strong><span>{user?.role}</span></div><button onClick={logout} aria-label="Sign out"><LogOut size={17} /></button></div></aside><section className="admin-main"><header className="admin-topbar"><div><span className="eyebrow">NEXABYTE / CONTENT</span><h1>Manage categories</h1></div><button className="admin-view-site" onClick={onBack}><ArrowLeft size={15} /> Back to articles</button></header>{error && <div className="admin-alert error-alert">{error}</div>}<section className="posts-panel category-panel"><h2>Topics</h2><p>Organize your published stories with topic categories.</p><form className="category-form" onSubmit={save}><input required value={editId ? editName : name} onChange={(event) => editId ? setEditName(event.target.value) : setName(event.target.value)} placeholder="Category name" /><button className="button-primary"><Plus size={16} /> {editId ? "Save changes" : "Add category"}</button>{editId && <button type="button" className="button-outline" onClick={() => { setEditId(""); setEditName(""); }}>Cancel</button>}</form><div className="category-list">{categories.map((category) => <div className="category-row" key={category._id}><span><strong>{category.name}</strong><small>/{category.slug}</small></span><div><button onClick={() => { setEditId(category._id); setEditName(category.name); }}><Pencil size={15} /> Edit</button><button onClick={() => remove(category)}><Trash2 size={15} /> Delete</button></div></div>)}</div></section></section></main>;
}

function AuthorManager({ onBack, user, logout }) {
  const [authors, setAuthors] = useState([]);
  const [editing, setEditing] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    const data = await request("/admin/authors");
    setAuthors(data.authors || []);
  };
  useEffect(() => { load().catch((err) => setError(err.message)); }, []);

  const save = async (event) => {
    event.preventDefault();
    setError(""); setMessage("");
    try {
      const path = editing ? `/admin/authors/${editing}` : "/admin/authors";
      await request(path, { method: editing ? "PUT" : "POST", body: JSON.stringify(form) });
      setForm({ name: "", email: "", password: "" });
      setEditing("");
      setMessage(editing ? "Author updated." : "Author account created.");
      await load();
    } catch (err) { setError(err.message); }
  };

  const edit = (author) => {
    setEditing(author._id || author.id);
    setForm({ name: author.name, email: author.email, password: "" });
    setError(""); setMessage("");
  };

  const remove = async (author) => {
    if (!window.confirm(`Delete author account for ${author.name}?`)) return;
    setError(""); setMessage("");
    try {
      await request(`/admin/authors/${author._id || author.id}`, { method: "DELETE" });
      setMessage("Author account deleted.");
      await load();
    } catch (err) { setError(err.message); }
  };

  return <main className="admin-shell">
    <aside className="admin-sidebar"><Link className="brand admin-brand" to="/"><span className="brand-mark">N</span><span className="brand-name">tech<span>sphere</span></span></Link><span className="admin-label">WORKSPACE</span><button className="admin-side-link" onClick={onBack}><LayoutDashboard size={17} /> Journal</button><button className="admin-side-link selected"><Users size={17} /> Authors</button><div className="admin-sidebar-bottom"><div className="admin-user-avatar">{user?.name?.slice(0, 1) || "N"}</div><div><strong>{user?.name}</strong><span>{user?.role}</span></div><button onClick={logout} aria-label="Sign out"><LogOut size={17} /></button></div></aside>
    <section className="admin-main"><header className="admin-topbar"><div><span className="eyebrow">NEXABYTE / TEAM</span><h1>Manage authors</h1></div><button className="admin-view-site" onClick={onBack}><ArrowLeft size={15} /> Back to articles</button></header>
      {error && <div className="admin-alert error-alert">{error}</div>}{message && <div className="admin-alert success-alert">{message}</div>}
      <section className="posts-panel category-panel"><h2>{editing ? "Edit author" : "Add an author"}</h2><p>Editors can sign in to create and manage journal articles.</p><form className="category-form author-form" onSubmit={save}><input required minLength="2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Full name" /><input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email address" /><input required={!editing} minLength="10" type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={editing ? "New password (optional)" : "Password (10+ characters)"} /><button className="button-primary"><Plus size={16} /> {editing ? "Save author" : "Create author"}</button>{editing && <button type="button" className="button-outline" onClick={() => { setEditing(""); setForm({ name: "", email: "", password: "" }); }}>Cancel</button>}</form>
        <div className="category-list">{authors.map((author) => <div className="category-row" key={author._id || author.id}><span><strong>{author.name} {author._id === user?.id && <small>(you)</small>}</strong><small>{author.email} · {author.role}</small></span><div><button onClick={() => edit(author)}><Pencil size={15} /> Edit</button>{author.role !== "admin" && <button onClick={() => remove(author)}><Trash2 size={15} /> Delete</button>}</div></div>)}</div>
      </section>
    </section>
  </main>;
}

function InlineImageControl({ onInsert }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true); setError("");
    try {
      const body = new FormData();
      body.append("featuredImage", file);
      const result = await request("/admin/media", { method: "POST", body });
      onInsert(`![${file.name.replace(/[\[\]]/g, "")}](${result.url})`);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); event.target.value = ""; }
  };

  return <div className="inline-image-control"><label className="upload-control"><Upload size={16} />{busy ? "Uploading image…" : "Upload image into article"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy} onChange={upload} /></label>{error && <span className="inline-upload-error">{error}</span>}</div>;
}

function ImagePreview({ file }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return <img className="upload-preview" src={url} alt="Selected featured image preview" />;
}
