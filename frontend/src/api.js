const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function request(path, options = {}) {
  const token = localStorage.getItem("techsphere_token");
  const headers = { ...options.headers };
  if (!(options.body instanceof FormData) && options.body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "The request could not be completed.");
  return data;
}

export const imageUrl = (image) => {
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;
  const base = API_URL.replace(/\/api\/?$/, "");
  return `${base}${image.startsWith("/") ? "" : "/"}${image}`;
};
