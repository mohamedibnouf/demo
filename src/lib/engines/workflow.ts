export function nextWorkflowStatus(collection: string, status: string): string | undefined {
  if (collection === "capas") {
    const map: Record<string, string> = {
      Draft: "Open",
      Open: "In Progress",
      "In Progress": "Pending Verification",
      "Pending Verification": "Effective",
      Effective: "Closed",
      Ineffective: "In Progress",
    };
    return map[status];
  }
  if (collection === "ncrs") {
    const map: Record<string, string> = {
      Draft: "Submitted",
      Submitted: "Under Review",
      "Under Review": "Investigation",
      Investigation: "Action Required",
      "Action Required": "Verification",
      Verification: "Closed",
    };
    return map[status];
  }
  const map: Record<string, string> = {
    Draft: "Submitted",
    Submitted: "Under Review",
    "Under Review": "Investigation",
    Investigation: "Action Required",
    "Action Required": "Verification",
    Verification: "Closed",
    Open: "In Progress",
    Issued: "Supplier Submitted",
    "Supplier Submitted": "Quality Review",
    "Quality Review": "Accepted",
    Accepted: "Verification",
    Request: "PE Manager Approval",
    "PE Manager Approval": "QE Document Review",
    "QE Document Review": "Quality Evaluation",
    "Quality Evaluation": "QE Review",
    "QE Review": "PE Review",
    "PE Review": "Final Approval",
    "Final Approval": "Approved",
    Planned: "In Progress",
    Completed: "Closed",
  };
  return map[status];
}
