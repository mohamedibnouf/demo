import type { AIMessage, AIProvider } from "./provider";

const LIBRARY = {
  causes:
    "Suggested possible causes (advisory):\n1) Tool wear on Alpha flare-seat machining after 18,000 cycles.\n2) Incoming sampling (AQL 1.0) insufficient for safety-critical valves.\n3) Charge-station torque / alignment variation on AHU-P25.\n4) Repeat of Q2 lot ALPHA-VLV-188 (see NCR-2026-0014 / SNCR-2026-0006).\nDo not approve or close any record from this suggestion.",
  similar:
    "Similar previous cases:\n• NCR-2026-0014 / SNCR-2026-0006 — Alpha valve leak, lot ALPHA-VLV-188, CAPA-2026-0012 closed Effective.\n• NCR-2026-0005 — AHU drain-pan leak classified process (different source_event_id).\n• CC-2026-0009 — customer leakage on SN-AHU-2026-1104, linked to QE-2026-0005.\nPattern: component leaks cluster on Alpha EXP-4421; process leaks cluster on night-shift brazing.",
  corrective:
    "Suggested corrective actions:\n• Quarantine remaining ALPHA-VLV-229 and sort on-line.\n• Replace CMP-EXP-4421 on held serials and re-run nitrogen decay with a valid gauge.\n• Impose C=0 incoming on this PN until two clean lots.\nHuman authorization required before changing controlled records.",
  preventive:
    "Suggested preventive actions:\n• Supplier tool-life interlock at 15,000 cycles.\n• Add Alpha to Q4 supplier audit plan.\n• Update WI-AHU-07 to require valve lot scan at charge station.\nAI must not implement these actions automatically.",
  ncr:
    "NCR history search:\nOpen/high: NCR-2026-0012 (Alpha valve, Investigation), NCR-2026-0026 (AHU leakage repeat), NCR-2026-0005 (process leak).\nClosed reference: NCR-2026-0014 (prior Alpha lot).",
  complaint:
    "Customer complaint history:\nLeakage: CC-2026-0009, CC-2026-0006, CC-2026-0012, CC-2026-0015.\nNoise trending: CC-2026-0001, CC-2026-0004, CC-2026-0008, CC-2026-0013.\nGulf Climate Solutions is the repeat leakage account.",
  supplier:
    "Supplier NCR history:\nAlpha: SNCR-2026-0004 (open response), SNCR-2026-0006 (closed).\nEastern Controls PCB coating: SNCR-2026-0005.\nOasis compressor cleanliness: SNCR-2026-0001.",
  audit:
    "Audit question preparation (ISO 9001):\n8.5.1 — Show last 5 AHU brazing logs including night shift.\n8.7 — Demonstrate source_event_id linkage from inspection → PC → NCR → SNCR → CAPA.\n7.1.5 — Show how expired CAL-0002 is blocked and CAL-0042 is scheduled.\n10.2 — Evidence of effectiveness verification, not just action completion.",
  risk:
    "Risk explanation:\nBusiness-rule engine flagged Alpha deterioration because three or more distinct component quality events share supplier Alpha. This is a deterministic count of source_event_id, not an AI decision. AI only explains the flag.",
  trend:
    "Quality trend explanation:\nProduction PPM moved 388 → 401 → 412 (Jul–Sep). FPY declined two periods on AHU. Leakage is the top defect bar. Customer FFR PPM rose with leakage/noise complaints. COPQ increased in Sep from AHU scrap source records (not copied from RRR).",
  document:
    "Document analysis (demo):\nSummary: Supplier 8D attributes leak to tool wear.\nDetected KPIs: SPPM, incoming reject rate.\nDates: completion 2026-10-09; audit proposed Q4.\nRisks: repeat leak if stock is consumed.\nActions: C=0 sampling, tool interlock.\nResponsible: Hiroshi Tanaka / SAMCO incoming inspector.\nDeadlines: 5 days.\nQuality issues: flare-seat porosity.\nRecommendations are advisory drafts only.",
};

export class MockAIProvider implements AIProvider {
  name = "MockAIProvider";

  async complete(messages: AIMessage[]): Promise<string> {
    const last = messages.filter((m) => m.role === "user").at(-1)?.content.toLowerCase() ?? "";
    if (last.includes("cause")) return LIBRARY.causes;
    if (last.includes("similar") || last.includes("previous")) return LIBRARY.similar;
    if (last.includes("prevent")) return LIBRARY.preventive;
    if (last.includes("correct")) return LIBRARY.corrective;
    if (last.includes("complaint")) return LIBRARY.complaint;
    if (last.includes("supplier")) return LIBRARY.supplier;
    if (last.includes("audit")) return LIBRARY.audit;
    if (last.includes("risk")) return LIBRARY.risk;
    if (last.includes("trend")) return LIBRARY.trend;
    if (last.includes("document") || last.includes("analy")) return LIBRARY.document;
    if (last.includes("ncr") || last.includes("search")) return LIBRARY.ncr;
    return `${LIBRARY.similar}\n\n${LIBRARY.risk}`;
  }
}
