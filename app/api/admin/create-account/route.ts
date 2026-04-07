import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { AdminCreateAccountPayload, AppRole } from "@/types/auth";

export const runtime = "nodejs";

function isRole(value: string): value is AppRole {
  return value === "admin" || value === "teacher" || value === "user";
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: "Missing Supabase server environment variables." },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing access token." }, { status: 401 });
  }

  const accessToken = authHeader.replace("Bearer ", "");

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  const {
    data: { user: actor },
    error: actorError,
  } = await authClient.auth.getUser();

  if (actorError || !actor) {
    return NextResponse.json({ error: "Unauthorized request." }, { status: 401 });
  }

  const actorRole = String(actor.user_metadata?.role ?? actor.app_metadata?.role ?? "").toLowerCase();
  if (actorRole !== "admin") {
    return NextResponse.json({ error: "Only admin can create accounts." }, { status: 403 });
  }

  const payload = (await request.json()) as AdminCreateAccountPayload;
  const normalizedEmail = payload.email?.trim().toLowerCase();

  if (!normalizedEmail || !payload.password || !isRole(payload.role)) {
    return NextResponse.json({ error: "Invalid account payload." }, { status: 400 });
  }

  if (payload.role === "teacher" && !payload.teacherAttributes?.courseCodes?.length) {
    return NextResponse.json(
      { error: "Teacher must include at least one course code." },
      { status: 400 },
    );
  }

  if (
    payload.role === "user" &&
    (!payload.userAttributes?.year ||
      !payload.userAttributes?.department ||
      !payload.userAttributes?.courseCodes?.length)
  ) {
    return NextResponse.json(
      { error: "User must include year, department, and course codes." },
      { status: 400 },
    );
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data, error } = await adminClient.auth.admin.createUser({
    email: normalizedEmail,
    password: payload.password,
    email_confirm: true,
    user_metadata: {
      role: payload.role,
      attributes:
        payload.role === "teacher"
          ? { courseCodes: payload.teacherAttributes?.courseCodes ?? [] }
          : payload.role === "user"
            ? {
                year: payload.userAttributes?.year ?? "",
                department: payload.userAttributes?.department ?? "",
                courseCodes: payload.userAttributes?.courseCodes ?? [],
              }
            : {},
    },
  });

  if (error) {
    return NextResponse.json({ error: `auth_create_failed: ${error.message}` }, { status: 400 });
  }

  const createdUserId = data.user?.id;
  const createdEmail = data.user?.email;

  if (!createdUserId || !createdEmail) {
    return NextResponse.json(
      { error: "auth_created_but_missing_user_fields" },
      { status: 500 },
    );
  }

  async function rollbackWithError(message: string, status = 400) {
    await adminClient.auth.admin.deleteUser(createdUserId);
    return NextResponse.json({ error: message }, { status });
  }

  const { error: profileError } = await adminClient.from("profiles").upsert(
    {
      id: createdUserId,
      email: createdEmail.toLowerCase(),
      role: payload.role,
      created_by: actor.id,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    return rollbackWithError(`profiles_upsert_failed: ${profileError.message}`);
  }

  if (payload.role === "teacher") {
    const { error: teacherAttrError } = await adminClient.from("teacher_attributes").upsert(
      {
        user_id: createdUserId,
        course_codes: payload.teacherAttributes?.courseCodes ?? [],
      },
      { onConflict: "user_id" },
    );

    if (teacherAttrError) {
      return rollbackWithError(`teacher_attributes_upsert_failed: ${teacherAttrError.message}`);
    }
  }

  if (payload.role === "user") {
    const { error: userAttrError } = await adminClient.from("user_attributes").upsert(
      {
        user_id: createdUserId,
        year: payload.userAttributes?.year ?? "",
        department: payload.userAttributes?.department ?? "",
        course_codes: payload.userAttributes?.courseCodes ?? [],
      },
      { onConflict: "user_id" },
    );

    if (userAttrError) {
      return rollbackWithError(`user_attributes_upsert_failed: ${userAttrError.message}`);
    }
  }

  return NextResponse.json({ userId: createdUserId }, { status: 200 });
}
