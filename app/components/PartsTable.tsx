import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
} from "@mui/material";
import {
  Edit,
  Delete,
  Add,
  Search,
  FilterList,
  Warning,
  Error,
  CheckCircle,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../redux/hooks";
import {
  selectFilteredParts,
  selectPartsSummary,
  selectPartsFilters,
  selectPartsLoading,
  setFilters,
  clearFilters,
  deletePartWithNotification,
  reorderPartWithNotification,
  getStockStatus,
  fetchParts,
} from "../redux/services/partsSlice";
import type { Part, StockStatus } from "../types";
import { tableStyles } from "../utils/tableStyles";
import LoadingSpinner from "./LoadingSpinner";

interface PartsTableProps {
  onEditPart: (part: Part) => void;
  onAddPart: () => void;
}

const PartsTable: React.FC<PartsTableProps> = ({ onEditPart, onAddPart }) => {
  const dispatch = useAppDispatch();
  const parts = useSelector(selectFilteredParts);
  const summary = useSelector(selectPartsSummary);
  const filters = useSelector(selectPartsFilters);
  const loading = useSelector(selectPartsLoading);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [partToDelete, setPartToDelete] = useState<Part | null>(null);
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm || "");

  // Fetch parts on component mount
  useEffect(() => {
    dispatch(fetchParts());
  }, [dispatch]);

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

  const handleDeleteClick = (part: Part) => {
    setPartToDelete(part);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (partToDelete) {
      dispatch(deletePartWithNotification(partToDelete.id));
      setDeleteDialogOpen(false);
      setPartToDelete(null);
    }
  };

  const handleReorderClick = (part: Part) => {
    const reorderQuantity = Math.max(part.minStock * 2, 10);
    dispatch(
      reorderPartWithNotification({ id: part.id, quantity: reorderQuantity }),
    );
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

  return (
    <Box>
      {/* Summary Cards */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6">Total Parts</Typography>
          <Typography variant="h4">{summary.totalParts}</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6" color="error">
            Critical Stock
          </Typography>
          <Typography variant="h4" color="error">
            {summary.criticalStock}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6" color="warning.main">
            Low Stock
          </Typography>
          <Typography variant="h4" color="warning.main">
            {summary.lowStock}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6">Total Value</Typography>
          <Typography variant="h4" color="success.main">
            ${summary.totalValue.toLocaleString()}
          </Typography>
        </Paper>
      </Box>

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
              value={filters.category || ""}
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
              value={filters.stockStatus || ""}
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

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Condition</InputLabel>
            <Select
              value={filters.condition || ""}
              onChange={(e) => handleFilterChange("condition", e.target.value)}
              label="Condition"
            >
              <MenuItem value="">All Conditions</MenuItem>
              <MenuItem value="New">New</MenuItem>
              <MenuItem value="Refurbished">Refurbished</MenuItem>
              <MenuItem value="Used">Used</MenuItem>
              <MenuItem value="Damaged">Damaged</MenuItem>
              <MenuItem value="Condemned">Condemned</MenuItem>
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

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              onAddPart();
              console.log("Add Part clicked");
            }}
            size="small"
            sx={{ ml: "auto" }}
          >
            Add Part
          </Button>
        </Box>
      </Paper>

      {/* Parts Table */}
      <TableContainer component={Paper} sx={tableStyles.containerWithLoading}>
        <LoadingSpinner
          loading={loading}
          message="Loading parts..."
          overlay={true}
          size={50}
        />
        <Table sx={tableStyles.patterns.wideTable}>
          <TableHead>
            <TableRow>
              <TableCell>Part ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>System</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Stock Level</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Cost</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {parts.map((part) => {
              const stockStatus = getStockStatus(
                part.stockLevel,
                part.minStock,
                part.maxStock,
              );
              return (
                <TableRow key={part.id} hover>
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
                  <TableCell>{part.supplier}</TableCell>
                  <TableCell>${part.cost.toLocaleString()}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Tooltip title="Edit Part">
                        <IconButton
                          size="small"
                          onClick={() => {
                            onEditPart(part);
                            console.log("Edit Part clicked for:", part.id);
                          }}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Part">
                        <IconButton
                          size="small"
                          onClick={() => {
                            handleDeleteClick(part);
                            console.log("Delete Part clicked for:", part.id);
                          }}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                      {(stockStatus === "Critical" ||
                        stockStatus === "Low") && (
                        <Tooltip title="Reorder Part">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              handleReorderClick(part);
                              console.log("Reorder Part clicked for:", part.id);
                            }}
                            color="warning"
                          >
                            Reorder
                          </Button>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete part &quot;{partToDelete?.name}
            &quot; ({partToDelete?.id})? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeleteDialogOpen(false);
              console.log("Cancel delete part");
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              handleDeleteConfirm();
              console.log("Confirm delete part");
            }}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PartsTable;
