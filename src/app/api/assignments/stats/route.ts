// Assignments Stats API Route - GET /api/assignments/stats
import { NextRequest, NextResponse } from "next/server";
import { getAssignmentStats } from "@/api/assignments";

// GET /api/assignments/stats - 할당 통계 조회
export async function GET(request: NextRequest) {
  try {
    const result = await getAssignmentStats();

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Assignment Stats API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
