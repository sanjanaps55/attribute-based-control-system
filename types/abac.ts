export type UserAttribute = {
  role: string;
  department: string;
  year: string;
  courses: string[];
};

export type SharedFile = {
  id: string;
  title: string;
  owner: string;
  classification: string;
  policy: string;
  updatedAt: string;
};

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  attributes: UserAttribute;
};

export type AssignmentRecord = {
  id: string;
  title: string;
  course_code: string;
  slot: string;
  policy: string;
  original_file_name: string;
  mime_type: string;
  created_at: string;
};

export type PolicyAttributes = {
  roles: string[];
  departments: string[];
  years: string[];
  courses: string[];
};
