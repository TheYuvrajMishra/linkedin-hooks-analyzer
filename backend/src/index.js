import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { initDb, savePost, getPosts, getDashboardData, query } from './db.js';
import { scrapePost } from './scraper.js';
import { analyzePost, generateAiInsights } from './ai.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Set up file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Parse side-by-side TOP POSTS sheet
function parseExcelBuffer(buffer) {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames.find(s => s.toUpperCase() === 'TOP POSTS') || workbook.SheetNames[2];
  
  if (!sheetName) {
    throw new Error('Could not find TOP POSTS sheet in the Excel file.');
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  const postsMap = new Map();

  // Skip the first 2 rows (row index 0 is title, row index 1 is column headers)
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    // Left side (Engagements)
    const leftUrl = row[0];
    const leftDate = row[1];
    const leftEng = row[2];

    if (leftUrl && typeof leftUrl === 'string' && leftUrl.startsWith('http')) {
      if (!postsMap.has(leftUrl)) {
        postsMap.set(leftUrl, { url: leftUrl, date: leftDate, engagements: 0, impressions: 0 });
      }
      const item = postsMap.get(leftUrl);
      item.engagements = parseInt(leftEng) || 0;
      if (leftDate) item.date = leftDate;
    }

    // Right side (Impressions)
    const rightUrl = row[4];
    const rightDate = row[5];
    const rightImp = row[6];

    if (rightUrl && typeof rightUrl === 'string' && rightUrl.startsWith('http')) {
      if (!postsMap.has(rightUrl)) {
        postsMap.set(rightUrl, { url: rightUrl, date: rightDate, engagements: 0, impressions: 0 });
      }
      const item = postsMap.get(rightUrl);
      item.impressions = parseInt(rightImp) || 0;
      if (rightDate) item.date = rightDate;
    }
  }

  return Array.from(postsMap.values());
}

// 1. Upload Excel file
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const posts = parseExcelBuffer(req.file.buffer);
    let savedCount = 0;

    for (const post of posts) {
      const er = post.impressions > 0 ? (post.engagements / post.impressions) * 100 : 0;
      // Get existing post text/metadata if already present in DB
      const existing = await query('SELECT text, hook, topic, hook_type, publish_date, media_type FROM posts WHERE url = ?', [post.url]);
      
      const postData = {
        url: post.url,
        text: existing[0]?.text || '',
        hook: existing[0]?.hook || '',
        topic: existing[0]?.topic || 'Career',
        hook_type: existing[0]?.hook_type || 'Opinion',
        publish_date: existing[0]?.publish_date || (post.date ? new Date(post.date).toISOString() : new Date().toISOString()),
        media_type: existing[0]?.media_type || 'Text'
      };

      const analyticsData = {
        impressions: post.impressions,
        engagements: post.engagements,
        er: parseFloat(er.toFixed(2))
      };

      await savePost(postData, analyticsData);
      savedCount++;
    }

    res.json({
      message: 'File processed successfully.',
      recordsProcessed: savedCount
    });
  } catch (error) {
    console.error('Upload processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Run Scraping & AI Analysis for un-analyzed posts
app.post('/api/analyze', async (req, res) => {
  try {
    // Find all posts that have empty text (not analyzed yet)
    const pendingPosts = await query(`
      SELECT p.*, a.impressions, a.engagements, a.er 
      FROM posts p
      JOIN analytics a ON p.id = a.post_id
      WHERE p.text IS NULL OR p.text = ''
    `);

    console.log(`Found ${pendingPosts.length} posts pending analysis.`);

    if (pendingPosts.length === 0) {
      return res.json({ message: 'All posts are already analyzed.', processed: 0 });
    }

    // Process posts in batches of 5 to run parallelly without hitting network/API rate limits
    const batchSize = 5;
    let processedCount = 0;

    for (let i = 0; i < pendingPosts.length; i += batchSize) {
      const batch = pendingPosts.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (post) => {
        // Step 1: Scrape
        const scraped = await scrapePost(post.url);
        
        // Use publish date from scraper if found, otherwise keep original
        const publishDate = scraped.publishDate || post.publish_date;
        const postText = scraped.text || `LinkedIn Post from ${post.url.split('/').pop()}`;

        // Step 2: AI Classification
        const classification = await analyzePost(postText);

        const postData = {
          url: post.url,
          text: postText,
          hook: classification.hook,
          topic: classification.topic,
          hook_type: classification.hook_type,
          publish_date: publishDate,
          media_type: scraped.mediaType || 'Text'
        };

        const analyticsData = {
          impressions: post.impressions,
          engagements: post.engagements,
          er: post.er
        };

        await savePost(postData, analyticsData);
        processedCount++;
      }));

      console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(pendingPosts.length / batchSize)}`);
    }

    res.json({
      message: `Analysis completed. Processed ${processedCount} posts.`,
      processed: processedCount
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Get Dashboard Aggregates & Dynamic AI Insights
app.get('/api/dashboard', async (req, res) => {
  try {
    const dashboardData = await getDashboardData();
    
    // Fetch all posts with text to generate insights
    const allPosts = await query(`
      SELECT p.*, a.impressions, a.engagements, a.er
      FROM posts p
      JOIN analytics a ON p.id = a.post_id
      WHERE p.text IS NOT NULL AND p.text != ''
    `);

    // Generate insights
    const aiInsights = await generateAiInsights(allPosts);

    res.json({
      ...dashboardData,
      aiInsights
    });
  } catch (error) {
    console.error('Dashboard fetching error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Get analyzed posts with filters & pagination
app.get('/api/posts', async (req, res) => {
  try {
    const { topic, hook_type, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const filterOptions = {
      topic: topic || null,
      hook_type: hook_type || null,
      limit: parseInt(limit),
      offset
    };

    const { posts, total } = await getPosts(filterOptions);

    res.json({
      posts,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Posts fetching error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Auto-seeding function on startup
async function autoSeed() {
  try {
    const checkPosts = await query('SELECT COUNT(*) as count FROM posts');
    const count = checkPosts[0]?.count || 0;

    if (count > 0) {
      console.log('Database already has posts. Skipping auto-seeding.');
      return;
    }

    // Look for local Excel file
    const rootDir = path.resolve(__dirname, '../../');
    const files = fs.readdirSync(rootDir);
    const excelFile = files.find(f => f.startsWith('AggregateAnalytics_') && f.endsWith('.xlsx'));

    if (excelFile) {
      const filePath = path.join(rootDir, excelFile);
      console.log(`Found local Excel file to auto-seed: ${filePath}`);
      const fileBuffer = fs.readFileSync(filePath);
      const posts = parseExcelBuffer(fileBuffer);

      console.log(`Auto-seeding ${posts.length} posts into database...`);
      for (const post of posts) {
        const er = post.impressions > 0 ? (post.engagements / post.impressions) * 100 : 0;
        const postData = {
          url: post.url,
          text: '',
          hook: '',
          topic: 'Career',
          hook_type: 'Opinion',
          publish_date: post.date ? new Date(post.date).toISOString() : new Date().toISOString(),
          media_type: 'Text'
        };
        const analyticsData = {
          impressions: post.impressions,
          engagements: post.engagements,
          er: parseFloat(er.toFixed(2))
        };
        await savePost(postData, analyticsData);
      }
      console.log('Auto-seeding completed successfully.');
    } else {
      console.log('No local Excel file found for auto-seeding.');
    }
  } catch (err) {
    console.error('Error during auto-seeding:', err.message);
  }
}

// Start Server
async function start() {
  await initDb();
  await autoSeed();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
