import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Missing Supabase env." }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing access token." }, { status: 401 });
  }
  const accessToken = authHeader.replace("Bearer ", "");

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const {
    data: { user: actor },
    error: actorError,
  } = await authClient.auth.getUser();
  if (actorError || !actor) {
    return NextResponse.json({ error: "Unauthorized request." }, { status: 401 });
  }

  const role = String(actor.user_metadata?.role ?? actor.app_metadata?.role ?? "").toLowerCase();
  if (role !== "teacher") {
    return NextResponse.json({ error: "Only teacher can access this endpoint." }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("teacher_attributes")
    .select("course_codes")
    .eq("user_id", actor.id)
    .single();

  if (error) {
    return NextResponse.json({ assignedCourses: [] }, { status: 200 });
  }

  return NextResponse.json({ assignedCourses: data.course_codes ?? [] }, { status: 200 });
}
