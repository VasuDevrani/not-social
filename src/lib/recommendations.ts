import prisma from "./prisma";
import { UserData } from "./types";

export interface RecommendationResult {
  user: UserData;
  score: number;
  reason: string;
}

export interface BasicUserQueryResult {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
  followers_count: string;
  posts_count: string;
}

export interface FriendsOfFriendsResult extends BasicUserQueryResult {
  mutual_friends: string;
}

export interface SimilarInterestsResult extends BasicUserQueryResult {
  common_interactions: string;
}

export interface RecentlyActiveResult extends BasicUserQueryResult {
  recent_posts: string;
  last_post: Date;
}

export class UserRecommendationService {
  /**
   * Get personalized user recommendations based on multiple strategies
   */
  static async getRecommendations(
    userId: string, 
    limit: number = 10
  ): Promise<RecommendationResult[]> {
    const recommendations = new Map<string, RecommendationResult>();

    // Strategy 1: Friends of Friends
    const friendsOfFriends = await this.getFriendsOfFriends(userId, limit);
    friendsOfFriends.forEach(rec => recommendations.set(rec.user.id, rec));

    // Strategy 2: Similar Interests (based on likes/comments)
    const similarInterests = await this.getSimilarInterests(userId, limit);
    similarInterests.forEach(rec => {
      const existing = recommendations.get(rec.user.id);
      if (existing) {
        existing.score += rec.score;
        existing.reason += `, ${rec.reason}`;
      } else {
        recommendations.set(rec.user.id, rec);
      }
    });

    // Strategy 3: Popular Users (high follower count)
    const popularUsers = await this.getPopularUsers(userId, limit);
    popularUsers.forEach(rec => {
      const existing = recommendations.get(rec.user.id);
      if (existing) {
        existing.score += rec.score * 0.3; // Lower weight for popularity
      } else {
        recommendations.set(rec.user.id, { ...rec, score: rec.score * 0.3 });
      }
    });

    // Strategy 4: Recently Active Users
    const recentlyActive = await this.getRecentlyActiveUsers(userId, limit);
    recentlyActive.forEach(rec => {
      const existing = recommendations.get(rec.user.id);
      if (existing) {
        existing.score += rec.score * 0.2;
      } else {
        recommendations.set(rec.user.id, { ...rec, score: rec.score * 0.2 });
      }
    });

    // Convert to array, sort by score, and return top results
    return Array.from(recommendations.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Strategy 1: Friends of Friends recommendation
   */
  private static async getFriendsOfFriends(
    userId: string, 
    limit: number
  ): Promise<RecommendationResult[]> {
    const friendsOfFriends = await prisma.$queryRaw<FriendsOfFriendsResult[]>`
      SELECT 
        u.id,
        u.username,
        u."displayName",
        u."avatarUrl",
        u.bio,
        u."createdAt",
        COUNT(DISTINCT f2."followerId") as mutual_friends,
        COALESCE(fc.followers_count, 0) as followers_count,
        COALESCE(pc.posts_count, 0) as posts_count
      FROM users u
      JOIN follows f2 ON f2."followingId" = u.id
      JOIN follows f1 ON f1."followingId" = f2."followerId" AND f1."followerId" = ${userId}
      LEFT JOIN (
        SELECT "followingId", COUNT(*) as followers_count 
        FROM follows 
        GROUP BY "followingId"
      ) fc ON fc."followingId" = u.id
      LEFT JOIN (
        SELECT "userId", COUNT(*) as posts_count 
        FROM posts 
        GROUP BY "userId"
      ) pc ON pc."userId" = u.id
      WHERE u.id != ${userId}
        AND NOT EXISTS (
          SELECT 1 FROM follows f3 
          WHERE f3."followerId" = ${userId} AND f3."followingId" = u.id
        )
      GROUP BY u.id, u.username, u."displayName", u."avatarUrl", u.bio, u."createdAt", fc.followers_count, pc.posts_count
      ORDER BY mutual_friends DESC, followers_count DESC
      LIMIT ${limit}
    `;

    return friendsOfFriends.map(user => ({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        createdAt: user.createdAt,
        followers: [],
        _count: {
          posts: parseInt(user.posts_count) || 0,
          followers: parseInt(user.followers_count) || 0,
        },
      },
      score: parseInt(user.mutual_friends) * 2,
      reason: `${user.mutual_friends} mutual connections`,
    }));
  }

  /**
   * Strategy 2: Similar Interests based on likes and comments
   */
  private static async getSimilarInterests(
    userId: string, 
    limit: number
  ): Promise<RecommendationResult[]> {
    const similarUsers = await prisma.$queryRaw<SimilarInterestsResult[]>`
      SELECT 
        u.id,
        u.username,
        u."displayName",
        u."avatarUrl",
        u.bio,
        u."createdAt",
        COUNT(DISTINCT p.id) as common_interactions,
        COALESCE(fc.followers_count, 0) as followers_count,
        COALESCE(pc.posts_count, 0) as posts_count
      FROM users u
      JOIN (
        -- Users who liked the same posts
        SELECT DISTINCT l2."userId"
        FROM likes l1
        JOIN likes l2 ON l1."postId" = l2."postId"
        WHERE l1."userId" = ${userId} AND l2."userId" != ${userId}
        
        UNION
        
        -- Users who commented on the same posts
        SELECT DISTINCT c2."userId"
        FROM comments c1
        JOIN comments c2 ON c1."postId" = c2."postId"
        WHERE c1."userId" = ${userId} AND c2."userId" != ${userId}
      ) similar_users ON similar_users."userId" = u.id
      JOIN posts p ON (
        EXISTS (SELECT 1 FROM likes l WHERE l."userId" = ${userId} AND l."postId" = p.id) OR
        EXISTS (SELECT 1 FROM comments c WHERE c."userId" = ${userId} AND c."postId" = p.id)
      ) AND (
        EXISTS (SELECT 1 FROM likes l WHERE l."userId" = u.id AND l."postId" = p.id) OR
        EXISTS (SELECT 1 FROM comments c WHERE c."userId" = u.id AND c."postId" = p.id)
      )
      LEFT JOIN (
        SELECT "followingId", COUNT(*) as followers_count 
        FROM follows 
        GROUP BY "followingId"
      ) fc ON fc."followingId" = u.id
      LEFT JOIN (
        SELECT "userId", COUNT(*) as posts_count 
        FROM posts 
        GROUP BY "userId"
      ) pc ON pc."userId" = u.id
      WHERE NOT EXISTS (
        SELECT 1 FROM follows f 
        WHERE f."followerId" = ${userId} AND f."followingId" = u.id
      )
      GROUP BY u.id, u.username, u."displayName", u."avatarUrl", u.bio, u."createdAt", fc.followers_count, pc.posts_count
      ORDER BY common_interactions DESC
      LIMIT ${limit}
    `;

    return similarUsers.map(user => ({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        createdAt: user.createdAt,
        followers: [],
        _count: {
          posts: parseInt(user.posts_count) || 0,
          followers: parseInt(user.followers_count) || 0,
        },
      },
      score: parseInt(user.common_interactions) * 1.5,
      reason: 'Similar interests',
    }));
  }

  /**
   * Strategy 3: Popular Users
   */
  private static async getPopularUsers(
    userId: string, 
    limit: number
  ): Promise<RecommendationResult[]> {
    const popularUsers = await prisma.user.findMany({
      where: {
        id: { not: userId },
        followers: {
          none: { followerId: userId }
        }
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            posts: true,
          }
        }
      },
      orderBy: {
        followers: { _count: 'desc' }
      },
      take: limit,
    });

    return popularUsers
      .filter(user => user._count.followers > 10) // Only suggest users with some following
      .map(user => ({
        user: {
          ...user,
          followers: [],
        },
        score: Math.log(user._count.followers + 1), // Logarithmic scoring
        reason: 'Popular user',
      }));
  }

  /**
   * Strategy 4: Recently Active Users
   */
  private static async getRecentlyActiveUsers(
    userId: string, 
    limit: number
  ): Promise<RecommendationResult[]> {
    const recentlyActive = await prisma.$queryRaw<RecentlyActiveResult[]>`
      SELECT 
        u.id,
        u.username,
        u."displayName",
        u."avatarUrl",
        u.bio,
        u."createdAt",
        MAX(p."createdAt") as last_post,
        COUNT(p.id) as recent_posts,
        COALESCE(fc.followers_count, 0) as followers_count
      FROM users u
      JOIN posts p ON p."userId" = u.id
      LEFT JOIN (
        SELECT "followingId", COUNT(*) as followers_count 
        FROM follows 
        GROUP BY "followingId"
      ) fc ON fc."followingId" = u.id
      WHERE u.id != ${userId}
        AND p."createdAt" > NOW() - INTERVAL '7 days'
        AND NOT EXISTS (
          SELECT 1 FROM follows f 
          WHERE f."followerId" = ${userId} AND f."followingId" = u.id
        )
      GROUP BY u.id, u.username, u."displayName", u."avatarUrl", u.bio, u."createdAt", fc.followers_count
      ORDER BY last_post DESC, recent_posts DESC
      LIMIT ${limit}
    `;

    return recentlyActive.map(user => ({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        createdAt: user.createdAt,
        followers: [],
        _count: {
          posts: parseInt(user.recent_posts) || 0,
          followers: parseInt(user.followers_count) || 0,
        },
      },
      score: parseInt(user.recent_posts),
      reason: 'Recently active',
    }));
  }
}
