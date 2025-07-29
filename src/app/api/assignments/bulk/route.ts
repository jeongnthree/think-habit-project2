// Assignments Bulk API Route - POST /api/assignments/bulk
import { NextRequest, NextResponse } from "next/server";
import { createBulkAssignments } from "@/api/assignments";
import { BulkAssignmentRequest } from "@/types";

// POST /api/assignments/bulk - 대량 할당 생성
export async function POST(request: NextRequest) {
  try {
    const body: BulkAssignmentRequest = await request.json();

    // 기본 유효성 검사
    if (
      !body.student_ids ||
      !Array.isArray(body.student_ids) ||
      body.student_ids.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: "student_ids array is required" },
        { status: 400 }
      );
    }

    if (
      !body.category_ids ||
      !Array.isArray(body.category_ids) ||
      body.category_ids.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: "category_ids array is required" },
        { status: 400 }
      );
    }

    if (!body.weekly_goal || !body.start_date) {
      return NextResponse.json(
        { success: false, error: "weekly_goal and start_date are required" },
        { status: 400 }
      );
    }

    const result = await createBulkAssignments(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Bulk Assignments API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
