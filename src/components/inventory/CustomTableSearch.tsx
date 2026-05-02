import React, { useRef, useEffect } from "react";
import { FiSearch, FiFilter } from "react-icons/fi";
import Dropdown from "@/components/shared/Dropdown";

interface CustomTableSearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  productTypeFilter: "All" | "Medicine" | "Glossary";
  productTypeFilterActions: Array<{
    label: string;
    onClick: () => void;
  }>;
  stockStatusFilter: "All" | "In Stock" | "Out of Stock";
  stockStatusFilterActions: Array<{
    label: string;
    onClick: () => void;
  }>;
  loading?: boolean; // Add loading prop to trigger focus when data loads
}

const CustomTableSearch: React.FC<CustomTableSearchProps> = ({
  searchQuery,
  onSearchChange,
  productTypeFilter,
  productTypeFilterActions,
  stockStatusFilter,
  stockStatusFilterActions,
  loading = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const previousLoadingRef = useRef<boolean>(false);

  // Auto-focus the input when component mounts
  useEffect(() => {
    // Small delay to ensure the input is rendered
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []); // Only on mount

  // Focus when loading completes (table refresh scenario)
  useEffect(() => {
    // If loading was true and now it's false, focus the input
    if (previousLoadingRef.current && !loading && inputRef.current) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
    previousLoadingRef.current = loading;
  }, [loading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchChange(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent form submission on Enter key
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  };

  return (
    <div className="row gy-2 mb-3">
      <div className="col-sm-12 col-md-4 ps-0 m-0">
        <form onSubmit={(e) => e.preventDefault()} noValidate style={{ display: 'contents' }}>
          <div className="position-relative">
            <FiSearch
              className="position-absolute"
              style={{
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#64748b",
                pointerEvents: "none",
              }}
              size={18}
            />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onKeyPress={(e) => {
                // Prevent form submission on any key press
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }
              }}
              placeholder="Search products..."
              className="form-control form-control-sm ps-5"
              style={{ width: "100%" }}
              autoComplete="off"
              autoFocus
            />
          </div>
        </form>
      </div>
      <div className="col-sm-12 col-md-4 ps-0 m-0 d-flex justify-content-md-start justify-content-center">
        <Dropdown
          dropdownItems={productTypeFilterActions}
          triggerClass="btn btn-light btn-sm"
          triggerPosition="0,21"
          triggerIcon={<FiFilter />}
          triggerText={`Type: ${productTypeFilter}`}
          isAvatar={false}
          dropdownAutoClose={true}
          tooltipTitle=""
          dropdownParentStyle=""
          dropdownMenuStyle=""
          iconStrokeWidth={1.7}
          isItemIcon={false}
          onClick={() => {}}
          active=""
          id="product-type-filter"
        />
      </div>
      <div className="col-sm-12 col-md-4 ps-0 m-0 d-flex justify-content-md-end justify-content-center">
        <Dropdown
          dropdownItems={stockStatusFilterActions}
          triggerClass="btn btn-light btn-sm"
          triggerPosition="0,21"
          triggerIcon={<FiFilter />}
          triggerText={`Stock: ${stockStatusFilter}`}
          isAvatar={false}
          dropdownAutoClose={true}
          tooltipTitle=""
          dropdownParentStyle=""
          dropdownMenuStyle=""
          iconStrokeWidth={1.7}
          isItemIcon={false}
          onClick={() => {}}
          active=""
          id="stock-status-filter"
        />
      </div>
    </div>
  );
};

export default CustomTableSearch;
