// src\app\admin\students\page.tsx

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ResponsiveList,
  ColumnDef,
} from "@/components/ui/special/ResponsiveList";
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
  UserPlus,
  MoreVertical,
  Search,
  PauseCircle,
  User,
  Hash,
  Mail,
  Book,
  SquareStack,
  Phone,
  MapPin,
  Eye,
  DollarSign,
  Save,
  Users,
  AlertCircle,
  X,
  GraduationCap,
  Download,
} from "lucide-react";
import { UserStatus } from "@prisma/client";
import Link from "next/link";
import { DatePicker } from "@/components/ui/special/DatePicker";
import {
  useStudentStore,
  AddStudentData,
  UpdateStudentData,
} from "@/stores/useStudentStore";
import { toast } from "sonner";

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
  dateOfBirth: string | null;
  admissionDate: string;
  user: {
    id: string;
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
    type: "PAYMENT" | "DISCOUNT";
    date: string;
  }>;
}

interface StudentFormData {
  name: string;
  email: string;
  class: string;
  section: string;
  rollNumber: string;
  guardian: string;
  guardianPhone: string;
  guardianEmail: string;
  address: string;
  dateOfBirth: string;
}

const classOptions = [
  "PP-1",
  "PP-2",
  "Class-1",
  "Class-2",
  "Class-3",
  "Class-4",
  "Class-5",
  "Class-6",
  "Class-7",
  "Class-8",
  "Class-9",
  "Class-10",
  "Class-11 (HS)",
  "Class-12 (HS)",
];

const sectionOptions = ["A", "B", "C", "D"];

export default function AdminStudentsPage() {
  // All data-related state, coming from our Zustand store.
  const {
    students,
    loading,
    error: storeError,
    fetchStudents,
    addStudent,
    updateStudent,
    deleteStudent,
    updateStudentStatus,
  } = useStudentStore();

  // Local UI state for dialogs, forms, and success messages.
  const [uiError, setUiError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [selectedStudentId, setSelectedStudentId] = React.useState<
    string | null
  >(null);
  const [formLoading, setFormLoading] = React.useState(false);

  // Filter state remains local to the component.
  const [searchQuery, setSearchQuery] = React.useState("");
  const [classFilter, setClassFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const [formData, setFormData] = React.useState<StudentFormData>({
    name: "",
    email: "",
    class: "",
    section: "A",
    rollNumber: "",
    guardian: "",
    guardianPhone: "",
    guardianEmail: "",
    address: "",
    dateOfBirth: "",
  });

  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: "name",
      header: "Student",
      cell: (student) => (
        <div>
          <div className="font-medium">{student.name}</div>
          <div className="text-sm text-muted-foreground">
            {student.user.email}
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
      cell: (student) => (
        <span className="font-medium">
          {student.class}-{student.section}
        </span>
      ),
    },
    {
      accessorKey: "guardian",
      header: "Guardian",
      cell: (student) => (
        <div>
          <div className="font-medium">{student.guardian}</div>
          <div className="text-sm text-muted-foreground">
            {student.guardianPhone}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (student) => (
        <Badge variant={getStatusColor(student.user.status)}>
          {student.user.status}
        </Badge>
      ),
      className: "w-[100px]", // Fixed width for consistent table layout
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
      className: "w-[120px]", // Fixed width for fee status
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: (student) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer h-9 px-3 mobile-actions-button"
            >
              <span className="hidden sm:inline mr-2">Actions</span>
              <MoreVertical className="h-4 w-4 sm:hidden" />
              <span className="sm:hidden ml-1 text-xs">Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href={`/admin/fees?studentId=${student.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                View Fees
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href={`/admin/payments?studentId=${student.id}`}>
                <DollarSign className="h-4 w-4 mr-2" />
                View Payments
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => openEditDialog(student)}
              className="cursor-pointer"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Details
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href={`/api/students/${student.id}/export`} target="_blank">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                handleStatusChange(
                  student.id,
                  student.user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"
                )
              }
              className="cursor-pointer"
            >
              <PauseCircle className="h-4 w-4 mr-2" />
              {student.user.status === "ACTIVE" ? "Suspend" : "Activate"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(student.id)}
              className="text-red-600 cursor-pointer"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Student
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: "w-[100px]",
    },
  ];

  const filteredStudents = React.useMemo(() => {
    let filtered = students;

    if (searchQuery) {
      filtered = filtered.filter(
        (student) =>
          student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.rollNumber
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          student.user.email
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          student.guardian.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (classFilter !== "all") {
      filtered = filtered.filter((student) => student.class === classFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (student) => student.user.status === statusFilter
      );
    }

    return filtered;
  }, [students, searchQuery, classFilter, statusFilter]);

  // console.log("Filtered Students", filteredStudents)

  React.useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      class: "",
      section: "A",
      rollNumber: "",
      guardian: "",
      guardianPhone: "",
      guardianEmail: "",
      address: "",
      dateOfBirth: "",
    });
    setIsEditing(false);
    setSelectedStudentId(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (student: Student) => {
    setFormData({
      name: student.name,
      email: student.user.email,
      class: student.class,
      section: student.section,
      rollNumber: student.rollNumber,
      guardian: student.guardian,
      guardianPhone: student.guardianPhone,
      guardianEmail: student.guardianEmail ?? "",
      address: student.address ?? "",
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split("T")[0] : "",
    });
    setSelectedStudentId(student.id);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUiError("");
    setSuccess("");
    setFormLoading(true);

    try {
      if (isEditing && selectedStudentId) {
        const updateData: UpdateStudentData = {
          ...formData,
          guardianEmail: formData.guardianEmail || null,
          address: formData.address || null,
          dateOfBirth: formData.dateOfBirth || null,
        };
        await updateStudent(selectedStudentId, updateData);
        setSuccess("Student updated successfully!");
      } else {
        const addData: AddStudentData = {
          ...formData,
          guardianEmail: formData.guardianEmail || null,
          address: formData.address || null,
          dateOfBirth: formData.dateOfBirth || null,
        };
        console.log("Students data", addData);
        await addStudent(addData);
        setSuccess("Student created successfully!");
      }
      toast.success(
        <div className="text-green-500">
          <strong>Success</strong>
          <div>Student Created Successfully</div>
        </div>
      );
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setUiError(errorMessage);
      toast.error(
        <div className="text-destructive">
          <strong>Error</strong>
          <div>Failed to create student</div>
        </div>
      );
      fetchStudents({ force: true }); // Rollback on error
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (studentId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this student? This will also delete all associated fees, payments, and attendance records."
      )
    ) {
      return;
    }
    setUiError("");
    setSuccess("");
    try {
      await deleteStudent(studentId);
      setSuccess("Student deleted successfully!");
      toast.success(
        <div className="text-green-500">
          <strong>Success</strong>
          <div>Student Deleted Successfully</div>
        </div>
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete student";
      setUiError(errorMessage);
      toast.error(
        <div className="text-destructive">
          <strong>Error</strong>
          <div>Failed to delete student</div>
        </div>
      );
      fetchStudents({ force: true }); // Rollback on error
    }
  };

  const handleStatusChange = async (
    studentId: string,
    newStatus: UserStatus
  ) => {
    setUiError("");
    setSuccess("");
    try {
      await updateStudentStatus(studentId, newStatus);
      setSuccess("Student status updated!");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update status";
      setUiError(errorMessage);
      fetchStudents({ force: true }); // Rollback on error
    }
  };

  const calculateTotalFees = (student: Student) => {
    return student.fees?.reduce((total, fee) => total + Number(fee.amount), 0);
  };

  const calculateTotalPaid = (student: Student) => {
    // Simply sum the amount of all transactions, as both PAYMENTS and DISCOUNTS reduce the debt.
    return student.payments?.reduce(
      (total, payment) => total + Number(payment.amount),
      0
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "PENDING":
        return "secondary";
      case "SUSPENDED":
        return "destructive";
      case "INACTIVE":
        return "outline";
      default:
        return "default";
    }
  };

  const uniqueClasses = Array.from(
    new Set(students.map((s) => s.class))
  ).sort();

  const finalError = uiError || storeError;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center gap-2">
          <div>
            <h1 className="text-3xl font-bold">Students Management</h1>
            <p className="text-gray-600">
              Manage student records, profiles, and status
            </p>
          </div>
          <div className="flex flex-col lg:flex-row items-center gap-2">
            <Link href="/api/students/export-all" target="_blank">
              <Button variant="outline" className="cursor-pointer tracking-tight">
                <Download className="h-4 w-4 mr-2" />
                Export All as PDF
              </Button>
            </Link>
            <Button onClick={openCreateDialog} className="cursor-pointer !px-6">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </div>
        </div>

        {finalError && (
          <Alert variant="destructive">
            <AlertDescription>{finalError}</AlertDescription>
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
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {
                  students.filter((student) => student.user.status === "ACTIVE")
                    .length
                }
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {
                  students.filter(
                    (student) => student.user.status === "PENDING"
                  ).length
                }
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueClasses.length}</div>
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
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex grow gap-4">
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="flex-1 cursor-pointer">
                    <SelectValue placeholder="Filter by Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="cursor-pointer">
                      All Classes
                    </SelectItem>
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

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="flex-1 cursor-pointer">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="cursor-pointer">
                      All Status
                    </SelectItem>
                    <SelectItem value="ACTIVE" className="cursor-pointer">
                      Active
                    </SelectItem>
                    <SelectItem value="PENDING" className="cursor-pointer">
                      Pending
                    </SelectItem>
                    <SelectItem value="SUSPENDED" className="cursor-pointer">
                      Suspended
                    </SelectItem>
                    <SelectItem value="INACTIVE" className="cursor-pointer">
                      Inactive
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <ResponsiveList
          columns={columns}
          data={filteredStudents}
          loading={loading}
          rowKey="id"
          emptyState={
            <div className="text-center py-8 text-gray-500">
              {searchQuery || classFilter !== "all" || statusFilter !== "all"
                ? "No students found matching your filters."
                : "No students found. Create some students to get started."}
            </div>
          }
        />

        {/* Add/Edit Student Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
              <DialogHeader className="space-y-0">
                <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                  {isEditing ? "Edit Student" : "Add New Student"}
                </DialogTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {isEditing
                    ? "Update student information"
                    : "Enter complete student details"}
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

              <div className="space-y-8 pb-6">
                {/* Basic Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <User className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Basic Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="name"
                        className="flex items-center gap-2 text-sm font-medium text-gray-700"
                      >
                        <User className="h-4 w-4 text-gray-500" />
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter student's full name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        required
                        className="h-11"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="flex items-center gap-2 text-sm font-medium text-gray-700"
                      >
                        <Mail className="h-4 w-4 text-gray-500" />
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        required
                        placeholder="student@example.com"
                        className="h-11"
                      />
                    </div>

                    {/* Roll Number */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="rollNumber"
                        className="flex items-center gap-2 text-sm font-medium text-gray-700"
                      >
                        <Hash className="h-4 w-4 text-gray-500" />
                        Roll Number *
                      </Label>
                      <Input
                        id="rollNumber"
                        type="text"
                        placeholder="Enter roll number"
                        value={formData.rollNumber}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            rollNumber: e.target.value,
                          }))
                        }
                        required
                        className="h-11"
                      />
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-2">
                      <DatePicker
                        value={formData.dateOfBirth}
                        onChange={(date) =>
                          setFormData((prev) => ({
                            ...prev,
                            dateOfBirth: date || "",
                          }))
                        }
                        label="Date of Birth"
                        placeholder="Select date of birth"
                        maxDate={new Date().toISOString().split("T")[0]} // Prevent future dates for DOB
                      />
                    </div>
                  </div>
                </div>

                {/* Academic Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Book className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Academic Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Class */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="class"
                        className="flex items-center gap-2 text-sm font-medium text-gray-700"
                      >
                        <Book className="h-4 w-4 text-gray-500" />
                        Class *
                      </Label>
                      <Select
                        value={formData.class}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, class: value }))
                        }
                        required
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Section */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="section"
                        className="flex items-center gap-2 text-sm font-medium text-gray-700"
                      >
                        <SquareStack className="h-4 w-4 text-gray-500" />
                        Section *
                      </Label>
                      <Select
                        value={formData.section}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, section: value }))
                        }
                        required
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select a section" />
                        </SelectTrigger>
                        <SelectContent>
                          {sectionOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Guardian Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Users className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Guardian Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Guardian Name */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="guardian"
                        className="flex items-center gap-2 text-sm font-medium text-gray-700"
                      >
                        <User className="h-4 w-4 text-gray-500" />
                        Guardian Name *
                      </Label>
                      <Input
                        id="guardian"
                        placeholder="Parent/Guardian full name"
                        value={formData.guardian}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            guardian: e.target.value,
                          }))
                        }
                        required
                        className="h-11"
                      />
                    </div>

                    {/* Guardian Phone */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="guardianPhone"
                        className="flex items-center gap-2 text-sm font-medium text-gray-700"
                      >
                        <Phone className="h-4 w-4 text-gray-500" />
                        Guardian Phone *
                      </Label>
                      <Input
                        id="guardianPhone"
                        type="tel"
                        placeholder="+91-9876543210"
                        value={formData.guardianPhone}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            guardianPhone: e.target.value,
                          }))
                        }
                        required
                        className="h-11"
                      />
                    </div>

                    {/* Guardian Email */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="guardianEmail"
                        className="flex items-center gap-2 text-sm font-medium text-gray-700"
                      >
                        <Mail className="h-4 w-4 text-gray-500" />
                        Guardian Email{" "}
                        <span className="text-gray-400 font-normal">
                          (Optional)
                        </span>
                      </Label>
                      <Input
                        id="guardianEmail"
                        type="email"
                        placeholder="guardian@example.com"
                        value={formData.guardianEmail}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            guardianEmail: e.target.value,
                          }))
                        }
                        className="h-11"
                      />
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="address"
                        className="flex items-center gap-2 text-sm font-medium text-gray-700"
                      >
                        <MapPin className="h-4 w-4 text-gray-500" />
                        Address
                      </Label>
                      <Input
                        id="address"
                        type="text"
                        placeholder="Enter complete address"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            address: e.target.value,
                          }))
                        }
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>
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
                    !formData.name ||
                    !formData.email ||
                    !formData.rollNumber ||
                    !formData.class ||
                    !formData.section ||
                    !formData.guardian ||
                    !formData.guardianPhone
                  }
                  className="h-11 px-8 bg-blue-600 hover:bg-blue-700"
                >
                  {formLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {isEditing ? "Update Student" : "Create Student"}
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
