"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { MainContainer, Section } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";
import {
  useAdminAccountManager,
  type TeacherRegistryItem,
  type UserRegistryItem,
} from "@/hooks/use-admin-account-manager";
import {
  useAcademicYears,
  useCourseSlotOptions,
  useDepartmentCourseCatalog,
} from "@/hooks/use-abac-data";
import type { AppRole } from "@/types/auth";

export default function AdminPage() {
  const { createAccount, fetchRoleRegistry, loading, error } = useAdminAccountManager();
  const academicYears = useAcademicYears();
  const courseSlotOptions = useCourseSlotOptions();
  const departmentCourseCatalog = useDepartmentCourseCatalog();
  const departments = Object.keys(departmentCourseCatalog);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("user");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(courseSlotOptions[0] ?? "F1+TF1");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [year, setYear] = useState(academicYears[0] ?? "First Year");
  const [department, setDepartment] = useState(departments[0] ?? "Computer Science");
  const [message, setMessage] = useState<string | null>(null);
  const [teachersRegistry, setTeachersRegistry] = useState<TeacherRegistryItem[]>([]);
  const [usersRegistry, setUsersRegistry] = useState<UserRegistryItem[]>([]);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const availableCourses = departmentCourseCatalog[department] ?? [];

  useEffect(() => {
    void (async () => {
      const roles = await fetchRoleRegistry();
      setTeachersRegistry(roles.teachers);
      setUsersRegistry(roles.users);
    })();
  }, [fetchRoleRegistry]);

  async function handleCreateAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const userId = await createAccount({
      email: email.trim().toLowerCase(),
      password,
      role,
      teacherAttributes: role === "teacher" ? { courseCodes: selectedCourses } : undefined,
      userAttributes:
        role === "user"
          ? {
              year,
              department,
              courseCodes: selectedCourses,
            }
          : undefined,
    });

    if (userId) {
      setMessage(`Account and role profile created successfully: ${userId}`);
      setEmail("");
      setPassword("");
      setSelectedCourses([]);
      setSelectedCourse("");
      setSelectedSlot(courseSlotOptions[0] ?? "F1+TF1");
      setYear(academicYears[0] ?? "First Year");
      setDepartment(departments[0] ?? "Computer Science");
      const roles = await fetchRoleRegistry();
      setTeachersRegistry(roles.teachers);
      setUsersRegistry(roles.users);
    }
  }

  const filteredTeachers = teachersRegistry.filter((item) =>
    [item.email, item.course_codes.join(" ")].join(" ").toLowerCase().includes(teacherSearch.toLowerCase()),
  );

  const filteredUsers = usersRegistry.filter((item) =>
    [item.email, item.department, item.year, item.course_codes.join(" ")]
      .join(" ")
      .toLowerCase()
      .includes(userSearch.toLowerCase()),
  );

  return (
    <main className="min-h-screen bg-background">
      <MainContainer>
        <Section>
          <SectionLabel>Administrative Console</SectionLabel>
          <div className="mt-10 max-w-3xl">
            <h1 className="font-serif text-5xl leading-tight md:text-6xl">
              Create accounts and assign role attributes.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Admin creates all teacher and student accounts, and stores role-based attributes
              during provisioning.
            </p>
          </div>

          <Card variant="featured" className="mt-10 max-w-2xl">
            <form className="space-y-4" onSubmit={handleCreateAccount}>
              <div>
                <label htmlFor="email" className="small-caps-label">
                  User Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="new.user@institution.edu"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="small-caps-label">
                  Temporary Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div>
                <p className="small-caps-label">Role</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["teacher", "user"] as const).map((itemRole) => (
                    <button
                      key={itemRole}
                      type="button"
                      onClick={() => setRole(itemRole)}
                      className={`border px-3 py-2 text-xs uppercase tracking-[0.15em] ${
                        role === itemRole
                          ? "border-accent bg-muted text-foreground"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {itemRole}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="department" className="small-caps-label">
                  Department / Specialization
                </label>
                <select
                  id="department"
                  value={department}
                  onChange={(event) => {
                    setDepartment(event.target.value);
                    setSelectedCourse("");
                    setSelectedCourses([]);
                  }}
                  className="w-full border border-border bg-background px-4 py-3 text-sm focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
                  required
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="courseSelect" className="small-caps-label">
                  Course + Slot
                </label>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <select
                    id="courseSelect"
                    value={selectedCourse}
                    onChange={(event) => setSelectedCourse(event.target.value)}
                    className="min-w-[240px] border border-border bg-background px-4 py-3 text-sm focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
                  >
                    <option value="">Select a course</option>
                    {availableCourses.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                  <select
                    id="slotSelect"
                    value={selectedSlot}
                    onChange={(event) => setSelectedSlot(event.target.value)}
                    className="min-w-[180px] border border-border bg-background px-4 py-3 text-sm focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
                  >
                    {courseSlotOptions.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      if (!selectedCourse) return;
                      const courseWithSlot = `${selectedCourse} [${selectedSlot}]`;
                      if (selectedCourses.includes(courseWithSlot)) return;
                      setSelectedCourses((prev) => [...prev, courseWithSlot]);
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedCourses.map((course) => (
                    <button
                      key={course}
                      type="button"
                      className="small-caps-label border border-border bg-muted px-3 py-1.5 text-foreground"
                      onClick={() =>
                        setSelectedCourses((prev) => prev.filter((item) => item !== course))
                      }
                    >
                      {course} x
                    </button>
                  ))}
                  {!selectedCourses.length ? (
                    <p className="text-sm text-muted-foreground">
                      Add one or more courses from the dropdown.
                    </p>
                  ) : null}
                </div>
              </div>

              {role === "user" ? (
                <div>
                  <label htmlFor="year" className="small-caps-label">
                    Year
                  </label>
                  <select
                    id="year"
                    value={year}
                    onChange={(event) => setYear(event.target.value)}
                    className="w-full border border-border bg-background px-4 py-3 text-sm focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
                    required
                  >
                    {academicYears.map((academicYear) => (
                      <option key={academicYear} value={academicYear}>
                        {academicYear}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {error ? <p className="text-sm text-red-700">{error}</p> : null}
              {message ? <p className="text-sm text-accent">{message}</p> : null}

              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </Card>

          <Card variant="elevated" className="mt-10">
            <div className="flex items-center justify-between gap-3">
              <p className="small-caps-label">Teacher Registry</p>
              <Button
                variant="secondary"
                className="px-3 py-1.5 text-xs"
                onClick={async () => {
                  const roles = await fetchRoleRegistry();
                  setTeachersRegistry(roles.teachers);
                  setUsersRegistry(roles.users);
                }}
              >
                Refresh
              </Button>
            </div>

            <div className="mt-4">
              <Input
                value={teacherSearch}
                onChange={(event) => setTeacherSearch(event.target.value)}
                placeholder="Search teachers by email or course..."
              />
            </div>

            <div className="mt-5 overflow-x-auto border border-border">
              <table className="w-full min-w-[720px] border-collapse">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left small-caps-label">Email</th>
                    <th className="px-4 py-3 text-left small-caps-label">Courses</th>
                    <th className="px-4 py-3 text-left small-caps-label">Updated At</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="px-4 py-3">{item.email}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {item.course_codes.join(", ")}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(item.updated_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filteredTeachers.length ? (
                <p className="px-4 py-4 text-sm text-muted-foreground">
                  No teacher records found.
                </p>
              ) : null}
            </div>
          </Card>

          <Card variant="elevated" className="mt-10">
            <p className="small-caps-label">User Registry</p>
            <div className="mt-4">
              <Input
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Search users by email, department, year, or course..."
              />
            </div>
            <div className="mt-5 overflow-x-auto border border-border">
              <table className="w-full min-w-[860px] border-collapse">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left small-caps-label">Email</th>
                    <th className="px-4 py-3 text-left small-caps-label">Department</th>
                    <th className="px-4 py-3 text-left small-caps-label">Year</th>
                    <th className="px-4 py-3 text-left small-caps-label">Courses</th>
                    <th className="px-4 py-3 text-left small-caps-label">Updated At</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="px-4 py-3">{item.email}</td>
                      <td className="px-4 py-3">{item.department}</td>
                      <td className="px-4 py-3">{item.year}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {item.course_codes.join(", ")}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(item.updated_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filteredUsers.length ? (
                <p className="px-4 py-4 text-sm text-muted-foreground">No user records found.</p>
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
