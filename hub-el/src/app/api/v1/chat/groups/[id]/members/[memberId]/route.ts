import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { removeMemberFromGroupService } from "@/services/chat.service";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const auth = authenticateApiRequest(req);
  if (auth.errorResponse) return auth.errorResponse;

  const { id, memberId } = await params;
  const groupId = parseInt(id);
  if (isNaN(groupId)) {
    return NextResponse.json({ success: false, error: "ID nhóm không hợp lệ" }, { status: 400 });
  }

  const result = await removeMemberFromGroupService(groupId, memberId, auth.userId);
  return NextResponse.json(result, { status: result.statusCode || (result.success ? 200 : 400) });
}

