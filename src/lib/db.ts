import fs from "fs";
import path from "path";
import { PrismaClient } from "@/generated/prisma/client";

const DB_FILE = path.join(process.cwd(), "data", "local_db.json");

interface DBData {
  posts: any[];
  dailyMetrics: any[];
  followerMetrics: any[];
  demographicMetrics: any[];
  analysisResults: any[];
}

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

function readJSONDB(): DBData {
  try {
    ensureDirectoryExistence(DB_FILE);
    if (!fs.existsSync(DB_FILE)) {
      const initialData: DBData = {
        posts: [],
        dailyMetrics: [],
        followerMetrics: [],
        demographicMetrics: [],
        analysisResults: [],
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    const fileContent = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(fileContent);
  } catch (error) {
    console.error("Error reading JSON DB file, returning empty state:", error);
    return {
      posts: [],
      dailyMetrics: [],
      followerMetrics: [],
      demographicMetrics: [],
      analysisResults: [],
    };
  }
}

function writeJSONDB(data: DBData) {
  try {
    ensureDirectoryExistence(DB_FILE);
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing to JSON DB file:", error);
  }
}

let prisma: PrismaClient | null = null;
let useFallback = false;

// Initialize Prisma connection
const dbUrl = process.env.DATABASE_URL || process.env.MONGODB_URI;

if (!dbUrl || !dbUrl.startsWith("mongodb")) {
  console.log("No MongoDB database configured. Falling back to JSON file storage.");
  useFallback = true;
} else {
  try {
    const globalForPrisma = globalThis as unknown as {
      prisma: PrismaClient;
    };

    prisma = globalForPrisma.prisma ?? new PrismaClient({
      datasourceUrl: dbUrl,
    });

    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
  } catch (error: any) {
    console.warn("Failed to initialize Prisma Client, falling back to JSON storage:", error.message);
    useFallback = true;
  }
}

export const db = {
  isFallback: () => useFallback,

  // --- Posts Operations ---
  getPosts: async () => {
    if (!useFallback && prisma) {
      try {
        return await prisma.post.findMany({
          orderBy: { publishedAt: "desc" },
        });
      } catch (err) {
        console.error("Prisma error in getPosts, using JSON fallback:", err);
      }
    }
    const data = readJSONDB();
    return data.posts.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
  },

  getPostByUrl: async (postUrl: string) => {
    if (!useFallback && prisma) {
      try {
        return await prisma.post.findUnique({
          where: { postUrl },
        });
      } catch (err) {
        console.error("Prisma error in getPostByUrl, using JSON fallback:", err);
      }
    }
    const data = readJSONDB();
    return data.posts.find((p) => p.postUrl === postUrl) || null;
  },

  savePost: async (postData: any) => {
    if (!useFallback && prisma) {
      try {
        const { id, createdAt, updatedAt, ...rest } = postData;
        const publishedAtDate = rest.publishedAt ? new Date(rest.publishedAt) : null;
        return await prisma.post.upsert({
          where: { postUrl: rest.postUrl },
          update: { ...rest, publishedAt: publishedAtDate },
          create: { ...rest, publishedAt: publishedAtDate },
        });
      } catch (err) {
        console.error("Prisma error in savePost, using JSON fallback:", err);
      }
    }
    const data = readJSONDB();
    const existingIdx = data.posts.findIndex((p) => p.postUrl === postData.postUrl);
    const updatedPost = {
      id: postData.id || `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...postData,
      createdAt: postData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (existingIdx >= 0) {
      data.posts[existingIdx] = { ...data.posts[existingIdx], ...updatedPost };
    } else {
      data.posts.push(updatedPost);
    }
    writeJSONDB(data);
    return updatedPost;
  },

  savePosts: async (postsArray: any[]) => {
    const results = [];
    for (const post of postsArray) {
      results.push(await db.savePost(post));
    }
    return results;
  },

  // --- Daily Metrics Operations ---
  getDailyMetrics: async () => {
    if (!useFallback && prisma) {
      try {
        return await prisma.dailyMetric.findMany({
          orderBy: { date: "asc" },
        });
      } catch (err) {
        console.error("Prisma error in getDailyMetrics, using JSON fallback:", err);
      }
    }
    const data = readJSONDB();
    return data.dailyMetrics.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  saveDailyMetrics: async (metricsArray: any[]) => {
    if (!useFallback && prisma) {
      try {
        // Clear old ones first for clean overwrite or do upserts
        await prisma.dailyMetric.deleteMany({});
        const results = [];
        for (const item of metricsArray) {
          results.push(
            await prisma.dailyMetric.create({
              data: {
                date: new Date(item.date),
                impressions: item.impressions,
                engagements: item.engagements,
              },
            })
          );
        }
        return results;
      } catch (err) {
        console.error("Prisma error in saveDailyMetrics, using JSON fallback:", err);
      }
    }
    const data = readJSONDB();
    data.dailyMetrics = metricsArray.map((item) => ({
      id: item.id || `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date(item.date).toISOString(),
      impressions: Number(item.impressions || 0),
      engagements: Number(item.engagements || 0),
    }));
    writeJSONDB(data);
    return data.dailyMetrics;
  },

  // --- Follower Metrics Operations ---
  getFollowerMetrics: async () => {
    if (!useFallback && prisma) {
      try {
        return await prisma.followerMetric.findMany({
          orderBy: { date: "asc" },
        });
      } catch (err) {
        console.error("Prisma error in getFollowerMetrics, using JSON fallback:", err);
      }
    }
    const data = readJSONDB();
    return data.followerMetrics.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  saveFollowerMetrics: async (metricsArray: any[]) => {
    if (!useFallback && prisma) {
      try {
        await prisma.followerMetric.deleteMany({});
        const results = [];
        for (const item of metricsArray) {
          results.push(
            await prisma.followerMetric.create({
              data: {
                date: new Date(item.date),
                newFollowers: item.newFollowers,
              },
            })
          );
        }
        return results;
      } catch (err) {
        console.error("Prisma error in saveFollowerMetrics, using JSON fallback:", err);
      }
    }
    const data = readJSONDB();
    data.followerMetrics = metricsArray.map((item) => ({
      id: item.id || `follower_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date(item.date).toISOString(),
      newFollowers: Number(item.newFollowers || 0),
    }));
    writeJSONDB(data);
    return data.followerMetrics;
  },

  // --- Demographic Metrics Operations ---
  getDemographicMetrics: async () => {
    if (!useFallback && prisma) {
      try {
        return await prisma.demographicMetric.findMany();
      } catch (err) {
        console.error("Prisma error in getDemographicMetrics, using JSON fallback:", err);
      }
    }
    const data = readJSONDB();
    return data.demographicMetrics;
  },

  saveDemographicMetrics: async (metricsArray: any[]) => {
    if (!useFallback && prisma) {
      try {
        await prisma.demographicMetric.deleteMany({});
        const results = [];
        for (const item of metricsArray) {
          results.push(
            await prisma.demographicMetric.create({
              data: {
                category: item.category,
                value: item.value,
                percentage: item.percentage,
              },
            })
          );
        }
        return results;
      } catch (err) {
        console.error("Prisma error in saveDemographicMetrics, using JSON fallback:", err);
      }
    }
    const data = readJSONDB();
    data.demographicMetrics = metricsArray.map((item) => ({
      id: item.id || `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category: item.category,
      value: item.value,
      percentage: Number(item.percentage || 0),
    }));
    writeJSONDB(data);
    return data.demographicMetrics;
  },

  // --- Analysis Results Operations ---
  getLatestAnalysisResult: async () => {
    if (!useFallback && prisma) {
      try {
        const results = await prisma.analysisResult.findMany({
          orderBy: { createdAt: "desc" },
          take: 1,
        });
        return results[0] || null;
      } catch (err) {
        console.error("Prisma error in getLatestAnalysisResult, using JSON fallback:", err);
      }
    }
    const data = readJSONDB();
    if (data.analysisResults.length === 0) return null;
    return data.analysisResults.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  },

  saveAnalysisResult: async (resultData: any) => {
    if (!useFallback && prisma) {
      try {
        return await prisma.analysisResult.create({
          data: {
            winningHooks: resultData.winningHooks,
            winningTopics: resultData.winningTopics,
            recommendations: resultData.recommendations,
            suggestedHooks: resultData.suggestedHooks || [],
          },
        });
      } catch (err) {
        console.error("Prisma error in saveAnalysisResult, using JSON fallback:", err);
      }
    }
    const data = readJSONDB();
    const newResult = {
      id: `analysis_${Date.now()}`,
      winningHooks: resultData.winningHooks,
      winningTopics: resultData.winningTopics,
      recommendations: resultData.recommendations,
      suggestedHooks: resultData.suggestedHooks || [],
      createdAt: new Date().toISOString(),
    };
    data.analysisResults.push(newResult);
    writeJSONDB(data);
    return newResult;
  },

  // --- Clear Database Operations ---
  clearAll: async () => {
    if (!useFallback && prisma) {
      try {
        await prisma.post.deleteMany({});
        await prisma.dailyMetric.deleteMany({});
        await prisma.followerMetric.deleteMany({});
        await prisma.demographicMetric.deleteMany({});
        await prisma.analysisResult.deleteMany({});
        return true;
      } catch (err) {
        console.error("Prisma error in clearAll, using JSON fallback:", err);
      }
    }
    const initialData: DBData = {
      posts: [],
      dailyMetrics: [],
      followerMetrics: [],
      demographicMetrics: [],
      analysisResults: [],
    };
    writeJSONDB(initialData);
    return true;
  },
};
