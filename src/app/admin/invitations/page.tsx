// src\app\admin\invitations\page.tsx

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
import AdminLayout from "@/components/layouts/AdminLayout";
import { Role } from "@prisma/client";
import { toast } from "sonner";
import {
  AlertCircle,
  Book,
  GraduationCap,
  Mail,
  Send,
  Shield,
  SquareStack,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import {
  ColumnDef,
  ResponsiveList,
} from "@/components/ui/special/ResponsiveList";

interface Invitation {
  id: string;
  email: string;
  role: Role;
  code: string;
  isUsed: boolean;
  expiresAt: string;
  createdAt: string;
  invitedUser: {
    name: string;
    email: string;
  };
}

export default function InvitationManagement() {
  const [invitations, setInvitations] = React.useState<Invitation[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  // Form state
  const [formData, setFormData] = React.useState({
    email: "",
    role: "STUDENT" as Role,
    // Student-specific fields
    class: "",
    section: "",
    guardian: "",
    guardianEmail: "",
  });

  const columns: ColumnDef<Invitation>[] = [
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ email }) => <div className="font-medium">{email}</div>,
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ role }) => (
        <Badge variant={role === "ADMIN" ? "destructive" : "default"}>
          {role}
        </Badge>
      ),
      className: "w-[80px]",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (invitation) => {
        const isExpired = new Date(invitation.expiresAt) < new Date();
        const status = invitation.isUsed
          ? "Used"
          : isExpired
          ? "Expired"
          : "Active";
        const variant = invitation.isUsed
          ? "secondary"
          : isExpired
          ? "destructive"
          : "default";
        return <Badge variant={variant}>{status}</Badge>;
      },
      className: "w-[100px]",
    },
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ code }) => (
        <span className="font-mono text-sm block w-30 md:w-40 overflow-hidden text-ellipsis whitespace-nowrap">
          {code}
        </span>
      ),
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: (invitation) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => copyToClipboard(invitation.code)}
            className="cursor-pointer"
          >
            <span className="hidden sm:inline">Copy Code</span>
            <span className="sm:hidden">Code</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => copyToClipboard(generateInvitationLink(invitation))}
            className="cursor-pointer"
          >
            <span className="hidden sm:inline">Copy Link</span>
            <span className="sm:hidden">Link</span>
          </Button>
        </div>
      ),
      className: "w-[160px]",
    },
  ];

  const fetchInvitations = React.useCallback(async () => {
    try {
      const response = await fetch("/api/invitations");
      if (response.ok) {
        const data = await response.json();
        setInvitations(data);
      }
    } catch {
      console.error("Error fetching invitations:", error);
    }
  }, [error]);

  React.useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload = {
        email: formData.email,
        role: formData.role,
        ...(formData.role === "STUDENT" && {
          studentData: {
            class: formData.class,
            section: formData.section,
            guardian: formData.guardian,
            guardianEmail: formData.guardianEmail || undefined,
          },
        }),
      };

      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Invitation created! Code: ${data.invitation.code}`);
        toast.success("Invitation created successfully!");
        setFormData({
          email: "",
          role: "STUDENT",
          class: "",
          section: "",
          guardian: "",
          guardianEmail: "",
        });
        fetchInvitations();
      } else {
        setError(data.error || "Failed to create invitation");
        toast.error("Invitation creation failed");
      }
    } catch {
      setError("Something went wrong");
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess("Copied to clipboard!");
    setTimeout(() => setSuccess(""), 2000);
  };

  const generateInvitationLink = (invitation: Invitation) => {
    const baseUrl = window.location.origin;
    const path =
      invitation.role === "ADMIN"
        ? "/auth/register/admin"
        : "/auth/register/student";
    return `${baseUrl}${path}?code=${invitation.code}&email=${invitation.email}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Invitation Management</h1>
          <p className="text-gray-600">
            Create and manage invitations for new users
          </p>
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

        {/* Create Invitation Form */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="pb-6 border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-2xl font-semibold text-gray-900">
              <UserPlus className="h-6 w-6 text-blue-600" />
              Create New Invitation
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Send an invitation to join the platform
            </p>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Error Alert */}
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700"
                >
                  <Mail className="h-4 w-4 text-gray-500" />
                  Email Address *
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
                  placeholder="Enter email address"
                  className="h-11"
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label
                  htmlFor="role"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700"
                >
                  <Users className="h-4 w-4 text-gray-500" />
                  Role *
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, role: value as Role }))
                  }
                >
                  <SelectTrigger className="h-11 cursor-pointer hover:bg-gray-50 transition-colors">
                    <SelectValue placeholder="Select user role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT" className="cursor-pointer py-3">
                      <div className="flex items-center gap-3">
                        <GraduationCap className="h-4 w-4 text-blue-600" />
                        <div className="flex flex-col">
                          <span className="font-medium">Student</span>
                          <span className="text-xs text-gray-500">
                            Regular student account
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="ADMIN" className="cursor-pointer py-3">
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-green-600" />
                        <div className="flex flex-col">
                          <span className="font-medium">Admin</span>
                          <span className="text-xs text-gray-500">
                            Administrative privileges
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Student-specific fields */}
              {formData.role === "STUDENT" && (
                <div className="space-y-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-4">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-medium text-gray-900">
                      Student Information
                    </h3>
                  </div>

                  {/* Class & Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="class"
                        className="flex items-center gap-2 text-sm font-medium text-gray-700"
                      >
                        <Book className="h-4 w-4 text-gray-500" />
                        Class *
                      </Label>
                      <Input
                        id="class"
                        placeholder="e.g., 10th, 12th"
                        value={formData.class}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            class: e.target.value,
                          }))
                        }
                        required
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="section"
                        className="flex items-center gap-2 text-sm font-medium text-gray-700"
                      >
                        <SquareStack className="h-4 w-4 text-gray-500" />
                        Section *
                      </Label>
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
                        className="h-11"
                      />
                    </div>
                  </div>

                  {/* Guardian Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <h4 className="text-sm font-medium text-gray-700">
                        Guardian Information
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          placeholder="Guardian email address"
                          value={formData.guardianEmail}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              guardianEmail: e.target.value,
                            }))
                          }
                          className="h-11"
                        />
                        <p className="text-xs text-gray-500">
                          Guardian will also receive notifications if provided
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="flex justify-end pt-6 border-t border-gray-100">
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={
                    loading ||
                    !formData.email ||
                    !formData.role ||
                    (formData.role === "STUDENT" &&
                      (!formData.class ||
                        !formData.section ||
                        !formData.guardian))
                  }
                  className="h-11 px-8 bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Create Invitation
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invitations List */}
        <Card>
          <CardHeader>
            <CardTitle>Sent Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveList
              columns={columns}
              data={invitations}
              loading={loading}
              rowKey="id"
              emptyState={
                <div className="text-center py-8 text-gray-500">
                  No invitations have been sent yet.
                </div>
              }
            />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
