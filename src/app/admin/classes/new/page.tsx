import { ClassForm } from "@/components/admin/class-form";

export default function NewClassPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">수업 등록</h1>
      <ClassForm />
    </div>
  );
}
