import { useMemo, useState } from "react";
import { exportUrl } from "../api.js";

export default function ExportPanel({ expenses }) {
  const [scope, setScope] = useState("all");

  const monthOptions = useMemo(() => {
    const set = new Set(expenses.map((e) => (e.date || "").slice(0, 7)).filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [expenses]);

  const yearOptions = useMemo(() => {
    const set = new Set(expenses.map((e) => (e.date || "").slice(0, 4)).filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [expenses]);

  return (
    <div className="chart-card">
      <div className="export-row">
        <label htmlFor="export-scope">Period</label>
        <select id="export-scope" value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="all">All time</option>
          <optgroup label="By year">
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </optgroup>
          <optgroup label="By month">
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      <div className="export-actions">
        <a className="upload-btn" href={exportUrl("csv", scope)} download>
          Download CSV
        </a>
        <a className="export-secondary-btn" href={exportUrl("pdf", scope)} download>
          Download PDF
        </a>
      </div>
    </div>
  );
}
