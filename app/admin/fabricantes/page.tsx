import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/MainLayout";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FabricantesManager } from "@/components/admin/FabricantesManager";

async function getFabricantes() {
  return await prisma.fabricante.findMany({
    orderBy: { nome: 'asc' }
  });
}

export default async function FabricantesPage() {
  const user = await getCurrentUser();

  if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
    redirect("/dashboard");
  }

  const fabricantes = await getFabricantes();

  return (
    // @ts-ignore
    <MainLayout user={user}>
      <FabricantesManager fabricantes={fabricantes} />
    </MainLayout>
  );
}