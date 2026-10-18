import type { Metadata } from "next";
import { currentAdmin } from "@/lib/auth/session";
import AdminDashboard from "@/components/admin/admin-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Spider Command Center // Admin",
  robots: { index: false, follow: false },
};

export default async function Dashboard() {
  const user = await currentAdmin();
  if (!user) return null;

  return <AdminDashboard userEmail={user} />;
}
