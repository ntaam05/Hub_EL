import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

export type AuthApiResult =
  | { userId: string; errorResponse: null }
  | { userId: null; errorResponse: NextResponse };

export function authenticateApiRequest(req: Request): AuthApiResult {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      userId: null,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Thiếu Bearer Token trong Authorization Header!",
          },
        },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.substring(7).trim();
  try {
    const decoded: any = verifyToken(token);
    if (!decoded || !decoded.id) {
      return {
        userId: null,
        errorResponse: NextResponse.json(
          {
            success: false,
            error: {
            code: "INVALID_TOKEN",
            message: "Token không chứa định danh người dùng hợp lệ!",
          },
        },
        { status: 401 }
      ),
    };
  }
    return { userId: decoded.id, errorResponse: null };
  } catch (err: any) {
    const isExpired = err.message === "TOKEN_EXPIRED";
    return {
      userId: null,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: {
            code: isExpired ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
            message: isExpired
              ? "Phiên đăng nhập đã hết hạn!"
              : "Token xác thực không hợp lệ!",
          },
        },
        { status: 401 }
      ),
    };
  }
}
