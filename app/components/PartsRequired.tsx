import React, { useState, useEffect } from "react";
import { 
  TextField, 
  Box, 
  Typography, 
  Autocomplete, 
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput
} from "@mui/material";
import { useSelector } from "react-redux";
import { selectFilteredParts } from "../redux/services/partsSlice";
import type { Part } from "../types";

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

  const handlePartChange = (event: any, newValue: Part[]) => {
    setSelectedParts(newValue);
    const partsString = newValue.map(part => part.name).join(', ');
    onPartsChange(partsString);
  };

  return (
    <Box>
      <Autocomplete
        multiple
        options={parts}
        getOptionLabel={(option) => `${option.name} (${option.id})`}
        value={selectedParts}
        onChange={handlePartChange}
        disabled={!editable}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              variant="outlined"
              label={`${option.name} (${option.id})`}
              {...getTagProps({ index })}
              key={option.id}
            />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label="Parts Required"
            variant="outlined"
            placeholder="Select parts from inventory"
            aria-describedby="parts-description"
            inputProps={{
              ...params.inputProps,
              "aria-label": "Parts required for this work order",
            }}
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {option.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {option.id} • {option.category} • Stock: {option.stockLevel}
              </Typography>
            </Box>
          </Box>
        )}
        isOptionEqualToValue={(option, value) => option.id === value.id}
      />
      <Typography
        id="parts-description"
        variant="caption"
        sx={{ mt: 0.5, display: "block", color: "text.secondary" }}
      >
        Select parts from the available inventory. Only parts with stock will be available.
      </Typography>
      {selectedParts.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Selected parts: {selectedParts.map(p => p.name).join(', ')}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PartsRequired;
