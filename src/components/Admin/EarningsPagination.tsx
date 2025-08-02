import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { EarningsFilters } from '@/hooks/useModeratorEarnings';

interface EarningsPaginationProps {
  filters: EarningsFilters;
  totalPages: number;
  totalCount: number;
  onFiltersChange: (filters: Partial<EarningsFilters>) => void;
  loading: boolean;
}

const EarningsPagination: React.FC<EarningsPaginationProps> = ({
  filters,
  totalPages,
  totalCount,
  onFiltersChange,
  loading
}) => {
  const { page, limit } = filters;
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      onFiltersChange({ page: newPage });
    }
  };

  const handleLimitChange = (newLimit: string) => {
    onFiltersChange({ limit: parseInt(newLimit), page: 1 });
  };

  const startItem = ((page - 1) * limit) + 1;
  const endItem = Math.min(page * limit, totalCount);

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 pt-4">
      {/* Results info and per-page selector */}
      <div className="flex items-center space-x-4">
        <div className="text-sm text-muted-foreground">
          Showing {startItem}-{endItem} of {totalCount} results
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Per page:</span>
          <Select
            value={limit.toString()}
            onValueChange={handleLimitChange}
            disabled={loading}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center space-x-2">
          {/* First page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={page === 1 || loading}
            className="hidden sm:flex"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Previous</span>
          </Button>

          {/* Page numbers */}
          <div className="flex items-center space-x-1">
            {/* Show first page if we're far from it */}
            {page > 3 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={loading}
                  className="w-8 h-8 p-0"
                >
                  1
                </Button>
                {page > 4 && (
                  <span className="text-muted-foreground">...</span>
                )}
              </>
            )}

            {/* Show pages around current page */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (page <= 3) {
                pageNumber = i + 1;
              } else if (page >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = page - 2 + i;
              }

              if (pageNumber < 1 || pageNumber > totalPages) return null;

              return (
                <Button
                  key={pageNumber}
                  variant={pageNumber === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNumber)}
                  disabled={loading}
                  className="w-8 h-8 p-0"
                >
                  {pageNumber}
                </Button>
              );
            })}

            {/* Show last page if we're far from it */}
            {page < totalPages - 2 && (
              <>
                {page < totalPages - 3 && (
                  <span className="text-muted-foreground">...</span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={loading}
                  className="w-8 h-8 p-0"
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>

          {/* Next page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages || loading}
          >
            <span className="hidden sm:inline mr-1">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={page === totalPages || loading}
            className="hidden sm:flex"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default EarningsPagination;