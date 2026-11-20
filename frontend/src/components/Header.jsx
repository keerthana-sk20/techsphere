import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ArrowUpRight, Menu, X } from "lucide-react";

export default function Header({ categories }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Link className="brand" to="/" aria-label="TechSphere home">
          <span className="brand-mark">N</span><span className="brand-name">nexabyte<span> / </span><b>techsphere</b></span>
        </Link>
        <button className="mobile-toggle" onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"}>
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav className={open ? "main-nav open" : "main-nav"}>
          <NavLink to="/" onClick={() => setOpen(false)}>Home</NavLink>
          <NavLink to="/blog" onClick={() => setOpen(false)}>Explore</NavLink>
          <div className="nav-category">
            <button type="button">Topics <span className="chevron">⌄</span></button>
            <div className="category-menu">
              {categories.map((category) => <Link key={category._id} to={`/blog?category=${encodeURIComponent(category.slug)}`}>{category.name}</Link>)}
              {!categories.length && <span className="category-empty">Explore all topics</span>}
            </div>
          </div>
          <a className="nav-cta" href="mailto:hello@nexabyte.tech">Let’s talk <ArrowUpRight size={15} /></a>
        </nav>
      </div>
    </header>
  );
}
