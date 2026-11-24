import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { leaveChatGroupService } from "@/services/chat.service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateApiRequest(req);
  if (auth.errorResponse) return auth.errorResponse;

  const { id } = await params;
  const groupId = parseInt(id);
  if (isNaN(groupId)) {
    return NextResponse.json({ success: false, error: "ID nhóm không hợp lệ" }, { status: 400 });
  }

  const result = await leaveChatGroupService(groupId, auth.userId);
  return NextResponse.json(result, { status: result.statusCode || (result.success ? 200 : 400) });
}

