import React from "react";
import { Table as TanStackTable } from "@tanstack/react-table";

interface TablePaginationProps {
  table: TanStackTable<any>;
}

const TablePagination = ({ table }: TablePaginationProps) => {
  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = table.getFilteredRowModel().rows.length;
  const startEntry = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endEntry = Math.min((pageIndex + 1) * pageSize, totalRows);
  const totalPages = table.getPageCount();
  const currentPage = pageIndex + 1;

  // Generate page numbers with ellipsis for large page counts
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 9) {
      // Show all pages if 9 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      pages.push(2);

      // Add ellipsis if current page is far from start
      if (currentPage > 4) {
        pages.push("...");
      }

      // Show pages around current page
      const startPage = Math.max(3, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      for (let i = startPage; i <= endPage; i++) {
        if (i !== 1 && i !== 2 && !pages.includes(i)) {
          pages.push(i);
        }
      }

      // Add ellipsis if current page is far from end
      if (currentPage < totalPages - 3) {
        pages.push("...");
      }

      // Always show last two pages
      if (!pages.includes(totalPages - 1)) {
        pages.push(totalPages - 1);
      }
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="row gy-2">
      <div className="col-sm-12 col-md-5 p-0">
        <div
          className="dataTables_info text-lg-start text-center"
          id="proposalList_info"
          role="status"
          aria-live="polite"
        >
          {totalRows === 0
            ? "Showing 0 entries"
            : `Showing ${startEntry} to ${endEntry} of ${totalRows} entries`}
        </div>
      </div>
      <div className="col-sm-12 col-md-7 p-0">
        <div className="dataTables_paginate paging_simple_numbers d-flex justify-content-md-end justify-content-center align-items-center gap-2">
          <ul className="pagination mb-0">
            <li
              className={`paginate_button page-item previous ${
                !table.getCanPreviousPage() ? "disabled" : ""
              }`}
            >
              <a
                href="#"
                className="page-link"
                onClick={(e) => {
                  e.preventDefault();
                  if (table.getCanPreviousPage()) {
                    table.previousPage();
                  }
                }}
              >
                Prev
              </a>
            </li>
            {pageNumbers.map((page, index) => (
              <li
                key={index}
                className={`paginate_button page-item ${
                  page === currentPage ? "active" : ""
                } ${page === "..." ? "disabled" : ""}`}
              >
                <a
                  href="#"
                  className="page-link"
                  onClick={(e) => {
                    e.preventDefault();
                    if (typeof page === "number") {
                      table.setPageIndex(page - 1);
                    }
                  }}
                >
                  {page}
                </a>
              </li>
            ))}
            <li
              className={`paginate_button page-item next ${
                !table.getCanNextPage() ? "disabled" : ""
              }`}
            >
              <a
                href="#"
                className="page-link"
                onClick={(e) => {
                  e.preventDefault();
                  if (table.getCanNextPage()) {
                    table.nextPage();
                  }
                }}
              >
                Next
              </a>
            </li>
          </ul>
          <div className="ms-2">
            <select
              className="form-select form-select-sm w-auto"
              value={pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
                table.setPageIndex(0); // Reset to first page when page size changes
              }}
            >
              {[10, 20, 30, 40, 50].map((size) => (
                <option key={size} value={size}>
                  Show {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TablePagination;
