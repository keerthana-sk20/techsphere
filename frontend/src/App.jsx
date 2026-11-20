import { useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Blog from "./pages/Blog.jsx";
import Article from "./pages/Article.jsx";
import Login from "./pages/Login.jsx";
import Admin from "./pages/Admin.jsx";
import { request } from "./api.js";

export default function App() {
  const [categories, setCategories] = useState([]);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  useEffect(() => {
    request("/categories").then((data) => setCategories(data.categories || [])).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (!measurementId) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", measurementId, { send_page_view: false });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
    return () => script.remove();
  }, []);

  useEffect(() => {
    if (window.gtag) window.gtag("event", "page_view", { page_path: `${location.pathname}${location.search}` });
  }, [location.pathname, location.search]);

  return (
    <>
      {!isAdmin && <Header categories={categories} />}
      <Routes>
        <Route path="/" element={<Home categories={categories} />} />
        <Route path="/blog" element={<Blog categories={categories} />} />
        <Route path="/blog/:slug" element={<Article />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<Admin categories={categories} onCategories={setCategories} />} />
        <Route path="*" element={<main className="container not-found"><h1>Page not found</h1><a href="/">Return home</a></main>} />
      </Routes>
      {!isAdmin && <Footer categories={categories} />}
    </>
  );
}
