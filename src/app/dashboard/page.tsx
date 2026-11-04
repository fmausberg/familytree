import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";

export default async function DashboardPage() {
  await requireUser();
  redirect("/persons");
}
