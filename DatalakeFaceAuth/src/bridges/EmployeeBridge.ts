/**
 * This file is the ONLY connection point between this app and Datalake 3.0.
 * Currently uses mock data because the Datalake 3.0 source code is not available.
 * When Datalake 3.0 is integrated, replace ONLY the implementations below.
 * All other files remain unchanged.
 *
 * Mock data simulates a realistic set of field employees.
 */

export interface Employee {
  id: string;
  name: string;
  department: string;
  isActive: boolean;
}

const MOCK_EMPLOYEES: Employee[] = [
  {
    id: "EMP001",
    name: "Ravi Kumar",
    department: "Field Operations",
    isActive: true,
  },
  {
    id: "EMP002",
    name: "Priya Sharma",
    department: "Survey Team",
    isActive: true,
  },
  {
    id: "EMP003",
    name: "Amit Singh",
    department: "Field Operations",
    isActive: true,
  },
  {
    id: "EMP004",
    name: "Deepa Nair",
    department: "Quality Control",
    isActive: true,
  },
  {
    id: "EMP005",
    name: "Mohammed Rafi",
    department: "Survey Team",
    isActive: true,
  },
  {
    id: "EMP006",
    name: "Sunita Patel",
    department: "Field Operations",
    isActive: true,
  },
  {
    id: "EMP007",
    name: "Arjun Reddy",
    department: "Maintenance",
    isActive: true,
  },
  {
    id: "EMP008",
    name: "Kavitha Menon",
    department: "Quality Control",
    isActive: true,
  },
  {
    id: "EMP009",
    name: "Sanjay Gupta",
    department: "Survey Team",
    isActive: false,
  },
  {
    id: "EMP010",
    name: "Lakshmi Iyer",
    department: "Field Operations",
    isActive: true,
  },
];

export class EmployeeBridge {
  static async getById(employeeId: string): Promise<Employee | null> {
    // Replace with: read from Datalake 3.0's data store when available
    return MOCK_EMPLOYEES.find((e) => e.id === employeeId) ?? null;
  }

  static async getAll(): Promise<Employee[]> {
    // Replace with: fetch from Datalake 3.0's employee API or local cache
    return MOCK_EMPLOYEES.filter((e) => e.isActive);
  }

  static async reportAttendance(record: {
    employeeId: string;
    timestamp: number;
    confidence: number;
  }): Promise<void> {
    // Replace with: notify Datalake 3.0's attendance pipeline when integrated
    console.log("[EmployeeBridge] Attendance reported:", record);
  }
}
