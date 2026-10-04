import { qualityCatalog } from "@/features/catalog";
import { CatalogListPage } from "@/features/records/list-page";

export default async function QualityList({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  return <CatalogListPage spec={qualityCatalog[module]} />;
}
