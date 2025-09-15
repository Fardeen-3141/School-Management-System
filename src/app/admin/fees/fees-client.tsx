// src\app\admin\fees\page.tsx

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogClose,
  DialogContent,
  DialogFooter,
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
  X,
  AlertCircle,
  GraduationCap,
  Users,
  Book,
  SquareStack,
  User,
  Clock,
} from "lucide-react";
import { addMonths, addYears, endOfMonth, format } from "date-fns";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import {
  ColumnDef,
  ResponsiveList,
} from "@/components/ui/special/ResponsiveList";
import { DatePicker } from "@/components/ui/special/DatePicker";
import { useFeeStore, Fee, StudentFeeSetup } from "@/stores/useFeeStore";

// This helper object will be useful for displaying human-readable labels
const recurrenceLabel = {
  ONCE: "One-Time",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

interface FeeFormData {
  type: string;
  amount: string;
  dueDate: string;
  studentId: string;
  applyToClass: boolean;
  targetClass: string;
  targetSection: string;
}

export default function AdminFeesPageClient() {
  const {
    fees,
    students,
    studentFeeSetups,
    allFeeStructures,
    viewingStudent,
    loading,
    error: storeError,
    fetchGlobalFeeData,
    fetchStudentFeeData,
    addFee,
    updateFee,
    deleteFee,
    addStudentFeeSetup,
    updateStudentFeeSetup,
    deleteStudentFeeSetup,
    clearStudentView,
  } = useFeeStore();

  // --- LOCAL UI STATE ---
  const [uiError, setUiError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  // Navigation to this page
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId");

  // Form state
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [selectedFee, setSelectedFee] = React.useState<Fee | null>(null);
  const [formLoading, setFormLoading] = React.useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");

  const [formData, setFormData] = React.useState<FeeFormData>({
    type: "",
    amount: "",
    dueDate: "",
    studentId: "",
    applyToClass: false,
    targetClass: "",
    targetSection: "",
  });

  // State for the new "Fee Setup" dialog
  const [isSetupDialogOpen, setIsSetupDialogOpen] = React.useState(false);
  const [isEditingSetup, setIsEditingSetup] = React.useState(false);
  const [selectedSetup, setSelectedSetup] =
    React.useState<StudentFeeSetup | null>(null);
  const [setupFormLoading, setSetupFormLoading] = React.useState(false);
  const [setupFormData, setSetupFormData] = React.useState({
    feeStructureId: "",
    customAmount: "",
  });

  const feeColumns: ColumnDef<Fee>[] = [
    {
      accessorKey: "student",
      header: "Student",
      cell: (fee) => (
        <Link
          href={`/admin/fees?studentId=${fee.student?.id}`}
          className="hover:underline cursor-pointer"
        >
          <div>
            <div className="font-medium">{fee.student?.name}</div>
            <div className="text-sm text-muted-foreground">
              {fee.student?.rollNumber} - {fee.student?.class}-
              {fee.student?.section}
            </div>
          </div>
        </Link>
      ),
    },
    {
      accessorKey: "type",
      header: "Fee Type",
      cell: (fee) => <span className="font-medium">{fee.type}</span>,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: (fee) => `₹${Number(fee.amount).toLocaleString()}`,
    },
    {
      accessorKey: "paid",
      header: "Paid",
      cell: (fee) => {
        // CORRECTED LOGIC: Sums all payments and discounts together.
        const totalPaid = fee.payments.reduce(
          (sum, p) => sum + Number(p.amount),
          0
        );
        return `₹${totalPaid.toLocaleString()}`;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (fee) => {
        // This now works correctly because we updated getFeeStatus!
        const feeStatus = getFeeStatus(fee);
        return (
          <Badge variant={feeStatus.color}>
            {feeStatus.status.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: (fee) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer h-9 px-3"
            >
              <span className="hidden sm:inline mr-2">Actions</span>
              <MoreVertical className="h-4 w-4 sm:hidden" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => openEditDialog(fee)}
              className="cursor-pointer"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Fee
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(fee.id)}
              className="text-red-600 cursor-pointer"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Fee
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filteredFees = React.useMemo(() => {
    // The filtering logic itself doesn't need to change, just how it gets the initial fees array.
    let filtered = fees;
    if (viewingStudent) {
      return filtered; // In student view, we show all their fees
    }

    // --- LOGIC FOR THE GLOBAL VIEW ---

    // Search filter (this is fine)
    if (searchQuery && !viewingStudent) {
      filtered = filtered.filter(
        (fee) =>
          fee.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          fee.student.rollNumber
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          fee.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // --- CORRECTED STATUS FILTER LOGIC ---
    if (statusFilter !== "all") {
      filtered = filtered.filter((fee) => {
        // Use our already-corrected helper function!
        const currentStatus = getFeeStatus(fee).status; // This returns 'PAID', 'PENDING', or 'OVERDUE'

        // The filter dropdown sends 'paid', 'pending', 'overdue'.
        // We match them (case-insensitively).
        return currentStatus.toLowerCase() === statusFilter;
      });
    }

    // Type filter (this is fine)
    if (typeFilter !== "all") {
      filtered = filtered.filter((fee) => fee.type === typeFilter);
    }

    return filtered;
  }, [fees, searchQuery, statusFilter, typeFilter, viewingStudent]);

  React.useEffect(() => {
    if (studentId) {
      fetchStudentFeeData(studentId);
    } else {
      fetchGlobalFeeData();
    }

    // Don't clear student view here - let it persist during navigation
  }, [studentId, fetchStudentFeeData, fetchGlobalFeeData]);

  // Add a separate effect for cleanup only when truly navigating away
  React.useEffect(() => {
    return () => {
      // Only clear when component unmounts
      if (!studentId) {
        clearStudentView();
      }
    };
  }, [clearStudentView, studentId]); // Empty dependency array - only runs on unmount

  const resetForm = () => {
    setFormData({
      type: "",
      amount: "",
      dueDate: "",
      studentId: "",
      applyToClass: false,
      targetClass: "",
      targetSection: "",
    });
    setIsEditing(false);
    setSelectedFee(null);
  };

  const openCreateDialog = () => {
    resetForm();
    // If we're in the student view, pre-fill the student ID
    if (viewingStudent) {
      setFormData((prev) => ({ ...prev, studentId: viewingStudent.id }));
    }
    setIsDialogOpen(true);
  };

  const openEditDialog = (fee: Fee) => {
    setFormData({
      type: fee.type,
      amount: fee.amount.toString(),
      dueDate: fee.dueDate.split("T")[0],
      studentId: fee.student.id,
      applyToClass: false,
      targetClass: "",
      targetSection: "",
    });
    setSelectedFee(fee);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUiError("");
    setSuccess("");
    setFormLoading(true);

    try {
      let requestData;

      if (formData.applyToClass && !isEditing) {
        // Bulk create for class
        requestData = {
          type: formData.type,
          amount: parseFloat(formData.amount),
          dueDate: formData.dueDate,
          applyToClass: true,
          targetClass: formData.targetClass,
          targetSection: formData.targetSection || undefined,
        };
      } else {
        // Single student fee
        requestData = {
          type: formData.type,
          amount: parseFloat(formData.amount),
          dueDate: formData.dueDate,
          studentId: formData.studentId,
        };
      }

      if (isEditing && selectedFee) {
        await updateFee(selectedFee.id, requestData);
        setSuccess("Fee updated successfully!");
      } else {
        await addFee(requestData);
        setSuccess(
          formData.applyToClass
            ? " Fees created for students!"
            : "Fee created successfully!"
        );
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      setUiError((err as Error).message);
      if (studentId) {
        fetchStudentFeeData(studentId, { force: true });
      } else {
        fetchGlobalFeeData({ force: true });
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (feeId: string) => {
    if (!confirm("Are you sure...")) return;

    setUiError("");
    try {
      await deleteFee(feeId);
      setSuccess("Fee deleted successfully!");
    } catch (err) {
      setUiError((err as Error).message);
      if (studentId) {
        fetchStudentFeeData(studentId, { force: true });
      } else {
        fetchGlobalFeeData({ force: true });
      }
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;
    setSetupFormLoading(true);
    setSuccess("");
    setUiError("");
    try {
      if (isEditingSetup && selectedSetup) {
        const body = {
          customAmount: setupFormData.customAmount
            ? parseFloat(setupFormData.customAmount)
            : null,
        };
        await updateStudentFeeSetup(studentId, selectedSetup.id, body);
      } else {
        const body = { feeStructureId: setupFormData.feeStructureId };
        await addStudentFeeSetup(studentId, body);
      }
      setSuccess("Fee rule saved successfully!");
      setIsSetupDialogOpen(false);
    } catch (err) {
      setUiError((err as Error).message);
      if (studentId) {
        fetchStudentFeeData(studentId, { force: true }); // Rollback on error
      }
    } finally {
      setSetupFormLoading(false);
    }
  };

  const handleToggleSetupActive = async (setup: StudentFeeSetup) => {
    if (!studentId) return;
    setSuccess("");
    setUiError("");

    try {
      await updateStudentFeeSetup(studentId, setup.id, {
        isActive: !setup.isActive,
      });
      setSuccess(
        `Fee rule '${setup.feeStructure.type}' has been ${
          !setup.isActive ? "activated" : "deactivated"
        }.`
      );
    } catch (err) {
      setUiError((err as Error).message);
      if (studentId) {
        fetchStudentFeeData(studentId, { force: true }); // Rollback on error
      }
    }
  };

  const handleRemoveSetup = async (setup: StudentFeeSetup) => {
    if (
      !studentId ||
      !confirm(
        `Are you sure you want to remove the '${setup.feeStructure.type}' rule from this student?`
      )
    )
      return;

    setSuccess("");
    setUiError("");

    try {
      await deleteStudentFeeSetup(studentId, setup.id);
      setSuccess("Fee rule removed successfully.");
    } catch (err) {
      setUiError((err as Error).message);
      if (studentId) {
        fetchStudentFeeData(studentId, { force: true }); // Rollback on error
      }
    }
  };

  const getFeeStatus = (fee: Fee) => {
    // 1. Calculate the total credited amount (includes PAYMENTS and DISCOUNTS)
    const totalCredited = fee.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    const balance = Number(fee.amount) - totalCredited;

    // 2. Determine status based on the balance
    if (balance <= 0) {
      return { status: "PAID", color: "default" as const };
    }

    const isOverdue = new Date(fee.dueDate) < new Date();
    if (isOverdue) {
      return { status: "OVERDUE", color: "destructive" as const };
    }

    return { status: "PENDING", color: "secondary" as const };
  };

  const calculateStats = () => {
    const sourceData = viewingStudent ? fees : fees;

    const totalFees = sourceData.reduce(
      (sum, fee) => sum + Number(fee.amount),
      0
    );

    let totalCollected = 0;
    let totalDiscounted = 0;

    // Iterate through all fees to sum up their associated payments and discounts
    sourceData.forEach((fee) => {
      (fee.payments || []).forEach((p) => {
        if (p.type === "PAYMENT") {
          totalCollected += Number(p.amount);
        } else if (p.type === "DISCOUNT") {
          totalDiscounted += Number(p.amount);
        }
      });
    });

    const totalCredited = totalCollected + totalDiscounted;
    const totalPending = totalFees - totalCredited;

    const overdueCount = sourceData.filter((fee) => {
      const feeStatus = getFeeStatus(fee);
      return feeStatus.status === "OVERDUE";
    }).length;

    return {
      totalFees,
      totalCollected,
      totalDiscounted,
      totalPending,
      overdueCount,
    };
  };

  const calculateNextDueDate = (setup: StudentFeeSetup): string => {
    // If the rule is inactive or one-time, there's no next due date.
    if (!setup.isActive) {
      return "N/A";
    }
    if (setup.feeStructure.recurrence === "ONCE") {
      return "One-Time Fee";
    }

    // The last date a fee was generated for this rule.
    const lastDate = setup.lastGeneratedFor
      ? new Date(setup.lastGeneratedFor)
      : null;

    let nextPeriod: Date;

    if (setup.feeStructure.recurrence === "MONTHLY") {
      // If it's never been generated, the next is for the current month.
      // Otherwise, it's for the month after the last generation.
      nextPeriod = lastDate ? addMonths(lastDate, 1) : new Date();
    } else {
      // YEARLY
      nextPeriod = lastDate ? addYears(lastDate, 1) : new Date();
    }

    // The cron job sets the due date to the end of the month.
    const nextDueDate = endOfMonth(nextPeriod);

    return format(nextDueDate, "PPP"); // e.g., "Sep 30th, 2025"
  };

  const stats = calculateStats();
  const uniqueTypes = Array.from(new Set(fees.map((f) => f.type))).sort();
  const uniqueClasses = Array.from(
    new Set(students.map((s) => s.class))
  ).sort();

  const finalError = uiError || storeError;

  // In your fees page, before the ResponsiveList component:
  if (loading && fees.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">
              Loading {studentId ? "student" : "fees"} data...
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {viewingStudent && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <CardTitle className="text-2xl">
                    Fee Ledger: {viewingStudent.name}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {viewingStudent.class}-{viewingStudent.section} | Roll No:{" "}
                    {viewingStudent.rollNumber}
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Link
                    href={`/admin/payments?studentId=${viewingStudent.id}`}
                    className="flex-1"
                  >
                    <Button
                      variant="secondary"
                      className="w-full cursor-pointer"
                    >
                      View Payment History
                    </Button>
                  </Link>
                  <Link href="/admin/fees" className="flex-1">
                    <Button variant="outline" className="w-full cursor-pointer">
                      &larr; All Fees
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Card for Managing Fee Rules */}
        {viewingStudent && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle>Recurring Fee Rules</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage automated fee generation for this student.
                </p>
              </div>
              <Button
                className="cursor-pointer"
                onClick={() => {
                  setIsEditingSetup(false);
                  setSetupFormData({ feeStructureId: "", customAmount: "" });
                  setIsSetupDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" /> Apply New Rule
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fee Type</TableHead>
                    <TableHead>Recurrence</TableHead>
                    <TableHead>Standard Amount</TableHead>
                    <TableHead>Custom Amount</TableHead>
                    <TableHead>Next Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentFeeSetups.length > 0 ? (
                    studentFeeSetups.map((setup) => (
                      <TableRow key={setup.id}>
                        <TableCell className="font-medium">
                          {setup.feeStructure.type}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {recurrenceLabel[setup.feeStructure.recurrence]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          ₹{Number(setup.feeStructure.amount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {setup.customAmount ? (
                            `₹${Number(setup.customAmount).toLocaleString()}`
                          ) : (
                            <span className="text-muted-foreground">
                              Default
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{calculateNextDueDate(setup)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={setup.isActive}
                              onCheckedChange={() =>
                                handleToggleSetupActive(setup)
                              }
                              className="cursor-pointer"
                            />
                            <span
                              className={
                                setup.isActive
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {setup.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="cursor-pointer"
                            onClick={() => {
                              setIsEditingSetup(true);
                              setSelectedSetup(setup);
                              setSetupFormData({
                                feeStructureId: "", // Not needed for edit
                                customAmount: String(setup.customAmount ?? ""),
                              });
                              setIsSetupDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 cursor-pointer"
                            onClick={() => handleRemoveSetup(setup)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground"
                      >
                        No recurring fee rules applied to this student.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <h2 className="text-xl font-bold pt-4">Generated Fee Ledger</h2>

        <div className="flex justify-between items-center">
          <div>
            {/* Hide the main title if viewing a student */}
            {!viewingStudent && (
              <>
                <h1 className="text-3xl font-bold">Fees Management</h1>
                <p className="text-gray-600">
                  Manage student fees, dues, and payment tracking
                </p>
              </>
            )}
          </div>
          <Button onClick={openCreateDialog} className="cursor-pointer">
            <Plus className="h-4 w-4 mr-2" />
            Create Fee
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
          {/* Total Fees Generated */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Fees Generated
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-2">
                ₹{stats.totalFees.toLocaleString()}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Total value created
                </span>
                <span className="text-xs text-blue-600 font-medium">100%</span>
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

          {/* Total Pending */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pending
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 mb-2">
                ₹{stats.totalPending.toLocaleString()}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Outstanding</span>
                <span className="text-xs font-medium text-orange-600">
                  {((stats.totalPending / stats.totalFees) * 100).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Overdue Fees */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overdue Fees
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 mb-2">
                {stats.overdueCount.toLocaleString()}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Past due date</span>
                <span className="text-xs font-medium text-red-600">Urgent</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        {!viewingStudent && (
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search fees..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex grow gap-4">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="flex-1 cursor-pointer">
                      <SelectValue placeholder="Filter by Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="cursor-pointer">
                        All Types
                      </SelectItem>
                      {uniqueTypes.map((type) => (
                        <SelectItem
                          key={type}
                          value={type}
                          className="cursor-pointer"
                        >
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="flex-1 cursor-pointer">
                      <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="cursor-pointer">
                        All Status
                      </SelectItem>
                      <SelectItem value="paid" className="cursor-pointer">
                        Paid
                      </SelectItem>
                      <SelectItem value="pending" className="cursor-pointer">
                        Pending
                      </SelectItem>
                      <SelectItem value="overdue" className="cursor-pointer">
                        Overdue
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fees Table */}
        <ResponsiveList
          columns={feeColumns}
          data={filteredFees}
          loading={loading}
          rowKey="id"
          emptyState={
            <div className="text-center py-8 text-gray-500">
              {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                ? "No fees found matching your filters."
                : "No fees have been generated yet."}
            </div>
          }
        />

        {/* Add/Edit Fee Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-hidden flex flex-col p-0">
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
              <DialogHeader className="space-y-0">
                <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  {isEditing ? "Edit Fee" : "Create New Fee"}
                </DialogTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {isEditing
                    ? "Update fee details"
                    : "Add a new fee for student(s)"}
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

              <div className="space-y-6 pb-6">
                {/* Fee Type */}
                <div className="space-y-2">
                  <Label
                    htmlFor="type"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700"
                  >
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    Fee Type *
                  </Label>
                  <Input
                    id="type"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, type: e.target.value }))
                    }
                    placeholder="e.g., Tuition Fee, Library Fee, Lab Fee"
                    className="h-11"
                    required
                  />
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label
                    htmlFor="amount"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700"
                  >
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    Amount *
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
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          amount: e.target.value,
                        }))
                      }
                      placeholder="0.00"
                      className="h-11 pl-8 text-right"
                      required
                    />
                  </div>
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <DatePicker
                    value={formData.dueDate}
                    onChange={(date) =>
                      setFormData((prev) => ({
                        ...prev,
                        dueDate: date || "",
                      }))
                    }
                    label="Due Date"
                    placeholder="Select due date"
                    required={true}
                  />
                </div>

                {!isEditing && (
                  <div className="space-y-4">
                    {/* Apply To Class Toggle */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="applyToClass"
                          checked={formData.applyToClass}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              applyToClass: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <Label
                          htmlFor="applyToClass"
                          className="flex items-center gap-2 text-sm font-medium text-gray-900 cursor-pointer"
                        >
                          <Users className="h-4 w-4 text-gray-500" />
                          Apply to entire class
                        </Label>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 ml-7">
                        Check this to apply the fee to all students in a
                        specific class/section
                      </p>
                    </div>

                    {formData.applyToClass ? (
                      <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <GraduationCap className="h-4 w-4 text-blue-600" />
                          <h4 className="text-sm font-medium text-gray-900">
                            Class Selection
                          </h4>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="targetClass"
                              className="flex items-center gap-2 text-sm font-medium text-gray-700"
                            >
                              <Book className="h-4 w-4 text-gray-500" />
                              Class *
                            </Label>
                            <Select
                              value={formData.targetClass}
                              onValueChange={(value) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  targetClass: value,
                                }))
                              }
                            >
                              <SelectTrigger className="h-11 cursor-pointer hover:bg-gray-50 transition-colors">
                                <SelectValue placeholder="Select class" />
                              </SelectTrigger>
                              <SelectContent>
                                {uniqueClasses.map((cls) => (
                                  <SelectItem
                                    key={cls}
                                    value={cls}
                                    className="cursor-pointer py-2"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Book className="h-4 w-4 text-gray-500" />
                                      Class {cls}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor="targetSection"
                              className="flex items-center gap-2 text-sm font-medium text-gray-700"
                            >
                              <SquareStack className="h-4 w-4 text-gray-500" />
                              Section{" "}
                              <span className="text-gray-400 font-normal">
                                (Optional)
                              </span>
                            </Label>
                            <Input
                              id="targetSection"
                              value={formData.targetSection}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  targetSection: e.target.value,
                                }))
                              }
                              placeholder="Leave empty for all sections"
                              className="h-11"
                            />
                            <p className="text-xs text-gray-500">
                              Specify a section (A, B, C) or leave empty to
                              apply to all sections
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
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
                            }))
                          }
                          disabled={!!viewingStudent || formData.applyToClass}
                        >
                          <SelectTrigger className="h-11 cursor-pointer hover:bg-gray-50 transition-colors">
                            <SelectValue placeholder="Select student" />
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
                    )}
                  </div>
                )}

                {isEditing && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="studentIdEdit"
                      className="flex items-center gap-2 text-sm font-medium text-gray-700"
                    >
                      <User className="h-4 w-4 text-gray-500" />
                      Student
                    </Label>
                    <Input
                      value={`${selectedFee?.student.name} - ${selectedFee?.student.rollNumber}`}
                      disabled
                      className="h-11 bg-gray-100 text-gray-600"
                    />
                    <p className="text-xs text-gray-500">
                      Student cannot be changed when editing a fee
                    </p>
                  </div>
                )}
              </div>
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
                    !formData.type ||
                    !formData.amount ||
                    !formData.dueDate
                  }
                  className="h-11 px-6 bg-blue-600 hover:bg-blue-700"
                >
                  {formLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : isEditing ? (
                    "Update Fee"
                  ) : (
                    "Create Fee"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* --- Fees Rules Dialog --- */}
        <Dialog open={isSetupDialogOpen} onOpenChange={setIsSetupDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditingSetup ? "Edit Fee Rule" : "Apply New Fee Rule"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSetupSubmit} className="space-y-8">
              {isEditingSetup ? (
                // --- EDIT MODE ---
                <div>
                  <Label>
                    Custom Amount (₹) for {selectedSetup?.feeStructure.type}
                  </Label>
                  <Input
                    value={setupFormData.customAmount}
                    onChange={(e) =>
                      setSetupFormData((prev) => ({
                        ...prev,
                        customAmount: e.target.value,
                      }))
                    }
                    placeholder={`Default: ₹${Number(
                      selectedSetup?.feeStructure.amount
                    ).toLocaleString()}`}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave blank to use the default amount.
                  </p>
                </div>
              ) : (
                // --- CREATE MODE ---
                <div>
                  <Label>Fee Structure</Label>
                  <Select
                    required
                    value={setupFormData.feeStructureId}
                    onValueChange={(val) =>
                      setSetupFormData((prev) => ({
                        ...prev,
                        feeStructureId: val,
                      }))
                    }
                  >
                    <SelectTrigger className="cursor-pointer">
                      <SelectValue placeholder="Select a fee structure..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allFeeStructures
                        .filter(
                          (s) =>
                            !studentFeeSetups.some(
                              (applied) => applied.feeStructure.id === s.id
                            )
                        )
                        .map((structure) => (
                          <SelectItem
                            key={structure.id}
                            value={structure.id}
                            className="cursor-pointer"
                          >
                            {structure.type} (₹
                            {Number(structure.amount).toLocaleString()}) -{" "}
                            {recurrenceLabel[structure.recurrence]}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <DialogFooter>
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  disabled={setupFormLoading}
                  className="cursor-pointer"
                >
                  {setupFormLoading
                    ? "Saving..."
                    : isEditingSetup
                    ? "Save Changes"
                    : "Apply Rule"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
