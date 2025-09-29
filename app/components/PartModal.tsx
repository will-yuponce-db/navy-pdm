import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Grid,
  Alert,
} from "@mui/material";
import { useAppDispatch } from "../redux/hooks";
import {
  addPartWithNotification,
  updatePartWithNotification,
} from "../redux/services/partsSlice";
import type { Part, PartCategory, PartCondition } from "../types";

interface PartModalProps {
  open: boolean;
  onClose: () => void;
  part?: Part | null;
  mode: "add" | "edit";
}

const PartModal: React.FC<PartModalProps> = ({ open, onClose, part, mode }) => {
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState({
    name: "",
    system: "",
    category: "" as PartCategory,
    stockLevel: 0,
    minStock: 0,
    maxStock: 0,
    location: "",
    condition: "New" as PartCondition,
    leadTime: "",
    supplier: "",
    cost: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (mode === "edit" && part) {
      setFormData({
        name: part.name,
        system: part.system,
        category: part.category,
        stockLevel: part.stockLevel,
        minStock: part.minStock,
        maxStock: part.maxStock,
        location: part.location,
        condition: part.condition,
        leadTime: part.leadTime,
        supplier: part.supplier,
        cost: part.cost,
      });
    } else {
      setFormData({
        name: "",
        system: "",
        category: "" as PartCategory,
        stockLevel: 0,
        minStock: 0,
        maxStock: 0,
        location: "",
        condition: "New" as PartCondition,
        leadTime: "",
        supplier: "",
        cost: 0,
      });
    }
    setErrors({});
  }, [mode, part, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Part name is required";
    }
    if (!formData.system.trim()) {
      newErrors.system = "System is required";
    }
    if (!formData.category) {
      newErrors.category = "Category is required";
    }
    if (formData.stockLevel < 0) {
      newErrors.stockLevel = "Stock level cannot be negative";
    }
    if (formData.minStock < 0) {
      newErrors.minStock = "Minimum stock cannot be negative";
    }
    if (formData.maxStock <= formData.minStock) {
      newErrors.maxStock = "Maximum stock must be greater than minimum stock";
    }
    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    }
    if (!formData.leadTime.trim()) {
      newErrors.leadTime = "Lead time is required";
    }
    if (!formData.supplier.trim()) {
      newErrors.supplier = "Supplier is required";
    }
    if (formData.cost <= 0) {
      newErrors.cost = "Cost must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    if (mode === "add") {
      dispatch(addPartWithNotification(formData));
    } else if (mode === "edit" && part) {
      dispatch(updatePartWithNotification({ id: part.id, updates: formData }));
    }

    onClose();
  };

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const categories: PartCategory[] = [
    "Hot Section",
    "Rotating Parts",
    "Consumables",
    "Electronics",
    "Hydraulics",
    "Fuel System",
  ];

  const conditions: PartCondition[] = [
    "New",
    "Refurbished",
    "Used",
    "Damaged",
    "Condemned",
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{mode === "add" ? "Add New Part" : "Edit Part"}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Part Name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="System"
                value={formData.system}
                onChange={(e) => handleChange("system", e.target.value)}
                error={!!errors.system}
                helperText={errors.system}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.category}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  label="Category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
                {errors.category && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.category}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.condition}>
                <InputLabel>Condition</InputLabel>
                <Select
                  value={formData.condition}
                  onChange={(e) => handleChange("condition", e.target.value)}
                  label="Condition"
                >
                  {conditions.map((condition) => (
                    <MenuItem key={condition} value={condition}>
                      {condition}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Stock Level"
                type="number"
                value={formData.stockLevel}
                onChange={(e) =>
                  handleChange("stockLevel", parseInt(e.target.value) || 0)
                }
                error={!!errors.stockLevel}
                helperText={errors.stockLevel}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Minimum Stock"
                type="number"
                value={formData.minStock}
                onChange={(e) =>
                  handleChange("minStock", parseInt(e.target.value) || 0)
                }
                error={!!errors.minStock}
                helperText={errors.minStock}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Maximum Stock"
                type="number"
                value={formData.maxStock}
                onChange={(e) =>
                  handleChange("maxStock", parseInt(e.target.value) || 0)
                }
                error={!!errors.maxStock}
                helperText={errors.maxStock}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                error={!!errors.location}
                helperText={errors.location}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Lead Time"
                value={formData.leadTime}
                onChange={(e) => handleChange("leadTime", e.target.value)}
                error={!!errors.leadTime}
                helperText={errors.leadTime}
                placeholder="e.g., 30 days"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Supplier"
                value={formData.supplier}
                onChange={(e) => handleChange("supplier", e.target.value)}
                error={!!errors.supplier}
                helperText={errors.supplier}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Unit Cost"
                type="number"
                value={formData.cost}
                onChange={(e) =>
                  handleChange("cost", parseFloat(e.target.value) || 0)
                }
                error={!!errors.cost}
                helperText={errors.cost}
                required
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                }}
              />
            </Grid>
          </Grid>

          {/* Stock Level Warning */}
          {formData.stockLevel <= formData.minStock &&
            formData.stockLevel > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Stock level is at or below minimum threshold. Consider
                reordering.
              </Alert>
            )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          {mode === "add" ? "Add Part" : "Update Part"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PartModal;
