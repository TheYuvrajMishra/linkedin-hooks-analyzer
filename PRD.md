# PRD — LinkedIn Posts Analyzer (Node.js Application)

## Overview

A Node.js application that analyzes a creator's LinkedIn posts and identifies which content patterns generate the highest impressions, engagement, and engagement rates.

The application will automatically process LinkedIn post data, extract opening hooks, classify content types, calculate performance metrics, and generate actionable recommendations to improve future content performance.

---

# Problem

LinkedIn analytics provides only raw metrics such as:

* Impressions
* Reactions
* Comments
* Shares

However, it does not answer critical content strategy questions:

* Which hooks perform best?
* Which topics generate the most reach?
* What posting patterns are most effective?
* What writing styles drive engagement?
* Which content formats should be repeated?

Users currently perform this analysis manually, which is time-consuming and difficult to scale.

---

# Goals

### Primary Goals

1. Extract hooks from LinkedIn posts
2. Calculate engagement metrics automatically
3. Identify top-performing content
4. Discover successful hook patterns
5. Generate recommendations for future content

### Success Metrics

* Analyze 100+ posts automatically
* Hook extraction accuracy >95%
* Topic classification accuracy >85%
* Processing time <2 minutes for 100 posts

---

# User Flow

## Input

Users can provide data through:

* LinkedIn Analytics CSV upload

OR

* A list of LinkedIn post URLs

---

## Processing

For each post:

### Step 1

Retrieve post data from the provided URL or imported dataset.

### Step 2

Extract:

* Post text
* Media type
* Publish date

### Step 3

Generate:

* Hook (first 2–3 lines)
* Hook type classification
* Topic category classification

### Step 4

Merge analytics data:

* Impressions
* Engagements
* Engagement Rate

---

## Output

### Table View

| Date | Hook | Topic | Impressions | Engagements | ER% |
| ---- | ---- | ----- | ----------- | ----------- | --- |

---

### Dashboard

#### Top Reach Posts

Display posts with the highest impressions.

#### Top Engagement Posts

Display posts with the highest engagement rates.

#### Best Hook Types

Example:

| Hook Type  | Avg Impressions |
| ---------- | --------------- |
| Contrarian | 5200            |
| Story      | 4100            |
| Curiosity  | 3800            |

#### Best Topics

Example:

| Topic       | Avg ER |
| ----------- | ------ |
| AI          | 3.1%   |
| Career      | 2.7%   |
| Freelancing | 2.4%   |

---

# Hook Classification

The application should classify hooks into the following categories:

### Curiosity

Examples:

* "Nobody talks about this..."
* "I discovered something strange..."

### Contrarian

Examples:

* "Most developers are wrong about..."

### Story

Examples:

* "Three months ago..."

### Failure

Examples:

* "I wasted six months..."

### Achievement

Examples:

* "I reached 100k users..."

### Opinion

Examples:

* "I think the future of AI..."

### Question

Examples:

* "Would you hire this developer?"

---

# Topic Classification

Supported topic categories:

* AI
* Startups
* Career
* Freelancing
* Full Stack Development
* React
* Next.js
* UI/UX
* Productivity
* Personal Branding
* Remote Work
* Hiring
* Entrepreneurship

---

# Analytics Engine

## Calculations

### Engagement Rate

Formula:

ER = (Engagements / Impressions) × 100

### Reach Score

A normalized score based on impressions across all analyzed posts.

### Performance Score

Weighted formula:

Performance Score =
(0.7 × Reach Score)
+
(0.3 × Engagement Rate)

---

# AI Insights

The application should generate insights such as:

### Winning Hooks

Examples:

* Hooks beginning with personal stories generate 3.2× more impressions on average.

### Winning Topics

Examples:

* Startup-related content receives 48% more reach than average.

### Best Posting Patterns

Examples:

* Posts under 150 words outperform long-form content.

### Recommendations

Examples:

* Publish more founder stories.
* Use curiosity-driven openings.
* Avoid generic React tutorials.

---

# Technical Architecture

## Application Type

Full-stack Node.js application

---

## Frontend

* Next.js
* Tailwind CSS
* TanStack Table
* Recharts

Responsibilities:

* CSV upload interface
* Analytics dashboard
* Data visualization
* Insights display

---

## Backend

* Node.js
* Express.js

Responsibilities:

* API endpoints
* CSV processing
* Analytics calculations
* AI integration
* Data management

---

## Scraping & Data Collection

* Puppeteer
* Rotating proxies
* Cookie-based authentication

Responsibilities:

* Visit LinkedIn post URLs
* Extract post content
* Capture metadata

---

## AI Layer

Supported providers:

* Gemini

OR

* Claude

Responsibilities:

* Hook extraction
* Hook classification
* Topic classification
* Insight generation
* Recommendation generation

---

## Database

### PostgreSQL

#### posts

| Column       | Type      |
| ------------ | --------- |
| id           | UUID      |
| url          | TEXT      |
| text         | TEXT      |
| hook         | TEXT      |
| topic        | VARCHAR   |
| hook_type    | VARCHAR   |
| publish_date | TIMESTAMP |
| media_type   | VARCHAR   |

#### analytics

| Column      | Type    |
| ----------- | ------- |
| post_id     | UUID    |
| impressions | INTEGER |
| engagements | INTEGER |
| er          | DECIMAL |

---

# API Endpoints

## POST /api/upload

Upload LinkedIn Analytics CSV file.

### Request

* CSV file

### Response

* Upload status
* Number of records processed

---

## POST /api/analyze

Analyze uploaded posts and generate classifications.

### Response

* Hooks
* Hook types
* Topics
* Metrics

---

## GET /api/dashboard

Retrieve dashboard analytics.

### Response

* Top posts
* Hook performance
* Topic performance
* AI insights

---

## GET /api/posts

Retrieve analyzed posts with filtering and pagination.

### Filters

* Topic
* Hook type
* Date range

---

# Advanced Features (V2)

### Hook Library

Search and filter hooks by:

* Highest reach
* Highest engagement rate
* Topic
* Date range

### Content DNA

Generate insights such as:

"What content style works best for this creator?"

### Content Generator

Generate new LinkedIn post ideas based on historical performance.

Example:

"Create 20 LinkedIn posts based on my top-performing AI and Startup content."

### Competitor Analysis

Analyze:

* Public creator profiles
* Content strategies
* Performance patterns
* Content gaps

---

# MVP Scope

### Included

✅ CSV upload

✅ LinkedIn post processing

✅ Post scraping

✅ Hook extraction

✅ Hook classification

✅ Topic classification

✅ Engagement rate calculation

✅ Analytics dashboard

✅ AI-generated insights

✅ PostgreSQL storage

✅ REST API built with Node.js and Express

---

### Excluded

❌ Competitor analysis

❌ Auto-posting

❌ Multi-platform support

❌ Content generation

❌ Team collaboration features

These features will be considered for V2.
