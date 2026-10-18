import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth/session";
import AdminDashboard from "@/components/admin/admin-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Workspace",
  robots: { index: false, follow: false },
};

export default async function Dashboard() {
  const user = await currentAdmin();
  if (!user) {
    redirect("/secret-admin/login");
  }

  return <AdminDashboard userEmail={user} />;
}
