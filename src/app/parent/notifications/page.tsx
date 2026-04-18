"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/parent/notifications").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setNotifications(data);
    });
    // Mark as read
    fetch("/api/parent/notifications/read", { method: "POST" });
  }, []);

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  function handleClick(noti: Notification) {
    if (noti.linkUrl) {
      router.push(noti.linkUrl);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">알림</h2>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-400">
            <Bell className="h-12 w-12 mx-auto mb-2" />
            <p>알림이 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((noti) => {
            const isOldUnread = !noti.isRead && new Date(noti.createdAt).getTime() < sevenDaysAgo;
            return (
              <Card
                key={noti.id}
                className={`${!noti.isRead ? "border-orange-200 bg-orange-50" : ""} ${isOldUnread ? "ring-2 ring-orange-400" : ""} ${noti.linkUrl ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
                onClick={() => handleClick(noti)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 p-1.5 rounded-full ${
                      noti.type === "ACTIVITY" ? "bg-purple-100 text-purple-600" :
                      noti.type === "EXAM" ? "bg-blue-100 text-blue-600" :
                      noti.type === "ATTENDANCE" ? "bg-green-100 text-green-600" :
                      noti.type === "READING" ? "bg-teal-100 text-teal-600" :
                      noti.type === "CONSULTATION" ? "bg-red-100 text-red-600" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{noti.title}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{noti.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-400">
                          {new Date(noti.createdAt).toLocaleDateString("ko-KR", {
                            month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                        {noti.linkUrl && <span className="text-xs text-blue-500">자세히 보기 &rarr;</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
