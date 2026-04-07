export type AuthCredentials = {
  email: string;
  password: string;
};

export type AppRole = "admin" | "teacher" | "user";

export type TeacherAttributes = {
  courseCodes: string[];
};

export type StudentAttributes = {
  year: string;
  department: string;
  courseCodes: string[];
};

export type AdminCreateAccountPayload = {
  email: string;
  password: string;
  role: AppRole;
  teacherAttributes?: TeacherAttributes;
  userAttributes?: StudentAttributes;
};
