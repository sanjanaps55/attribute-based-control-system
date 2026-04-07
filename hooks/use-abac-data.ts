import {
  academicYears,
  courseSlotOptions,
  currentUserAttributes,
  departmentCourseCatalog,
  files,
  policyAttributes,
  users,
} from "@/lib/mock-data";
import type {
  PolicyAttributes,
  SharedFile,
  UserAttribute,
  UserRecord,
} from "@/types/abac";

export function useCurrentUserAttributes(): UserAttribute {
  return currentUserAttributes;
}

export function useSharedFiles(): SharedFile[] {
  return files;
}

export function useUsers(): UserRecord[] {
  return users;
}

export function usePolicyAttributes(): PolicyAttributes {
  return policyAttributes;
}

export function useAcademicYears(): string[] {
  return academicYears;
}

export function useDepartmentCourseCatalog(): Record<string, string[]> {
  return departmentCourseCatalog;
}

export function useCourseSlotOptions(): string[] {
  return courseSlotOptions;
}
