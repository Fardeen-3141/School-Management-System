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
  CalendarIcon,
} from "lucide-react";
import { PaymentStatus } from "@prisma/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { addMonths, addYears, endOfMonth, format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import {
  ColumnDef,
  ResponsiveList,
} from "@/components/ui/special/ResponsiveList";

interface FeeStructure {
  id: string;
  type: string;
  amount: number;
  recurrence: "ONCE" | "MONTHLY" | "YEARLY";
}

interface StudentFeeSetup {
  id: string;
  feeStructure: FeeStructure;
  customAmount: number | null;
  isActive: boolean;
  lastGeneratedFor: string | null;
}

// This helper object will be useful for displaying human-readable labels
const recurrenceLabel = {
  ONCE: "One-Time",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

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

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  class: string;
  section: string;
}

interface FeeFormData {
  type: string;
  amount: string;
  dueDate: string;
  studentId: string;
  applyToClass: boolean;
  targetClass: string;
  targetSection: string;
}

interface ViewingStudent extends Student {
  user: {
    email: string;
  };
}

export default function AdminFeesPageClient() {
  const [fees, setFees] = React.useState<Fee[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [filteredFees, setFilteredFees] = React.useState<Fee[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  // Navigation to this page
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId");
  const [viewingStudent, setViewingStudent] =
    React.useState<ViewingStudent | null>(null);

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

  const [studentFeeSetups, setStudentFeeSetups] = React.useState<
    StudentFeeSetup[]
  >([]);
  const [allFeeStructures, setAllFeeStructures] = React.useState<
    FeeStructure[]
  >([]);

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
          href={`/admin/fees?studentId=${fee.student.id}`}
          className="hover:underline cursor-pointer"
        >
          <div>
            <div className="font-medium">{fee.student.name}</div>
            <div className="text-sm text-muted-foreground">
              {fee.student.rollNumber} - {fee.student.class}-
              {fee.student.section}
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
      className: "w-[100px]",
    },
    {
      accessorKey: "paid",
      header: "Paid",
      cell: (fee) => {
        const totalPaid = fee.payments
          .filter((p) => p.status === "COMPLETED")
          .reduce((sum, p) => sum + Number(p.amount), 0);
        return `₹${totalPaid.toLocaleString()}`;
      },
      className: "w-[100px]",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (fee) => {
        const feeStatus = getFeeStatus(fee);
        return (
          <Badge
            variant={feeStatus.color as "destructive" | "default" | "secondary"}
          >
            {feeStatus.status.toUpperCase()}
          </Badge>
        );
      },
      className: "w-[100px]",
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
              <span className="sm:hidden ml-1 text-xs">Menu</span>
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
      className: "w-[100px]",
    },
  ];

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // When viewing all fees, the logic is simpler and doesn't change much
      if (!studentId) {
        const feesPromise = fetch("/api/fees");
        const studentsPromise = fetch("/api/students");
        const [feesResponse, studentsResponse] = await Promise.all([
          feesPromise,
          studentsPromise,
        ]);
        if (!feesResponse.ok || !studentsResponse.ok) {
          throw new Error("Failed to fetch initial data.");
        }
        const feesData = await feesResponse.json();
        const studentsData = await studentsResponse.json();
        setFees(feesData);
        setStudents(studentsData);
        setViewingStudent(null); // Ensure student view is cleared
        setStudentFeeSetups([]); // Clear setups
        return;
      }

      // When viewing a single student, fetch all data related to them
      const studentPromise = fetch(`/api/students/${studentId}`);
      const setupsPromise = fetch(`/api/students/${studentId}/fee-setups`);
      const structuresPromise = fetch("/api/fee-structures");

      const [studentResponse, setupsResponse, structuresResponse] =
        await Promise.all([studentPromise, setupsPromise, structuresPromise]);

      if (!studentResponse.ok)
        throw new Error(`Failed to fetch student ID: ${studentId}`);
      if (!setupsResponse.ok)
        throw new Error("Failed to fetch student fee setups.");
      if (!structuresResponse.ok)
        throw new Error("Failed to fetch fee structures.");

      const studentData = await studentResponse.json();
      const setupsData = await setupsResponse.json();
      const structuresData = await structuresResponse.json();

      setViewingStudent(studentData);
      // The student endpoint already returns their generated fees
      setFees(studentData.fees || []);
      setStudentFeeSetups(setupsData);
      setAllFeeStructures(structuresData);
    } catch (err: unknown) {
      setError(
        (err as { message: string }).message ||
          "An error occurred while fetching data."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  const filterFees = React.useCallback(() => {
    let filtered = fees;

    // If viewing a single student, filter by their ID first.
    if (viewingStudent) {
      filtered = filtered.filter((fee) => fee.student.id === viewingStudent.id);
    }

    // Search filter
    // Only apply search if not in student view
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

    // Status filter
    if (statusFilter !== " all") {
      filtered = filtered.filter((fee) => {
        const totalPaid = fee.payments
          .filter((p) => p.status === "COMPLETED")
          .reduce((sum, p) => sum + Number(p.amount), 0);

        if (statusFilter === "paid") return totalPaid >= Number(fee.amount);
        if (statusFilter === "pending") return totalPaid < Number(fee.amount);
        if (statusFilter === "overdue") {
          return (
            totalPaid < Number(fee.amount) && new Date(fee.dueDate) < new Date()
          );
        }
        return true;
      });
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((fee) => fee.type === typeFilter);
    }

    setFilteredFees(filtered);
  }, [fees, searchQuery, statusFilter, typeFilter, viewingStudent]);

  React.useEffect(() => {
    fetchData();
  }, [studentId, fetchData]); // This effect will re-run whenever the studentId in the URL changes

  React.useEffect(() => {
    filterFees();
  }, [fees, searchQuery, statusFilter, typeFilter, viewingStudent, filterFees]);

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
    setError("");
    setSuccess("");
    setFormLoading(true);

    try {
      const url = isEditing ? `/api/fees/${selectedFee?.id}` : "/api/fees";
      const method = isEditing ? "PUT" : "POST";

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

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          isEditing
            ? "Fee updated successfully!"
            : formData.applyToClass
            ? `Fees created for ${data.count || 1} students!`
            : "Fee created successfully!"
        );
        setIsDialogOpen(false);
        resetForm();
        fetchData();
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(
          data.error || `Failed to ${isEditing ? "update" : "create"} fee`
        );
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (feeId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this fee? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/fees/${feeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("Fee deleted successfully!");
        fetchData();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete fee");
      }
    } catch {
      setError("Error deleting fee");
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;
    setSetupFormLoading(true);
    setSuccess("");
    setError("");

    const url = isEditingSetup
      ? `/api/students/${studentId}/fee-setups/${selectedSetup?.id}`
      : `/api/students/${studentId}/fee-setups`;

    const method = isEditingSetup ? "PUT" : "POST";

    const body = isEditingSetup
      ? {
          customAmount: setupFormData.customAmount
            ? parseFloat(setupFormData.customAmount)
            : null,
        }
      : { feeStructureId: setupFormData.feeStructureId };

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save fee rule.");
      }
      setSuccess("Fee rule saved successfully!");
      setIsSetupDialogOpen(false);
      fetchData(); // Refresh all data
    } catch (err: unknown) {
      setError((err as { message: string }).message);
    } finally {
      setSetupFormLoading(false);
    }
  };

  const handleToggleSetupActive = async (setup: StudentFeeSetup) => {
    if (!studentId) return;
    setSuccess("");
    setError("");

    try {
      const response = await fetch(
        `/api/students/${studentId}/fee-setups/${setup.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !setup.isActive }),
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update status.");
      }
      setSuccess(
        `Fee rule '${setup.feeStructure.type}' has been ${
          !setup.isActive ? "activated" : "deactivated"
        }.`
      );
      fetchData(); // Refresh all data
    } catch (err: unknown) {
      setError((err as { message: string }).message);
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
    setError("");

    try {
      const response = await fetch(
        `/api/students/${studentId}/fee-setups/${setup.id}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove fee rule.");
      }
      setSuccess("Fee rule removed successfully.");
      fetchData(); // Refresh all data
    } catch (err: unknown) {
      setError((err as { message: string }).message);
    }
  };

  const getFeeStatus = (fee: Fee) => {
    const totalPaid = fee.payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const isOverdue = new Date(fee.dueDate) < new Date();

    if (totalPaid >= Number(fee.amount))
      return { status: "paid", color: "default" };

    if (isOverdue) return { status: "overdue", color: "destructive" };
    return { status: "pending", color: "secondary" };
  };

  const calculateStats = () => {
    // Use filteredFees for stats when viewing a student, otherwise use all fees
    const sourceData = viewingStudent ? filteredFees : fees;

    const totalFees = sourceData.reduce(
      (sum, fee) => sum + Number(fee.amount),
      0
    );
    const totalPaid = sourceData.reduce((sum, fee) => {
      const paid = fee.payments
        .filter((p) => p.status === "COMPLETED")
        .reduce((paidSum, p) => paidSum + Number(p.amount), 0);
      return sum + paid;
    }, 0);
    const totalPending = totalFees - totalPaid;
    const overdueCount = sourceData.filter((fee) => {
      const totalPaid = fee.payments
        .filter((p) => p.status === "COMPLETED")
        .reduce((sum, p) => sum + Number(p.amount), 0);
      return (
        totalPaid < Number(fee.amount) && new Date(fee.dueDate) < new Date()
      );
    }).length;

    return { totalFees, totalPaid, totalPending, overdueCount };
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
              <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{stats.totalFees.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collected</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₹{stats.totalPaid.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                ₹{stats.totalPending.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <CalendarIcon className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.overdueCount}
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Edit Fee" : "Create New Fee"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-1">
                <Label htmlFor="type">Fee Type *</Label>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, type: e.target.value }))
                  }
                  placeholder="e.g., Tuition Fee, Library Fee, Lab Fee"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between text-left font-normal cursor-pointer"
                    >
                      {formData.dueDate ? (
                        format(new Date(formData.dueDate), "PPP")
                      ) : (
                        <span>Select date</span>
                      )}
                      <CalendarIcon className="ml-2 h-4 w-4 text-gray-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        formData.dueDate
                          ? new Date(formData.dueDate)
                          : undefined
                      }
                      onSelect={(date) =>
                        setFormData((prev) => ({
                          ...prev,
                          dueDate: date ? date.toISOString().split("T")[0] : "",
                        }))
                      }
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {!isEditing && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
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
                      className="rounded cursor-pointer"
                    />
                    <Label htmlFor="applyToClass">Apply to entire class</Label>
                  </div>

                  {formData.applyToClass ? (
                    <div className="space-y-8">
                      <div className="space-y-1">
                        <Label htmlFor="targetClass">Class *</Label>
                        <Select
                          value={formData.targetClass}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              targetClass: value,
                            }))
                          }
                        >
                          <SelectTrigger className="cursor-pointer">
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                          <SelectContent>
                            {uniqueClasses.map((cls) => (
                              <SelectItem
                                key={cls}
                                value={cls}
                                className="cursor-pointer"
                              >
                                {cls}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="targetSection">
                          Section (Optional)
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
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Label htmlFor="studentId">Student *</Label>
                      <Select
                        value={formData.studentId}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, studentId: value }))
                        }
                        disabled={!!viewingStudent || formData.applyToClass}
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
                              {student.name} - {student.rollNumber} (
                              {student.class}-{student.section})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {isEditing && (
                <div>
                  <Label htmlFor="studentIdEdit">Student</Label>
                  <Input
                    value={`${selectedFee?.student.name} - ${selectedFee?.student.rollNumber}`}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
              )}

              <div className="flex space-x-4 pt-4">
                <Button
                  type="submit"
                  disabled={formLoading}
                  className="cursor-pointer"
                >
                  {formLoading
                    ? "Saving..."
                    : isEditing
                    ? "Update Fee"
                    : "Create Fee"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
            </form>
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
