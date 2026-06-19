# PRD Addendum — Technical Constraints & LLM Integration

## Architecture Change

The application will be a **pure Next.js application**.

No separate Express backend.

Next.js API Routes (`app/api/*`) will serve as the backend layer.

---

# Technology Stack

## Frontend

* Next.js 15+
* TypeScript
* TailwindCSS
* TanStack Table
* Recharts
* Shadcn UI

## Backend

Next.js Route Handlers

```text
app/api/*
```

Responsibilities:

* CSV upload processing
* LinkedIn scraping orchestration
* LLM requests
* Analytics calculations
* Database operations

## Database

PostgreSQL

ORM:

* Prisma

---

# External AI Provider

## Base URL

```text
http://localhost:3001/v1
```

## API Key

```text
freellmapi-ee8a352746a891c55ecc1a17b56c356ab0f1cce2c9b5442b
```

## Compatibility

Application should assume OpenAI-compatible APIs.

Example:

```ts
const client = new OpenAI({
  apiKey: process.env.FREELLM_API_KEY,
  baseURL: process.env.FREELLM_BASE_URL
});
```

Environment Variables:

```env
FREELLM_BASE_URL=http://localhost:3001/v1
FREELLM_API_KEY=freellmapi-ee8a352746a891c55ecc1a17b56c356ab0f1cce2c9b5442b
```

---

# AI Workflows

## 1. Hook Extraction

Input:

```json
{
  "post": "full linkedin post text"
}
```

Output:

```json
{
  "hook": "first 2-3 lines"
}
```

---

## 2. Hook Classification

Output:

```json
{
  "hookType": "Curiosity"
}
```

Allowed Values:

* Curiosity
* Contrarian
* Story
* Failure
* Achievement
* Opinion
* Question
* Educational
* Building In Public
* Career

---

## 3. Topic Classification

Output:

```json
{
  "topic": "AI"
}
```

Allowed Values:

* AI
* Startups
* SaaS
* Career
* Hiring
* Freelancing
* Full Stack
* React
* Next.js
* UI/UX
* Productivity
* Entrepreneurship
* Personal Branding

---

## 4. Content Pattern Analysis

Input:

All analyzed posts.

Output:

```json
{
  "winningHooks": [],
  "winningTopics": [],
  "recommendations": []
}
```

---

# Analysis Pipeline

```text
CSV Upload
        ↓
Parse CSV
        ↓
Extract LinkedIn URLs
        ↓
Visit Posts (Puppeteer)
        ↓
Extract Post Text
        ↓
Extract Hook (LLM)
        ↓
Classify Hook Type
        ↓
Classify Topic
        ↓
Calculate Metrics
        ↓
Store Results
        ↓
Generate Dashboard
        ↓
Generate AI Insights
```

---

# Core Dashboard Widgets

### Overview Cards

* Total Posts
* Total Impressions
* Total Engagements
* Average ER%
* Best Performing Topic
* Best Performing Hook Type

### Posts Table

Columns:

| Date | Hook | Hook Type | Topic | Impressions | Engagements | ER% |
| ---- | ---- | --------- | ----- | ----------: | ----------: | --: |

Features:

* Sorting
* Filtering
* Search
* Pagination

### Hook Analytics

* Average impressions per hook type
* Average ER per hook type

### Topic Analytics

* Average impressions per topic
* Average ER per topic

### AI Insights Panel

Generated recommendations:

* What worked
* What failed
* What to post more
* What to avoid
* Suggested future topics

---

# Additional Feature

## Hook Intelligence

For every post:

Store:

```ts
{
  hook: string;
  hookType: string;
  hookLength: number;
  impressions: number;
  engagements: number;
  engagementRate: number;
}
```

This enables discovering patterns such as:

* Best hook length
* Best opening words
* Best hook categories
* Best performing sentence structures

---

# MVP Priority

P0

* CSV Upload
* LinkedIn URL Extraction
* Puppeteer Scraping
* Hook Extraction
* Topic Classification
* Dashboard
* PostgreSQL Storage

P1

* AI Recommendations
* Hook Intelligence
* Pattern Detection

P2

* Content DNA
* Content Idea Generation
* Competitor Analysis
