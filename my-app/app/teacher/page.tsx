"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { MainContainer, Section } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";
import {
  buildPolicyMetadataJson,
  buildPolicyString,
  inferDepartmentFromCourse,
  SLOT_FROM_ASSIGNED,
} from "@/lib/access-policy";
import { supabase } from "@/lib/supabase/client";
import { useAcademicYears, useCourseSlotOptions, useDepartmentCourseCatalog } from "@/hooks/use-abac-data";

const selectClassName =
  "mt-1 w-full border border-border bg-background px-4 py-3 text-sm focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25";

export default function TeacherPage() {
  const departmentCourseCatalog = useDepartmentCourseCatalog();
  const academicYears = useAcademicYears();
  const courseSlotOptions = useCourseSlotOptions();
  const departments = useMemo(() => Object.keys(departmentCourseCatalog), [departmentCourseCatalog]);

  const [assignedCourses, setAssignedCourses] = useState<string[]>([]);
  const [selectedAssignedCourse, setSelectedAssignedCourse] = useState("");
  const [policyDepartment, setPolicyDepartment] = useState("");
  const [policyYear, setPolicyYear] = useState("");
  const [slotSelectValue, setSlotSelectValue] = useState<string>(SLOT_FROM_ASSIGNED);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [lastUploaded, setLastUploaded] = useState<{
    id: string;
    title: string;
    course_code: string;
    slot: string;
  } | null>(null);
  const [uploadedAssignments, setUploadedAssignments] = useState<
    Array<{ id: string; title: string; course_code: string; slot: string; created_at: string }>
  >([]);

  const loadTeacherContext = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) return;

    const assignmentsRes = await fetch("/api/assignments", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    const assignmentsData = (await assignmentsRes.json()) as {
      assignments?: Array<{ id: string; title: string; course_code: string; slot: string; created_at: string }>;
      error?: string;
    };
    if (assignmentsRes.ok && Array.isArray(assignmentsData.assignments)) {
      setUploadedAssignments(assignmentsData.assignments);
    }

    const contextRes = await fetch("/api/teacher/context", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    const contextData = (await contextRes.json()) as { assignedCourses?: string[] };
    const courseCodes = contextData.assignedCourses ?? [];
    setAssignedCourses(courseCodes);
    if (courseCodes.length) {
      const first = courseCodes[0];
      setSelectedAssignedCourse(first);
      const base = first.replace(/\s\[[^\]]+\]$/, "");
      setPolicyDepartment(inferDepartmentFromCourse(base, departmentCourseCatalog));
    }
  }, [departmentCourseCatalog]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadTeacherContext();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadTeacherContext]);

  const slotFromCourse = useMemo(() => {
    const match = selectedAssignedCourse.match(/\[(.+)\]$/);
    return match ? match[1] : "";
  }, [selectedAssignedCourse]);

  const prettyCourseName = useMemo(
    () => selectedAssignedCourse.replace(/\s\[[^\]]+\]$/, ""),
    [selectedAssignedCourse],
  );

  const effectiveSlot =
    slotSelectValue === SLOT_FROM_ASSIGNED ? slotFromCourse : slotSelectValue;

  const policyFields = useMemo(() => {
    if (!selectedAssignedCourse || !policyDepartment || !policyYear || !effectiveSlot) {
      return null;
    }
    return {
      role: "user" as const,
      department: policyDepartment,
      year: policyYear,
      course: prettyCourseName,
      slot: effectiveSlot,
    };
  }, [selectedAssignedCourse, policyDepartment, policyYear, prettyCourseName, effectiveSlot]);

  const computedPolicy = useMemo(() => {
    if (!policyFields) return "";
    return buildPolicyString(policyFields);
  }, [policyFields]);

  const policyMetadataJson = useMemo(() => {
    if (!policyFields) return "";
    return buildPolicyMetadataJson(policyFields);
  }, [policyFields]);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setUploadStatus("idle");
    setLastUploaded(null);

    if (!file) {
      setMessage("Please choose a file to upload.");
      setUploadStatus("error");
      return;
    }

    if (!policyFields || !computedPolicy) {
      setMessage(
        "Set access policy: choose department and year (same values admin used for students), and a slot.",
      );
      setUploadStatus("error");
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setMessage("Please login again.");
      setUploadStatus("error");
      return;
    }

    const titleSnapshot = title.trim();
    setUploadStatus("uploading");

    const formData = new FormData();
    formData.append("title", titleSnapshot);
    formData.append("courseCode", prettyCourseName);
    formData.append("slot", effectiveSlot);
    formData.append("policy", computedPolicy);
    formData.append("file", file);

    const response = await fetch("/api/teacher/upload-assignment", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    const data = (await response.json()) as { assignmentId?: string; error?: string };
    if (!response.ok) {
      setMessage(data.error ?? "Upload failed.");
      setUploadStatus("error");
      return;
    }

    const assignmentId = data.assignmentId ?? "";
    const createdAt = new Date().toISOString();
    setLastUploaded({
      id: assignmentId,
      title: titleSnapshot,
      course_code: prettyCourseName,
      slot: effectiveSlot,
    });
    setUploadedAssignments((prev) => {
      const next = [
        {
          id: assignmentId,
          title: titleSnapshot,
          course_code: prettyCourseName,
          slot: effectiveSlot,
          created_at: createdAt,
        },
        ...prev.filter((row) => row.id !== assignmentId),
      ];
      return next;
    });
    setMessage(null);
    setUploadStatus("success");
    setTitle("");
    setFile(null);
    await loadTeacherContext();
  }

  return (
    <main className="min-h-screen bg-background">
      <MainContainer>
        <Section>
          <SectionLabel>Teacher Dashboard</SectionLabel>
          <div className="mt-10 max-w-3xl">
            <h1 className="font-serif text-5xl leading-tight md:text-6xl">Teacher Workspace</h1>
          </div>

          <Card variant="featured" className="mt-10 max-w-2xl">
            <p className="small-caps-label">Teacher Attributes</p>
            <p className="mt-4 text-muted-foreground">
              Upload assignment files under a specific assigned course and slot.
            </p>
            <div className="mt-4">
              <Button variant="secondary" onClick={() => void loadTeacherContext()}>
                Refresh Assigned Courses
              </Button>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {assignedCourses.length ? (
                assignedCourses.map((course) => (
                  <span key={course} className="small-caps-label border border-border bg-muted px-3 py-1.5 text-foreground">
                    {course}
                  </span>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No assigned courses found in your account metadata yet.
                </p>
              )}
            </div>
          </Card>

          <Card variant="elevated" className="mt-10 max-w-3xl">
            <p className="small-caps-label">Upload Assignment</p>
            <form className="mt-4 space-y-4" onSubmit={handleUpload}>
              <div>
                <label htmlFor="assignedCourse" className="small-caps-label">
                  Assigned Course
                </label>
                <select
                  id="assignedCourse"
                  value={selectedAssignedCourse}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedAssignedCourse(value);
                    const base = value.replace(/\s\[[^\]]+\]$/, "");
                    setPolicyDepartment(inferDepartmentFromCourse(base, departmentCourseCatalog));
                  }}
                  className={selectClassName}
                  required
                >
                  {!assignedCourses.length ? <option value="">No assigned courses</option> : null}
                  {assignedCourses.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="slotPolicy" className="small-caps-label">
                  Slot (policy)
                </label>
                <select
                  id="slotPolicy"
                  value={slotSelectValue}
                  onChange={(event) => setSlotSelectValue(event.target.value)}
                  className={selectClassName}
                >
                  <option value={SLOT_FROM_ASSIGNED}>
                    From assigned course{slotFromCourse ? ` (${slotFromCourse})` : ""}
                  </option>
                  {courseSlotOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Students must have this exact slot on their account to decrypt (match admin course codes).
                </p>
              </div>

              <div>
                <label htmlFor="policyDepartment" className="small-caps-label">
                  Department (policy)
                </label>
                <select
                  id="policyDepartment"
                  value={policyDepartment}
                  onChange={(event) => setPolicyDepartment(event.target.value)}
                  className={selectClassName}
                  required
                >
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="policyYear" className="small-caps-label">
                  Year (policy)
                </label>
                <select
                  id="policyYear"
                  value={policyYear}
                  onChange={(event) => setPolicyYear(event.target.value)}
                  className={selectClassName}
                  required
                >
                  <option value="">Select year</option>
                  {academicYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Use the same year label the admin selected when creating the student account.
                </p>
              </div>

              <div>
                <label htmlFor="title" className="small-caps-label">
                  Assignment Title
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Assignment 3 - Secure Hashing"
                  required
                />
              </div>

              <div>
                <label htmlFor="policy" className="small-caps-label">
                  Access policy (ABE string)
                </label>
                <Input id="policy" value={computedPolicy} readOnly placeholder="Pick department, year, and slot…" />
              </div>

              <div>
                <label htmlFor="policyMetadata" className="small-caps-label">
                  Policy metadata (JSON)
                </label>
                <textarea
                  id="policyMetadata"
                  readOnly
                  rows={8}
                  value={policyMetadataJson || "{}"}
                  className="mt-1 w-full resize-y border border-border bg-muted/30 px-4 py-3 font-mono text-xs text-foreground focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
                />
              </div>

              <div>
                <label htmlFor="file" className="small-caps-label">
                  Assignment File
                </label>
                <Input
                  id="file"
                  type="file"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={
                  uploadStatus === "uploading" ||
                  !assignedCourses.length ||
                  !policyFields ||
                  !selectedAssignedCourse ||
                  !policyDepartment ||
                  !policyYear
                }
              >
                {uploadStatus === "uploading" ? "Uploading…" : "Upload Assignment"}
              </Button>
              {message ? (
                <p className="text-sm text-destructive" role="alert">
                  {message}
                </p>
              ) : null}
            </form>
          </Card>

          {uploadStatus === "success" && lastUploaded ? (
            <div
              className="mt-6 max-w-3xl rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-emerald-950 dark:border-emerald-400/35 dark:bg-emerald-500/15 dark:text-emerald-100"
              role="status"
              aria-live="polite"
            >
              <p className="text-sm font-medium">Assignment uploaded</p>
              <p className="mt-1 text-sm opacity-90">
                <span className="font-medium">{lastUploaded.title}</span>
                {" · "}
                {lastUploaded.course_code} ({lastUploaded.slot})
              </p>
              <p className="mt-1 font-mono text-xs opacity-80">ID: {lastUploaded.id}</p>
              <p className="mt-2 text-xs opacity-80">It now appears in your list below.</p>
            </div>
          ) : null}

          <Card variant="elevated" className="mt-10 max-w-3xl">
            <p className="small-caps-label">Uploaded Assignments</p>
            {uploadedAssignments.length ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {uploadedAssignments.length} file{uploadedAssignments.length === 1 ? "" : "s"} on record.
              </p>
            ) : null}
            <div className="mt-4 space-y-3">
              {uploadedAssignments.map((item) => (
                <div
                  key={item.id}
                  className={`border-b border-border pb-3 last:border-b-0 ${
                    lastUploaded?.id === item.id ? "rounded-md border border-accent/40 bg-accent/5 px-3 py-2" : ""
                  }`}
                >
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.course_code} ({item.slot}) · {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
              {!uploadedAssignments.length ? (
                <p className="text-sm text-muted-foreground">No uploads yet.</p>
              ) : null}
            </div>
          </Card>

          <div className="mt-12">
            <Link href="/">
              <Button variant="ghost" className="px-0 py-0">
                Return home
              </Button>
            </Link>
          </div>
        </Section>
      </MainContainer>
    </main>
  );
}
