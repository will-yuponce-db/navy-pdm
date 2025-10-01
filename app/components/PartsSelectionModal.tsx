import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import {
  Search,
  FilterList,
  CheckCircle,
  Warning,
  Error,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import {
  selectFilteredParts,
  setFilters,
  clearFilters,
} from "../redux/services/partsSlice";
import { useAppDispatch } from "../redux/hooks";
import type { Part, StockStatus } from "../types";
import { getStockStatus } from "../redux/services/partsSlice";

interface PartsSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedParts: Part[]) => void;
  selectedParts: Part[];
  title?: string;
}

const PartsSelectionModal: React.FC<PartsSelectionModalProps> = ({
  open,
  onClose,
  onConfirm,
  selectedParts,
  title = "Select Parts",
}) => {
  const dispatch = useAppDispatch();
  const parts = useSelector(selectFilteredParts);
  const [localSelectedParts, setLocalSelectedParts] =
    useState<Part[]>(selectedParts);
  const [searchTerm, setSearchTerm] = useState("");

  // Update local state when selectedParts prop changes
  useEffect(() => {
    setLocalSelectedParts(selectedParts);
  }, [selectedParts]);

  const handlePartToggle = (part: Part) => {
    setLocalSelectedParts((prev) => {
      const isSelected = prev.some((p) => p.id === part.id);
      if (isSelected) {
        return prev.filter((p) => p.id !== part.id);
      } else {
        return [...prev, part];
      }
    });
  };

  const handleSelectAll = () => {
    if (localSelectedParts.length === parts.length) {
      setLocalSelectedParts([]);
    } else {
      setLocalSelectedParts([...parts]);
    }
  };

  const handleConfirm = () => {
    onConfirm(localSelectedParts);
    onClose();
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    dispatch(setFilters({ searchTerm: value }));
  };

  const handleFilterChange = (filterType: string, value: string) => {
    if (value === "") {
      dispatch(setFilters({ [filterType]: undefined }));
    } else {
      dispatch(setFilters({ [filterType]: value }));
    }
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    setSearchTerm("");
  };

  const getStockStatusColor = (status: StockStatus) => {
    switch (status) {
      case "Critical":
        return "error";
      case "Low":
        return "warning";
      case "Adequate":
        return "success";
      case "Overstocked":
        return "info";
      default:
        return "default";
    }
  };

  const getStockStatusIcon = (status: StockStatus) => {
    switch (status) {
      case "Critical":
        return <Error />;
      case "Low":
        return <Warning />;
      case "Adequate":
        return <CheckCircle />;
      default:
        return null;
    }
  };

  const isAllSelected =
    parts.length > 0 && localSelectedParts.length === parts.length;
  const isIndeterminate =
    localSelectedParts.length > 0 && localSelectedParts.length < parts.length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: "80vh" },
      }}
    >
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">{title}</Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary">
              {localSelectedParts.length} selected
            </Typography>
            {localSelectedParts.length > 0 && (
              <Button
                size="small"
                onClick={() => setLocalSelectedParts([])}
                color="secondary"
              >
                Clear All
              </Button>
            )}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Filters and Search */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <TextField
              label="Search Parts"
              value={searchTerm}
              onChange={handleSearchChange}
              size="small"
              sx={{ minWidth: 200 }}
              InputProps={{
                startAdornment: (
                  <Search sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value=""
                onChange={(e) => handleFilterChange("category", e.target.value)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="Hot Section">Hot Section</MenuItem>
                <MenuItem value="Rotating Parts">Rotating Parts</MenuItem>
                <MenuItem value="Consumables">Consumables</MenuItem>
                <MenuItem value="Electronics">Electronics</MenuItem>
                <MenuItem value="Hydraulics">Hydraulics</MenuItem>
                <MenuItem value="Fuel System">Fuel System</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Stock Status</InputLabel>
              <Select
                value=""
                onChange={(e) =>
                  handleFilterChange("stockStatus", e.target.value)
                }
                label="Stock Status"
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="Critical">Critical</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Adequate">Adequate</MenuItem>
                <MenuItem value="Overstocked">Overstocked</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={handleClearFilters}
              size="small"
            >
              Clear Filters
            </Button>
          </Box>
        </Paper>

        {/* Parts Table */}
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={isIndeterminate}
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    color="primary"
                  />
                </TableCell>
                <TableCell>Part ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>System</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Stock Level</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Cost</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {parts.map((part) => {
                const stockStatus = getStockStatus(
                  part.stockLevel,
                  part.minStock,
                  part.maxStock,
                );
                const isSelected = localSelectedParts.some(
                  (p) => p.id === part.id,
                );

                return (
                  <TableRow
                    key={part.id}
                    hover
                    selected={isSelected}
                    onClick={() => handlePartToggle(part)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handlePartToggle(part)}
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {part.id}
                      </Typography>
                    </TableCell>
                    <TableCell>{part.name}</TableCell>
                    <TableCell>{part.system}</TableCell>
                    <TableCell>{part.category}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {part.stockLevel} / {part.maxStock}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Min: {part.minStock}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={stockStatus}
                        color={getStockStatusColor(stockStatus)}
                        size="small"
                        icon={getStockStatusIcon(stockStatus)}
                      />
                    </TableCell>
                    <TableCell>{part.location}</TableCell>
                    <TableCell>${part.cost.toLocaleString()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Selected Parts Summary */}
        {localSelectedParts.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Selected Parts:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {localSelectedParts.map((part) => (
                <Chip
                  key={part.id}
                  label={`${part.name} (${part.id})`}
                  onDelete={() => handlePartToggle(part)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          disabled={localSelectedParts.length === 0}
        >
          Select {localSelectedParts.length} Part
          {localSelectedParts.length !== 1 ? "s" : ""}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PartsSelectionModal;
