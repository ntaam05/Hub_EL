import NextAuth, { CredentialsSignin } from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials" 
import bcrypt from "bcryptjs" 
import { PrismaAdapter } from "@auth/prisma-adapter" 
import { prisma } from "@/lib/prisma"

// 🚨 BƯỚC QUAN TRỌNG: Tạo class Lỗi tùy chỉnh qua mặt NextAuth v5
class CustomAuthError extends CredentialsSignin {
  constructor(msg: string) {
    super();
    this.code = msg; // Thuộc tính code này sẽ được NextAuth truyền thẳng ra Frontend
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  
  session: { strategy: "jwt" }, 

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        },
      },
    }),
    GitHub,
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
           throw new CustomAuthError("Vui lòng nhập đầy đủ thông tin!");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });

        if (!user || !user.password) {
           throw new CustomAuthError("Sai tài khoản hoặc mật khẩu!");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password as string, user.password);
        if (!isPasswordValid) {
           throw new CustomAuthError("Sai tài khoản hoặc mật khẩu!");
        }

        // 🚨 CHỐT CHẶN: Dùng CustomAuthError để ném lỗi ra Frontend
        if (user.role === "BANNED" || user.role === "banned") {
           throw new CustomAuthError("Tài khoản của bạn đã bị khóa!");
        }

        return user;
      }
    })
  ],
  
  callbacks: {
    // CHỐT CHẶN 1: Khóa cửa ngay lúc vừa bấm Đăng nhập (Dùng cho cả Google/Github)
    async signIn({ user, account, profile }) {
      try {
        if (!user?.email) return false;

        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { role: true } 
        });

        if (dbUser?.role === "banned" || dbUser?.role === "BANNED") {
          console.log(`⛔ CHẶN ĐĂNG NHẬP: Tài khoản ${user.email} đã bị khóa!`);
          
          // Mẹo: Nếu đăng nhập bằng Google/Github mà bị ban, nó sẽ đá văng ra trang chủ kèm param lỗi
          return "/?error=banned"; 
        }

        return true; 
      } catch (error) {
        console.error("Lỗi khi check ban user:", error);
        return false;
      }
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.image = user.image;
        
        const u = user as any; 
        token.freeCoins = u.freeCoins ?? 0;
        token.aiTokens = u.aiTokens ?? 0;
        token.currentStreak = u.currentStreak ?? 0;
        token.level = u.level ?? 1;
        token.xp = u.xp ?? 0;
        token.streakFreezes = u.streakFreezes ?? 0;
        token.isPro = u.isPro ?? false;
        token.role = u.role ?? "student"; 
        
        // CHỐT CHẶN 2: Lưu luôn trạng thái ban vào token
        token.status = u.status ?? "ACTIVE";
      }
      
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.image) token.image = session.image;
        return { ...token, ...session };
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        
        if (token.name) session.user.name = token.name as string;
        if (token.image) session.user.image = token.image as string;
        
        const u = session.user as any; 
        u.freeCoins = token.freeCoins;
        u.aiTokens = token.aiTokens;
        u.currentStreak = token.currentStreak;
        u.level = token.level;
        u.xp = token.xp;
        u.streakFreezes = token.streakFreezes;
        u.isPro = token.isPro;
        u.role = token.role; 
        
        // CHỐT CHẶN 2 (Tiếp): Đẩy status ra session để Frontend biết đường đá văng
        u.status = token.status;
      }
      return session;
    },
  },
  trustHost: true,
})