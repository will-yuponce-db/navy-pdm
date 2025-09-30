import React, { useState, useEffect } from "react";
import { 
  TextField, 
  Box, 
  Typography, 
  Chip,
  IconButton,
  Tooltip
} from "@mui/material";
import { Add, Edit } from "@mui/icons-material";
import { useSelector } from "react-redux";
import { selectFilteredParts } from "../redux/services/partsSlice";
import type { Part } from "../types";
import PartsSelectionModal from "./PartsSelectionModal";

interface PartsRequiredProps {
  partsRequired: string;
  onPartsChange: (value: string) => void;
  editable?: boolean;
}

const PartsRequired: React.FC<PartsRequiredProps> = ({
  partsRequired,
  onPartsChange,
  editable = true,
}) => {
  const parts = useSelector(selectFilteredParts);
  const [selectedParts, setSelectedParts] = useState<Part[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Parse partsRequired string into selected parts
  useEffect(() => {
    if (partsRequired) {
      const partNames = partsRequired.split(',').map(name => name.trim()).filter(Boolean);
      const foundParts = parts.filter(part => partNames.includes(part.name));
      setSelectedParts(foundParts);
    } else {
      setSelectedParts([]);
    }
  }, [partsRequired, parts]);

  const handleModalOpen = () => {
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handlePartsConfirm = (newSelectedParts: Part[]) => {
    setSelectedParts(newSelectedParts);
    const partsString = newSelectedParts.map(part => part.name).join(', ');
    onPartsChange(partsString);
  };

  const handleRemovePart = (partToRemove: Part) => {
    const updatedParts = selectedParts.filter(part => part.id !== partToRemove.id);
    setSelectedParts(updatedParts);
    const partsString = updatedParts.map(part => part.name).join(', ');
    onPartsChange(partsString);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <TextField
          fullWidth
          value={selectedParts.length > 0 ? `${selectedParts.length} part${selectedParts.length !== 1 ? 's' : ''} selected` : 'No parts selected'}
          label="Parts Required"
          variant="outlined"
          disabled
          aria-describedby="parts-description"
          inputProps={{
            "aria-label": "Parts required for this work order",
          }}
        />
        {editable && (
          <Tooltip title={selectedParts.length > 0 ? "Edit parts" : "Select parts"}>
            <IconButton
              onClick={handleModalOpen}
              color="primary"
              size="large"
            >
              {selectedParts.length > 0 ? <Edit /> : <Add />}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Typography
        id="parts-description"
        variant="caption"
        sx={{ mt: 0.5, display: "block", color: "text.secondary" }}
      >
        Click the {selectedParts.length > 0 ? 'edit' : 'add'} button to select parts from inventory
      </Typography>

      {selectedParts.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Selected Parts:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedParts.map((part) => (
              <Chip
                key={part.id}
                label={`${part.name} (${part.id})`}
                onDelete={editable ? () => handleRemovePart(part) : undefined}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      )}

      <PartsSelectionModal
        open={modalOpen}
        onClose={handleModalClose}
        onConfirm={handlePartsConfirm}
        selectedParts={selectedParts}
        title="Select Parts for Work Order"
      />
    </Box>
  );
};

export default PartsRequired;
