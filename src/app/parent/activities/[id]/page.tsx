import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ParentActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.userType !== "parent") notFound();

  const { id } = await params;

  const activity = await prisma.activity.findUnique({
    where: { id, isShared: true },
    include: {
      student: true,
      media: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!activity) notFound();

  // 해당 학부모의 자녀인지 확인 (Row-Level Security)
  const parent = await prisma.parent.findUnique({
    where: { phone: session.user.email },
    include: { children: true },
  });

  const isLinked = parent?.children.some((c) => c.studentId === activity.studentId);
  if (!isLinked) notFound();

  return (
    <div className="space-y-4">
      <Link href="/parent/activities" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> 활동 목록
      </Link>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
              {activity.student.name}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(activity.activityDate).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
            </span>
            {activity.isEdited && <span className="text-xs text-gray-400">(수정됨)</span>}
          </div>

          <h2 className="text-lg font-bold mb-3">{activity.title}</h2>

          {activity.content && (
            <p className="text-sm text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">{activity.content}</p>
          )}

          {/* Media gallery */}
          {activity.media.length > 0 && (
            <div className="space-y-3">
              {activity.media.map((m) => (
                <div key={m.id} className="rounded-lg overflow-hidden bg-gray-100">
                  {m.type === "PHOTO" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.url} alt="" className="w-full" />
                  ) : (
                    <div>
                      <video src={m.url} controls className="w-full" />
                      <a href={m.url} download className="block text-center text-xs text-blue-600 py-2">
                        동영상이 재생되지 않으면 클릭하여 다운로드
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
