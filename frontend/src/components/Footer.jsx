import { ArrowUpRight, Linkedin, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer({ categories }) {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-about">
          <Link className="brand footer-brand" to="/"><span className="brand-mark">N</span><span className="brand-name">nexabyte<span> / </span><b>techsphere</b></span></Link>
          <p>Ideas and insights for a world built on technology.</p>
        </div>
        <div className="footer-links"><span className="eyebrow">DISCOVER</span><Link to="/blog">All articles</Link>{categories.slice(0, 3).map((category) => <Link key={category._id} to={`/blog?category=${encodeURIComponent(category.slug)}`}>{category.name}</Link>)}</div>
        <div className="footer-links"><span className="eyebrow">NEXABYTE</span><a href="mailto:hello@nexabyte.tech">Contact us <ArrowUpRight size={13} /></a><span>Building what’s next.</span></div>
        <div className="footer-social"><a aria-label="NexaByte on LinkedIn" href="https://www.linkedin.com/" target="_blank" rel="noreferrer"><Linkedin size={17} /></a><a aria-label="NexaByte on X" href="https://x.com/" target="_blank" rel="noreferrer"><Twitter size={17} /></a></div>
      </div>
      <div className="container footer-bottom"><span>© {new Date().getFullYear()} NexaByte Technologies</span><span>Technology, thoughtfully explored.</span></div>
    </footer>
  );
}
