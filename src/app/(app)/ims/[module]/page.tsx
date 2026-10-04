import { imsCatalog } from "@/features/catalog";
import { CatalogListPage } from "@/features/records/list-page";

export default async function ImsList({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  return <CatalogListPage spec={imsCatalog[module]} />;
}
