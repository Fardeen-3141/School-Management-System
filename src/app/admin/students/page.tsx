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
  CalendarIcon,
  Book,
  SquareStack,
  Phone,
  MapPin,
  Eye,
  DollarSign,
} from "lucide-react";
import { PaymentMethod, PaymentStatus, UserStatus } from "@prisma/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import Link from "next/link";

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
    method: PaymentMethod;
    status: PaymentStatus;
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

export default function AdminStudentsPage() {
  const [students, setStudents] = React.useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  // Form state
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(
    null
  );
  const [formLoading, setFormLoading] = React.useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [classFilter, setClassFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const [formData, setFormData] = React.useState<StudentFormData>({
    name: "",
    email: "",
    class: "",
    section: "",
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

  const fetchStudents = React.useCallback(async () => {
    try {
      const response = await fetch("/api/students");
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      } else {
        setError("Failed to fetch students");
      }
    } catch {
      setError("Error fetching students");
    } finally {
      setLoading(false);
    }
  }, []);

  const filterStudents = React.useCallback(() => {
    let filtered = students;

    // Search filter
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

    // Class filter
    if (classFilter !== "all") {
      filtered = filtered.filter((student) => student.class === classFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (student) => student.user.status === statusFilter
      );
    }

    setFilteredStudents(filtered);
  }, [classFilter, searchQuery, statusFilter, students]);

  React.useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  React.useEffect(() => {
    filterStudents();
  }, [students, searchQuery, classFilter, statusFilter, filterStudents]);

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      class: "",
      section: "",
      rollNumber: "",
      guardian: "",
      guardianPhone: "",
      guardianEmail: "",
      address: "",
      dateOfBirth: "",
    });
    setIsEditing(false);
    setSelectedStudent(null);
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
    setSelectedStudent(student);
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
        ? `/api/students/${selectedStudent?.id}`
        : "/api/students";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          guardianEmail: formData.guardianEmail || undefined,
          address: formData.address || undefined,
          dateOfBirth: formData.dateOfBirth || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          isEditing
            ? "Student updated successfully!"
            : `Student created successfully! ${
                data.defaultPassword ? `Password: ${data.defaultPassword}` : ""
              }`
        );
        setIsDialogOpen(false);
        resetForm();
        fetchStudents();
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(
          data.error || `Failed to ${isEditing ? "update" : "create"} student`
        );
      }
    } catch {
      setError("Something went wrong");
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

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("Student deleted successfully!");
        fetchStudents();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete student");
      }
    } catch {
      setError("Error deleting student");
    }
  };

  const handleStatusChange = async (studentId: string, newStatus: string) => {
    setSuccess("");
    setError("");

    try {
      const response = await fetch(`/api/students/${studentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setSuccess("Student status updated!");
        fetchStudents();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update status");
      }
    } catch {
      setError("Error updating status");
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Students Management</h1>
            <p className="text-gray-600">
              Manage student records, profiles, and status
            </p>
          </div>
          <Button onClick={openCreateDialog} className="cursor-pointer">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Student
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Edit Student" : "Add New Student"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="relative space-y-1">
                  <Label htmlFor="name">Full Name *</Label>
                  <div className="relative">
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      required
                      className="pr-10"
                    />
                    <User
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                  </div>
                </div>

                {/* --- Email Field --- */}
                <div className="relative space-y-1">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
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
                      placeholder="Enter your email"
                      className="pr-10"
                    />
                    <Mail
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                  </div>
                </div>

                {/* Roll Number */}
                <div className="relative space-y-1">
                  <Label htmlFor="rollNumber">Roll Number *</Label>
                  <div className="relative">
                    <Input
                      id="rollNumber"
                      type="text"
                      placeholder="Enter your roll number"
                      value={formData.rollNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          rollNumber: e.target.value,
                        }))
                      }
                      required
                      className="pr-10"
                    />
                    <Hash
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="space-y-1">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between text-left font-normal cursor-pointer"
                      >
                        {formData.dateOfBirth ? (
                          format(new Date(formData.dateOfBirth), "PPP")
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
                          formData.dateOfBirth
                            ? new Date(formData.dateOfBirth)
                            : undefined
                        }
                        onSelect={(date) =>
                          setFormData((prev) => ({
                            ...prev,
                            dateOfBirth: date
                              ? date.toISOString().split("T")[0]
                              : "",
                          }))
                        }
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Class */}
                <div className="relative space-y-1">
                  <Label htmlFor="name">Class *</Label>
                  <div className="relative">
                    <Input
                      id="class"
                      type="text"
                      placeholder="e.g., 10th, 12th"
                      value={formData.class}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          class: e.target.value,
                        }))
                      }
                      required
                      className="pr-10"
                    />
                    <Book
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                  </div>
                </div>

                {/* Section */}
                <div className="relative space-y-1">
                  <Label htmlFor="section">Section *</Label>
                  <div className="relative">
                    <Input
                      id="section"
                      placeholder="e.g., A, B, C"
                      value={formData.section}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          section: e.target.value,
                        }))
                      }
                      required
                      className="pr-10"
                    />
                    <SquareStack
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                  </div>
                </div>

                {/* Guardian Name */}
                <div className="relative space-y-1">
                  <Label htmlFor="guardian">Guardian Name *</Label>
                  <div className="relative">
                    <Input
                      id="guardian"
                      placeholder="Parent/Guardian name"
                      value={formData.guardian}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          guardian: e.target.value,
                        }))
                      }
                      required
                      className="pr-10"
                    />
                    <User
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                  </div>
                </div>

                {/* Guardian Phone */}
                <div className="relative space-y-1">
                  <Label htmlFor="guardianPhone">Guardian Phone *</Label>
                  <div className="relative">
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
                      className="pr-10"
                    />
                    <Phone
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                  </div>
                </div>

                {/* Guardian Email */}
                <div className="relative space-y-1">
                  <Label htmlFor="guardianEmail">
                    Guardian Email (Optional)
                  </Label>
                  <div className="relative">
                    <Input
                      id="guardianEmail"
                      type="email"
                      placeholder="Guardian email address"
                      value={formData.guardianEmail}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          guardianEmail: e.target.value,
                        }))
                      }
                      className="pr-10"
                    />
                    <Mail
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="relative space-y-1">
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <Input
                      id="address"
                      type="text"
                      placeholder="Enter your address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      className="pr-10"
                    />
                    <MapPin
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <Button type="submit" disabled={formLoading}>
                  {formLoading
                    ? "Saving..."
                    : isEditing
                    ? "Update Student"
                    : "Create Student"}
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
    </AdminLayout>
  );
}
