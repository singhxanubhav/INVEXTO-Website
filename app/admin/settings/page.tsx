"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ShieldAlert, KeyRound, Loader2, Shield } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/src/hooks/useAuth";

const SUPER_ADMIN_EMAIL = "anubhavsinghbkj@gmail.com";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [requireOtp, setRequireOtp] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setRequireOtp(data.data.requireOtpRegistration === "true");
        }
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoadingSettings(false));

    if (isSuperAdmin) {
      fetch("/api/admin/users?limit=100")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setUsers(data.data.users);
          }
        })
        .catch(() => toast.error("Failed to load users"))
        .finally(() => setLoadingUsers(false));
    } else {
      setLoadingUsers(false);
    }
  }, [isSuperAdmin]);

  const toggleOtp = async (checked: boolean) => {
    if (!confirm(`Are you sure you want to ${checked ? 'enable' : 'disable'} OTP verification for new registrations?`)) return;
    
    setRequireOtp(checked);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "requireOtpRegistration", value: String(checked) })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`OTP Verification ${checked ? 'enabled' : 'disabled'}`);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update setting");
      setRequireOtp(!checked); // revert
    }
  };

  const toggleAdminRole = async (targetUserId: string, targetEmail: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    if (targetEmail === SUPER_ADMIN_EMAIL) {
      toast.error("Cannot modify the Super Admin");
      return;
    }
    
    if (!confirm(`Are you sure you want to ${newStatus ? 'GRANT' : 'REVOKE'} admin access for ${targetEmail}?`)) return;

    setUpdatingId(targetUserId);
    try {
      const res = await fetch("/api/admin/users/roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId, isAdmin: newStatus })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        setUsers(users.map(u => u.id === targetUserId ? { ...u, isAdmin: newStatus } : u));
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loadingSettings) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground mt-1">Manage global platform configurations and access.</p>
      </div>

      <div className="space-y-6">
        {/* Auth Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-amber-500" />
              <CardTitle>Authentication Settings</CardTitle>
            </div>
            <CardDescription>Configure how users register and authenticate on the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-4">
              <div className="space-y-0.5">
                <label className="text-base font-medium">Require OTP Verification</label>
                <p className="text-sm text-muted-foreground">
                  If disabled, new users will bypass email verification and be logged in immediately.
                </p>
              </div>
              <Switch checked={requireOtp} onCheckedChange={toggleOtp} />
            </div>
          </CardContent>
        </Card>

        {/* Super Admin Section */}
        {isSuperAdmin && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-destructive" />
                <CardTitle>Super Admin Management</CardTitle>
              </div>
              <CardDescription>Grant or revoke administrator privileges for user accounts.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="rounded-md border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Admin Access</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium flex items-center gap-2">
                            {u.name}
                            {u.email === SUPER_ADMIN_EMAIL && (
                              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-500">Super Admin</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                          <td className="px-4 py-3 text-right">
                            <Switch 
                              checked={u.isAdmin} 
                              disabled={u.email === SUPER_ADMIN_EMAIL || updatingId === u.id}
                              onCheckedChange={() => toggleAdminRole(u.id, u.email, u.isAdmin)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
