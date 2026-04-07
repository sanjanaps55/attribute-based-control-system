import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { uploadFlow } from "@/lib/crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
  if (actorRole !== "teacher") {
    return NextResponse.json({ error: "Only teacher can upload assignments." }, { status: 403 });
  }

  const formData = await request.formData();
  const title = String(formData.get("title") ?? "").trim();
  const courseCode = String(formData.get("courseCode") ?? "").trim();
  const slot = String(formData.get("slot") ?? "").trim();
  const policy = String(formData.get("policy") ?? "").trim();
  const file = formData.get("file");

  if (!title || !courseCode || !slot || !policy || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing required upload fields." }, { status: 400 });
  }

  const fileBuffer = new Uint8Array(await file.arrayBuffer());
  const encryptedPayload = await uploadFlow(fileBuffer, policy);

  const { data, error } = await supabaseAdmin
    .from("assignments")
    .insert({
      teacher_id: actor.id,
      title,
      course_code: courseCode,
      slot,
      policy,
      original_file_name: file.name,
      mime_type: file.type || "application/octet-stream",
      ciphertext_base64: encryptedPayload.ciphertext,
      encrypted_key: encryptedPayload.encrypted_key,
      nonce_base64: encryptedPayload.nonce,
      auth_tag_base64: encryptedPayload.auth_tag,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ assignmentId: data.id }, { status: 200 });
}
