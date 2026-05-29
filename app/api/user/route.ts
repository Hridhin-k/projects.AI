import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { invalidateUserProfile } from "@/lib/auth/profile-cache";
import { getDb } from "@/lib/db";
import { mapUser, type User as UserRow } from "@/lib/types/database";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch user";
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { data, error } = await getDb()
      .from("users")
      .update({ name: name.trim(), updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Update failed");
    }

    invalidateUserProfile(user.authUserId);

    return NextResponse.json(mapUser(data as UserRow));
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
