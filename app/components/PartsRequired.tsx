import React from "react";
import { TextField, Box, Typography } from "@mui/material";

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
  return (
    <Box>
      <TextField
        fullWidth
        multiline
        rows={3}
        value={partsRequired}
        onChange={(e) => onPartsChange(e.target.value)}
        label="Parts Required"
        variant="outlined"
        disabled={!editable}
        aria-describedby="parts-description"
        inputProps={{
          "aria-label": "Parts required for this work order",
        }}
      />
      <Typography
        id="parts-description"
        variant="caption"
        sx={{ mt: 0.5, display: "block", color: "text.secondary" }}
      >
        List the parts, materials, or components needed for this work order
      </Typography>
    </Box>
  );
};

export default PartsRequired;
