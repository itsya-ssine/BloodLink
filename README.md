# 🩸 BloodLink — Blood Donation Web App

A professional, fully-featured blood donation web application built with vanilla HTML, CSS, and JavaScript.

---

## Project Structure

```
bloodlink/
├── index.html                  # Main entry point (SPA shell)
├── schema.sql                  # PostgreSQL schema
├── css/
│   ├── main.css                # Global styles, layout, typography
│   ├── components.css          # Component-specific styles
│   └── animations.css          # Keyframe animations & transitions
├── js/
│   ├── data.js                 # Mock data (users, hospitals, requests)
│   ├── router.js               # Page router + Dashboard renderer
│   ├── app.js                  # App init, navigation, toast notifications
│   └── components/
│       ├── profile.js          # User profile & edit modal
│       ├── map.js              # Interactive Leaflet hospital map
│       ├── donations.js        # Donate flow (4 steps) + history
│       └── requests.js         # Blood request board + post form
├── backend/
│   ├── public/
│   │   ├── index.php           # API front controller
│   │   └── .htaccess           # Apache rewrite to index.php
│   ├── src/
│   │   ├── bootstrap.php       # Env loading + autoload
│   │   ├── Database.php        # PDO PostgreSQL connector
│   │   └── Response.php        # JSON response helper
│   ├── .env.example            # Backend environment template
│   └── README.md               # Backend API setup and endpoints
```

---

## Getting Started

### Option 1 — Open directly in browser
Simply double-click `index.html`. No build step required.

### Option 2 — Local server (recommended)
```bash
# Python
python -m http.server 3000

# Node.js
npx serve .

# VS Code
# Use the "Live Server" extension
```

### Option 3 — Run with PHP backend API
```bash
# 1) Create database from schema
psql -U postgres -d bloodlink -f schema.sql

# 1.1) Seed minimal startup data
psql -U postgres -d bloodlink -f seed.sql

# Optional: load the complete AppData dataset
psql -U postgres -d bloodlink -f seed-all.sql

# 2) Configure backend env
cp backend/.env.example backend/.env

# 3) Serve frontend
python -m http.server 3000

# 4) Serve backend API (new terminal)
php -S localhost:8080 -t backend/public
```

API base URL: `http://localhost:8080/api`

Then open `http://localhost:3000` in your browser.

---

## Features

| Page | Features |
|------|----------|
| **Dashboard** | Stats overview, urgent requests widget, nearby hospitals, recent donations |
| **My Profile** | Personal info, contact, medical data, achievements, editable via modal |
| **Donate Blood** | 4-step wizard: Eligibility checklist → Select center → Schedule date/time → Confirm |
| **History** | Timeline view + table with all past donations, statistics |
| **Hospitals Map** | Interactive Leaflet map, filter by urgency, blood type availability, slot count |
| **Blood Requests** | Request board, filter by urgency, post new request, respond to requests |

---

## Design System

- **Fonts**: Playfair Display (headings) + DM Sans (body) + DM Mono (data)
- **Colors**: Deep crimson `#C0152A` on void black `#0A0A0C`
- **Components**: Cards, badges, stat cards, modals, timelines, step indicators, toast notifications
- **Animations**: Page transitions, fade-up stagger, pulse glow, heartbeat, shimmer skeleton

---

## Technologies Used

- **HTML5** — Semantic markup
- **CSS3** — Custom properties, Grid, Flexbox, animations
- **Vanilla JavaScript** — ES6+, module pattern, no framework
- **Leaflet.js** — Interactive maps (via CDN)
- **Google Fonts** — Playfair Display, DM Sans, DM Mono

---

## Architecture

The app follows a **component-based SPA pattern**:
- `Router` handles page navigation and renders HTML strings into `#mainContent`
- Each component (`ProfileComponent`, `MapComponent`, etc.) has a `render()` method
- `AppData` is the single source of truth for all state
- Toast notifications and modals are managed by `App`

---

## Localization

The app is pre-configured for **Morocco (Khouribga region)**:
- Map centered on Khouribga coordinates
- Moroccan hospital names and phone formats
- French/Arabic hospital naming conventions
