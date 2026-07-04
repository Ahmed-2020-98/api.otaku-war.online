const NodeCache = require("node-cache");

/**
 * Centralized cache service for the application
 * Uses in-memory caching to reduce database load
 */

// User cache - for JWT authentication (1 hour TTL)
const userCache = new NodeCache({
  stdTTL: 3600, // 1 hour
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false, // Better performance, don't clone objects
  maxKeys: 1000,
});

// Category cache - categories change rarely (30 minutes TTL)
const categoryCache = new NodeCache({
  stdTTL: 1800, // 30 minutes
  checkperiod: 300,
  useClones: false,
  maxKeys: 1000,
});

// Question cache - for game generation (10 minutes TTL)
const questionCache = new NodeCache({
  stdTTL: 600, // 10 minutes
  checkperiod: 120,
  useClones: false,
  maxKeys: 1000,
});

// Credit package cache - rarely changes (1 hour TTL)
const creditPackageCache = new NodeCache({
  stdTTL: 3600, // 1 hour
  checkperiod: 600,
  useClones: false,
  maxKeys: 1000,
});

// Discount code cache - for validation (5 minutes TTL)
const discountCodeCache = new NodeCache({
  stdTTL: 300, // 5 minutes
  checkperiod: 60,
  useClones: false,
  maxKeys: 1000,
});

/**
 * Get or set cache with a fallback function
 * @param {NodeCache} cache - The cache instance to use
 * @param {string} key - Cache key
 * @param {Function} fallbackFn - Async function to get data if cache miss
 * @param {number} ttl - Optional custom TTL in seconds
 * @returns {Promise<any>} Cached or fresh data
 */
const getOrSet = async (cache, key, fallbackFn, ttl = null) => {
  const cachedData = cache.get(key);
  if (cachedData !== undefined) {
    return cachedData;
  }

  try {
    const freshData = await fallbackFn();
    if (ttl) {
      cache.set(key, freshData, ttl);
    } else {
      cache.set(key, freshData);
    }
    return freshData;
  } catch (error) {
    console.error(`Cache fetch error for key ${key}:`, error);
    throw error; // Re-throw to let caller handle
  }
};

/**
 * Invalidate specific cache keys
 */
const invalidate = {
  user: (userId) => userCache.del(`user:${userId}`),
  allUsers: () => userCache.flushAll(),

  category: (categoryId) => {
    categoryCache.del(`category:${categoryId}`);
    categoryCache.del("categories:all");
  },
  allCategories: () => categoryCache.flushAll(),

  question: (questionId) => questionCache.del(`question:${questionId}`),
  questionsByCategory: (categoryId) => {
    const keys = questionCache.keys();
    keys.forEach((key) => {
      if (key.includes(`category:${categoryId}`)) {
        questionCache.del(key);
      }
    });
  },
  allQuestions: () => questionCache.flushAll(),

  creditPackage: (packageId) => {
    creditPackageCache.del(`package:${packageId}`);
    creditPackageCache.del("packages:all");
  },
  allCreditPackages: () => creditPackageCache.flushAll(),

  discountCode: (code) => discountCodeCache.del(`discount:${code}`),
  allDiscountCodes: () => discountCodeCache.flushAll(),
};

/**
 * Get cache statistics for monitoring
 */
const getStats = () => ({
  user: userCache.getStats(),
  category: categoryCache.getStats(),
  question: questionCache.getStats(),
  creditPackage: creditPackageCache.getStats(),
  discountCode: discountCodeCache.getStats(),
});

module.exports = {
  userCache,
  categoryCache,
  questionCache,
  creditPackageCache,
  discountCodeCache,
  getOrSet,
  invalidate,
  getStats,
};
