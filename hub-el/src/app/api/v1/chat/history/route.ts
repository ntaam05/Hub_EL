import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { getChatHistoryService } from "@/services/chat.service";

export async function GET(req: Request) {
  const auth = authenticateApiRequest(req);
  if (auth.errorResponse) return auth.errorResponse;

  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get("targetId");
  const isGroup = searchParams.get("isGroup") === "true";

  if (!targetId) {
    return NextResponse.json(
      { success: false, error: "Thiếu targetId trong query parameters" },
      { status: 400 }
    );
  }

  const limitParam = searchParams.get("limit") || searchParams.get("take");
  const beforeIdParam = searchParams.get("beforeId");
  const beforeParam = searchParams.get("before");
  const skipParam = searchParams.get("skip");

  const limit = limitParam ? parseInt(limitParam) : undefined;
  const beforeId = beforeIdParam ? parseInt(beforeIdParam) : undefined;
  const skip = skipParam ? parseInt(skipParam) : undefined;

  const result = await getChatHistoryService(auth.userId, targetId, isGroup, {
    limit,
    beforeId,
    before: beforeParam || undefined,
    skip,
  });

  return NextResponse.json(result, { status: result.statusCode || (result.success ? 200 : 400) });
}
