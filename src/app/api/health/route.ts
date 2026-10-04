import { NextResponse } from "next/server";
import { getDataProvider } from "@/server/data/provider";

export function GET() {
  const provider = getDataProvider();
  return NextResponse.json({
    ok: true,
    app: "SAMCO Integrated IMS/QMS Platform",
    provider: provider.name,
    demo: true,
  });
}
