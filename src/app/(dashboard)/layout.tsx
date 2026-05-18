import { Sidebar } from "@/components/layout/sidebar";
import { requireUser } from "@/lib/auth/server";
import { Providers } from "../providers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <Providers initialUser={user}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </Providers>
  );
}
