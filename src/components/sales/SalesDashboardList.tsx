import React, { useCallback, useEffect, useState, useRef } from 'react';
import { salesService, SalesListItem } from '@/services/salesService';
import Swal from 'sweetalert2';
import { FiChevronLeft, FiChevronRight, FiSearch } from 'react-icons/fi';

export type SaleStatus = 'All' | 'Paid' | 'Unpaid' | 'Draft' | 'Cancelled';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 30, 50];
const DEFAULT_PAGE_SIZE = 10;
const POLLING_INTERVAL = 5000; // 5 seconds

interface SalesDashboardListProps {
  selectedReceiptNumber: string | null;
  onSelectReceipt: (receiptNumber: string) => void;
  refreshTrigger?: number;
}

const SalesDashboardList: React.FC<SalesDashboardListProps> = ({
  selectedReceiptNumber,
  onSelectReceipt,
  refreshTrigger = 0,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<SaleStatus>('Draft');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sales, setSales] = useState<SalesListItem[]>([]);
  const [allSales, setAllSales] = useState<SalesListItem[]>([]); // Store all fetched sales for frontend search
  const [loading, setLoading] = useState(true);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalItems: 0,
    totalPages: 0,
  });

  // Fetch all sales for frontend search (with loading state)
  const fetchAllSales = useCallback(
    async (status: SaleStatus, showLoading: boolean = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        }
        let allFetchedSales: SalesListItem[] = [];
        let currentPage = 1;
        let hasMorePages = true;

        // Fetch all pages
        while (hasMorePages) {
          const response = await salesService.getAllSales({
            page: currentPage,
            pageSize: 100, // Fetch larger page size to reduce API calls
            sortBy: 'date',
            sortDirection: 'desc',
            saleStatus: status === 'All' ? undefined : status,
          });
          
          allFetchedSales = [...allFetchedSales, ...response.data];
          
          if (response.currentPage >= response.totalPages) {
            hasMorePages = false;
          } else {
            currentPage++;
          }
        }

        setAllSales(allFetchedSales);
        return allFetchedSales;
      } catch (err) {
        // Only show error on initial load, not during polling
        if (showLoading) {
          setAllSales([]);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err instanceof Error ? err.message : 'Failed to load sales',
          });
        }
        return [];
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    []
  );

  // Silent fetch for polling (no loading state, no error alerts)
  const fetchAllSalesSilent = useCallback(
    async (status: SaleStatus) => {
      try {
        let allFetchedSales: SalesListItem[] = [];
        let currentPage = 1;
        let hasMorePages = true;

        // Fetch all pages
        while (hasMorePages) {
          const response = await salesService.getAllSales({
            page: currentPage,
            pageSize: 100,
            sortBy: 'date',
            sortDirection: 'desc',
            saleStatus: status === 'All' ? undefined : status,
          });
          
          allFetchedSales = [...allFetchedSales, ...response.data];
          
          if (response.currentPage >= response.totalPages) {
            hasMorePages = false;
          } else {
            currentPage++;
          }
        }

        setAllSales(allFetchedSales);
        return allFetchedSales;
      } catch (err) {
        // Silently fail during polling
        console.error("Error polling sales:", err);
        return [];
      }
    },
    []
  );

  // Frontend search function
  const performFrontendSearch = useCallback(
    (allSalesData: SalesListItem[], query: string, status: SaleStatus, page: number, pageSize: number) => {
      let filteredSales = allSalesData;

      // Filter by search query (partial match in receipt number)
      if (query.trim()) {
        const searchLower = query.trim().toLowerCase();
        filteredSales = filteredSales.filter((sale) =>
          sale.receiptNumber.toLowerCase().includes(searchLower)
        );
      }

      // Filter by status (already filtered in fetchAllSales, but double-check)
      if (status !== 'All') {
        filteredSales = filteredSales.filter((sale) => sale.saleStatus === status);
      }

      // Sort by date (descending)
      filteredSales.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });

      // Paginate
      const totalItems = filteredSales.length;
      const totalPages = Math.ceil(totalItems / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedSales = filteredSales.slice(startIndex, endIndex);

      setSales(paginatedSales);
      setPagination({
        page,
        pageSize,
        totalItems,
        totalPages,
      });
    },
    []
  );

  // Refs for polling handlers - use stable initial values
  const selectedStatusRef = useRef<SaleStatus>('Draft');
  const searchQueryRef = useRef<string>('');
  const paginationRef = useRef({ page: 1, pageSize: DEFAULT_PAGE_SIZE, totalItems: 0, totalPages: 0 });
  const fetchAllSalesSilentRef = useRef<((status: SaleStatus) => Promise<SalesListItem[]>) | null>(null);
  const performFrontendSearchRef = useRef<
    ((data: SalesListItem[], query: string, status: SaleStatus, page: number, pageSize: number) => void) | null
  >(null);

  // Fetch all sales when status changes or on initial load
  useEffect(() => {
    fetchAllSales(selectedStatus).then((allSalesData) => {
      if (allSalesData.length > 0) {
        performFrontendSearch(allSalesData, searchQuery, selectedStatus, 1, pagination.pageSize);
      }
    });
  }, [selectedStatus, refreshTrigger, fetchAllSales]);

  // Perform frontend search when search query changes
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (allSales.length > 0) {
        performFrontendSearch(allSales, searchQuery, selectedStatus, 1, pagination.pageSize);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, allSales, selectedStatus, pagination.pageSize, performFrontendSearch]);

  // Keep refs in sync so polling handlers always see latest values
  useEffect(() => {
    selectedStatusRef.current = selectedStatus;
  }, [selectedStatus]);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);

  useEffect(() => {
    fetchAllSalesSilentRef.current = fetchAllSalesSilent;
  }, [fetchAllSalesSilent]);

  useEffect(() => {
    performFrontendSearchRef.current = performFrontendSearch;
  }, [performFrontendSearch]);

  // Handle pagination changes
  useEffect(() => {
    if (allSales.length > 0) {
      performFrontendSearch(allSales, searchQuery, selectedStatus, pagination.page, pagination.pageSize);
    }
  }, [pagination.page, pagination.pageSize, allSales, searchQuery, selectedStatus, performFrontendSearch]);

  // Polling for real-time updates (silent, no loading state)
  useEffect(() => {
    let isMounted = true;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let isPolling = false; // Prevent overlapping polls

    const pollSales = async () => {
      if (!isMounted || isPolling) return;
      
      isPolling = true;
      try {
        const fetchFn = fetchAllSalesSilentRef.current;
        const searchFn = performFrontendSearchRef.current;
        if (!fetchFn || !searchFn) {
          isPolling = false;
          return;
        }

        const currentStatus = selectedStatusRef.current;
        const currentQuery = searchQueryRef.current;
        const currentPage = paginationRef.current.page;
        const currentPageSize = paginationRef.current.pageSize;
        
        // Silently refresh sales data in background
        const refreshedSales = await fetchFn(currentStatus);
        if (isMounted) {
          // Only update if data changed to prevent unnecessary re-renders
          // Update even if empty to handle deletions
          searchFn(refreshedSales, currentQuery, currentStatus, currentPage, currentPageSize);
        }
      } catch (error) {
        // Silently handle errors during polling
        console.error("Error polling sales:", error);
      } finally {
        isPolling = false;
      }
    };

    // Start polling after initial load (wait a bit to avoid immediate refresh)
    const startPolling = setTimeout(() => {
      if (isMounted) {
        pollInterval = setInterval(pollSales, POLLING_INTERVAL);
      }
    }, POLLING_INTERVAL);

    // Cleanup
    return () => {
      isMounted = false;
      clearTimeout(startPolling);
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, []); // Only run once on mount

  const handleStatusChange = (status: SaleStatus) => {
    setSelectedStatus(status);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      page: 1,
      pageSize: newPageSize,
    }));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const startEntry =
    pagination.totalItems === 0
      ? 0
      : (pagination.page - 1) * pagination.pageSize + 1;
  const endEntry = Math.min(
    pagination.page * pagination.pageSize,
    pagination.totalItems
  );

  return (
    <div className="card h-100 border-0 shadow-sm">
      <div className="card-header bg-transparent border-bottom py-3">
        <div className="d-flex align-items-center gap-2">
          <h5 className="card-title mb-0 fw-bold">Sales List</h5>
          <div className="d-flex align-items-center gap-2 ms-auto">
            <div className="position-relative" style={{ width: '200px' }}>
              <FiSearch className="position-absolute" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d', pointerEvents: 'none' }} size={16} />
              <input
                type="text"
                className="form-control form-control-sm ps-5"
                placeholder="Search receipt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto', minWidth: '120px' }}
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value as SaleStatus)}
            >
              <option value="All">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>
      <div className="card-body p-0 d-flex flex-column">

        {loading ? (
          <div className="d-flex justify-content-center align-items-center flex-grow-1 py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            <div className="table-responsive flex-grow-1">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col" className="border-0 ps-3">
                      Receipt Number
                    </th>
                    <th scope="col" className="border-0">
                      Status
                    </th>
                    <th scope="col" className="border-0 text-end pe-3">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sales.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center text-muted py-4 ps-3 pe-3">
                        No {selectedStatus === 'All' ? '' : selectedStatus} receipts found.
                      </td>
                    </tr>
                  ) : (
                    sales.map((sale) => {
                      const getStatusBadgeClass = (status: string) => {
                        switch (status) {
                          case 'Paid':
                            return 'badge bg-success';
                          case 'Unpaid':
                            return 'badge bg-warning';
                          case 'Draft':
                            return 'badge bg-info';
                          case 'Cancelled':
                            return 'badge bg-danger';
                          default:
                            return 'badge bg-secondary';
                        }
                      };

                      return (
                        <tr
                          key={sale.salesId}
                          className={
                            selectedReceiptNumber === sale.receiptNumber
                              ? 'table-primary'
                              : ''
                          }
                        >
                          <td className="ps-3">
                            <button
                              type="button"
                              className="btn btn-link p-0 text-primary text-decoration-none fw-semibold text-start"
                              onClick={() => onSelectReceipt(sale.receiptNumber)}
                            >
                              {sale.receiptNumber}
                            </button>
                          </td>
                          <td>
                            <span className={getStatusBadgeClass(sale.saleStatus)}>
                              {sale.saleStatus}
                            </span>
                          </td>
                          <td className="text-end pe-3">
                            {formatDate(sale.date)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 0 && (
              <div className="card-footer bg-transparent border-top d-flex flex-wrap align-items-center justify-content-between gap-2 py-2">
                <div className="d-flex align-items-center gap-2 order-2 order-md-1">
                  <span className="small text-muted">
                    Showing {startEntry} to {endEntry} of {pagination.totalItems} entries
                  </span>
                  <select
                    className="form-select form-select-sm w-auto"
                    value={pagination.pageSize}
                    onChange={(e) =>
                      handlePageSizeChange(Number(e.target.value))
                    }
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
                <ul className="pagination pagination-sm mb-0 order-1 order-md-2">
                  <li
                    className={`page-item ${
                      pagination.page <= 1 ? 'disabled' : ''
                    }`}
                  >
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      aria-label="Previous"
                    >
                      <FiChevronLeft size={16} />
                    </button>
                  </li>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      const current = pagination.page;
                      if (pagination.totalPages <= 7) return true;
                      return (
                        p === 1 ||
                        p === pagination.totalPages ||
                        Math.abs(p - current) <= 1
                      );
                    })
                    .map((p, idx, arr) => {
                      const prev = arr[idx - 1];
                      const showEllipsis = prev !== undefined && p - prev > 1;
                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && (
                            <li className="page-item disabled">
                              <span className="page-link">…</span>
                            </li>
                          )}
                          <li
                            className={`page-item ${
                              pagination.page === p ? 'active' : ''
                            }`}
                          >
                            <button
                              type="button"
                              className="page-link"
                              onClick={() => handlePageChange(p)}
                            >
                              {p}
                            </button>
                          </li>
                        </React.Fragment>
                      );
                    })}
                  <li
                    className={`page-item ${
                      pagination.page >= pagination.totalPages ? 'disabled' : ''
                    }`}
                  >
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      aria-label="Next"
                    >
                      <FiChevronRight size={16} />
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SalesDashboardList;
