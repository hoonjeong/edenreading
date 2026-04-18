"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  FileText,
  MessageSquare,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  School,
  Upload,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

const menuItems = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/members", label: "관리자 관리", icon: Users },
  { href: "/admin/parents", label: "학부모 관리", icon: UserPlus },
  { href: "/admin/students", label: "학생 관리", icon: GraduationCap },
  { href: "/admin/classes", label: "수강반 관리", icon: School },
  { href: "/admin/import", label: "엑셀 임포트", icon: Upload },
  { href: "/admin/activities", label: "활동 기록", icon: BookOpen },
  { href: "/admin/exams", label: "시험 관리", icon: ClipboardCheck },
  { href: "/admin/reading", label: "독서 기록", icon: FileText },
  { href: "/admin/attendance", label: "출결 관리", icon: Calendar },
  { href: "/admin/messages", label: "메시지 발송", icon: MessageSquare },
  { href: "/admin/consultations", label: "상담 관리", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col h-full">
      <div className="p-6 border-b border-blue-700">
        <h1 className="text-xl font-bold text-white">이든국어독서교육원</h1>
        <p className="text-blue-200 text-xs mt-1">관리자</p>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        {menuItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-6 py-3 text-sm transition-colors",
                isActive
                  ? "bg-blue-700 text-white font-medium"
                  : "text-blue-100 hover:bg-blue-700/50"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="border-t border-blue-700 p-4">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-2 py-2 text-sm text-blue-200 hover:text-white transition-colors w-full"
        >
          <LogOut className="h-5 w-5" />
          로그아웃
        </button>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-800 text-white rounded-lg shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-blue-800 z-40 transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {nav}
      </aside>
    </>
  );
}
