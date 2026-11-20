import { useEffect } from "react";

export default function SEO({ title, description, image, url, type = "website" }) {
  useEffect(() => {
    document.title = title ? `${title} | TechSphere` : "TechSphere | NexaByte Technologies";
    const setMeta = (selector, attr, value) => {
      if (!value) return;
      let tag = document.head.querySelector(selector);
      if (!tag) { tag = document.createElement("meta"); document.head.appendChild(tag); }
      tag.setAttribute(attr, value);
    };
    setMeta('meta[name="description"]', "content", description || "Technology perspectives and practical guides from NexaByte Technologies.");
    setMeta('meta[property="og:title"]', "content", title || "TechSphere | NexaByte Technologies");
    setMeta('meta[property="og:description"]', "content", description || "Technology perspectives and practical guides from NexaByte Technologies.");
    setMeta('meta[property="og:type"]', "content", type);
    setMeta('meta[property="og:image"]', "content", image);
    setMeta('meta[property="og:url"]', "content", url || window.location.href);
    setMeta('meta[name="google-site-verification"]', "content", import.meta.env.VITE_GOOGLE_SITE_VERIFICATION);
  }, [title, description, image, url, type]);
  return null;
}
