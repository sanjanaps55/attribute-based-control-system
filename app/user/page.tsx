"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MainContainer, Section } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";
import { supabase } from "@/lib/supabase/client";

export default function UserPage() {
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<
    Array<{
      id: string;
      title: string;
      course_code: string;
      slot: string;
      policy: string;
      original_file_name: string;
      created_at: string;
    }>
  >([]);

  async function loadAssignments() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) return;

    const response = await fetch("/api/assignments", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    const data = (await response.json()) as {
      assignments?: Array<{
        id: string;
        title: string;
        course_code: string;
        slot: string;
        policy: string;
        original_file_name: string;
        created_at: string;
      }>;
    };
    setAssignments(data.assignments ?? []);
  }

  const filteredAssignments = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return assignments;

    return assignments.filter((assignment) =>
      [
        assignment.title,
        assignment.course_code,
        assignment.slot,
        assignment.policy,
        assignment.original_file_name,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [assignments, query]);

  async function handleAccess(assignmentId: string, fileName: string) {
    setMessage(null);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setMessage("Please login again.");
      return;
    }

    const response = await fetch("/api/assignments/access", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ assignmentId }),
    });

    const data = (await response.json()) as {
      fileName?: string;
      mimeType?: string;
      fileBase64?: string;
      error?: string;
    };

    if (!response.ok || !data.fileBase64) {
      setMessage(data.error ?? "Access Denied");
      return;
    }

    const bytes = Uint8Array.from(atob(data.fileBase64), (char) => char.charCodeAt(0));
    const blob = new Blob([bytes], { type: data.mimeType ?? "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = data.fileName ?? fileName;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("File decrypted and downloaded.");
  }

  return (
    <main className="min-h-screen bg-background">
      <MainContainer>
        <Section>
          <SectionLabel>User Dashboard</SectionLabel>
          <div className="mt-10 max-w-3xl">
            <h1 className="font-serif text-5xl leading-tight md:text-6xl">User Workspace</h1>
          </div>

          <Card variant="featured" className="mt-10 max-w-2xl">
            <p className="small-caps-label">User Attributes</p>
            <p className="mt-4 text-muted-foreground">
              Year, department, and enrolled course codes assigned by admin will appear here after
              backend profile integration.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Attributes are read-only for users. Only admin can create or modify them.
            </p>
          </Card>

          <Card variant="elevated" className="mt-10">
            <p className="small-caps-label">Search Assignments</p>
            <div className="mt-3">
              <Button variant="secondary" onClick={() => void loadAssignments()}>
                Load Assignments
              </Button>
            </div>
            <div className="mt-4">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by title, course, slot, policy..."
              />
            </div>

            <div className="mt-6 space-y-4">
              {filteredAssignments.map((assignment) => (
                <div key={assignment.id} className="border-b border-border pb-4 last:border-b-0">
                  <p className="font-medium">{assignment.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {assignment.course_code} ({assignment.slot}) ·{" "}
                    {new Date(assignment.created_at).toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{assignment.policy}</p>
                  <Button
                    variant="secondary"
                    className="mt-3 px-3 py-1.5 text-xs"
                    onClick={() => handleAccess(assignment.id, assignment.original_file_name)}
                  >
                    Access and Decrypt
                  </Button>
                </div>
              ))}
              {!filteredAssignments.length ? (
                <p className="text-sm text-muted-foreground">No assignments match this search.</p>
              ) : null}
              {message ? <p className="text-sm text-accent">{message}</p> : null}
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
