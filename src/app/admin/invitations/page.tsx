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
import { Mail, User, Users } from "lucide-react";
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
        <Card>
          <CardHeader>
            <CardTitle>Create New Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* --- Email Field --- */}
              <div className="w-full relative space-y-1">
                <Label htmlFor="email">Email Address *</Label>
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

              {/* --- Role --- */}
              <div className="w-full relative space-y-1">
                <Label htmlFor="role">Role *</Label>
                <div className="relative">
                  <Select
                    value={formData.role}
                    onValueChange={(value: Role) =>
                      setFormData((prev) => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger className="w-full pr-10">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDENT">Student</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Users
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                </div>
              </div>

              {/* Student-specific fields */}
              {formData.role === "STUDENT" && (
                <>
                  {/* Class & Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative space-y-1">
                      <Label htmlFor="class">Class *</Label>
                      <div className="relative">
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
                          className="pr-10"
                        />
                        <Users
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                          size={18}
                        />
                      </div>
                    </div>

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
                        <Users
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                          size={18}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Guardian Name & Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>
                </>
              )}

              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Invitation"}
              </Button>
            </form>
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
