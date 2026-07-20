"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Users,
  Search,
  Filter,
  ShieldBan,
  Mail,
  Key,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  MoreVertical,
  Loader2,
} from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  image: string;
  role: string;
  isVerified: boolean;
  subscriptionPlan: "FREE" | "PRO" | "ELITE";
  status: "active" | "suspended";
  createdAt: string | null;
  lastActive: string | null;
}

interface UserStats {
  totalUsers: number;
  activeToday: number;
  suspendedUsers: number;
  freeUsers: number;
  proUsers: number;
  eliteUsers: number;
}

interface UsersResponse {
  stats?: UserStats;
  users?: AdminUser[];
  message?: string;
}

const emptyStats: UserStats = {
  totalUsers: 0,
  activeToday: 0,
  suspendedUsers: 0,
  freeUsers: 0,
  proUsers: 0,
  eliteUsers: 0,
};

function formatDate(value: string | null, includeTime = false) {
  if (!value) return "Never";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";

  const datePart = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  if (!includeTime) return datePart;

  const timePart = new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return `${datePart} ${timePart}`;
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

function roleLabel(role: string) {
  const normalized = role.toLowerCase();
  if (normalized === "admin") return "Admin";
  if (normalized === "mentor") return "Mentor";
  return "Student";
}

function planLabel(plan: string) {
  if (plan === "ELITE") return "Elite";
  if (plan === "PRO") return "Pro";
  return "Free";
}

export default function UserManagementPage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<UserStats>(emptyStats);
  const [isLoading, setIsLoading] = useState(true);
  const [actionKey, setActionKey] = useState("");
  const [modalUser, setModalUser] = useState<AdminUser | null>(null);
  const [modalAction, setModalAction] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async (query = debouncedSearch) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (query) params.set("search", query);
      if (planFilter !== "all") params.set("plan", planFilter);
      const queryString = params.toString();
      const response = await fetch(`/api/admin/users${queryString ? `?${queryString}` : ""}`, {
        cache: "no-store",
      });
      const data = (await response.json().catch(() => null)) as
        | UsersResponse
        | null;

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load users.");
      }

      setStats(data?.stats || emptyStats);
      setUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load users.");
      setStats(emptyStats);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, planFilter]);

  useEffect(() => {
    void fetchUsers(debouncedSearch);
  }, [debouncedSearch, planFilter, fetchUsers]);

  const filtered = useMemo(() => {
    return users.filter((user) => {
      if (
        roleFilter !== "all" &&
        user.role !== roleFilter
      ) return false;
      if (statusFilter !== "all" && user.status !== statusFilter) return false;
      return true;
    });
  }, [roleFilter, statusFilter, users]);

  const openModal = (user: AdminUser, action: string) => {
    setModalUser(user);
    setModalAction(action);
  };

  const closeModal = () => {
    setModalUser(null);
    setModalAction("");
  };

  const handleStatusChange = async (
    user: AdminUser,
    status: "active" | "suspended"
  ) => {
    const isSuspending = status === "suspended";
    const confirmed = window.confirm(
      isSuspending
        ? `Suspend ${user.name}? They will lose access until reactivated.`
        : `Activate ${user.name}? They will regain account access.`
    );

    if (!confirmed) return;

    try {
      setActionKey(`${user.id}-${status}`);
      const response = await fetch(`/api/admin/users/${user.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update user status.");
      }

      toast.success(data?.message || "User status updated.");
      await fetchUsers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update user status."
      );
    } finally {
      setActionKey("");
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    const confirmed = window.confirm(
      `Delete ${user.name}'s account? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setActionKey(`${user.id}-delete`);
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete user.");
      }

      toast.success(data?.message || "User deleted.");
      await fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user.");
    } finally {
      setActionKey("");
    }
  };

  if (!mounted) return <div className="min-h-screen" />;

  return (
    <div className="min-h-screen bg-white p-3 dark:bg-[#0f0a16] sm:p-4 lg:p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Users className="w-6 h-6 text-[#7C3AED]" /> User Management
        </h1>
        <p className="text-sm text-muted-foreground">Manage StudyBuddy student accounts, permissions, and security.</p>
      </header>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 border border-slate-200 dark:border-white/10 rounded-md flex items-center gap-3 bg-purple-50 dark:bg-purple-950/20">
          <Users className="w-6 h-6 text-[#7C3AED]" />
          <div>
            <div className="text-xs text-[#7C3AED]">Total Users</div>
            <div className="font-bold text-lg">{stats.totalUsers}</div>
          </div>
        </div>
        <div className="p-4 border border-slate-200 dark:border-white/10 rounded-md flex items-center gap-3 bg-green-50 dark:bg-green-950/20">
          <CheckCircle className="w-6 h-6 text-green-500" />
          <div>
            <div className="text-xs text-green-500">Active Today</div>
            <div className="font-bold text-lg">{stats.activeToday}</div>
          </div>
        </div>
        <div className="p-4 border border-slate-200 dark:border-white/10 rounded-md flex items-center gap-3 bg-red-50 dark:bg-red-950/20">
          <ShieldBan className="w-6 h-6 text-red-500" />
          <div>
            <div className="text-xs text-red-500">Suspended</div>
            <div className="font-bold text-lg">{stats.suspendedUsers}</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 border border-slate-200 dark:border-white/10 rounded-md bg-slate-50 dark:bg-white/[0.02]">
          <div className="text-xs text-slate-500">Free Users</div>
          <div className="font-bold text-lg">{stats.freeUsers}</div>
        </div>
        <div className="p-4 border border-slate-200 dark:border-white/10 rounded-md bg-purple-50 dark:bg-purple-950/20">
          <div className="text-xs text-[#7C3AED]">Pro Users</div>
          <div className="font-bold text-lg">{stats.proUsers}</div>
        </div>
        <div className="p-4 border border-slate-200 dark:border-white/10 rounded-md bg-purple-50 dark:bg-purple-950/20">
          <div className="text-xs text-[#7C3AED]">Elite Users</div>
          <div className="font-bold text-lg">{stats.eliteUsers}</div>
        </div>
      </div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="pl-9 pr-3 py-2 border border-slate-200 dark:border-white/10 rounded-md bg-white dark:bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 dark:focus:ring-[#7C3AED]/30"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              className="pl-9 pr-3 py-2 border border-slate-200 dark:border-white/10 rounded-md bg-white dark:bg-[#0f0a16] text-sm"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="mentor">Mentor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              className="pl-9 pr-3 py-2 border border-slate-200 dark:border-white/10 rounded-md bg-white dark:bg-[#0f0a16] text-sm"
              value={planFilter}
              onChange={e => setPlanFilter(e.target.value)}
            >
              <option value="all">All Plans</option>
              <option value="FREE">Free</option>
              <option value="PRO">Pro</option>
              <option value="ELITE">Elite</option>
            </select>
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              className="pl-9 pr-3 py-2 border border-slate-200 dark:border-white/10 rounded-md bg-white dark:bg-[#0f0a16] text-sm"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>
      <div className="border border-slate-200 dark:border-white/10 rounded-md overflow-x-auto bg-white dark:bg-[#0f0a16]">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-white/10">
          <thead>
            <tr className="bg-slate-50 dark:bg-white/[0.02]">
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-left text-slate-500 dark:text-slate-300">User</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-left text-slate-500 dark:text-slate-300">Plan / Role</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-left text-slate-500 dark:text-slate-300">Status</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-left text-slate-500 dark:text-slate-300">Joined</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-left text-slate-500 dark:text-slate-300">Last Login</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-right text-slate-500 dark:text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                  <Loader2 className="mx-auto mb-2 w-8 h-8 animate-spin text-[#7C3AED]" />
                  Loading users...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                  <XCircle className="mx-auto mb-2 w-8 h-8 opacity-60" />
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map(user => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition"
                >
                  <td className="px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 bg-[#7C3AED] text-white text-xs font-bold flex items-center justify-center overflow-hidden">
                      {user.image ? (
                        <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
                      ) : (
                        getInitials(user.name)
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{user.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-300 flex items-center gap-1">
                        <Mail className="w-3 h-3 inline-block" /> {user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.role === "admin" ? (
                        <span className="inline-block px-2 py-1 rounded bg-purple-100 dark:bg-purple-950/30 text-[#7C3AED] text-xs font-bold border border-purple-200 dark:border-purple-800/50 shadow-sm">Admin</span>
                      ) : user.role === "mentor" ? (
                        <span className="inline-block px-2 py-1 rounded bg-purple-100 dark:bg-purple-950/20 text-[#7C3AED] text-xs font-semibold">Mentor</span>
                      ) : (
                        <span className="inline-block px-2 py-1 rounded bg-slate-100 dark:bg-slate-950/20 text-slate-700 dark:text-slate-300 text-xs font-semibold">{roleLabel(user.role)}</span>
                      )}
                      <span className="inline-block px-2 py-1 rounded border border-[#7C3AED]/20 bg-[#7C3AED]/10 text-[#7C3AED] text-xs font-bold">
                        {planLabel(user.subscriptionPlan)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {user.status === "active" ? (
                      <span className="inline-block px-2 py-1 rounded bg-green-100 dark:bg-green-950/20 text-green-700 dark:text-green-300 text-xs font-semibold flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Active</span>
                    ) : (
                      <span className="inline-block px-2 py-1 rounded bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-1 w-fit"><ShieldBan className="w-3 h-3" /> Suspended</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">{formatDate(user.lastActive, true)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <button className="p-2 rounded hover:bg-slate-100 dark:hover:bg-white/[0.04]" onClick={() => openModal(user, "edit")} aria-label={`Edit ${user.name}`}><Edit className="w-4 h-4 text-[#7C3AED]" /></button>
                      <button className="p-2 rounded hover:bg-slate-100 dark:hover:bg-white/[0.04]" onClick={() => openModal(user, "reset") } aria-label={`Reset password for ${user.name}`}><Key className="w-4 h-4 text-green-500" /></button>
                      {user.status === "suspended" ? (
                        <button
                          className="p-2 rounded hover:bg-slate-100 dark:hover:bg-white/[0.04] disabled:opacity-50"
                          disabled={Boolean(actionKey)}
                          onClick={() => void handleStatusChange(user, "active")}
                          title="Activate user"
                          aria-label={`Activate ${user.name}`}
                        >
                          {actionKey === `${user.id}-active` ? (
                            <Loader2 className="w-4 h-4 animate-spin text-green-500" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </button>
                      ) : (
                        <button
                          className="p-2 rounded hover:bg-slate-100 dark:hover:bg-white/[0.04] disabled:opacity-50"
                          disabled={Boolean(actionKey)}
                          onClick={() => void handleStatusChange(user, "suspended")}
                          title="Suspend user"
                          aria-label={`Suspend ${user.name}`}
                        >
                          {actionKey === `${user.id}-suspended` ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                          ) : (
                            <ShieldBan className="w-4 h-4 text-red-500" />
                          )}
                        </button>
                      )}
                      <button
                        className="p-2 rounded hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50"
                        disabled={Boolean(actionKey)}
                        onClick={() => void handleDeleteUser(user)}
                        title="Delete user"
                        aria-label={`Delete ${user.name}`}
                      >
                        {actionKey === `${user.id}-delete` ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-red-500" />
                        )}
                      </button>
                      <button className="p-2 rounded hover:bg-slate-100 dark:hover:bg-white/[0.04]" onClick={() => openModal(user, "more") } aria-label={`More actions for ${user.name}`}><MoreVertical className="w-4 h-4 text-slate-400" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {modalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-[#0f0a16] sm:max-w-md sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              {modalAction === "edit" && <Edit className="w-5 h-5 text-[#7C3AED]" />}
              {modalAction === "reset" && <Key className="w-5 h-5 text-green-500" />}
              {modalAction === "more" && <MoreVertical className="w-5 h-5 text-slate-400" />}
              <span className="font-semibold text-lg">{modalAction.charAt(0).toUpperCase() + modalAction.slice(1)} User</span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 bg-[#7C3AED] text-white text-xs font-bold flex items-center justify-center overflow-hidden">
                {modalUser.image ? (
                  <img src={modalUser.image} alt={modalUser.name} className="h-full w-full object-cover" />
                ) : (
                  getInitials(modalUser.name)
                )}
              </div>
              <div>
                <div className="font-medium text-slate-900 dark:text-white">{modalUser.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-300 flex items-center gap-1">
                  <Mail className="w-3 h-3 inline-block" /> {modalUser.email}
                </div>
              </div>
            </div>
            
            {modalAction === "edit" && (
              <div className="mb-2 text-sm">Editing user details will be available in a future admin workflow.</div>
            )}
            
            {modalAction === "reset" && (
              <>
                <div className="mb-2 text-sm">Password reset links are handled through the user account flow.</div>
                <button className="w-full bg-green-600 hover:bg-green-700 transition-colors text-white py-2 rounded-md font-semibold text-sm mt-2" onClick={closeModal}>
                  Done
                </button>
              </>
            )}
            
            {modalAction === "more" && (
              <div className="mb-2 text-sm">
                Role: {roleLabel(modalUser.role)} · Status: {modalUser.status}
              </div>
            )}
            
            <button className="w-full mt-4 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 transition-colors text-slate-700 dark:text-white py-2 rounded-md font-semibold text-sm" onClick={closeModal}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

