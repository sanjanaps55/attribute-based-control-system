import type { PolicyAttributes, SharedFile, UserAttribute, UserRecord } from "@/types/abac";

export const currentUserAttributes: UserAttribute = {
  role: "Research Assistant",
  department: "Computer Science",
  year: "Final Year",
  courses: ["CS601 Applied Cryptography", "CS609 Network Security"],
};

export const files: SharedFile[] = [
  {
    id: "f-01",
    title: "Encrypted Thesis Draft",
    owner: "Prof. Elena Markov",
    classification: "Internal",
    policy: "Role: Faculty OR (Department: Computer Science AND Year: Final Year)",
    updatedAt: "2 hours ago",
  },
  {
    id: "f-02",
    title: "ABAC Policy Evaluation Notes",
    owner: "Kiran Joseph",
    classification: "Restricted",
    policy: "Department: Computer Science AND Course: CS601 Applied Cryptography",
    updatedAt: "Yesterday",
  },
  {
    id: "f-03",
    title: "Secure Storage Benchmark Results",
    owner: "A. Raman",
    classification: "Internal",
    policy: "Role: Research Assistant AND Department: Computer Science",
    updatedAt: "3 days ago",
  },
];

export const users: UserRecord[] = [
  {
    id: "u-001",
    name: "Sanjana P S",
    email: "sanjana.ps@example.edu",
    attributes: {
      role: "Student",
      department: "Computer Science",
      year: "Final Year",
      courses: ["CS601 Applied Cryptography", "CS604 Cloud Security"],
    },
  },
  {
    id: "u-002",
    name: "Elena Markov",
    email: "emarkov@example.edu",
    attributes: {
      role: "Faculty",
      department: "Computer Science",
      year: "N/A",
      courses: ["CS601 Applied Cryptography"],
    },
  },
  {
    id: "u-003",
    name: "Kiran Joseph",
    email: "kiran.j@example.edu",
    attributes: {
      role: "Research Assistant",
      department: "Computer Science",
      year: "Graduate",
      courses: ["CS609 Network Security"],
    },
  },
];

export const policyAttributes: PolicyAttributes = {
  roles: ["Student", "Faculty", "Research Assistant", "Admin"],
  departments: ["Computer Science", "Electronics", "Mathematics", "Law"],
  years: ["First Year", "Second Year", "Third Year", "Final Year", "Graduate"],
  courses: [
    "CS601 Applied Cryptography",
    "CS609 Network Security",
    "CS604 Cloud Security",
    "CS620 Privacy Engineering",
  ],
};

export const academicYears = [
  "First Year",
  "Second Year",
  "Third Year",
  "Final Year",
  "Graduate",
];

export const courseSlotOptions = [
  "F1+TF1",
  "F2+TF2",
  "G1+TG1",
  "G2+TG2",
  "A1+TA1",
  "B1+TB1",
  "C1+TC1",
  "D1+TD1",
  "E1+TE1",
];

export const departmentCourseCatalog: Record<string, string[]> = {
  "Computer Science": [
    "CS601 Applied Cryptography",
    "CS609 Network Security",
    "CS604 Cloud Security",
    "CS620 Privacy Engineering",
    "CS630 AI Systems",
  ],
  Mechanical: [
    "ME201 Thermodynamics",
    "ME242 Machine Design",
    "ME278 Fluid Mechanics",
    "ME310 CAD/CAM",
  ],
  Electrical: [
    "EE210 Circuit Analysis",
    "EE245 Power Systems",
    "EE260 Control Systems",
    "EE301 Digital Signal Processing",
  ],
  Electronics: [
    "EC210 Analog Electronics",
    "EC248 Microprocessors",
    "EC280 Embedded Systems",
    "EC325 VLSI Design",
  ],
  Civil: [
    "CE205 Structural Analysis",
    "CE240 Geotechnical Engineering",
    "CE265 Transportation Engineering",
    "CE300 Environmental Engineering",
  ],
};
