import Dashboard from "@/components/Dashboard";
import { getDashboardData } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialData = await getDashboardData();
  return <Dashboard initialData={initialData} />;
}
