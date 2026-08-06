import ReceiptTape from "../components/ReceiptTape.jsx";
import ReceiptFilterTabs from "../components/ReceiptFilterTabs.jsx";
import MerchantInsights from "../components/MerchantInsights.jsx";
import ExportPanel from "../components/ExportPanel.jsx";

export default function Receipts({
  receipts,
  filteredReceipts,
  itemsByReceipt,
  deductibleDefaults,
  filterTab,
  onFilterChange,
  onDelete,
  onToggleDeductible,
  expenses,
}) {
  return (
    <>
      <header className="app-header">
        <div>
          <h1 className="app-title">
            Receipts<span>.</span>
          </h1>
          <div className="app-subtitle">browse, filter, and export your receipts</div>
        </div>
      </header>

      <h2 className="section-title">Merchant insights</h2>
      <MerchantInsights />

      <h2 className="section-title">Recent receipts</h2>
      <ReceiptFilterTabs active={filterTab} onChange={onFilterChange} />
      <div className="tape-list">
        {filteredReceipts.length === 0 && receipts.length === 0 && (
          <div className="empty-state">No receipts yet — scan your first one from the Dashboard.</div>
        )}
        {filteredReceipts.length === 0 && receipts.length > 0 && (
          <div className="empty-state">No receipts match this filter.</div>
        )}
        {filteredReceipts.map((r) => (
          <ReceiptTape
            key={r.id}
            receipt={r}
            items={itemsByReceipt[r.id] || []}
            deductibleDefaults={deductibleDefaults}
            onDelete={onDelete}
            onToggleDeductible={onToggleDeductible}
          />
        ))}
      </div>

      <h2 className="section-title">Export &amp; reports</h2>
      <ExportPanel expenses={expenses} />
    </>
  );
}
