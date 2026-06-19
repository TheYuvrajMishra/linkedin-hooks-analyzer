import sqlite3 from 'sqlite3';
import pg from 'pg';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

const { Client } = pg;

let dbType = 'sqlite';
let sqliteDb = null;
let pgClient = null;

export async function initDb() {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    try {
      console.log('Connecting to PostgreSQL database...');
      pgClient = new Client({ connectionString: dbUrl });
      await pgClient.connect();
      dbType = 'postgres';
      console.log('Connected to PostgreSQL successfully.');
    } catch (err) {
      console.error('Failed to connect to PostgreSQL. Falling back to SQLite.', err);
      setupSQLite();
    }
  } else {
    setupSQLite();
  }

  // Create tables if they don't exist
  await createTables();
}

function setupSQLite() {
  dbType = 'sqlite';
  const sqlitePath = process.env.DATABASE_SQLITE_PATH || './linkedin_analytics.db';
  const resolvedPath = path.resolve(sqlitePath);
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  console.log(`Using SQLite database at: ${resolvedPath}`);
  sqliteDb = new sqlite3.Database(resolvedPath);
}

async function createTables() {
  if (dbType === 'postgres') {
    // PostgreSQL schema
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id UUID PRIMARY KEY,
        url TEXT UNIQUE,
        text TEXT,
        hook TEXT,
        topic VARCHAR(100),
        hook_type VARCHAR(100),
        publish_date TIMESTAMP,
        media_type VARCHAR(100)
      );
    `);
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS analytics (
        post_id UUID PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
        impressions INTEGER,
        engagements INTEGER,
        er DECIMAL(5,2)
      );
    `);
  } else {
    // SQLite schema
    return new Promise((resolve, reject) => {
      sqliteDb.serialize(() => {
        sqliteDb.run(`
          CREATE TABLE IF NOT EXISTS posts (
            id TEXT PRIMARY KEY,
            url TEXT UNIQUE,
            text TEXT,
            hook TEXT,
            topic TEXT,
            hook_type TEXT,
            publish_date TEXT,
            media_type TEXT
          );
        `, (err) => {
          if (err) return reject(err);
        });

        sqliteDb.run(`
          CREATE TABLE IF NOT EXISTS analytics (
            post_id TEXT PRIMARY KEY,
            impressions INTEGER,
            engagements INTEGER,
            er REAL,
            FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
          );
        `, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });
  }
}

// Helper to run query regardless of engine
export async function query(sql, params = []) {
  if (dbType === 'postgres') {
    // Convert SQLite parameter placeholders (?) to PostgreSQL ($1, $2, etc.) if needed
    let pgSql = sql;
    let index = 1;
    while (pgSql.includes('?')) {
      pgSql = pgSql.replace('?', `$${index++}`);
    }
    const res = await pgClient.query(pgSql, params);
    return res.rows;
  } else {
    return new Promise((resolve, reject) => {
      // If it's a SELECT query, use db.all. Otherwise, use db.run.
      const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
      if (isSelect) {
        sqliteDb.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      } else {
        sqliteDb.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      }
    });
  }
}

export async function savePost(postData, analyticsData) {
  const { url, text, hook, topic, hook_type, publish_date, media_type } = postData;
  const { impressions, engagements, er } = analyticsData;

  // Check if post already exists by URL
  const existing = await query('SELECT id FROM posts WHERE url = ?', [url]);
  let postId;

  if (existing.length > 0) {
    postId = existing[0].id;
    // Update post
    await query(
      `UPDATE posts 
       SET text = ?, hook = ?, topic = ?, hook_type = ?, publish_date = ?, media_type = ? 
       WHERE id = ?`,
      [text, hook, topic, hook_type, publish_date, media_type, postId]
    );
    // Update analytics
    await query(
      `UPDATE analytics 
       SET impressions = ?, engagements = ?, er = ? 
       WHERE post_id = ?`,
      [impressions, engagements, er, postId]
    );
  } else {
    postId = crypto.randomUUID();
    // Insert post
    await query(
      `INSERT INTO posts (id, url, text, hook, topic, hook_type, publish_date, media_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [postId, url, text, hook, topic, hook_type, publish_date, media_type]
    );
    // Insert analytics
    await query(
      `INSERT INTO analytics (post_id, impressions, engagements, er) 
       VALUES (?, ?, ?, ?)`,
      [postId, impressions, engagements, er]
    );
  }

  return postId;
}

export async function getPosts({ topic, hook_type, limit = 50, offset = 0 } = {}) {
  let sql = `
    SELECT p.*, a.impressions, a.engagements, a.er 
    FROM posts p
    JOIN analytics a ON p.id = a.post_id
    WHERE 1=1
  `;
  const params = [];

  if (topic) {
    sql += ' AND p.topic = ?';
    params.push(topic);
  }
  if (hook_type) {
    sql += ' AND p.hook_type = ?';
    params.push(hook_type);
  }

  sql += ' ORDER BY p.publish_date DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const posts = await query(sql, params);

  // Count total for pagination
  let countSql = 'SELECT COUNT(*) as total FROM posts WHERE 1=1';
  const countParams = [];
  if (topic) {
    countSql += ' AND topic = ?';
    countParams.push(topic);
  }
  if (hook_type) {
    countSql += ' AND hook_type = ?';
    countParams.push(hook_type);
  }
  const countRes = await query(countSql, countParams);
  const total = countRes[0]?.total || 0;

  return { posts, total };
}

export async function getDashboardData() {
  // 1. Get total posts count
  const countRes = await query('SELECT COUNT(*) as count FROM posts');
  const totalPosts = countRes[0]?.count || 0;

  if (totalPosts === 0) {
    return {
      totalPosts: 0,
      topReachPosts: [],
      topEngagementPosts: [],
      bestHookTypes: [],
      bestTopics: [],
      overallMetrics: { impressions: 0, engagements: 0, avgEr: 0 }
    };
  }

  // 2. Overall stats
  const overallRes = await query(`
    SELECT 
      SUM(impressions) as total_impressions, 
      SUM(engagements) as total_engagements,
      AVG(er) as avg_er
    FROM analytics
  `);
  const overall = {
    impressions: overallRes[0]?.total_impressions || 0,
    engagements: overallRes[0]?.total_engagements || 0,
    avgEr: parseFloat(overallRes[0]?.avg_er || 0).toFixed(2)
  };

  // 3. Top Reach Posts (by impressions)
  const topReach = await query(`
    SELECT p.id, p.url, p.hook, p.topic, p.hook_type, p.publish_date, a.impressions, a.engagements, a.er
    FROM posts p
    JOIN analytics a ON p.id = a.post_id
    ORDER BY a.impressions DESC
    LIMIT 5
  `);

  // 4. Top Engagement Posts (by ER)
  const topEngagement = await query(`
    SELECT p.id, p.url, p.hook, p.topic, p.hook_type, p.publish_date, a.impressions, a.engagements, a.er
    FROM posts p
    JOIN analytics a ON p.id = a.post_id
    ORDER BY a.er DESC
    LIMIT 5
  `);

  // 5. Best Hook Types (Avg Impressions)
  const bestHookTypes = await query(`
    SELECT p.hook_type, AVG(a.impressions) as avg_impressions, AVG(a.er) as avg_er, COUNT(*) as count
    FROM posts p
    JOIN analytics a ON p.id = a.post_id
    GROUP BY p.hook_type
    ORDER BY avg_impressions DESC
  `);
  const formattedHookTypes = bestHookTypes.map(h => ({
    hook_type: h.hook_type || 'Unknown',
    avgImpressions: Math.round(h.avg_impressions || 0),
    avgEr: parseFloat(h.avg_er || 0).toFixed(2),
    count: h.count
  }));

  // 6. Best Topics (Avg ER)
  const bestTopics = await query(`
    SELECT p.topic, AVG(a.impressions) as avg_impressions, AVG(a.er) as avg_er, COUNT(*) as count
    FROM posts p
    JOIN analytics a ON p.id = a.post_id
    GROUP BY p.topic
    ORDER BY avg_er DESC
  `);
  const formattedTopics = bestTopics.map(t => ({
    topic: t.topic || 'Unknown',
    avgImpressions: Math.round(t.avg_impressions || 0),
    avgEr: parseFloat(t.avg_er || 0).toFixed(2),
    count: t.count
  }));

  return {
    totalPosts,
    overallMetrics: overall,
    topReachPosts: topReach,
    topEngagementPosts: topEngagement,
    bestHookTypes: formattedHookTypes,
    bestTopics: formattedTopics
  };
}
