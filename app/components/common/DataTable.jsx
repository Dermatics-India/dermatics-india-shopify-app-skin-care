import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Normalizes a value pair for cross-type comparison. Nulls sort last.
// Numbers compare numerically; everything else falls back to a numeric-aware
// locale string compare (so "Item 2" sorts before "Item 10", and ISO date
// strings sort chronologically).
function compareValues(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

/**
 * Reusable Polaris-style table with built-in search, sortable columns,
 * page-size selector, and pagination.
 *
 * Columns:
 *   { key, header, render?(row, i), sortable?, sortValue?(row) }
 *
 * Search:
 *   - Pass `searchableFields={["name", "email"]}` to enable the built-in
 *     case-insensitive `includes` filter — DataTable owns the input state.
 *   - For controlled search (e.g. URL-backed), pass `searchValue` +
 *     `onSearchChange` instead. With both, the parent supplies pre-filtered
 *     rows; the field is purely UI.
 *
 * Filters slot:
 *   - `filters` renders on the right side of the header row (DateRangePicker,
 *     dropdowns, action buttons, etc.).
 *
 * Pagination:
 *   - Client-side (default) — pass the full `rows` array.
 *   - Server-side — pass `page`, `totalCount`, `onPageChange`. For controlled
 *     sorting, also pass `sortKey`, `sortDirection`, `onSortChange`.
 */
export function DataTable({
  columns,
  rows,
  rowKey,
  onRowClick,
  loading,
  pageSize: pageSizeProp = 20,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  page,
  totalCount,
  onPageChange,
  onPageSizeChange,
  sortKey: sortKeyProp,
  sortDirection: sortDirectionProp,
  onSortChange,
  emptyState,
  // Search + filters slot
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchLabel,
  searchableFields,
  filters,
}) {
  const { t } = useTranslation();

  const isServerPage =
    typeof totalCount === "number" && typeof onPageChange === "function";
  const isServerSort = typeof onSortChange === "function";
  const isControlledSearch = typeof onSearchChange === "function";

  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(pageSizeProp);
  const [internalSort, setInternalSort] = useState({ key: null, direction: null });
  const [internalSearch, setInternalSearch] = useState("");

  const currentPage = isServerPage ? Math.max(1, page || 1) : internalPage;
  const currentPageSize = isServerPage ? pageSizeProp : internalPageSize;
  const sortKey = isServerSort ? sortKeyProp : internalSort.key;
  const sortDirection = isServerSort ? sortDirectionProp : internalSort.direction;
  const query = isControlledSearch ? (searchValue || "") : internalSearch;

  const showSearch = isControlledSearch || Array.isArray(searchableFields);
  const showHeader = showSearch || filters != null;

  // Built-in search filtering (skipped when caller controls it).
  const searchedRows = useMemo(() => {
    if (isControlledSearch || !Array.isArray(searchableFields)) return rows;
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      searchableFields.some((field) =>
        String(row?.[field] ?? "").toLowerCase().includes(q),
      ),
    );
  }, [rows, query, searchableFields, isControlledSearch]);

  const sortedRows = useMemo(() => {
    if (isServerSort || !sortKey || !sortDirection) return searchedRows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return searchedRows;
    const accessor = col.sortValue || ((row) => row[col.key]);
    const sign = sortDirection === "asc" ? 1 : -1;
    return [...searchedRows].sort(
      (a, b) => sign * compareValues(accessor(a), accessor(b)),
    );
  }, [searchedRows, sortKey, sortDirection, columns, isServerSort]);

  const total = isServerPage ? totalCount : sortedRows.length;
  const totalPages = currentPageSize > 0 ? Math.max(1, Math.ceil(total / currentPageSize)) : 1;
  const paginationVisible = currentPageSize > 0;

  const visibleRows = useMemo(() => {
    if (!currentPageSize) return sortedRows;
    if (isServerPage) return sortedRows;
    const start = (currentPage - 1) * currentPageSize;
    return sortedRows.slice(start, start + currentPageSize);
  }, [sortedRows, currentPage, currentPageSize, isServerPage]);

  const setPage = (next) => {
    const clamped = Math.min(totalPages, Math.max(1, next));
    if (clamped === currentPage) return;
    if (isServerPage) onPageChange(clamped);
    else setInternalPage(clamped);
  };

  const setPageSize = (next) => {
    const n = Number(next);
    if (!Number.isFinite(n) || n <= 0) return;
    if (typeof onPageSizeChange === "function") onPageSizeChange(n);
    if (!isServerPage) {
      setInternalPageSize(n);
      setInternalPage(1);
    }
  };

  const setSearch = (next) => {
    if (isControlledSearch) onSearchChange(next);
    else setInternalSearch(next);
    if (!isServerPage) setInternalPage(1);
  };

  const toggleSort = (col) => {
    if (!col.sortable) return;
    const next =
      sortKey === col.key
        ? { key: col.key, direction: sortDirection === "asc" ? "desc" : "asc" }
        : { key: col.key, direction: "asc" };
    if (isServerSort) onSortChange(next);
    else {
      setInternalSort(next);
      if (!isServerPage) setInternalPage(1);
    }
  };

  const startIdx = total === 0 ? 0 : (currentPage - 1) * currentPageSize + 1;
  const endIdx = Math.min(total, currentPage * currentPageSize);

  const sizeSelectorVisible =
    pageSizeOptions.length > 1 &&
    (!isServerPage || typeof onPageSizeChange === "function");

  return (
    <s-stack direction="block" gap="none">
      {showHeader && (
        <>
        <s-stack
          direction="inline"
          justifyContent="space-between"
          alignItems="center"
          padding="small"
        >
          {showSearch && (
            <s-search-field
              label={searchLabel || t("cmn.dataTable.searchLabel")}
              labelAccessibilityVisibility="exclusive"
              placeholder={searchPlaceholder || t("cmn.dataTable.searchPlaceholder")}
              value={query}
              onInput={(e) => setSearch(e.target.value)}
              autocomplete="off"
              inlineSize="fill"
              style={{ flex: 1, minWidth: 0 }}
            />
          )}
          {filters && (
            <s-stack direction="inline" alignItems="center" gap="small-200">
              {filters}
            </s-stack>
          )}
        </s-stack>
        <s-divider color="strong"></s-divider>
        </>
      )}

      <s-table>
        <s-table-header-row>
          {columns.map((col) => {
            const active = col.sortable && sortKey === col.key;
            const indicator = !col.sortable
              ? ""
              : active
                ? sortDirection === "asc"
                  ? " ▲"
                  : " ▼"
                : " ↕";
            return (
              <s-table-header
                key={col.key}
                onClick={col.sortable ? () => toggleSort(col) : undefined}
                style={
                  col.sortable
                    ? { cursor: "pointer", userSelect: "none" }
                    : undefined
                }
              >
                {col.header}
                {col.sortable && (
                  <s-text tone={active ? undefined : "subdued"}>{indicator}</s-text>
                )}
              </s-table-header>
            );
          })}
        </s-table-header-row>
        <s-table-body>
          {!loading && visibleRows.map((row, i) => (
            <s-table-row
              key={rowKey(row, i)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={onRowClick ? { cursor: "pointer" } : undefined}
            >
              {columns.map((col) => (
                <s-table-cell key={col.key}>
                  {col.render ? col.render(row, i) : row[col.key]}
                </s-table-cell>
              ))}
            </s-table-row>
          ))}
        </s-table-body>
      </s-table>

      {loading ? (
        <s-stack
          direction="block"
          alignItems="center"
          justifyContent="center"
          padding="large-200"
        >
          <s-spinner accessibilityLabel={t("cmn.loading")} />
        </s-stack>
      ) : visibleRows.length === 0 ? (
        <s-box padding="base">
          {emptyState || (
            <s-text tone="subdued">{t("cmn.dataTable.empty")}</s-text>
          )}
        </s-box>
      ) : null}

      {(paginationVisible && total > 0) && (
        <s-stack
          direction="inline"
          justifyContent="space-between"
          alignItems="center"
          gap="large-100"
          padding="small"
          border="solid"
          borderWidth="base"
        >
          <s-box>
            {sizeSelectorVisible && (
              <s-stack direction="inline" alignItems="center" gap="small-200">
                <s-select
                  value={String(currentPageSize)}
                  onChange={(e) => setPageSize(e.target.value)}
                  disabled={visibleRows.length === 0}
                >
                  {pageSizeOptions.map((n) => (
                    <s-option key={n} value={String(n)}>
                      {n}
                    </s-option>
                  ))}
                </s-select>
              </s-stack>
            )}
          </s-box>
          <s-stack direction="inline" alignItems="center" gap="small-200">
            <s-text tone="subdued">
              { total > 0 && t("cmn.dataTable.rangeOf", {
                start: startIdx,
                end: endIdx,
                total,
              })}
            </s-text>
            <s-stack direction="inline" gap="small-200">
              <s-button
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                {t("cmn.dataTable.previous")}
              </s-button>
              <s-button
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                {t("cmn.dataTable.next")}
              </s-button>
            </s-stack>
          </s-stack>
        </s-stack>
      )}
    </s-stack>
  );
}
