// Categories Stats API Route - GET /api/categories/stats
import { NextRequest, NextResponse } from "next/server";
import { getCategoryStats } from "@/api/categories";

// GET /api/categories/stats - 카테고리 통계 조회
export async function GET(request: NextRequest) {
  try {
    const result = await getCategoryStats();

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Category Stats API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
