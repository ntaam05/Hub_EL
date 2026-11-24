import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Mở rộng kiểu dữ liệu Session để TypeScript biết 
   * rằng session.user có thêm các trường này.
   */
  interface Session {
    user: {
      id: string;
      freeCoins: number;
      aiTokens: number;
      currentStreak: number;
      level: number;
      xp: number;
      streakFreezes: number;
    } & DefaultSession["user"]
  }

  /**
   * Mở rộng kiểu dữ liệu User (dữ liệu từ DB)
   */
  interface User {
    freeCoins?: number;
    aiTokens?: number;
    currentStreak?: number;
    level?: number;
    xp?: number;
    streakFreezes?: number;
  }
}