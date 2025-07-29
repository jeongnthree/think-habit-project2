// Categories Bulk API Route - POST /api/categories/bulk
import { NextRequest, NextResponse } from "next/server";
import { bulkToggleCategories, bulkDeleteCategories } from "@/api/categories";

// POST /api/categories/bulk - 대량 작업
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, categoryIds, isActive } = body;

    if (!action || !categoryIds || !Array.isArray(categoryIds)) {
      return NextResponse.json(
        { success: false, error: "Action and categoryIds are required" },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case "toggle":
        if (typeof isActive !== "boolean") {
          return NextResponse.json(
            { success: false, error: "isActive is required for toggle action" },
            { status: 400 }
          );
        }
        result = await bulkToggleCategories(categoryIds, isActive);
        break;

      case "delete":
        result = await bulkDeleteCategories(categoryIds);
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use "toggle" or "delete"' },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Bulk Categories API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
