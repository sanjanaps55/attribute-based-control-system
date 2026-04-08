export const SLOT_FROM_ASSIGNED = "__from_assigned__";

export type AccessPolicyFields = {
  role: "user";
  department: string;
  year: string;
  course: string;
  slot: string;
};

export function inferDepartmentFromCourse(
  courseTitle: string,
  catalog: Record<string, string[]>,
): string {
  const deptKeys = Object.keys(catalog);
  for (const dept of deptKeys) {
    const courses = catalog[dept] ?? [];
    if (courses.some((c) => courseTitle === c || courseTitle.includes(c))) {
      return dept;
    }
  }
  return deptKeys[0] ?? "";
}

export function buildPolicyString(fields: AccessPolicyFields): string {
  const { role, department, year, course, slot } = fields;
  return `role:${role} AND department:"${department}" AND year:"${year}" AND course:"${course}" AND slot:"${slot}"`;
}

export function buildPolicyMetadataJson(fields: AccessPolicyFields): string {
  return JSON.stringify(fields, null, 2);
}
