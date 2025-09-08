// src\app\auth\register\admin\page.tsx

"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, IdCard, Key, Mail, User } from "lucide-react";

export default function AdminRegistrationPageClient() {
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    employeeId: "",
    invitationCode: "",
  });

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-fill invitation code if provided in URL
  React.useEffect(() => {
    const code = searchParams.get("code");
    const email = searchParams.get("email");
    if (code) setFormData((prev) => ({ ...prev, invitationCode: code }));
    if (email) setFormData((prev) => ({ ...prev, email }));
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          employeeId: formData.employeeId,
          invitationCode: formData.invitationCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Registration successful! You can now login.");
        toast.success("Registration successful! You can now login.");
        setTimeout(() => router.push("/auth/login"), 2000);
      } else {
        setError(data.error || "Registration failed");
        toast.error("Registration failed");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50">
      <Card className="w-full max-w-md my-10">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Admin Registration
          </CardTitle>
          <p className="text-center text-gray-600">
            Register with your invitation code
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-600">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <AlertDescription className="text-green-600">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Invitation Code */}
            <div className="relative space-y-1">
              <Label htmlFor="invitationCode">Invitation Code *</Label>
              <div className="relative">
                <Input
                  id="invitationCode"
                  type="text"
                  placeholder="Enter invitation code"
                  value={formData.invitationCode}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      invitationCode: e.target.value,
                    }))
                  }
                  required
                  className="pr-10"
                />
                <Key
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
              </div>
            </div>

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
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
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
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
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

            {/* Employee ID */}
            <div className="relative space-y-1">
              <Label htmlFor="employeeId">Employee ID *</Label>
              <div className="relative">
                <Input
                  id="employeeId"
                  type="text"
                  placeholder="Enter your employee ID"
                  value={formData.employeeId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      employeeId: e.target.value,
                    }))
                  }
                  required
                  className="pr-10"
                />
                <IdCard
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
              </div>
            </div>

            {/* Password */}
            <div className="relative space-y-1">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="relative space-y-1">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  onClick={() => setShowConfirm((prev) => !prev)}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registering..." : "Register as Admin"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/auth/login" className="text-blue-600 hover:underline">
              Already have an account? Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
