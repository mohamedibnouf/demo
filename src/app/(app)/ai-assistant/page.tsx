import { askAssistant, recentAnalyses } from "@/server/ai/actions";
import { Card, PageHeader } from "@/components/ui";
import { AssistantForm } from "@/features/ai/assistant-form";

const ACTIONS = [
  "Suggest Possible Causes",
  "Find Similar Previous Cases",
  "Suggest Corrective Actions",
  "Suggest Preventive Actions",
  "Search NCR History",
  "Search Customer Complaint History",
  "Search Supplier NCR History",
  "Audit Question Preparation",
  "Risk Explanation",
  "Quality Trend Explanation",
  "Uploaded Document Analysis",
];

export default async function AiPage() {
  const history = await recentAnalyses();
  return (
    <div className="space-y-4">
      <PageHeader title="AI Quality Assistant" subtitle="Internal advisory assistant — never a decision maker" />
      <Card className="border-amber-200 bg-amber-50 p-3 text-sm text-warning">
        AI recommendations are advisory. Final decisions remain with authorized SAMCO personnel.
      </Card>
      <AssistantForm actions={ACTIONS} ask={askAssistant} />
      {history.length ? (
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase text-muted">Recent analyses</h2>
          <ul className="space-y-3 text-sm">
            {history.map((h) => (
              <li key={h.id}>
                <p className="font-medium">
                  {h.topic} · {h.provider}
                </p>
                <p className="whitespace-pre-wrap text-muted">{h.result.slice(0, 280)}…</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
