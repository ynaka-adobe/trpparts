/*
 * Table Block
 * Recreate a table
 * https://www.hlx.live/developer/block-collection/table
 */

function buildCell(rowIndex) {
  const cell = rowIndex ? document.createElement('td') : document.createElement('th');
  if (!rowIndex) cell.setAttribute('scope', 'col');
  return cell;
}

export default async function decorate(block) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  const header = !block.classList.contains('no-header');
  if (header) table.append(thead);
  table.append(tbody);

  [...block.children].forEach((child, i) => {
    const row = document.createElement('tr');
    if (header && i === 0) thead.append(row);
    else tbody.append(row);
    [...child.children].forEach((col) => {
      const cell = buildCell(header ? i : i + 1);
      cell.innerHTML = col.innerHTML;
      row.append(cell);
    });
  });
  // each body cell knows its column name, so narrow screens can stack a row as "label value" lines;
  // explicit roles keep it a table for assistive tech once CSS lays it out as blocks
  table.setAttribute('role', 'table');
  table.querySelectorAll('tr').forEach((tr) => tr.setAttribute('role', 'row'));
  table.querySelectorAll('th').forEach((th) => th.setAttribute('role', 'columnheader'));
  table.querySelectorAll('td').forEach((td) => td.setAttribute('role', 'cell'));
  [thead, tbody].forEach((group) => group.setAttribute('role', 'rowgroup'));
  if (header && thead.rows[0]) {
    const labels = [...thead.rows[0].cells].map((th) => th.textContent.trim());
    [...tbody.rows].forEach((tr) => {
      [...tr.cells].forEach((td, i) => {
        if (labels[i]) td.dataset.label = labels[i];
      });
    });
  }
  block.innerHTML = '';
  block.append(table);
}
