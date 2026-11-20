# TechSphere — NexaByte Technologies

A full-stack technology publication built with React, Express, and MongoDB.

## Requirements

- Node.js 20+
- MongoDB (local or hosted)

## Run locally

1. Copy `backend/.env.example` to `backend/.env` and set a MongoDB connection string, a long random `JWT_SECRET`, and a strong `ADMIN_PASSWORD`.
2. From the project root, install dependencies: `npm install`.
3. Create the initial admin account and default blog topics: `npm run seed`.
4. Start the frontend and API: `npm run dev`.
5. Open `http://localhost:5173`; the admin area is at `/admin/login`.

The admin account is created only by the seed command. Admin passwords are hashed with bcrypt; the API does not expose a public registration route.

## Project layout

- `frontend/` — Vite + React public pages and admin dashboard.
- `backend/` — Express REST API, Mongoose models, authentication, and image uploads.
- Public API: `GET /api/articles`, `GET /api/articles/:slug`, `GET /api/categories`.
- Admin API: `POST /api/auth/login` and protected `/api/admin/*`.

Set `SITE_URL` to the canonical public website origin and `CLIENT_ORIGIN` to the frontend origin(s) before deployment. The API provides `/sitemap.xml` and `/robots.txt`. Set `VITE_API_URL` at frontend build time if the API is hosted at a different origin; its default is `http://localhost:5000/api`. Optional frontend build settings `VITE_GA_MEASUREMENT_ID` and `VITE_GOOGLE_SITE_VERIFICATION` enable Google Analytics 4 and Search Console verification.

## Content format

Article content is text with Markdown-style `##`/`###` headings, links, images, tables, fenced code blocks, blockquotes, and `-` list items. Use `@[video](https://youtu.be/VIDEO_ID)` or a Vimeo URL for embedded videos. Content is rendered as React text rather than injected HTML. Uploads accept JPEG, PNG, GIF, and WebP files up to 5 MB and are resized/optimized as WebP.

Scheduled posts become publicly visible at their scheduled time and are included in sitemap/article queries after that time. The stored status remains `scheduled` until an administrator changes it.
