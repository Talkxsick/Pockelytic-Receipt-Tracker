import { categoryColor } from "../categoryColors.js";

export default function ReceiptTape({ receipt, onDelete }) {
  let items = [];
  try {
    items = JSON.parse(receipt.raw_json || "{}").items || [];
  } catch {
    items = [];
  }

  return (
    <div className="tape">
      <div className="tape-header">
        <div>
          <div className="tape-merchant">{receipt.merchant}</div>
          <div className="tape-date">{receipt.date}</div>
        </div>
        <button className="tape-delete" onClick={() => onDelete(receipt.id)}>
          remove
        </button>
      </div>

      {items.map((item, i) => {
        const c = categoryColor(item.category);
        return (
          <div className="tape-row" key={i}>
            <span className="tape-item-name">
              {item.name}
              <span className="tape-item-category" style={{ background: c.bg, color: c.text }}>
                {item.category}
              </span>
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
