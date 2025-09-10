// src\app\admin\dashboard\page.tsx

"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/layouts/AdminLayout";
import { UserStatus } from "@prisma/client";
import Link from "next/link";
import {
  ColumnDef,
  ResponsiveList,
} from "@/components/ui/special/ResponsiveList";
import { CheckCircle, Clock, Receipt, Users } from "lucide-react";

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
    discount: string;
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
    return student.payments.reduce(
      (total, payment) => total + Number(payment.amount),
      0
    );
  };

  const calculateTotalDiscount = (student: Student) => {
    return student.payments.reduce(
      (total, payment) => total + Number(payment.discount),
      0
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-start items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>

        {/* Dashboard Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Students */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Students
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-2">
                {students.length.toLocaleString()}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Enrolled</span>
                <span className="font-medium text-green-600">
                  {students.filter((s) => s.user.status === "ACTIVE").length}{" "}
                  Active
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Total Fees */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Fees
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
                <Receipt className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-2">
                ₹
                {students
                  .reduce(
                    (total, student) => total + calculateTotalFees(student),
                    0
                  )
                  .toLocaleString()}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Expected</span>
                <span className="font-medium text-purple-600">
                  ₹
                  {students
                    .reduce(
                      (total, student) =>
                        total + calculateTotalDiscount(student),
                      0
                    )
                    .toLocaleString()}{" "}
                  Discount
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Collections */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Collections
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 mb-2">
                ₹
                {students
                  .reduce(
                    (total, student) => total + calculateTotalPaid(student),
                    0
                  )
                  .toLocaleString()}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Collected</span>
                <span className="font-medium text-green-700">
                  {(() => {
                    const totalFees = students.reduce(
                      (total, student) => total + calculateTotalFees(student),
                      0
                    );
                    const totalPaid = students.reduce(
                      (total, student) => total + calculateTotalPaid(student),
                      0
                    );
                    return totalFees > 0
                      ? Math.round((totalPaid / totalFees) * 100)
                      : 0;
                  })()}
                  % Complete
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Outstanding */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Outstanding
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 mb-2">
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
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-medium text-red-600">
                  {
                    students.filter(
                      (student) =>
                        calculateTotalFees(student) -
                          calculateTotalPaid(student) >
                        0
                    ).length
                  }{" "}
                  Students
                </span>
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
