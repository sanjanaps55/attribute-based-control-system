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

  const actorRole = String(actor.user_metadata?.role ?? actor.app_metadata?.role ?? "").toLowerCase();

  let query = supabaseAdmin
    .from("assignments")
    .select("id,title,course_code,slot,policy,original_file_name,mime_type,created_at,teacher_id")
    .order("created_at", { ascending: false });

  if (actorRole === "teacher") {
    query = query.eq("teacher_id", actor.id);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ assignments: data ?? [] }, { status: 200 });
}
