// src\app\admin\payments\page.tsx

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminLayout from "@/components/layouts/AdminLayout";
import {
  Edit,
  Trash2,
  Plus,
  MoreVertical,
  Search,
  DollarSign,
  CreditCard,
  CheckCircle,
  Clock,
  CalendarIcon,
} from "lucide-react";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ColumnDef,
  ResponsiveList,
} from "@/components/ui/special/ResponsiveList";

interface Payment {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  date: string;
  createdAt: string;
  student: {
    id: string;
    name: string;
    rollNumber: string;
    class: string;
    section: string;
  };
  fee: {
    id: string;
    type: string;
    amount: number;
    dueDate: string;
  };
}

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  class: string;
  section: string;
  fees: Array<{
    id: string;
    type: string;
    amount: number;
    dueDate: string;
    payments: Array<{
      amount: number;
      status: string;
    }>;
  }>;
}

interface ViewingStudent {
  id: string;
  name: string;
  rollNumber: string;
  class: string;
  section: string;
  fees: Array<{
    id: string;
    type: string;
    amount: number;
    payments: Array<{
      amount: number;
      status: string;
    }>;
  }>;
}

interface PaymentFormData {
  studentId: string;
  feeId: string;
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
  date: string;
}

interface Fee {
  id: string;
  type: string;
  amount: number;
  dueDate: string;
  createdAt: string;
  student: {
    id: string;
    name: string;
    rollNumber: string;
    class: string;
    section: string;
  };
  payments: Array<{
    id: string;
    amount: number;
    status: PaymentStatus;
    date: string;
  }>;
}

export default function AdminPaymentsPageClient() {
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [allFees, setAllFees] = React.useState<Fee[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [filteredPayments, setFilteredPayments] = React.useState<Payment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  // Navigating to this page for a particular student
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId");
  const [viewingStudent, setViewingStudent] =
    React.useState<ViewingStudent | null>(null);

  // Form state
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(
    null
  );
  const [formLoading, setFormLoading] = React.useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [methodFilter, setMethodFilter] = React.useState("all");
  const [dateFilter, setDateFilter] = React.useState("all");

  const [formData, setFormData] = React.useState<PaymentFormData>({
    studentId: "",
    feeId: "",
    amount: "",
    method: "CASH",
    status: "COMPLETED",
    date: new Date().toISOString().split("T")[0],
  });

  const columns: ColumnDef<Payment>[] = [
    {
      accessorKey: "student",
      header: "Student",
      cell: (payment) =>
        !viewingStudent ? (
          <Link
            href={`/admin/payments?studentId=${payment.student.id}`}
            className="hover:underline"
          >
            <div>
              <div className="font-medium">{payment.student.name}</div>
              <div className="text-sm text-muted-foreground">
                {payment.student.rollNumber} - {payment.student.class}
                {payment.student.section}
              </div>
            </div>
          </Link>
        ) : (
          <div>
            <div className="font-medium">{payment.student.name}</div>
            <div className="text-sm text-muted-foreground">
              {payment.student.rollNumber} - {payment.student.class}
              {payment.student.section}
            </div>
          </div>
        ),
    },
    {
      accessorKey: "feeType",
      header: "Fee Type",
      cell: (payment) => <span>{payment.fee?.type || "General Payment"}</span>,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: (payment) => (
        <span className="font-medium">
          ₹{Number(payment.amount).toLocaleString()}
        </span>
      ),
      className: "w-[100px]",
    },
    {
      accessorKey: "method",
      header: "Method",
      hideOnMobile: true,
      cell: (payment) => (
        <div className="flex items-center gap-2">
          <span>{getMethodIcon(payment.method)}</span>
          {payment.method.replace("_", " ")}
        </div>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: (payment) => (
        <span>{new Date(payment.date).toLocaleDateString()}</span>
      ),
      className: "w-[110px]",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (payment) => (
        <Badge
          variant={
            getStatusColor(payment.status) as ReturnType<typeof getStatusColor>
          }
        >
          {payment.status}
        </Badge>
      ),
      className: "w-[100px]",
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: (payment) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer h-9 px-3"
            >
              <span className="hidden sm:inline mr-2">Actions</span>
              <MoreVertical className="h-4 w-4 sm:hidden" />
              <span className="sm:hidden ml-1 text-xs">Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => openEditDialog(payment)}
              className="cursor-pointer"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Payment
            </DropdownMenuItem>
            {payment.status === "PENDING" && (
              <DropdownMenuItem
                onClick={() => handleStatusChange(payment.id, "COMPLETED")}
                className="cursor-pointer"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Completed
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => handleDelete(payment.id)}
              className="text-red-600 cursor-pointer"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Payment
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: "w-[100px]",
    },
  ];

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const paymentsPromise = fetch("/api/payments");
      const studentsPromise = fetch("/api/students");
      const feesPromise = fetch("/api/fees");
      let studentPromise = null;

      if (studentId) {
        studentPromise = fetch(`/api/students/${studentId}`);
      } else {
        setViewingStudent(null);
      }

      const [paymentsResponse, studentsResponse, feesResponse] =
        await Promise.all([paymentsPromise, studentsPromise, feesPromise]);

      if (!paymentsResponse.ok || !studentsResponse.ok) {
        throw new Error("Failed to fetch initial data.");
      }

      const paymentsData = await paymentsResponse.json();
      const studentsData = await studentsResponse.json();
      const feesData = await feesResponse.json();

      setPayments(paymentsData);
      setStudents(
        studentsData.map((student: Student) => ({
          id: student.id,
          name: student.name,
          rollNumber: student.rollNumber,
          class: student.class,
          section: student.section,
          fees: student.fees || [],
        }))
      );
      setAllFees(feesData);

      if (studentPromise) {
        const studentResponse = await studentPromise;
        if (studentResponse.ok) {
          const studentData = await studentResponse.json();
          setViewingStudent(studentData);
        } else {
          setError(`Failed to fetch details for student ID: ${studentId}`);
        }
      }
    } catch (err: unknown) {
      setError(
        (err as { message: string }).message ||
          "An error occurred while fetching data."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [studentId]); // useCallback depends on studentId

  const filterPayments = React.useCallback(() => {
    let filtered = payments;

    // If viewing a single student, filter by their ID first.
    if (viewingStudent) {
      filtered = filtered.filter(
        (payment) => payment.student.id === viewingStudent.id
      );
    }

    // Search filter
    // Only apply search if not in student view
    if (searchQuery && !viewingStudent) {
      filtered = filtered.filter(
        (payment) =>
          payment.student.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          payment.student.rollNumber
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          payment.fee?.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((payment) => payment.status === statusFilter);
    }

    // Method filter
    if (methodFilter !== "all") {
      filtered = filtered.filter((payment) => payment.method === methodFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const today = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(
            (payment) =>
              new Date(payment.date).toDateString() ===
              filterDate.toDateString()
          );
          break;
        case "week":
          filterDate.setDate(today.getDate() - 7);
          filtered = filtered.filter(
            (payment) => new Date(payment.date) >= filterDate
          );
          break;
        case "month":
          filterDate.setMonth(today.getMonth() - 1);
          filtered = filtered.filter(
            (payment) => new Date(payment.date) >= filterDate
          );
          break;
      }
    }

    setFilteredPayments(filtered);
  }, [
    dateFilter,
    methodFilter,
    payments,
    searchQuery,
    statusFilter,
    viewingStudent,
  ]);

  React.useEffect(() => {
    fetchData();
  }, [studentId, fetchData]);

  React.useEffect(() => {
    filterPayments();
  }, [
    payments,
    searchQuery,
    statusFilter,
    methodFilter,
    dateFilter,
    viewingStudent,
    filterPayments,
  ]);

  const resetForm = () => {
    setFormData({
      studentId: "",
      feeId: "",
      amount: "",
      method: "CASH",
      status: "COMPLETED",
      date: new Date().toISOString().split("T")[0],
    });
    setIsEditing(false);
    setSelectedPayment(null);
  };

  const openCreateDialog = () => {
    resetForm();

    // If we are viewing a specific student, pre-fill the form with their ID.
    if (viewingStudent) {
      setFormData((prev) => ({
        ...prev,
        studentId: viewingStudent.id,
      }));
    }

    setIsDialogOpen(true);
  };

  const openEditDialog = (payment: Payment) => {
    setFormData({
      studentId: payment.student.id,
      feeId: payment.fee?.id || "",
      amount: payment.amount.toString(),
      method: payment.method,
      status: payment.status,
      date: payment.date.split("T")[0],
    });
    setSelectedPayment(payment);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setFormLoading(true);

    try {
      const url = isEditing
        ? `/api/payments/${selectedPayment?.id}`
        : "/api/payments";
      const method = isEditing ? "PUT" : "POST";

      const requestData = {
        studentId: formData.studentId,
        feeId: formData.feeId || undefined,
        amount: parseFloat(formData.amount),
        method: formData.method,
        status: formData.status,
        date: formData.date,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          isEditing
            ? "Payment updated successfully!"
            : "Payment recorded successfully!"
        );
        setIsDialogOpen(false);
        resetForm();
        fetchData();
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(
          data.error || `Failed to ${isEditing ? "update" : "record"} payment`
        );
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (paymentId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this payment? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("Payment deleted successfully!");
        fetchData();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete payment");
      }
    } catch {
      setError("Error deleting payment");
    }
  };

  const handleStatusChange = async (
    paymentId: string,
    newStatus: PaymentStatus
  ) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setSuccess("Payment status updated!");
        fetchData();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update status");
      }
    } catch {
      setError("Error updating status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "default";
      case "PENDING":
        return "secondary";
      case "FAILED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "CASH":
        return "💵";
      case "CARD":
        return "💳";
      case "BANK_TRANSFER":
        return "🏦";
      case "UPI":
        return "📱";
      default:
        return "💰";
    }
  };

  const calculateStats = () => {
    // If viewing a student, use their filtered payments. Otherwise, use all payments.
    const sourcePayments = viewingStudent ? filteredPayments : payments;

    let sourceFees;
    if (viewingStudent) {
      // The student object from the API contains their associated fees
      sourceFees = viewingStudent.fees || [];
    } else {
      // In global view, use the full list of all fees
      sourceFees = allFees;
    }

    const remainingDue = sourceFees
      .map((fee) => {
        // For each fee, find the total paid specifically for it.
        const totalPaidForFee = (fee.payments || [])
          .filter((p) => p.status === "COMPLETED")
          .reduce((sum: number, p) => sum + Number(p.amount), 0);

        // Calculate the balance for this single fee.
        const balance = Number(fee.amount) - totalPaidForFee;

        // Only count positive balances.
        return balance > 0 ? balance : 0;
      })
      // 2. Sum up the balances of all fees that are not fully paid.
      .reduce((total, balance) => total + balance, 0);

    const totalCollected = sourcePayments
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    const pendingAmount = sourcePayments
      .filter((p) => p.status === "PENDING")
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    const todayAmount = sourcePayments
      .filter(
        (p) =>
          p.status === "COMPLETED" &&
          new Date(p.date).toDateString() === new Date().toDateString()
      )
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    const completedCount = sourcePayments.filter(
      (p) => p.status === "COMPLETED"
    ).length;

    return {
      totalCollected,
      remainingDue,
      pendingAmount,
      todayAmount,
      completedCount,
    };
  };

  const stats = calculateStats();
  const selectedStudent = students.find((s) => s.id === formData.studentId);
  const availableFees =
    selectedStudent?.fees.filter((fee) => {
      const totalPaid = fee.payments
        .filter((p) => p.status === "COMPLETED")
        .reduce((sum, p) => sum + p.amount, 0);
      return totalPaid < fee.amount; // Only show fees that aren't fully paid
    }) || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {viewingStudent && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <CardTitle className="text-2xl">
                    Payment History: {viewingStudent.name}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {viewingStudent.class}-{viewingStudent.section} | Roll No:{" "}
                    {viewingStudent.rollNumber}
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Link
                    href={`/admin/fees?studentId=${viewingStudent.id}`}
                    className="flex-1"
                  >
                    <Button
                      variant="secondary"
                      className="w-full cursor-pointer"
                    >
                      View Fee Ledger
                    </Button>
                  </Link>
                  <Link href="/admin/payments" className="flex-1">
                    <Button variant="outline" className="w-full cursor-pointer">
                      &larr; All Payments
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        <div className="flex justify-between items-center">
          <div>
            {!viewingStudent && (
              <>
                <h1 className="text-2xl md:text-3xl font-bold">
                  Payments Management
                </h1>
                <p className="text-gray-600">
                  Record and manage student fee payments
                </p>
              </>
            )}
          </div>

          <Button onClick={openCreateDialog} className="cursor-pointer">
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-600">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-600">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Collection Status (Paid / Total Due)
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <span className="text-green-600">
                  ₹{stats.totalCollected.toLocaleString()}
                </span>
                <span className="text-xl text-muted-foreground">
                  {" "}
                  / ₹
                  {(stats.totalCollected + stats.remainingDue).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                ₹{stats.remainingDue.toLocaleString()} remaining
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                ₹{stats.pendingAmount.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Today&apos;s Collection
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ₹{stats.todayAmount.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Transactions
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search payments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex flex-col grow md:flex-row items-center gap-4">
                <div className="flex grow gap-4">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="flex-1 cursor-pointer">
                      <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="cursor-pointer">
                        All Status
                      </SelectItem>
                      <SelectItem value="COMPLETED" className="cursor-pointer">
                        Completed
                      </SelectItem>
                      <SelectItem value="PENDING" className="cursor-pointer">
                        Pending
                      </SelectItem>
                      <SelectItem value="FAILED" className="cursor-pointer">
                        Failed
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={methodFilter} onValueChange={setMethodFilter}>
                    <SelectTrigger className="flex-1 cursor-pointer">
                      <SelectValue placeholder="Filter by Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="cursor-pointer">
                        All Methods
                      </SelectItem>
                      <SelectItem value="CASH" className="cursor-pointer">
                        Cash
                      </SelectItem>
                      <SelectItem value="CARD" className="cursor-pointer">
                        Card
                      </SelectItem>
                      <SelectItem
                        value="BANK_TRANSFER"
                        className="cursor-pointer"
                      >
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="UPI" className="cursor-pointer">
                        UPI
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="flex-1 cursor-pointer">
                    <SelectValue placeholder="Filter by Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="cursor-pointer">
                      All Time
                    </SelectItem>
                    <SelectItem value="today" className="cursor-pointer">
                      Today
                    </SelectItem>
                    <SelectItem value="week" className="cursor-pointer">
                      Last Week
                    </SelectItem>
                    <SelectItem value="month" className="cursor-pointer">
                      Last Month
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <ResponsiveList
          columns={columns}
          data={filteredPayments}
          loading={loading}
          rowKey="id"
          emptyState={
            <div className="text-center py-8 text-gray-500">
              {searchQuery ||
              statusFilter !== "all" ||
              methodFilter !== "all" ||
              dateFilter !== "all"
                ? "No payments found matching your filters."
                : "No payments recorded yet."}
            </div>
          }
        />

        {/* Add/Edit Payment Dialog */}
        <div className="">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-md my-4">
              <DialogHeader>
                <DialogTitle>
                  {isEditing ? "Edit Payment" : "Record New Payment"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-1.5">
                  <Label htmlFor="studentId">Student *</Label>
                  <Select
                    value={formData.studentId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        studentId: value,
                        feeId: "",
                      }))
                    }
                    disabled={!!viewingStudent}
                  >
                    <SelectTrigger className="cursor-pointer">
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem
                          key={student.id}
                          value={student.id}
                          className="cursor-pointer"
                        >
                          {student.name} - {student.rollNumber} ({student.class}
                          -{student.section})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.studentId && availableFees.length > 0 && (
                  <div className="space-y-1.5">
                    <Label htmlFor="feeId">Fee (Optional)</Label>
                    <Select
                      value={formData.feeId}
                      onValueChange={(value) => {
                        const fee = availableFees.find((f) => f.id === value);
                        setFormData((prev) => ({
                          ...prev,
                          feeId: value,
                          amount: fee ? fee.amount.toString() : prev.amount,
                        }));
                      }}
                    >
                      <SelectTrigger className="cursor-pointer">
                        <SelectValue placeholder="Select fee (or leave empty for general payment)" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFees.map((fee) => {
                          const totalPaid = fee.payments
                            .filter((p) => p.status === "COMPLETED")
                            .reduce((sum, p) => sum + p.amount, 0);
                          const remaining = fee.amount - totalPaid;
                          return (
                            <SelectItem
                              key={fee.id}
                              value={fee.id}
                              className="cursor-pointer"
                            >
                              {fee.type} - ₹{remaining} due
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="amount">Amount (₹) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="method">Payment Method *</Label>
                  <Select
                    value={formData.method}
                    onValueChange={(value: PaymentMethod) =>
                      setFormData((prev) => ({ ...prev, method: value }))
                    }
                  >
                    <SelectTrigger className="cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH" className="cursor-pointer">
                        💵 Cash
                      </SelectItem>
                      <SelectItem value="CARD" className="cursor-pointer">
                        💳 Card
                      </SelectItem>
                      <SelectItem
                        value="BANK_TRANSFER"
                        className="cursor-pointer"
                      >
                        🏦 Bank Transfer
                      </SelectItem>
                      <SelectItem value="UPI" className="cursor-pointer">
                        📱 UPI
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: PaymentStatus) =>
                      setFormData((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger className="cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMPLETED" className="cursor-pointer">
                        Completed
                      </SelectItem>
                      <SelectItem value="PENDING" className="cursor-pointer">
                        Pending
                      </SelectItem>
                      <SelectItem value="FAILED" className="cursor-pointer">
                        Failed
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="date">Payment Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, date: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="paymentDate">Payment Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between text-left font-normal cursor-pointer"
                      >
                        {formData.date ? (
                          format(new Date(formData.date), "PPP")
                        ) : (
                          <span>Select Payment date</span>
                        )}
                        <CalendarIcon className="ml-2 h-4 w-4 text-gray-400" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          formData.date ? new Date(formData.date) : undefined
                        }
                        onSelect={(date) =>
                          setFormData((prev) => ({
                            ...prev,
                            dueDate: date
                              ? date.toISOString().split("T")[0]
                              : "",
                          }))
                        }
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex space-x-4 pt-4">
                  <Button type="submit" disabled={formLoading}>
                    {formLoading
                      ? "Saving..."
                      : isEditing
                      ? "Update Payment"
                      : "Record Payment"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AdminLayout>
  );
}
