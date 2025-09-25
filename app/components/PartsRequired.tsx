import React, { useState } from "react";
import {
  Box,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  Tooltip,
} from "@mui/material";
import {
  Add,
  Remove,
  Warning,
  Error,
  CheckCircle,
  Inventory,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import type { RootState } from "../types";
import { selectAllParts, getStockStatus } from "../redux/services/partsSlice";
import type { Part, StockStatus } from "../types";

interface PartsRequiredProps {
  partsRequired?: string;
  onPartsChange?: (parts: string) => void;
  editable?: boolean;
}

const PartsRequired: React.FC<PartsRequiredProps> = ({
  partsRequired = "",
  onPartsChange,
  editable = false,
}) => {
  const parts = useSelector(selectAllParts);
  const [partsDialogOpen, setPartsDialogOpen] = useState(false);
  const [selectedParts, setSelectedParts] = useState<string[]>([]);

  // Parse parts from string
  const currentParts = partsRequired
    ? partsRequired
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p)
    : [];

  const handleAddPart = (partId: string) => {
    const part = parts.find((p) => p.id === partId);
    if (part && !currentParts.includes(part.name)) {
      const newParts = [...currentParts, part.name];
      onPartsChange?.(newParts.join(", "));
    }
  };

  const handleRemovePart = (partName: string) => {
    const newParts = currentParts.filter((p) => p !== partName);
    onPartsChange?.(newParts.join(", "));
  };

  const getPartStockStatus = (partName: string): StockStatus | null => {
    const part = parts.find(
      (p) =>
        p.name.toLowerCase().includes(partName.toLowerCase()) ||
        partName.toLowerCase().includes(p.name.toLowerCase()),
    );
    return part
      ? getStockStatus(part.stockLevel, part.minStock, part.maxStock)
      : null;
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

  const getLowStockParts = () => {
    return currentParts.filter((partName) => {
      const status = getPartStockStatus(partName);
      return status === "Critical" || status === "Low";
    });
  };

  const lowStockParts = getLowStockParts();

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Typography variant="subtitle2" fontWeight="medium">
          Parts Required:
        </Typography>
        {editable && (
          <Button
            size="small"
            startIcon={<Add />}
            onClick={() => setPartsDialogOpen(true)}
            variant="outlined"
          >
            Add Parts
          </Button>
        )}
      </Box>

      {currentParts.length > 0 ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {currentParts.map((partName, index) => {
            const stockStatus = getPartStockStatus(partName);
            return (
              <Chip
                key={index}
                label={partName}
                color={
                  stockStatus
                    ? (getStockStatusColor(stockStatus) as any)
                    : "default"
                }
                icon={stockStatus ? getStockStatusIcon(stockStatus) : undefined}
                onDelete={
                  editable ? () => handleRemovePart(partName) : undefined
                }
                deleteIcon={<Remove />}
                size="small"
              />
            );
          })}
        </Box>
      ) : (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontStyle: "italic" }}
        >
          No parts required
        </Typography>
      )}

      {lowStockParts.length > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Low Stock Alert:</strong> The following parts are low in
            stock: {lowStockParts.join(", ")}
          </Typography>
        </Alert>
      )}

      {/* Parts Selection Dialog */}
      <Dialog
        open={partsDialogOpen}
        onClose={() => setPartsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Select Parts</DialogTitle>
        <DialogContent>
          <List>
            {parts.map((part) => {
              const stockStatus = getStockStatus(
                part.stockLevel,
                part.minStock,
                part.maxStock,
              );
              const isSelected = currentParts.includes(part.name);

              return (
                <ListItem key={part.id} divider>
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography variant="body1">{part.name}</Typography>
                        <Chip
                          label={stockStatus}
                          color={getStockStatusColor(stockStatus) as any}
                          size="small"
                          icon={getStockStatusIcon(stockStatus)}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {part.id} • {part.system} • {part.category}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Stock: {part.stockLevel}/{part.maxStock} • $
                          {part.cost.toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    {isSelected ? (
                      <Tooltip title="Remove from work order">
                        <IconButton
                          onClick={() => handleRemovePart(part.name)}
                          color="error"
                        >
                          <Remove />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Add to work order">
                        <IconButton
                          onClick={() => handleAddPart(part.id)}
                          color="primary"
                        >
                          <Add />
                        </IconButton>
                      </Tooltip>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPartsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PartsRequired;
