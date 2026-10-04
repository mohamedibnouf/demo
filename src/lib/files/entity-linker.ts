import type { DemoStore, ReferencedEntity } from "@/types";
import { hrefForRef } from "@/lib/record-hrefs";

const PATTERNS: { type: string; regex: RegExp }[] = [
  { type: "NCR", regex: /\bNCR-20\d{2}-\d{4}\b/g },
  { type: "CAPA", regex: /\bCAPA-20\d{2}-\d{4}\b/g },
  { type: "ECN", regex: /\bECN-20\d{2}-\d{4}\b/g },
  { type: "SNCR", regex: /\bSNCR-20\d{2}-\d{4}\b/g },
  { type: "Production Order", regex: /\bPO-20\d{2}-\d{4}\b/g },
  { type: "Serial Number", regex: /\bSN-[A-Z0-9]+-20\d{2}-\d{4}\b/g },
  { type: "Equipment", regex: /\bCAL-\d{4}\b/g },
  { type: "Audit Finding", regex: /\bAF-20\d{2}-\d{4}\b/g },
];

export function findReferencedEntities(store: DemoStore, text: string): ReferencedEntity[] {
  const found = new Map<string, ReferencedEntity>();
  for (const pattern of PATTERNS) {
    for (const match of text.match(pattern.regex) ?? []) {
      const href = hrefForRef(store, match);
      if (!href) continue;
      const key = `${pattern.type}:${match}`;
      found.set(key, { type: pattern.type, value: match, recordId: match, href });
    }
  }
  for (const supplier of store.suppliers) {
    if (text.toLowerCase().includes(supplier.name.toLowerCase()) || text.includes(supplier.code)) {
      const href = hrefForRef(store, supplier.id);
      if (href) found.set(`Supplier:${supplier.id}`, { type: "Supplier", value: supplier.name, recordId: supplier.id, href });
    }
  }
  for (const customer of store.customers) {
    if (text.toLowerCase().includes(customer.name.toLowerCase())) {
      const href = hrefForRef(store, customer.id);
      if (href) found.set(`Customer:${customer.id}`, { type: "Customer", value: customer.name, recordId: customer.id, href });
    }
  }
  return [...found.values()];
}
