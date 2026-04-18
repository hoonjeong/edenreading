import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ParentNav } from "@/components/parent/nav";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || session.user.userType !== "parent") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <h1 className="text-lg font-bold text-orange-600">이든국어독서교육원</h1>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-4">
        {children}
      </main>
      <ParentNav />
    </div>
  );
}
