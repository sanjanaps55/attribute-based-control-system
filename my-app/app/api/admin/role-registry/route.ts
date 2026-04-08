import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type TeacherRegistryItem = {
  id: string;
  email: string;
  role: "teacher";
  updated_at: string;
  course_codes: string[];
};

type UserRegistryItem = {
  id: string;
  email: string;
  role: "user";
  updated_at: string;
  year: string;
  department: string;
  course_codes: string[];
};

export async function GET(request: Request) {
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
    return NextResponse.json({ error: "Only admin can access role registry." }, { status: 403 });
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: teacherProfiles, error: teacherProfilesError } = await adminClient
    .from("profiles")
    .select("id,email,role,updated_at")
    .eq("role", "teacher")
    .order("updated_at", { ascending: false });

  if (teacherProfilesError) {
    return NextResponse.json({ error: teacherProfilesError.message }, { status: 400 });
  }

  const { data: userProfiles, error: userProfilesError } = await adminClient
    .from("profiles")
    .select("id,email,role,updated_at")
    .eq("role", "user")
    .order("updated_at", { ascending: false });

  if (userProfilesError) {
    return NextResponse.json({ error: userProfilesError.message }, { status: 400 });
  }

  const teacherIds = (teacherProfiles ?? []).map((item) => item.id);
  const userIds = (userProfiles ?? []).map((item) => item.id);

  const { data: teacherAttributes, error: teacherAttributesError } = teacherIds.length
    ? await adminClient
        .from("teacher_attributes")
        .select("user_id,course_codes")
        .in("user_id", teacherIds)
    : { data: [], error: null };

  if (teacherAttributesError) {
    return NextResponse.json({ error: teacherAttributesError.message }, { status: 400 });
  }

  const { data: userAttributes, error: userAttributesError } = userIds.length
    ? await adminClient
        .from("user_attributes")
        .select("user_id,year,department,course_codes")
        .in("user_id", userIds)
    : { data: [], error: null };

  if (userAttributesError) {
    return NextResponse.json({ error: userAttributesError.message }, { status: 400 });
  }

  const teacherAttrMap = new Map(
    (teacherAttributes ?? []).map((item) => [item.user_id, item.course_codes ?? []]),
  );
  const userAttrMap = new Map(
    (userAttributes ?? []).map((item) => [
      item.user_id,
      {
        year: item.year ?? "",
        department: item.department ?? "",
        course_codes: item.course_codes ?? [],
      },
    ]),
  );

  const teachers: TeacherRegistryItem[] = (teacherProfiles ?? []).map((item) => ({
    id: item.id,
    email: item.email,
    role: "teacher",
    updated_at: item.updated_at,
    course_codes: teacherAttrMap.get(item.id) ?? [],
  }));

  const users: UserRegistryItem[] = (userProfiles ?? []).map((item) => {
    const attrs = userAttrMap.get(item.id);
    return {
      id: item.id,
      email: item.email,
      role: "user",
      updated_at: item.updated_at,
      year: attrs?.year ?? "",
      department: attrs?.department ?? "",
      course_codes: attrs?.course_codes ?? [],
    };
  });

  return NextResponse.json({ teachers, users }, { status: 200 });
}
