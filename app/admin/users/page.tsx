"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
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
} from "lucide-react";

// 👇 1. TypeScript ko bataya ke User object kaisa dikhta hai
interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  status: string;
  joined: string;
  lastLogin: string;
}

// 👇 2. Mock users ko bataya ke yeh "User" type ke objects hain
const MOCK_USERS: User[] = [
  {
    id: "u1",
    name: "Alex Kim",
    email: "alex.kim@email.com",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    role: "elite",
    status: "active",
    joined: "2025-11-12",
    lastLogin: "2026-02-24 09:12",
  },
  {
    id: "u2",
    name: "Priya Singh",
    email: "priya.singh@email.com",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    role: "free",
    status: "active",
    joined: "2025-12-01",
    lastLogin: "2026-02-24 08:55",
  },
  {
    id: "u3",
    name: "Sam Rodriguez",
    email: "sam.rod@email.com",
    avatar: "https://randomuser.me/api/portraits/men/65.jpg",
    role: "pro",
    status: "suspended",
    joined: "2026-01-10",
    lastLogin: "2026-02-23 21:10",
  },
  {
    id: "u4",
    name: "Taylor Morgan",
    email: "taylor.morgan@email.com",
    avatar: "https://randomuser.me/api/portraits/women/12.jpg",
    role: "free",
    status: "active",
    joined: "2025-10-22",
    lastLogin: "2026-02-24 07:30",
  },
  {
    id: "u5",
    name: "Jordan Lee",
    email: "jordan.lee@email.com",
    avatar: "https://randomuser.me/api/portraits/men/23.jpg",
    role: "elite",
    status: "active",
    joined: "2026-02-01",
    lastLogin: "2026-02-24 10:01",
  },
];

export default function UserManagementPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // 👇 3. Yahan useState ko bataya ke isme User aaye ga ya phir null
  const [modalUser, setModalUser] = useState<User | null>(null);
  const [modalAction, setModalAction] = useState("");
  const [suspendReason, setSuspendReason] = useState("");

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div className="min-h-screen" />;

  const filtered = MOCK_USERS.filter(u => {
    if (search && !(u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))) return false;
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    return true;
  });

  const totalUsers = MOCK_USERS.length;
  const activeToday = MOCK_USERS.filter(u => u.status === "active").length;
  const suspended = MOCK_USERS.filter(u => u.status === "suspended").length;

  // 👇 4. Function ke parameters mein types daal diye
  const openModal = (user: User, action: string) => {
    setModalUser(user);
    setModalAction(action);
    setSuspendReason("");
  };
  
  const closeModal = () => {
    setModalUser(null);
    setModalAction("");
    setSuspendReason("");
  };

  return (
    <div className="p-6 bg-white dark:bg-[#0f0a16] min-h-screen">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-500" /> User Management
        </h1>
        <p className="text-sm text-muted-foreground">Manage StudyBuddy student accounts, permissions, and security.</p>
      </header>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 border border-slate-200 dark:border-white/10 rounded-md flex items-center gap-3 bg-blue-50 dark:bg-blue-950/20">
          <Users className="w-6 h-6 text-blue-500" />
          <div>
            <div className="text-xs text-blue-500">Total Users</div>
            <div className="font-bold text-lg">{totalUsers}</div>
          </div>
        </div>
        <div className="p-4 border border-slate-200 dark:border-white/10 rounded-md flex items-center gap-3 bg-green-50 dark:bg-green-950/20">
          <CheckCircle className="w-6 h-6 text-green-500" />
          <div>
            <div className="text-xs text-green-500">Active Today</div>
            <div className="font-bold text-lg">{activeToday}</div>
          </div>
        </div>
        <div className="p-4 border border-slate-200 dark:border-white/10 rounded-md flex items-center gap-3 bg-red-50 dark:bg-red-950/20">
          <ShieldBan className="w-6 h-6 text-red-500" />
          <div>
            <div className="text-xs text-red-500">Suspended</div>
            <div className="font-bold text-lg">{suspended}</div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="pl-9 pr-3 py-2 border border-slate-200 dark:border-white/10 rounded-md bg-white dark:bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900"
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
              className="pl-9 pr-3 py-2 border border-slate-200 dark:border-white/10 rounded-md bg-white dark:bg-transparent text-sm"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="elite">Elite</option>
            </select>
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              className="pl-9 pr-3 py-2 border border-slate-200 dark:border-white/10 rounded-md bg-white dark:bg-transparent text-sm"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
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
            {filtered.length === 0 ? (
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
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/10" />
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{user.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-300 flex items-center gap-1">
                        <Mail className="w-3 h-3 inline-block" /> {user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {user.role === "elite" ? (
                      <span className="inline-block px-2 py-1 rounded bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-800/50 shadow-sm">Elite 👑</span>
                    ) : user.role === "pro" ? (
                      <span className="inline-block px-2 py-1 rounded bg-blue-100 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 text-xs font-semibold">Pro Member 🌟</span>
                    ) : (
                      <span className="inline-block px-2 py-1 rounded bg-slate-100 dark:bg-slate-950/20 text-slate-700 dark:text-slate-300 text-xs font-semibold">Free</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.status === "active" ? (
                      <span className="inline-block px-2 py-1 rounded bg-green-100 dark:bg-green-950/20 text-green-700 dark:text-green-300 text-xs font-semibold flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Active</span>
                    ) : (
                      <span className="inline-block px-2 py-1 rounded bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-1 w-fit"><ShieldBan className="w-3 h-3" /> Suspended</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">{user.joined}</td>
                  <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">{user.lastLogin}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <button className="p-2 rounded hover:bg-slate-100 dark:hover:bg-white/[0.04]" onClick={() => openModal(user, "edit")}><Edit className="w-4 h-4 text-blue-500" /></button>
                      <button className="p-2 rounded hover:bg-slate-100 dark:hover:bg-white/[0.04]" onClick={() => openModal(user, "reset") }><Key className="w-4 h-4 text-green-500" /></button>
                      <button className="p-2 rounded hover:bg-slate-100 dark:hover:bg-white/[0.04]" onClick={() => openModal(user, "suspend") }><ShieldBan className="w-4 h-4 text-red-500" /></button>
                      <button className="p-2 rounded hover:bg-slate-100 dark:hover:bg-white/[0.04]" onClick={() => openModal(user, "delete") }><Trash2 className="w-4 h-4 text-slate-500" /></button>
                      <button className="p-2 rounded hover:bg-slate-100 dark:hover:bg-white/[0.04]" onClick={() => openModal(user, "more") }><MoreVertical className="w-4 h-4 text-slate-400" /></button>
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
          <div className="bg-white dark:bg-[#0f0a16] rounded-xl shadow-xl p-6 w-full max-w-md border border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-3 mb-4">
              {modalAction === "edit" && <Edit className="w-5 h-5 text-blue-500" />}
              {modalAction === "reset" && <Key className="w-5 h-5 text-green-500" />}
              {modalAction === "suspend" && <ShieldBan className="w-5 h-5 text-red-500" />}
              {modalAction === "delete" && <Trash2 className="w-5 h-5 text-slate-500" />}
              {modalAction === "more" && <MoreVertical className="w-5 h-5 text-slate-400" />}
              <span className="font-semibold text-lg">{modalAction.charAt(0).toUpperCase() + modalAction.slice(1)} User</span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <img src={modalUser.avatar} alt={modalUser.name} className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/10" />
              <div>
                <div className="font-medium text-slate-900 dark:text-white">{modalUser.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-300 flex items-center gap-1">
                  <Mail className="w-3 h-3 inline-block" /> {modalUser.email}
                </div>
              </div>
            </div>
            
            {modalAction === "suspend" && (
              <>
                <div className="mb-2 text-sm text-red-600 font-semibold">Are you sure you want to suspend {modalUser.name}?</div>
                <select
                  className="w-full mb-4 px-3 py-2 border border-slate-200 dark:border-white/10 rounded-md bg-white dark:bg-transparent text-sm"
                  value={suspendReason}
                  onChange={e => setSuspendReason(e.target.value)}
                >
                  <option value="">Select reason...</option>
                  <option value="spam">Spam</option>
                  <option value="policy">Policy Violation</option>
                </select>
                <button
                  className="w-full bg-red-600 text-white py-2 rounded-md font-semibold text-sm disabled:opacity-60"
                  disabled={!suspendReason}
                  onClick={closeModal}
                >
                  Confirm Suspension
                </button>
              </>
            )}
            
            {modalAction === "edit" && (
              <div className="mb-2 text-sm">Edit user details (mock only).</div>
            )}
            
            {modalAction === "reset" && (
              <>
                <div className="mb-2 text-sm">Reset password for this user (mock only).</div>
                <button className="w-full bg-green-600 hover:bg-green-700 transition-colors text-white py-2 rounded-md font-semibold text-sm mt-2" onClick={closeModal}>
                  Send Reset Link
                </button>
              </>
            )}
            
            {modalAction === "delete" && (
              <>
                <div className="mb-2 text-sm text-red-600 font-semibold">Are you sure you want to delete {modalUser.name}?</div>
                <button className="w-full bg-red-600 hover:bg-red-700 transition-colors text-white py-2 rounded-md font-semibold text-sm mt-2" onClick={closeModal}>
                  Confirm Delete
                </button>
              </>
            )}
            
            <button className="w-full mt-4 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 transition-colors text-slate-700 dark:text-white py-2 rounded-md font-semibold text-sm" onClick={closeModal}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}