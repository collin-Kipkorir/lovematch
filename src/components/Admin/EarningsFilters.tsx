import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Filter, Search, X, Download, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { EarningsFilters as EarningsFiltersType } from '@/hooks/useModeratorEarnings';

interface EarningsFiltersProps {
  filters: EarningsFiltersType;
  onFiltersChange: (filters: Partial<EarningsFiltersType>) => void;
  onExport: (format: 'csv' | 'excel' | 'pdf') => void;
  onRefresh: () => void;
  loading: boolean;
  totalCount: number;
}

const statusOptions = [
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'paid', label: 'Paid' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'rejected', label: 'Rejected' }
];

const typeOptions = [
  { value: 'base_salary', label: 'Base Salary' },
  { value: 'referral_commission', label: 'Referral Commission' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'adjustment', label: 'Adjustment' }
];

const EarningsFiltersComponent: React.FC<EarningsFiltersProps> = ({
  filters,
  onFiltersChange,
  onExport,
  onRefresh,
  loading,
  totalCount
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    filters.dateFrom ? new Date(filters.dateFrom) : undefined
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(
    filters.dateTo ? new Date(filters.dateTo) : undefined
  );
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  const handleStatusChange = (status: string, checked: boolean) => {
    const currentStatus = filters.status || [];
    const newStatus = checked
      ? [...currentStatus, status]
      : currentStatus.filter(s => s !== status);
    
    onFiltersChange({ status: newStatus.length > 0 ? newStatus : undefined });
  };

  const handleTypeChange = (type: string, checked: boolean) => {
    const currentTypes = filters.type || [];
    const newTypes = checked
      ? [...currentTypes, type]
      : currentTypes.filter(t => t !== type);
    
    onFiltersChange({ type: newTypes.length > 0 ? newTypes : undefined });
  };

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date);
    onFiltersChange({ 
      dateFrom: date ? format(date, 'yyyy-MM-dd') : undefined 
    });
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date);
    onFiltersChange({ 
      dateTo: date ? format(date, 'yyyy-MM-dd') : undefined 
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    // Debounce search
    const timeoutId = setTimeout(() => {
      onFiltersChange({ search: value || undefined, page: 1 });
    }, 500);
    
    return () => clearTimeout(timeoutId);
  };

  const clearAllFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearchTerm('');
    onFiltersChange({
      status: undefined,
      type: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      search: undefined,
      page: 1
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status?.length) count++;
    if (filters.type?.length) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.search) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-4">
      {/* Search and Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by moderator, description..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Earnings</SheetTitle>
                <SheetDescription>
                  Apply filters to refine the earnings list
                </SheetDescription>
              </SheetHeader>
              
              <div className="space-y-6 mt-6">
                {/* Status Filter */}
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="space-y-3 mt-2">
                    {statusOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${option.value}`}
                          checked={filters.status?.includes(option.value) || false}
                          onCheckedChange={(checked) => 
                            handleStatusChange(option.value, checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor={`status-${option.value}`}
                          className="text-sm font-normal"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Type Filter */}
                <div>
                  <Label className="text-sm font-medium">Payment Type</Label>
                  <div className="space-y-3 mt-2">
                    {typeOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${option.value}`}
                          checked={filters.type?.includes(option.value) || false}
                          onCheckedChange={(checked) => 
                            handleTypeChange(option.value, checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor={`type-${option.value}`}
                          className="text-sm font-normal"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <Label className="text-sm font-medium">Date Range</Label>
                  <div className="space-y-3 mt-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">From</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateFrom ? format(dateFrom, "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={dateFrom}
                            onSelect={handleDateFromChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-muted-foreground">To</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateTo ? format(dateTo, "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={dateTo}
                            onSelect={handleDateToChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                {/* Sorting */}
                <div>
                  <Label className="text-sm font-medium">Sort By</Label>
                  <div className="space-y-2 mt-2">
                    <Select
                      value={filters.sortBy}
                      onValueChange={(value) => 
                        onFiltersChange({ sortBy: value as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="amount">Amount</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="type">Type</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value={filters.sortOrder}
                      onValueChange={(value) => 
                        onFiltersChange({ sortOrder: value as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Descending</SelectItem>
                        <SelectItem value="asc">Ascending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    className="w-full"
                    disabled={activeFiltersCount === 0}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All Filters
                  </Button>
                  
                  <Button
                    onClick={() => setIsFilterOpen(false)}
                    className="w-full"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          {/* Export Dropdown */}
          <Select onValueChange={(value) => onExport(value as any)}>
            <SelectTrigger className="w-auto">
              <Button variant="outline" size="sm" asChild>
                <div>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </div>
              </Button>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">Export as CSV</SelectItem>
              <SelectItem value="excel">Export as Excel</SelectItem>
              <SelectItem value="pdf">Export as PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {filters.status?.map((status) => (
            <Badge key={status} variant="secondary" className="flex items-center gap-1">
              {statusOptions.find(s => s.value === status)?.label}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleStatusChange(status, false)}
              />
            </Badge>
          ))}
          
          {filters.type?.map((type) => (
            <Badge key={type} variant="secondary" className="flex items-center gap-1">
              {typeOptions.find(t => t.value === type)?.label}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleTypeChange(type, false)}
              />
            </Badge>
          ))}
          
          {filters.dateFrom && (
            <Badge variant="secondary" className="flex items-center gap-1">
              From: {format(new Date(filters.dateFrom), 'MMM dd, yyyy')}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleDateFromChange(undefined)}
              />
            </Badge>
          )}
          
          {filters.dateTo && (
            <Badge variant="secondary" className="flex items-center gap-1">
              To: {format(new Date(filters.dateTo), 'MMM dd, yyyy')}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleDateToChange(undefined)}
              />
            </Badge>
          )}
          
          {filters.search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: "{filters.search}"
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => {
                  setSearchTerm('');
                  onFiltersChange({ search: undefined });
                }}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {totalCount} result{totalCount !== 1 ? 's' : ''}
        {activeFiltersCount > 0 && ' (filtered)'}
      </div>
    </div>
  );
};

export default EarningsFiltersComponent;