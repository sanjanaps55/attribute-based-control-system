import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { accessFlow } from "@/lib/crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type AccessRequest = {
  assignmentId: string;
};

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const userPrivateKey = process.env.ABE_USER_PRIVATE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Missing Supabase env." }, { status: 500 });
  }

  if (!userPrivateKey) {
    return NextResponse.json({ error: "ABE_USER_PRIVATE_KEY is not configured." }, { status: 500 });
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

  const body = (await request.json()) as AccessRequest;
  if (!body.assignmentId) {
    return NextResponse.json({ error: "Missing assignmentId." }, { status: 400 });
  }

  const { data: assignment, error } = await supabaseAdmin
    .from("assignments")
    .select("ciphertext_base64,encrypted_key,nonce_base64,auth_tag_base64,original_file_name,mime_type")
    .eq("id", body.assignmentId)
    .single();

  if (error || !assignment) {
    return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
  }

  try {
    const plaintext = await accessFlow(
      {
        ciphertext: assignment.ciphertext_base64,
        encrypted_key: assignment.encrypted_key,
        nonce: assignment.nonce_base64,
        auth_tag: assignment.auth_tag_base64,
      },
      userPrivateKey,
    );

    return NextResponse.json(
      {
        fileName: assignment.original_file_name,
        mimeType: assignment.mime_type,
        fileBase64: Buffer.from(plaintext).toString("base64"),
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }
}
