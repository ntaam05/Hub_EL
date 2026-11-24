import jwt from "jsonwebtoken";

export const getJwtSecret = () =>
  process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "hub-el-secret-key-mobile-jwt-2026";
const ACCESS_TOKEN_EXPIRY = "1h"; // 1 giờ
const REFRESH_TOKEN_EXPIRY = "30d"; // 30 ngày

export interface JwtUserPayload {
  id: string;
  email: string;
  role?: string;
  name?: string | null;
}

export function signAccessToken(payload: JwtUserPayload): string {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      name: payload.name,
      type: "access",
    },
    getJwtSecret(),
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

export function signRefreshToken(payload: JwtUserPayload): string {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      type: "refresh",
    },
    getJwtSecret(),
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      throw new Error("TOKEN_EXPIRED");
    }
    throw new Error("INVALID_TOKEN");
  }
}

