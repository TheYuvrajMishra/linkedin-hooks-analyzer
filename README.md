# LinkedIn Hooks & Analytics Analyzer

A full-stack Node.js and Next.js application that parses a creator's LinkedIn posts from Excel/CSV exports, fetches their full post content via metadata extraction, classifies their hooks and topics using Gemini AI (with a local rules-based heuristic fallback), and visualizes the results on a premium dark-themed dashboard.

## Features

- ⚡ **Auto-Seeding**: Upon startup, the backend automatically detects any local Excel file named `AggregateAnalytics_*.xlsx` in the root workspace and seeds its data into the database. You'll see your posts in the dashboard right away!
- 📊 **Metric Dashboard**: Computes total reach, total engagement, average impressions by hook type, and average engagement rate (ER%) by topic.
- 🧪 **AI Analysis Layer**: Extracts hooks, classifies hook types (Curiosity, Contrarian, Story, Failure, Achievement, Opinion, Question), and classifies topics.
- 🧠 **Dynamic AI Insights**: Generates actionable copywriting recommendations and content DNA insights based on aggregate performance data.
- 📁 **Excel File Upload**: Dropzone to upload additional LinkedIn exports. It parses side-by-side impressions and engagements lists accurately.
- 🗂️ **Filterable Post Library**: Paginated list of all posts with inline previews, metrics, performance scores, and detailed inspection modal.

---

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **NPM** (v9 or higher)

### Setup & Installation

1. Install dependencies for the root, frontend, and backend packages:
   ```bash
   npm run install:all
   ```

2. Configure your environment variables:
   Open [backend/.env](file:///H:/linkedin-hooks-analyzer/backend/.env) and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   *Note: If no API key is specified, the application will run in offline mode using a keyword-based heuristic classifier and mock insight generator. The app will never crash!*

3. Run the development environment:
   ```bash
   npm run dev
   ```
   This will start both:
   - **Express.js Backend**: `http://localhost:5000`
   - **Next.js Frontend**: `http://localhost:3000`

---

## Technical Architecture

### [Backend (Express)](file:///H:/linkedin-hooks-analyzer/backend)
- **Framework**: Express.js
- **Database**: SQLite (local dev fallback) / PostgreSQL (configured via `DATABASE_URL` in [backend/.env](file:///H:/linkedin-hooks-analyzer/backend/.env))
- **Scraper**: [scraper.js](file:///H:/linkedin-hooks-analyzer/backend/src/scraper.js) — Fetches LinkedIn post HTML and extracts the post text from the meta description and publish date from JSON-LD schema without authentication blocks.
- **AI Engine**: [ai.js](file:///H:/linkedin-hooks-analyzer/backend/src/ai.js) — Uses `@google/genai` to call `gemini-2.5-flash` with JSON Schemas for structured classification and insight generation.

### [Frontend (Next.js)](file:///H:/linkedin-hooks-analyzer/frontend)
- **Framework**: Next.js v16 (App Router) + Tailwind CSS v4
- **Charts**: Recharts
- **Icons**: Lucide React
- **Table & Controls**: [page.tsx](file:///H:/linkedin-hooks-analyzer/frontend/src/app/page.tsx) — Implements glassmorphism UI layouts, search filters, modal detail inspectors, and file upload handlers.
