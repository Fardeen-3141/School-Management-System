// src\app\admin\attendance\page.tsx

"use client";

import React, { useEffect, useState } from "react";
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
  Users,
  UserCheck,
  UserX,
  Clock,
  Save,
  Download,
  CalendarIcon,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  ColumnDef,
  ResponsiveList,
} from "@/components/ui/special/ResponsiveList";

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  createdAt: string;
  student: {
    id: string;
    name: string;
    rollNumber: string;
    class: string;
    section: string;
  };
}

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  class: string;
  section: string;
}

interface BulkAttendanceData {
  studentId: string;
  status: string;
}

export default function AdminAttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredAttendance, setFilteredAttendance] = useState<
    AttendanceRecord[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Filter state
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [classFilter, setClassFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Bulk attendance state
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [bulkDate, setBulkDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [bulkAttendanceData, setBulkAttendanceData] = useState<
    BulkAttendanceData[]
  >([]);

  const attendanceColumns: ColumnDef<AttendanceRecord>[] = [
    {
      accessorKey: "student",
      header: "Student",
      cell: (record) => (
        <div>
          <div className="font-medium">{record.student.name}</div>
          <div className="text-sm text-muted-foreground">
            Roll No: {record.student.rollNumber}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "class",
      header: "Class",
      cell: (record) => (
        <span className="font-medium">
          {record.student.class}-{record.student.section}
        </span>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: (record) => new Date(record.date).toLocaleDateString(),
      className: "w-[110px]",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (record) => (
        <Badge
          variant={
            getStatusColor(record.status) as ReturnType<typeof getStatusColor>
          }
        >
          {record.status}
        </Badge>
      ),
      className: "w-[100px]",
    },
    {
      accessorKey: "actions",
      header: "Update Status",
      cell: (record) => (
        <Select
          value={record.status}
          onValueChange={(value) =>
            handleSingleAttendanceUpdate(
              record.student.id,
              record.date.split("T")[0],
              value
            )
          }
        >
          <SelectTrigger className="w-32 cursor-pointer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PRESENT" className="cursor-pointer">
              Present
            </SelectItem>
            <SelectItem value="ABSENT" className="cursor-pointer">
              Absent
            </SelectItem>
            <SelectItem value="LATE" className="cursor-pointer">
              Late
            </SelectItem>
          </SelectContent>
        </Select>
      ),
      className: "w-[140px]",
    },
  ];

  const fetchAttendance = React.useCallback(async () => {
    try {
      const response = await fetch("/api/attendance");
      if (response.ok) {
        const data = await response.json();
        setAttendance(data);
      } else {
        setError("Failed to fetch attendance");
      }
    } catch {
      setError("Error fetching attendance");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudents = React.useCallback(async () => {
    try {
      const response = await fetch("/api/students");
      if (response.ok) {
        const data = await response.json();
        setStudents(
          data.map((student: Student) => ({
            id: student.id,
            name: student.name,
            rollNumber: student.rollNumber,
            class: student.class,
            section: student.section,
          }))
        );
      }
    } catch (error: unknown) {
      console.error("Error fetching students:", error);
    }
  }, []);

  const filterAttendance = React.useCallback(() => {
    let filtered = attendance;

    // Date filter
    if (selectedDate) {
      filtered = filtered.filter(
        (record) => record.date.split("T")[0] === selectedDate
      );
    }

    // Class filter
    if (classFilter !== "all") {
      filtered = filtered.filter(
        (record) => record.student.class === classFilter
      );
    }

    // Section filter
    if (sectionFilter !== "all") {
      filtered = filtered.filter(
        (record) => record.student.section === sectionFilter
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((record) => record.status === statusFilter);
    }

    setFilteredAttendance(filtered);
  }, [attendance, classFilter, sectionFilter, selectedDate, statusFilter]);

  useEffect(() => {
    fetchAttendance();
    fetchStudents();
  }, [fetchAttendance, fetchStudents]);

  useEffect(() => {
    filterAttendance();
  }, [
    attendance,
    selectedDate,
    classFilter,
    sectionFilter,
    statusFilter,
    filterAttendance,
  ]);

  const openBulkAttendanceDialog = () => {
    setSelectedClass("");
    setSelectedSection("");
    setBulkDate(new Date().toISOString().split("T")[0]);
    setBulkAttendanceData([]);
    setIsBulkDialogOpen(true);
  };

  const loadClassStudents = () => {
    if (!selectedClass) return;

    const classStudents = students
      .filter((student) => {
        return (
          student.class === selectedClass &&
          (selectedSection === "" || student.section === selectedSection)
        );
      })
      .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));

    setBulkAttendanceData(
      classStudents.map((student) => ({
        studentId: student.id,
        status: "PRESENT", // Default to present
      }))
    );
  };

  const updateBulkAttendance = (studentId: string, status: string) => {
    setBulkAttendanceData((prev) =>
      prev.map((item) =>
        item.studentId === studentId ? { ...item, status } : item
      )
    );
  };

  const markAllAs = (status: string) => {
    setBulkAttendanceData((prev) => prev.map((item) => ({ ...item, status })));
  };

  const handleBulkSubmit = async () => {
    if (bulkAttendanceData.length === 0) {
      setError("Please load students first");
      return;
    }

    setBulkLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/attendance/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: bulkDate,
          attendanceData: bulkAttendanceData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          `Attendance recorded for ${bulkAttendanceData.length} students!`
        );
        setIsBulkDialogOpen(false);
        fetchAttendance();
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(data.error || "Failed to record attendance");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleSingleAttendanceUpdate = async (
    studentId: string,
    date: string,
    status: string
  ) => {
    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          date,
          status,
        }),
      });

      if (response.ok) {
        setSuccess("Attendance updated!");
        fetchAttendance();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update attendance");
      }
    } catch {
      setError("Error updating attendance");
    }
  };

  const exportAttendance = () => {
    const csvContent = [
      "Date,Student Name,Roll Number,Class,Section,Status",
      ...filteredAttendance.map(
        (record) =>
          `${new Date(record.date).toLocaleDateString()},${
            record.student.name
          },${record.student.rollNumber},${record.student.class},${
            record.student.section
          },${record.status}`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${selectedDate || "all"}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "default";
      case "ABSENT":
        return "destructive";
      case "LATE":
        return "secondary";
      default:
        return "outline";
    }
  };

  const calculateStats = () => {
    const today = new Date().toISOString().split("T")[0];
    const todayAttendance = attendance.filter(
      (record) => record.date.split("T")[0] === today
    );

    const presentCount = todayAttendance.filter(
      (r) => r.status === "PRESENT"
    ).length;
    const absentCount = todayAttendance.filter(
      (r) => r.status === "ABSENT"
    ).length;
    const lateCount = todayAttendance.filter((r) => r.status === "LATE").length;
    const totalMarked = todayAttendance.length;

    const attendanceRate =
      totalMarked > 0 ? ((presentCount / totalMarked) * 100).toFixed(1) : "0";

    return {
      presentCount,
      absentCount,
      lateCount,
      totalMarked,
      attendanceRate,
    };
  };

  const stats = calculateStats();
  const uniqueClasses = Array.from(
    new Set(students.map((s) => s.class))
  ).sort();

  const uniqueSections = Array.from(
    new Set(students.map((s) => s.section))
  ).sort();

  // Get students for selected class and section for bulk attendance
  const classStudents = students
    .filter((student) => {
      return (
        student.class === selectedClass &&
        (selectedSection === "" || student.section === selectedSection)
      );
    })
    .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));

  // Get existing attendance for the bulk date to avoid duplicates
  const existingAttendanceForBulkDate = attendance.filter(
    (record) =>
      record.date.split("T")[0] === bulkDate &&
      classStudents.some((student) => student.id === record.student.id)
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Attendance Management
            </h1>
            <p className="text-gray-600">
              Track and manage student attendance records
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-4 md:gap-2">
            <Button
              onClick={openBulkAttendanceDialog}
              className="cursor-pointer"
            >
              <Users className="h-4 w-4 mr-2" />
              Mark Attendance
            </Button>

            <Button
              onClick={exportAttendance}
              variant="outline"
              className="cursor-pointer"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Present Today
              </CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.presentCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Absent Today
              </CardTitle>
              <UserX className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.absentCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late Today</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.lateCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Attendance Rate
              </CardTitle>
              <CalendarIcon className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.attendanceRate}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Marked
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMarked}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row flex-wrap grow gap-4">
              <div className="flex-1 flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="flex-1">
                  <Label>Class</Label>
                  <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {uniqueClasses.map((cls) => (
                        <SelectItem key={cls} value={cls}>
                          {cls}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex-1 flex gap-4">
                <div className="flex-1">
                  <Label>Section</Label>
                  <Select
                    value={sectionFilter}
                    onValueChange={setSectionFilter}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {uniqueSections.map((section) => (
                        <SelectItem key={section} value={section}>
                          {section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="PRESENT">Present</SelectItem>
                      <SelectItem value="ABSENT">Absent</SelectItem>
                      <SelectItem value="LATE">Late</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Table */}
        <ResponsiveList
          columns={attendanceColumns}
          data={filteredAttendance}
          loading={loading}
          rowKey="id"
          emptyState={
            <div className="text-center py-8 text-gray-500">
              No attendance records found for the selected filters.
            </div>
          }
        />

        {/* Bulk Attendance Dialog */}
        <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Mark Class Attendance</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-4 px-1">
              {/* Class Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="min-w-0">
                  <Label htmlFor="bulkClass">Class *</Label>
                  <Select
                    value={selectedClass}
                    onValueChange={setSelectedClass}
                  >
                    <SelectTrigger className="cursor-pointer w-full">
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

                <div className="min-w-0">
                  <Label htmlFor="bulkSection">Section</Label>
                  <Select
                    value={selectedSection}
                    onValueChange={setSelectedSection}
                  >
                    <SelectTrigger className="cursor-pointer w-full">
                      <SelectValue placeholder="All sections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="cursor-pointer">
                        All Sections
                      </SelectItem>
                      {uniqueSections.map((section) => (
                        <SelectItem
                          key={section}
                          value={section}
                          className="cursor-pointer"
                        >
                          {section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="dateOfBirth">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between text-left font-normal cursor-pointer"
                      >
                        <span className="truncate">
                          {bulkDate
                            ? format(new Date(bulkDate), "PPP")
                            : "Select date"}
                        </span>
                        <CalendarIcon className="ml-2 h-4 w-4 text-gray-400 flex-shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={bulkDate ? new Date(bulkDate) : undefined}
                        onSelect={() => setBulkDate(bulkDate)}
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <Button
                  onClick={loadClassStudents}
                  disabled={!selectedClass}
                  variant="outline"
                  className="w-full sm:w-auto cursor-pointer"
                >
                  Load Students
                </Button>

                {bulkAttendanceData.length > 0 && (
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAllAs("PRESENT")}
                      className="flex-1 sm:flex-none cursor-pointer"
                    >
                      All Present
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAllAs("ABSENT")}
                      className="flex-1 sm:flex-none cursor-pointer"
                    >
                      All Absent
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAllAs("LATE")}
                      className="flex-1 sm:flex-none cursor-pointer"
                    >
                      All Late
                    </Button>
                  </div>
                )}
              </div>

              {/* Existing Attendance Warning */}
              {existingAttendanceForBulkDate.length > 0 && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertDescription className="text-yellow-600">
                    Attendance for {existingAttendanceForBulkDate.length}{" "}
                    students on {bulkDate} already exists. Submitting will
                    update existing records.
                  </AlertDescription>
                </Alert>
              )}

              {/* Students List */}
              {bulkAttendanceData.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                      Students ({bulkAttendanceData.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3">
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                      {classStudents.map((student) => {
                        const attendanceData = bulkAttendanceData.find(
                          (item) => item.studentId === student.id
                        );
                        const existingRecord =
                          existingAttendanceForBulkDate.find(
                            (record) => record.student.id === student.id
                          );

                        return (
                          <div
                            key={student.id}
                            className="flex items-center justify-between p-3 border rounded-lg gap-3 min-w-0"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {student.name}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-2 flex-wrap">
                                <span>{student.rollNumber}</span>
                                {existingRecord && (
                                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded whitespace-nowrap">
                                    Current: {existingRecord.status}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <Select
                                value={attendanceData?.status || "PRESENT"}
                                onValueChange={(value) =>
                                  updateBulkAttendance(student.id, value)
                                }
                              >
                                <SelectTrigger className="w-28 cursor-pointer">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem
                                    value="PRESENT"
                                    className="cursor-pointer"
                                  >
                                    Present
                                  </SelectItem>
                                  <SelectItem
                                    value="ABSENT"
                                    className="cursor-pointer"
                                  >
                                    Absent
                                  </SelectItem>
                                  <SelectItem
                                    value="LATE"
                                    className="cursor-pointer"
                                  >
                                    Late
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t flex-shrink-0">
              <Button
                onClick={handleBulkSubmit}
                disabled={bulkLoading || bulkAttendanceData.length === 0}
                className="w-full sm:w-auto cursor-pointer"
              >
                <Save className="h-4 w-4 mr-2" />
                {bulkLoading ? "Saving..." : "Save Attendance"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBulkDialogOpen(false)}
                className="w-full sm:w-auto cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
