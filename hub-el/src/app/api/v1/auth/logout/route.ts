import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Với JWT Stateless, client xóa token khỏi Secure Storage là hoàn tất đăng xuất.
    // Nếu có blacklist trong tương lai, có thể ghi token vào blacklist ở đây.
    return NextResponse.json({
      success: true,
      message: "Đăng xuất thành công.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error.message || "Lỗi khi đăng xuất.",
        },
      },
      { status: 500 }
    );
  }
}

