/*
 * table-ruled: the boilerplate Table (first row is the header unless "no-header"),
 * drawn with a rule under every row (source: /about-us/warranty/ .warranty-table).
 */
import decorateTable from '../table/table.js';

export default async function decorate(block) {
  await decorateTable(block);

  const table = block.querySelector('table');
  if (!table) return;

  /*
   * Below 481px the rows are restyled as grids (product name on its own line).
   * Changing the display of table elements drops their table semantics in some
   * browsers, so state the roles explicitly.
   */
  table.setAttribute('role', 'table');
  table.querySelectorAll('thead, tbody').forEach((group) => group.setAttribute('role', 'rowgroup'));
  table.querySelectorAll('tr').forEach((row) => {
    row.setAttribute('role', 'row');
    row.classList.add('table-ruled-row');
  });
  table.querySelectorAll('th').forEach((cell) => cell.setAttribute('role', 'columnheader'));
  table.querySelectorAll('td').forEach((cell) => cell.setAttribute('role', 'cell'));
}
