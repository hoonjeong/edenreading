"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, ClipboardCheck, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/parent", label: "홈", icon: Home },
  { href: "/parent/activities", label: "활동", icon: BookOpen },
  { href: "/parent/exams", label: "시험", icon: ClipboardCheck },
  { href: "/parent/notifications", label: "알림", icon: Bell },
  { href: "/parent/mypage", label: "내 정보", icon: User },
];

export function ParentNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-30">
      <div className="max-w-lg mx-auto flex">
        {navItems.map((item) => {
          const isActive = item.href === "/parent"
            ? pathname === "/parent"
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center py-2 text-xs transition-colors",
                isActive ? "text-orange-600" : "text-gray-400"
              )}
            >
              <item.icon className="h-5 w-5 mb-1" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
