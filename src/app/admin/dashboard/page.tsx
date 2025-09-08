// src\app\admin\dashboard\page.tsx

"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/layouts/AdminLayout";
import { PaymentMethod, PaymentStatus, UserStatus } from "@prisma/client";
import Link from "next/link";
import {
  ColumnDef,
  ResponsiveList,
} from "@/components/ui/special/ResponsiveList";

interface Student {
  id: string;
  name: string;
  class: string;
  section: string;
  rollNumber: string;
  guardian: string;
  guardianPhone: string;
  guardianEmail: string | null;
  address: string | null;
  user: {
    email: string;
    name: string;
    status: UserStatus;
    studentId: string;
  };
  fees: Array<{
    id: string;
    type: string;
    amount: number;
    dueDate: string;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
  }>;
}

export default function AdminDashboard() {
  const [students, setStudents] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState(true);

  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: "name",
      header: "Student",
      cell: (student) => (
        <div>
          <div className="font-medium">{student.name}</div>
          <div className="text-sm text-muted-foreground">
            Roll: {student.rollNumber}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "rollNumber",
      header: "Roll No.",
    },
    {
      accessorKey: "class",
      header: "Class",
      cell: ({ class: className, section }) => (
        <span className="font-medium">
          {className}-{section}
        </span>
      ),
      className: "w-[80px]",
    },
    {
      accessorKey: "feeStatus",
      header: "Fee Status",
      cell: (student) => {
        const totalFees = calculateTotalFees(student);
        const totalPaid = calculateTotalPaid(student);
        const pending = totalFees - totalPaid;
        return totalFees === 0 ? (
          <Badge variant="outline">No fees</Badge>
        ) : (
          <Badge variant={pending > 0 ? "destructive" : "default"}>
            {pending > 0 ? `₹${pending} due` : "Paid"}
          </Badge>
        );
      },
      className: "w-[120px]",
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: (student) => (
        <Link href={`/admin/fees?studentId=${student.id}`}>
          <Button variant="outline" size="sm" className="cursor-pointer">
            View Details
          </Button>
        </Link>
      ),
      className: "w-[120px]",
    },
  ];

  React.useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/students");
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error: unknown) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalFees = (student: Student) => {
    return student.fees.reduce((total, fee) => total + Number(fee.amount), 0);
  };

  const calculateTotalPaid = (student: Student) => {
    return student.payments
      .filter((payment) => payment.status === "COMPLETED")
      .reduce((total, payment) => total + Number(payment.amount), 0);
  };

  // const getStatusColor = (status: UserStatus) => {
  //   switch (status) {
  //     case "ACTIVE":
  //       return "default";
  //     case "PENDING":
  //       return "secondary";
  //     case "SUSPENDED":
  //       return "destructive";
  //     case "INACTIVE":
  //       return "outline";
  //     default:
  //       return "default";
  //   }
  // };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button className="cursor-pointer">Add Student</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹
                {students
                  .reduce(
                    (total, student) => total + calculateTotalFees(student),
                    0
                  )
                  .toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Collected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₹
                {students
                  .reduce(
                    (total, student) => total + calculateTotalPaid(student),
                    0
                  )
                  .toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ₹
                {students
                  .reduce(
                    (total, student) =>
                      total +
                      (calculateTotalFees(student) -
                        calculateTotalPaid(student)),
                    0
                  )
                  .toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Students</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveList
              columns={columns}
              data={students}
              loading={loading}
              rowKey="id"
              emptyState={
                <div className="text-center py-8 text-gray-500">
                  No students found. Create some invitations to get started.
                </div>
              }
            />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
