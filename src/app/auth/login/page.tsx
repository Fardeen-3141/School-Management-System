// src\app\auth\login\page.tsx

"use client";

import React from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { DividerWithText } from "@/components/ui/special/DividerWithText";
import Image from "next/image";
import { toast } from "sonner";
import { Eye, EyeOff, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  const router = useRouter();

  // --- Credentials login ---
  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false, // handle redirect manually
      });

      if (result?.ok) {
        const session = await getSession();
        if (session?.user.role === "ADMIN") {
          router.push("/admin/dashboard");
        } else {
          router.push("/student/dashboard");
        }
      } else {
        setError("Invalid email or password");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- Google login ---
  const handleGoogleLogin = async () => {
    try {
      await signIn("google", {
        callbackUrl: "/",
      });
    } catch (error) {
      setError("Google login failed");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Anipur Adarsha Vidyaniketan HS
          </CardTitle>
          <p className="text-center text-gray-600">Sign in to your account</p>
        </CardHeader>
        <CardContent className="space-y-8">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-600">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleCredentialsLogin} className="space-y-6">
            {/* --- Email Field --- */}
            <div className="relative space-y-1 ml-1">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

            {/* Password */}
            <div className="relative space-y-1">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {/* --- Submit --- */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <DividerWithText text="Or continue with" />

          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Image
              src="/google.svg"
              alt="Google"
              width={20}
              height={20}
              className="w-4 h-4"
            />
            <span className="font-medium text-sm">Sign in with Google</span>
          </Button>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-gray-600">
            New user? Register with invitation code:
          </div>
          <div className="flex space-x-2 w-full">
            <Link href="/auth/register/student" className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                Student Registration
              </Button>
            </Link>
            <Link href="/auth/register/admin" className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                Admin Registration
              </Button>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
