"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always show the same success state, whether or not the email exists —
      // matches AuthService.forgotPassword()'s account-enumeration protection.
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthShell title="Check your email" description="If an account exists for that email, a reset link has been sent.">
        <Link href="/login">
          <Button variant="outline" className="w-full">
            Back to login
          </Button>
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Reset your password" description="Enter your email and we'll send you a reset link.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </Button>
        <Link href="/login" className="text-center text-sm text-accent hover:underline">
          Back to login
        </Link>
      </form>
    </AuthShell>
  );
}
