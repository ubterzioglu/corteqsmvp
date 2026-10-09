import type { ArchRow } from "@/lib/investor/architecture-content";

interface ArchRowTableProps {
  rows: readonly ArchRow[];
  caption: string;
  /** "kv": etiket + değer (+ alt not) · "stacked": değer kalın, not altta. */
  variant?: "kv" | "stacked";
}

const ArchRowTable = ({ rows, caption, variant = "kv" }: ArchRowTableProps) => (
  <table className={`arch-table arch-table--${variant}`}>
    <caption className="arch-caption inv-mono">{caption}</caption>
    <tbody>
      {rows.map((row) => (
        <tr key={row.label}>
          <th scope="row">{row.label}</th>
          <td>
            <span className="arch-table__value">{row.value}</span>
            {row.note ? <span className="arch-table__note">{row.note}</span> : null}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default ArchRowTable;
