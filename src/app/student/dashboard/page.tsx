// src\app\student\dashboard\page.tsx

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StudentLayout from "@/components/layouts/StudentLayout";

interface StudentData {
  id: string;
  name: string;
  class: string;
  section: string;
  guardian: string;
  contact: string;
  fees: Array<{
    id: string;
    type: string;
    amount: number;
    dueDate: string;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    date: string;
    status: string;
  }>;
  attendance: Array<{
    id: string;
    date: string;
    status: string;
  }>;
}

export default function StudentDashboard() {
  const { data: session } = useSession();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const response = await fetch("/api/student/profile");
      if (response.ok) {
        const data = await response.json();
        setStudentData(data);
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div>Loading...</div>
      </StudentLayout>
    );
  }

  if (!studentData) {
    return (
      <StudentLayout>
        <div>No student data found</div>
      </StudentLayout>
    );
  }

  const totalFees = studentData.fees.reduce(
    (total, fee) => total + Number(fee.amount),
    0
  );
  const totalPaid = studentData.payments
    .filter((payment) => payment.status === "COMPLETED")
    .reduce((total, payment) => total + Number(payment.amount), 0);
  const pendingFees = totalFees - totalPaid;

  const attendanceRate =
    studentData.attendance.length > 0
      ? (studentData.attendance.filter((a) => a.status === "PRESENT").length /
          studentData.attendance.length) *
        100
      : 0;

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {studentData.name}!</h1>
          <p className="text-gray-600">
            Class {studentData.class} - Section {studentData.section}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{totalFees.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₹{totalPaid.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ₹{pendingFees.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {attendanceRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentData.payments.slice(0, 5).map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        ₹{Number(payment.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>{payment.method}</TableCell>
                      <TableCell>
                        {new Date(payment.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payment.status === "COMPLETED"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Outstanding Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentData.fees.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell>{fee.type}</TableCell>
                      <TableCell>
                        ₹{Number(fee.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(fee.dueDate).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentData.attendance.slice(0, 10).map((attendance) => (
                  <TableRow key={attendance.id}>
                    <TableCell>
                      {new Date(attendance.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          attendance.status === "PRESENT"
                            ? "default"
                            : attendance.status === "LATE"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {attendance.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
