import { Trash2 } from "lucide-react";
import { avatarColor, categoryColor } from "../categoryColors.js";

function DeductibleToggle({ expense, deductibleDefaults, onToggle }) {
  // Three states cycled by click: null (use category default) -> true -> false -> null
  const override = expense.deductible === null || expense.deductible === undefined ? null : !!expense.deductible;
  const effective = override === null ? !!deductibleDefaults[expense.category] : override;

  function handleClick() {
    const next = override === null ? true : override === true ? false : null;
    onToggle(expense.id, next);
  }

  let label = effective ? "Deductible" : "Not deductible";
  if (override === null) label += " (default)";

  return (
    <button
      className={`deductible-toggle${effective ? " on" : ""}${override === null ? " default" : ""}`}
      onClick={handleClick}
      title="Click to override this item's tax-deductible status"
      type="button"
    >
      {label}
    </button>
  );
}

export default function ReceiptTape({ receipt, items, deductibleDefaults, onDelete, onToggleDeductible }) {
  const avatar = avatarColor(receipt.merchant);

  return (
    <div className="tape">
      <div className="tape-header">
        <div className="tape-header-left">
          <div className="tape-avatar" style={{ background: avatar.bg, color: avatar.text }}>
            {receipt.merchant?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <div className="tape-merchant">{receipt.merchant}</div>
            <div className="tape-date">{receipt.date}</div>
          </div>
        </div>
        <button className="tape-icon-delete" onClick={() => onDelete(receipt.id)} title="Delete receipt">
          <Trash2 size={15} strokeWidth={2} />
        </button>
      </div>

      {items.map((item) => {
        const c = categoryColor(item.category);
        return (
          <div className="tape-row" key={item.id}>
            <span className="tape-item-name">
              {item.item_name}
              <span className="tape-item-category" style={{ background: c.bg, color: c.text }}>
                {item.category}
              </span>
              <DeductibleToggle
                expense={item}
                deductibleDefaults={deductibleDefaults}
                onToggle={onToggleDeductible}
              />
            </span>
            <span className="tape-item-price">${item.price?.toFixed(2)}</span>
          </div>
        );
      })}

      <div className="tape-total-row">
        <span>TOTAL</span>
        <span>${receipt.total?.toFixed(2)}</span>
      </div>
    </div>
  );
}
