import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardContent from "./dashboard-content";

export default async function Dashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token");

  if (!token) {
    redirect("/login");
  }

  return <DashboardContent />;
}
