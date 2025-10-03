import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import PartsTable from "~/components/PartsTable";
import PartModal from "~/components/PartModal";
import type { Part } from "~/types";

export function meta() {
  return [
    { title: "Inventory" },
    { name: "description", content: "Navy PDM Inventory Management System" },
  ];
}

export default function Parts() {
  const [partModalOpen, setPartModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");

  const handleAddPart = () => {
    setSelectedPart(null);
    setModalMode("add");
    setPartModalOpen(true);
  };

  const handleEditPart = (part: Part) => {
    setSelectedPart(part);
    setModalMode("edit");
    setPartModalOpen(true);
  };

  const handleCloseModal = () => {
    setPartModalOpen(false);
    setSelectedPart(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Inventory
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage inventory, track stock levels, and monitor part availability
          across all systems.
        </Typography>
      </Box>

      <PartsTable onAddPart={handleAddPart} onEditPart={handleEditPart} />

      <PartModal
        open={partModalOpen}
        onClose={handleCloseModal}
        part={selectedPart}
        mode={modalMode}
      />
    </Box>
  );
}
