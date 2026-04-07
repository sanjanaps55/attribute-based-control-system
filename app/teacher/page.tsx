"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { MainContainer, Section } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";
import { supabase } from "@/lib/supabase/client";

export default function TeacherPage() {
  const [assignedCourses, setAssignedCourses] = useState<string[]>([]);
  const [selectedAssignedCourse, setSelectedAssignedCourse] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadedAssignments, setUploadedAssignments] = useState<
    Array<{ id: string; title: string; course_code: string; slot: string; created_at: string }>
  >([]);

  async function loadTeacherContext() {
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
    };
    setUploadedAssignments(assignmentsData.assignments ?? []);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const courseCodes = (user?.user_metadata?.attributes?.courseCodes ?? []) as string[];
    setAssignedCourses(courseCodes);
    if (courseCodes.length) {
      setSelectedAssignedCourse(courseCodes[0]);
    }
  }

  const slot = useMemo(() => {
    const match = selectedAssignedCourse.match(/\[(.+)\]$/);
    return match ? match[1] : "";
  }, [selectedAssignedCourse]);

  const prettyCourseName = useMemo(
    () => selectedAssignedCourse.replace(/\s\[[^\]]+\]$/, ""),
    [selectedAssignedCourse],
  );

  const computedPolicy = useMemo(() => {
    if (!selectedAssignedCourse) return "";
    return `role:user AND course:"${prettyCourseName}" AND slot:"${slot}"`;
  }, [selectedAssignedCourse, prettyCourseName, slot]);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!file) {
      setMessage("Please choose a file to upload.");
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setMessage("Please login again.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("courseCode", prettyCourseName);
    formData.append("slot", slot);
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
      return;
    }

    setMessage(`Encrypted upload completed. Assignment ID: ${data.assignmentId}`);
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
                  onChange={(event) => setSelectedAssignedCourse(event.target.value)}
                  className="mt-1 w-full border border-border bg-background px-4 py-3 text-sm focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
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
                <label htmlFor="slot" className="small-caps-label">
                  Slot
                </label>
                <Input id="slot" value={slot} readOnly />
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
                  Access Policy
                </label>
                <Input id="policy" value={computedPolicy} readOnly />
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

              <Button type="submit" variant="primary" disabled={!assignedCourses.length}>
                Upload Assignment
              </Button>
              {message ? <p className="text-sm text-accent">{message}</p> : null}
            </form>
          </Card>

          <Card variant="elevated" className="mt-10 max-w-3xl">
            <p className="small-caps-label">Uploaded Assignments</p>
            <div className="mt-4 space-y-3">
              {uploadedAssignments.map((item) => (
                <div key={item.id} className="border-b border-border pb-3 last:border-b-0">
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
