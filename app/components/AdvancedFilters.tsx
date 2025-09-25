import { useState, useMemo } from "react";
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Collapse,
  Typography,
  Slider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { ExpandMore, FilterList, Clear } from "@mui/icons-material";
import type { WorkOrder } from "../types";

interface AdvancedFiltersProps {
  data: WorkOrder[];
  onFilteredData: (filteredData: WorkOrder[]) => void;
}

export const AdvancedFilters = ({
  data,
  onFilteredData,
}: AdvancedFiltersProps) => {
  const [expanded, setExpanded] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "All",
    priority: "All",
    homeport: "All",
    gte: "All",
    etaRange: [0, 30],
    dateRange: {
      start: "",
      end: "",
    },
    ships: [] as string[],
    failureModes: [] as string[],
    sortBy: "createdAt",
    sortOrder: "desc" as "asc" | "desc",
  });

  // Get unique values for filter options
  const uniqueValues = useMemo(
    () => ({
      homeports: [...new Set(data.map((item) => item.homeport))],
      gtes: [...new Set(data.map((item) => item.gte))],
      ships: [...new Set(data.map((item) => item.ship))],
      failureModes: [...new Set(data.map((item) => item.fm))],
    }),
    [data],
  );

  // Apply filters and sorting
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Text search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchLower),
        ),
      );
    }

    // Status filter
    if (filters.status !== "All") {
      filtered = filtered.filter((item) => item.status === filters.status);
    }

    // Priority filter
    if (filters.priority !== "All") {
      filtered = filtered.filter((item) => item.priority === filters.priority);
    }

    // Homeport filter
    if (filters.homeport !== "All") {
      filtered = filtered.filter((item) => item.homeport === filters.homeport);
    }

    // GTE filter
    if (filters.gte !== "All") {
      filtered = filtered.filter((item) => item.gte === filters.gte);
    }

    // ETA range filter
    filtered = filtered.filter(
      (item) =>
        item.eta >= filters.etaRange[0] && item.eta <= filters.etaRange[1],
    );

    // Date range filter
    if (filters.dateRange.start) {
      const startDate = new Date(filters.dateRange.start);
      filtered = filtered.filter(
        (item) => item.createdAt && new Date(item.createdAt) >= startDate,
      );
    }
    if (filters.dateRange.end) {
      const endDate = new Date(filters.dateRange.end);
      filtered = filtered.filter(
        (item) => item.createdAt && new Date(item.createdAt) <= endDate,
      );
    }

    // Ships filter
    if (filters.ships.length > 0) {
      filtered = filtered.filter((item) => filters.ships.includes(item.ship));
    }

    // Failure modes filter
    if (filters.failureModes.length > 0) {
      filtered = filtered.filter((item) =>
        filters.failureModes.includes(item.fm),
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any = a[filters.sortBy as keyof WorkOrder];
      let bValue: any = b[filters.sortBy as keyof WorkOrder];

      if (aValue instanceof Date) aValue = aValue.getTime();
      if (bValue instanceof Date) bValue = bValue.getTime();

      if (typeof aValue === "string") aValue = aValue.toLowerCase();
      if (typeof bValue === "string") bValue = bValue.toLowerCase();

      if (filters.sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [data, filters]);

  // Update filtered data when filters change
  useMemo(() => {
    onFilteredData(filteredData);
  }, [filteredData, onFilteredData]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "All",
      priority: "All",
      homeport: "All",
      gte: "All",
      etaRange: [0, 30],
      dateRange: { start: "", end: "" },
      ships: [],
      failureModes: [],
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status !== "All") count++;
    if (filters.priority !== "All") count++;
    if (filters.homeport !== "All") count++;
    if (filters.gte !== "All") count++;
    if (filters.etaRange[0] !== 0 || filters.etaRange[1] !== 30) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.ships.length > 0) count++;
    if (filters.failureModes.length > 0) count++;
    return count;
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FilterList />
            <Typography variant="h6">Advanced Filters</Typography>
            {getActiveFiltersCount() > 0 && (
              <Chip
                label={getActiveFiltersCount()}
                color="primary"
                size="small"
              />
            )}
          </Box>
        </AccordionSummary>

        <AccordionDetails>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Basic Filters Row */}
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                size="small"
                placeholder="Search work orders..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                sx={{ minWidth: 250 }}
              />

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  <MenuItem value="All">All</MenuItem>
                  <MenuItem value="Submitted">Submitted</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="On Hold">On Hold</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filters.priority}
                  label="Priority"
                  onChange={(e) =>
                    handleFilterChange("priority", e.target.value)
                  }
                >
                  <MenuItem value="All">All</MenuItem>
                  <MenuItem value="Routine">Routine</MenuItem>
                  <MenuItem value="Priority">Priority</MenuItem>
                  <MenuItem value="CASREP">CASREP</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Homeport</InputLabel>
                <Select
                  value={filters.homeport}
                  label="Homeport"
                  onChange={(e) =>
                    handleFilterChange("homeport", e.target.value)
                  }
                >
                  <MenuItem value="All">All</MenuItem>
                  {uniqueValues.homeports.map((homeport) => (
                    <MenuItem key={homeport} value={homeport}>
                      {homeport}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Advanced Filters */}
            <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              {/* ETA Range */}
              <Box sx={{ minWidth: 200 }}>
                <Typography variant="subtitle2" gutterBottom>
                  ETA Range (days)
                </Typography>
                <Slider
                  value={filters.etaRange}
                  onChange={(_, value) => handleFilterChange("etaRange", value)}
                  valueLabelDisplay="auto"
                  min={0}
                  max={60}
                  step={1}
                />
                <Typography variant="caption">
                  {filters.etaRange[0]} - {filters.etaRange[1]} days
                </Typography>
              </Box>

              {/* Date Range */}
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <TextField
                  size="small"
                  type="date"
                  label="From"
                  value={filters.dateRange.start}
                  onChange={(e) =>
                    handleFilterChange("dateRange", {
                      ...filters.dateRange,
                      start: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  size="small"
                  type="date"
                  label="To"
                  value={filters.dateRange.end}
                  onChange={(e) =>
                    handleFilterChange("dateRange", {
                      ...filters.dateRange,
                      end: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </Box>

            {/* Multi-select Filters */}
            <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Ships
                </Typography>
                <FormGroup>
                  {uniqueValues.ships.slice(0, 5).map((ship) => (
                    <FormControlLabel
                      key={ship}
                      control={
                        <Checkbox
                          checked={filters.ships.includes(ship)}
                          onChange={(e) => {
                            const newShips = e.target.checked
                              ? [...filters.ships, ship]
                              : filters.ships.filter((s) => s !== ship);
                            handleFilterChange("ships", newShips);
                          }}
                        />
                      }
                      label={ship}
                    />
                  ))}
                </FormGroup>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Failure Modes
                </Typography>
                <FormGroup>
                  {uniqueValues.failureModes.slice(0, 5).map((fm) => (
                    <FormControlLabel
                      key={fm}
                      control={
                        <Checkbox
                          checked={filters.failureModes.includes(fm)}
                          onChange={(e) => {
                            const newFMs = e.target.checked
                              ? [...filters.failureModes, fm]
                              : filters.failureModes.filter((f) => f !== fm);
                            handleFilterChange("failureModes", newFMs);
                          }}
                        />
                      }
                      label={fm}
                    />
                  ))}
                </FormGroup>
              </Box>
            </Box>

            {/* Sorting */}
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Typography variant="subtitle2">Sort by:</Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Field</InputLabel>
                <Select
                  value={filters.sortBy}
                  label="Field"
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                >
                  <MenuItem value="createdAt">Created Date</MenuItem>
                  <MenuItem value="wo">Work Order</MenuItem>
                  <MenuItem value="ship">Ship</MenuItem>
                  <MenuItem value="priority">Priority</MenuItem>
                  <MenuItem value="status">Status</MenuItem>
                  <MenuItem value="eta">ETA</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Order</InputLabel>
                <Select
                  value={filters.sortOrder}
                  label="Order"
                  onChange={(e) =>
                    handleFilterChange("sortOrder", e.target.value)
                  }
                >
                  <MenuItem value="asc">Ascending</MenuItem>
                  <MenuItem value="desc">Descending</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Actions */}
            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
              <Button
                variant="outlined"
                startIcon={<Clear />}
                onClick={clearFilters}
                size="small"
              >
                Clear Filters
              </Button>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};
