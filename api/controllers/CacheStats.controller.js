const { getStats } = require("../../utils/cacheService");

/**
 * Get cache statistics for monitoring
 * Useful for monitoring cache hit rates and performance
 */
const getCacheStats = async (req, res, next) => {
  try {
    const stats = getStats();

    // Calculate hit rates
    const calculateHitRate = (cacheStats) => {
      const total = cacheStats.hits + cacheStats.misses;
      return total === 0 ? 0 : ((cacheStats.hits / total) * 100).toFixed(2);
    };

    const response = {
      message: "Cache statistics fetched successfully",
      caches: {
        user: {
          ...stats.user,
          hitRate: `${calculateHitRate(stats.user)}%`,
        },
        category: {
          ...stats.category,
          hitRate: `${calculateHitRate(stats.category)}%`,
        },
        question: {
          ...stats.question,
          hitRate: `${calculateHitRate(stats.question)}%`,
        },
        creditPackage: {
          ...stats.creditPackage,
          hitRate: `${calculateHitRate(stats.creditPackage)}%`,
        },
        discountCode: {
          ...stats.discountCode,
          hitRate: `${calculateHitRate(stats.discountCode)}%`,
        },
      },
      summary: {
        totalKeys: Object.values(stats).reduce((sum, cache) => sum + cache.keys, 0),
        totalHits: Object.values(stats).reduce((sum, cache) => sum + cache.hits, 0),
        totalMisses: Object.values(stats).reduce((sum, cache) => sum + cache.misses, 0),
        overallHitRate: (() => {
          const totalHits = Object.values(stats).reduce((sum, cache) => sum + cache.hits, 0);
          const totalMisses = Object.values(stats).reduce((sum, cache) => sum + cache.misses, 0);
          const total = totalHits + totalMisses;
          return total === 0 ? "0.00%" : `${((totalHits / total) * 100).toFixed(2)}%`;
        })(),
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Get cache stats error:", error);
    next(error);
  }
};

module.exports = {
  getCacheStats,
};