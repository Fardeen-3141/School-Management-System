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
import AdminLayout from "@/components/layouts/AdminLayout";
import {
  Trash2,
  Plus,
  Search,
  DollarSign,
  CreditCard,
  CheckCircle,
  Clock,
  X,
  AlertCircle,
  User,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ColumnDef,
  ResponsiveList,
} from "@/components/ui/special/ResponsiveList";
import { DatePicker } from "@/components/ui/special/DatePicker";
import {
  usePaymentStore,
  Payment,
  AddPaymentData,
} from "@/stores/usePaymentStore";
import { useFeeStore } from "@/stores/useFeeStore";

interface PaymentFormData {
  studentId: string;
  feeId: string;
  amount: string;
  discount: string;
  date: string;
}

export default function AdminPaymentsPageClient() {
  // Connect to the payment store
  const {
    payments,
    loading: paymentsLoading,
    error: paymentsError,
    fetchGlobalPayments,
    fetchStudentPayments,
    addPayment,
    deletePayment,
    clearStudentView: clearPaymentView,
  } = usePaymentStore();

  // Connect to the fee store to get students and fees for the forms
  const {
    students,
    fees: allFees,
    loading: feesLoading,
    error: feesError,
    fetchGlobalFeeData,
    fetchStudentFeeData,
    clearStudentView, // Add this for fee store cleanup
  } = useFeeStore();

  // Local UI state
  const [uiError, setUiError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  // Navigating to this page for a particular student
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId");
  const viewingStudent = useFeeStore((state) => state.viewingStudent); // Get viewingStudent from fee store

  // Form state
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [formLoading, setFormLoading] = React.useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [dateFilter, setDateFilter] = React.useState("all");

  const [formData, setFormData] = React.useState<PaymentFormData>({
    studentId: "",
    feeId: "",
    amount: "",
    discount: "",
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
                {payment.student.rollNumber} - {payment.student.class}-
                {payment.student.section}
              </div>
            </div>
          </Link>
        ) : (
          <div>
            <div className="font-medium">{payment.student.name}</div>
            <div className="text-sm text-muted-foreground">
              {payment.student.rollNumber} - {payment.student.class}-
              {payment.student.section}
            </div>
          </div>
        ),
    },
    {
      accessorKey: "feeType",
      header: "Fee Type",
      cell: (payment) => <span>{payment.fee?.type || "General"}</span>,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ type }) => (
        <Badge
          variant={type === "DISCOUNT" ? "secondary" : "default"}
          className={
            type === "DISCOUNT" ? "border-purple-600/50 text-purple-700" : ""
          }
        >
          {type}
        </Badge>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: (payment) => (
        <span className="font-medium">
          ₹{Number(payment.amount).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: (payment) => (
        <span>{new Date(payment.date).toLocaleDateString()}</span>
      ),
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: (payment) => (
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
          onClick={() => handleDelete(payment.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const filteredPayments = React.useMemo(() => {
    let filtered = payments;

    if (viewingStudent) {
      filtered = filtered.filter(
        (payment) => payment.student.id === viewingStudent.id
      );
    }

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

    return filtered;
  }, [dateFilter, payments, searchQuery, viewingStudent]);

  React.useEffect(() => {
    if (studentId) {
      // Fetch student-specific payments
      fetchStudentPayments(studentId);
      // Also fetch fee data for the forms
      fetchStudentFeeData(studentId);
    } else {
      // Fetch global payments
      fetchGlobalPayments();
      // Also fetch global fee data for the forms
      fetchGlobalFeeData();
    }

    // Cleanup function
    return () => {
      if (!studentId) {
        clearPaymentView(); // Use the renamed function
        clearStudentView(); // Clear fee store
      }
    };
  }, [
    studentId,
    fetchStudentPayments,
    fetchGlobalPayments,
    fetchStudentFeeData,
    fetchGlobalFeeData,
    clearPaymentView, // Use the renamed function
  ]);

  const resetForm = () => {
    setFormData({
      studentId: "",
      feeId: "",
      amount: "",
      discount: "0",
      date: new Date().toISOString().split("T")[0],
    });
    setIsEditing(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUiError("");
    setSuccess("");
    setFormLoading(true);

    try {
      const requestData: AddPaymentData = {
        studentId: formData.studentId,
        feeId: formData.feeId || undefined,
        amount: parseFloat(formData.amount) || 0,
        discount: parseFloat(formData.discount) || 0,
        date: formData.date,
      };
      await addPayment(requestData);
      setSuccess("Payment recorded successfully!");
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      setUiError((err as Error).message);
      if (studentId) {
        fetchStudentPayments(studentId, { force: true });
      } else {
        fetchGlobalPayments({ force: true });
      } // Rollback on error
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (paymentId: string) => {
    if (!confirm("Are you sure...")) return;
    setUiError("");
    setSuccess("");
    try {
      await deletePayment(paymentId);
      setSuccess("Payment deleted successfully!");
    } catch (err) {
      setUiError((err as Error).message);
      if (studentId) {
        fetchStudentPayments(studentId, { force: true });
      } else {
        fetchGlobalPayments({ force: true });
      } // Rollback on error
    }
  };

  const calculateStats = () => {
    // Determine the correct data source based on the view
    const sourcePayments = viewingStudent ? filteredPayments : payments;
    const sourceFees = viewingStudent ? viewingStudent.fees || [] : allFees;

    // --- NEW, CORRECTED CALCULATION LOGIC ---

    // Total collected is the sum of only real payments (money that changed hands).
    const totalCollected = sourcePayments
      .filter((p) => p.type === "PAYMENT")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // Total discounted is the sum of only discount transactions.
    const totalDiscounted = sourcePayments
      .filter((p) => p.type === "DISCOUNT")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // Remaining due is based on all fee amounts minus all transaction types.
    const remainingDue = sourceFees
      .map((fee) => {
        // For each fee, find the total credited (paid or discounted).
        const totalCreditedToFee = (fee.payments || []).reduce(
          (sum: number, p) => sum + Number(p.amount),
          0
        );
        const balance = Number(fee.amount) - totalCreditedToFee;
        return balance > 0 ? balance : 0;
      })
      .reduce((total, balance) => total + balance, 0);

    const todayAmount = sourcePayments
      .filter(
        (p) =>
          p.type === "PAYMENT" &&
          new Date(p.date).toDateString() === new Date().toDateString()
      )
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // The count of actual payment transactions.
    const completedCount = sourcePayments.filter(
      (p) => p.type === "PAYMENT"
    ).length;

    return {
      totalCollected,
      totalDiscounted, // We now have a new, useful stat!
      remainingDue,
      todayAmount,
      completedCount,
    };
  };

  const stats = calculateStats();
  const selectedStudent = students.find((s) => s.id === formData.studentId);
  const availableFees =
    selectedStudent?.fees.filter((fee) => {
      // The total paid is simply the sum of all payments/discounts for that fee.
      const totalPaid = fee.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      return totalPaid < fee.amount; // Only show fees that aren't fully paid
    }) || [];

  const finalError = uiError || paymentsError || feesError;
  const isLoading = paymentsLoading || feesLoading;

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

        {finalError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-600">
              {finalError}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Fees Overview */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Fees
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-2">
                ₹{(stats.totalCollected + stats.remainingDue).toLocaleString()}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Outstanding</span>
                <span className="font-medium text-orange-600">
                  ₹{stats.remainingDue.toLocaleString()}
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
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 mb-2">
                ₹{stats.totalCollected.toLocaleString()}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Discounts</span>
                <span className="font-medium text-purple-600">
                  ₹{stats.totalDiscounted.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Today's Collection */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today&apos;s Collection
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 mb-2">
                ₹{stats.todayAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                As of {new Date().toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          {/* Transactions */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed Payments
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-slate-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-2">
                {stats.completedCount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Total transactions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-2 min-w-64">
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
          loading={isLoading}
          rowKey="id"
          emptyState={
            <div className="text-center py-8 text-gray-500">
              {searchQuery || dateFilter !== "all"
                ? "No payments found matching your filters."
                : "No payments recorded yet."}
            </div>
          }
        />

        {/* Add/Edit Payment Dialog */}
        <div className="">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0">
              {/* Fixed Header */}
              <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
                <DialogHeader className="space-y-0">
                  <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    {isEditing ? "Edit Payment" : "Record New Payment"}
                  </DialogTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {isEditing
                      ? "Update payment details"
                      : "Enter payment information for the student"}
                  </p>
                </DialogHeader>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDialogOpen(false)}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6">
                {/* Error Alert */}
                {finalError && (
                  <Alert className="mb-4 border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">
                      {finalError}
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 pb-6">
                  {/* Student Selection */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="studentId"
                      className="flex items-center gap-2 text-sm font-medium text-gray-700"
                    >
                      <User className="h-4 w-4 text-gray-500" />
                      Student *
                    </Label>
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
                      <SelectTrigger className="h-11 cursor-pointer hover:bg-gray-50 transition-colors">
                        <SelectValue placeholder="Choose a student..." />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem
                            key={student.id}
                            value={student.id}
                            className="cursor-pointer py-3"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {student.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                Roll: {student.rollNumber} • Class:{" "}
                                {student.class}-{student.section}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Fee Selection */}
                  {formData.studentId && availableFees.length > 0 && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="feeId"
                        className="flex items-center gap-2 text-sm font-medium text-gray-700"
                      >
                        <CreditCard className="h-4 w-4 text-gray-500" />
                        Fee Type{" "}
                        <span className="text-gray-400 font-normal">
                          (Optional)
                        </span>
                      </Label>
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
                        <SelectTrigger className="h-11 cursor-pointer hover:bg-gray-50 transition-colors">
                          <SelectValue placeholder="Select fee type or leave empty for general payment" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFees.map((fee) => {
                            const totalPaid = fee.payments.reduce(
                              (sum, p) => sum + p.amount,
                              0
                            );
                            const remaining = fee.amount - totalPaid;
                            return (
                              <SelectItem
                                key={fee.id}
                                value={fee.id}
                                className="cursor-pointer py-3"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span className="font-medium">
                                    {fee.type}
                                  </span>
                                  <div className="flex flex-col items-end">
                                    <span className="text-sm font-semibold text-green-600">
                                      ₹{remaining.toLocaleString()}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      remaining
                                    </span>
                                  </div>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Amount and Discount Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="amount"
                        className="flex items-center gap-2 text-sm font-medium text-gray-700"
                      >
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        Amount Paid *
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          ₹
                        </span>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="h-11 pl-8 text-right"
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
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="discount"
                        className="flex items-center gap-2 text-sm font-medium text-gray-700"
                      >
                        Discount Given
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          ₹
                        </span>
                        <Input
                          id="discount"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="h-11 pl-8 text-right"
                          value={formData.discount}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              discount: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Amount forgiven at the time of payment
                      </p>
                    </div>
                  </div>

                  {/* Payment Date */}
                  <div className="space-y-2">
                    <DatePicker
                      value={formData.date}
                      onChange={(date) =>
                        setFormData((prev) => ({
                          ...prev,
                          date: date || "",
                        }))
                      }
                      label="Payment Date"
                      placeholder="Select payment date"
                      required={true}
                    />
                  </div>
                </form>
              </div>

              {/* Fixed Footer */}
              <div className="border-t border-gray-100 p-6 pt-4 bg-gray-50">
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="h-11 px-6"
                    disabled={formLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={
                      formLoading ||
                      !formData.studentId ||
                      !formData.amount ||
                      !formData.date
                    }
                    className="h-11 px-6 bg-blue-600 hover:bg-blue-700"
                  >
                    {formLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </div>
                    ) : isEditing ? (
                      "Update Payment"
                    ) : (
                      "Record Payment"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AdminLayout>
  );
}
