import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Tabs,
  Tab,
  Menu,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Schedule,
  Add,
  Edit,
  Delete,
  Visibility,
  Build,
  Warning,
  CheckCircle,
  MoreVert,
  FilterList,
  CalendarToday,
  Person,
} from "@mui/icons-material";
import { tableStyles } from "../utils/tableStyles";
import type {
  MaintenanceSchedule,
  MaintenanceScheduleType,
  MaintenanceScheduleStatus,
  Priority,
  CreateMaintenanceScheduleForm,
} from "../types";

export function meta() {
  return [
    { title: "Maintenance Schedule" },
    {
      name: "description",
      content: "Navy PDM Maintenance Schedule Management",
    },
  ];
}

// Mock maintenance schedule data
const mockSchedules: MaintenanceSchedule[] = [
  {
    id: "MS-001",
    assetId: "DDG-51-001",
    assetName: "USS Arleigh Burke",
    scheduleType: "Preventive",
    frequency: "Quarterly",
    nextDueDate: new Date("2024-04-15"),
    lastCompleted: new Date("2024-01-15"),
    estimatedDuration: 24,
    priority: "Routine",
    status: "Scheduled",
    description: "Quarterly inspection and maintenance",
    assignedTechnician: "John Smith",
    partsRequired: ["Oil Filter", "Air Filter", "Belt"],
    estimatedCost: 125000,
    notes: "Standard quarterly maintenance",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "MS-002",
    assetId: "CVN-78-001",
    assetName: "USS Gerald R. Ford",
    scheduleType: "Predictive",
    frequency: "Monthly",
    nextDueDate: new Date("2024-02-20"),
    lastCompleted: new Date("2024-01-20"),
    estimatedDuration: 48,
    priority: "Urgent",
    status: "Overdue",
    description: "Catapult system predictive maintenance",
    assignedTechnician: "Sarah Johnson",
    partsRequired: ["Hydraulic Pump", "Valve Assembly"],
    estimatedCost: 250000,
    notes: "Critical system requiring immediate attention",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "MS-003",
    assetId: "SSN-774-001",
    assetName: "USS Virginia",
    scheduleType: "Routine",
    frequency: "Semi-Annual",
    nextDueDate: new Date("2024-07-08"),
    lastCompleted: new Date("2024-01-08"),
    estimatedDuration: 72,
    priority: "Routine",
    status: "Scheduled",
    description: "Semi-annual nuclear reactor maintenance",
    assignedTechnician: "Mike Wilson",
    partsRequired: ["Coolant Filter", "Seal Kit"],
    estimatedCost: 500000,
    notes: "Comprehensive system check",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "MS-004",
    assetId: "LHD-1-001",
    assetName: "USS Wasp",
    scheduleType: "Corrective",
    frequency: "As Needed",
    nextDueDate: new Date("2024-03-20"),
    estimatedDuration: 36,
    priority: "CASREP",
    status: "In Progress",
    description: "Flight deck repair and maintenance",
    assignedTechnician: "Lisa Brown",
    partsRequired: ["Deck Plate", "Fasteners", "Sealant"],
    estimatedCost: 180000,
    workOrderId: "WO-2024-001",
    notes: "Emergency repair due to structural damage",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

export default function MaintenanceSchedule() {
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateMaintenanceScheduleForm>({
    assetId: "",
    scheduleType: "Preventive",
    frequency: "Monthly",
    nextDueDate: "",
    estimatedDuration: 0,
    priority: "Routine",
    description: "",
    assignedTechnician: "",
    partsRequired: [],
    estimatedCost: 0,
    notes: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const getStatusColor = (status: MaintenanceScheduleStatus) => {
    switch (status) {
      case "Scheduled":
        return "info";
      case "In Progress":
        return "warning";
      case "Completed":
        return "success";
      case "Overdue":
        return "error";
      case "Cancelled":
        return "default";
      case "On Hold":
        return "secondary";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case "Routine":
        return "success";
      case "Urgent":
        return "warning";
      case "CASREP":
        return "error";
      default:
        return "default";
    }
  };

  const getScheduleTypeColor = (type: MaintenanceScheduleType) => {
    switch (type) {
      case "Preventive":
        return "primary";
      case "Predictive":
        return "info";
      case "Corrective":
        return "warning";
      case "Emergency":
        return "error";
      case "Routine":
        return "success";
      case "Overhaul":
        return "secondary";
      default:
        return "default";
    }
  };

  // Filter schedules by status
  const scheduledSchedules = mockSchedules.filter(
    (s) => s.status === "Scheduled",
  );
  const inProgressSchedules = mockSchedules.filter(
    (s) => s.status === "In Progress",
  );
  const overdueSchedules = mockSchedules.filter((s) => s.status === "Overdue");
  const completedSchedules = mockSchedules.filter(
    (s) => s.status === "Completed",
  );

  const getCurrentSchedules = () => {
    switch (activeTab) {
      case 0:
        return scheduledSchedules;
      case 1:
        return inProgressSchedules;
      case 2:
        return overdueSchedules;
      case 3:
        return completedSchedules;
      default:
        return mockSchedules;
    }
  };

  // Modal handlers
  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setFormData({
      assetId: "",
      scheduleType: "Preventive",
      frequency: "Monthly",
      nextDueDate: "",
      estimatedDuration: 0,
      priority: "Routine",
      description: "",
      assignedTechnician: "",
      partsRequired: [],
      estimatedCost: 0,
      notes: "",
    });
    setFormErrors({});
  };

  const openEditModal = (scheduleId: string) => {
    setSelectedSchedule(scheduleId);
    const schedule = mockSchedules.find((s) => s.id === scheduleId);
    if (schedule) {
      setFormData({
        assetId: schedule.assetId,
        scheduleType: schedule.scheduleType,
        frequency: schedule.frequency,
        nextDueDate: schedule.nextDueDate.toISOString().split("T")[0],
        estimatedDuration: schedule.estimatedDuration,
        priority: schedule.priority,
        description: schedule.description,
        assignedTechnician: schedule.assignedTechnician || "",
        partsRequired: schedule.partsRequired || [],
        estimatedCost: schedule.estimatedCost,
        notes: schedule.notes || "",
      });
    }
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setSelectedSchedule(null);
    setFormData({
      assetId: "",
      scheduleType: "Preventive",
      frequency: "Monthly",
      nextDueDate: "",
      estimatedDuration: 0,
      priority: "Routine",
      description: "",
      assignedTechnician: "",
      partsRequired: [],
      estimatedCost: 0,
      notes: "",
    });
    setFormErrors({});
  };

  const openDetailsModal = (scheduleId: string) => {
    setSelectedSchedule(scheduleId);
    setDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedSchedule(null);
  };

  const openDeleteModal = (scheduleId: string) => {
    setSelectedSchedule(scheduleId);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedSchedule(null);
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    scheduleId: string,
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedRowId(scheduleId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRowId(null);
  };

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.assetId.trim()) {
      errors.assetId = "Asset is required";
    }
    if (!formData.description.trim()) {
      errors.description = "Description is required";
    }
    if (!formData.nextDueDate) {
      errors.nextDueDate = "Next due date is required";
    }
    if (formData.estimatedDuration <= 0) {
      errors.estimatedDuration = "Estimated duration must be greater than 0";
    }
    if (formData.estimatedCost < 0) {
      errors.estimatedCost = "Estimated cost cannot be negative";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form field changes
  const handleFormChange = (
    field: string,
    value: string | number | string[],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Handle form submission
  const handleFormSubmit = () => {
    if (!validateForm()) {
      return;
    }

    // In a real application, this would create/update the schedule in the database
    console.log("Maintenance schedule saved:", formData);

    // Show success message
    alert("Maintenance schedule saved successfully!");

    if (editModalOpen) {
      closeEditModal();
    } else {
      closeCreateModal();
    }
  };

  // Handle delete
  const handleDelete = () => {
    // In a real application, this would delete the schedule from the database
    console.log("Deleting schedule:", selectedSchedule);
    alert("Maintenance schedule deleted successfully!");
    closeDeleteModal();
  };

  const selectedScheduleData = mockSchedules.find(
    (s) => s.id === selectedSchedule,
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" component="h1">
          Maintenance Schedule
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="outlined" startIcon={<FilterList />}>
            Filters
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreateModal}
          >
            Create Schedule
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 4 }}>
        <Box sx={{ flex: "1 1 250px", minWidth: "250px" }}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Schedule color="info" />
                <Box>
                  <Typography variant="h6">Scheduled</Typography>
                  <Typography variant="h4">
                    {scheduledSchedules.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: "1 1 250px", minWidth: "250px" }}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Build color="warning" />
                <Box>
                  <Typography variant="h6">In Progress</Typography>
                  <Typography variant="h4">
                    {inProgressSchedules.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: "1 1 250px", minWidth: "250px" }}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Warning color="error" />
                <Box>
                  <Typography variant="h6">Overdue</Typography>
                  <Typography variant="h4">
                    {overdueSchedules.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: "1 1 250px", minWidth: "250px" }}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <CheckCircle color="success" />
                <Box>
                  <Typography variant="h6">Completed</Typography>
                  <Typography variant="h4">
                    {completedSchedules.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
        >
          <Tab
            label={`Scheduled (${scheduledSchedules.length})`}
            icon={<Schedule />}
            iconPosition="start"
          />
          <Tab
            label={`In Progress (${inProgressSchedules.length})`}
            icon={<Build />}
            iconPosition="start"
          />
          <Tab
            label={`Overdue (${overdueSchedules.length})`}
            icon={<Warning />}
            iconPosition="start"
          />
          <Tab
            label={`Completed (${completedSchedules.length})`}
            icon={<CheckCircle />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Schedule Table */}
      <TableContainer
        component={Paper}
        sx={{
          mb: 4,
          ...tableStyles.container,
        }}
      >
        <Table sx={tableStyles.patterns.wideTable}>
          <TableHead>
            <TableRow>
              <TableCell>Schedule</TableCell>
              <TableCell>Asset</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Frequency</TableCell>
              <TableCell>Next Due</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {getCurrentSchedules().map((schedule) => (
              <TableRow key={schedule.id} hover>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {schedule.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {schedule.description}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {schedule.assetName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {schedule.assetId}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={schedule.scheduleType}
                    color={getScheduleTypeColor(schedule.scheduleType)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{schedule.frequency}</Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CalendarToday fontSize="small" color="action" />
                    <Typography variant="body2">
                      {schedule.nextDueDate.toLocaleDateString()}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={schedule.priority}
                    color={getPriorityColor(schedule.priority)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={schedule.status}
                    color={getStatusColor(schedule.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Person fontSize="small" color="action" />
                    <Typography variant="body2">
                      {schedule.assignedTechnician || "Unassigned"}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, schedule.id)}
                  >
                    <MoreVert />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            if (selectedRowId) {
              openDetailsModal(selectedRowId);
              handleMenuClose();
            }
          }}
        >
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedRowId) {
              openEditModal(selectedRowId);
              handleMenuClose();
            }
          }}
        >
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedRowId) {
              openDeleteModal(selectedRowId);
              handleMenuClose();
            }
          }}
        >
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create Schedule Modal */}
      <Dialog
        open={createModalOpen}
        onClose={closeCreateModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Maintenance Schedule</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Asset</InputLabel>
                  <Select
                    value={formData.assetId}
                    label="Asset"
                    onChange={(e) =>
                      handleFormChange("assetId", e.target.value)
                    }
                    error={!!formErrors.assetId}
                  >
                    <MenuItem value="DDG-51-001">USS Arleigh Burke</MenuItem>
                    <MenuItem value="CVN-78-001">USS Gerald R. Ford</MenuItem>
                    <MenuItem value="SSN-774-001">USS Virginia</MenuItem>
                    <MenuItem value="LHD-1-001">USS Wasp</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Schedule Type</InputLabel>
                  <Select
                    value={formData.scheduleType}
                    label="Schedule Type"
                    onChange={(e) =>
                      handleFormChange("scheduleType", e.target.value)
                    }
                  >
                    <MenuItem value="Preventive">Preventive</MenuItem>
                    <MenuItem value="Predictive">Predictive</MenuItem>
                    <MenuItem value="Corrective">Corrective</MenuItem>
                    <MenuItem value="Emergency">Emergency</MenuItem>
                    <MenuItem value="Routine">Routine</MenuItem>
                    <MenuItem value="Overhaul">Overhaul</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    value={formData.frequency}
                    label="Frequency"
                    onChange={(e) =>
                      handleFormChange("frequency", e.target.value)
                    }
                  >
                    <MenuItem value="Daily">Daily</MenuItem>
                    <MenuItem value="Weekly">Weekly</MenuItem>
                    <MenuItem value="Monthly">Monthly</MenuItem>
                    <MenuItem value="Quarterly">Quarterly</MenuItem>
                    <MenuItem value="Semi-Annual">Semi-Annual</MenuItem>
                    <MenuItem value="Annual">Annual</MenuItem>
                    <MenuItem value="As Needed">As Needed</MenuItem>
                    <MenuItem value="Custom">Custom</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Next Due Date"
                  type="date"
                  value={formData.nextDueDate}
                  onChange={(e) =>
                    handleFormChange("nextDueDate", e.target.value)
                  }
                  error={!!formErrors.nextDueDate}
                  helperText={formErrors.nextDueDate}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Estimated Duration (hours)"
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={(e) =>
                    handleFormChange(
                      "estimatedDuration",
                      parseInt(e.target.value) || 0,
                    )
                  }
                  error={!!formErrors.estimatedDuration}
                  helperText={formErrors.estimatedDuration}
                  inputProps={{ min: 1 }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={formData.priority}
                    label="Priority"
                    onChange={(e) =>
                      handleFormChange("priority", e.target.value)
                    }
                  >
                    <MenuItem value="Routine">Routine</MenuItem>
                    <MenuItem value="Urgent">Urgent</MenuItem>
                    <MenuItem value="CASREP">CASREP</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) =>
                    handleFormChange("description", e.target.value)
                  }
                  error={!!formErrors.description}
                  helperText={formErrors.description}
                  multiline
                  rows={3}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Assigned Technician"
                  value={formData.assignedTechnician}
                  onChange={(e) =>
                    handleFormChange("assignedTechnician", e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Estimated Cost ($)"
                  type="number"
                  value={formData.estimatedCost}
                  onChange={(e) =>
                    handleFormChange(
                      "estimatedCost",
                      parseInt(e.target.value) || 0,
                    )
                  }
                  error={!!formErrors.estimatedCost}
                  helperText={formErrors.estimatedCost}
                  inputProps={{ min: 0 }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => handleFormChange("notes", e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>

            {/* Validation Errors */}
            {Object.keys(formErrors).length > 0 && (
              <Alert severity="error">
                Please fix the errors above before saving.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCreateModal}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleFormSubmit}
            disabled={Object.keys(formErrors).length > 0}
          >
            Create Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Schedule Modal */}
      <Dialog
        open={editModalOpen}
        onClose={closeEditModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Maintenance Schedule</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Asset</InputLabel>
                  <Select
                    value={formData.assetId}
                    label="Asset"
                    onChange={(e) =>
                      handleFormChange("assetId", e.target.value)
                    }
                    error={!!formErrors.assetId}
                  >
                    <MenuItem value="DDG-51-001">USS Arleigh Burke</MenuItem>
                    <MenuItem value="CVN-78-001">USS Gerald R. Ford</MenuItem>
                    <MenuItem value="SSN-774-001">USS Virginia</MenuItem>
                    <MenuItem value="LHD-1-001">USS Wasp</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Schedule Type</InputLabel>
                  <Select
                    value={formData.scheduleType}
                    label="Schedule Type"
                    onChange={(e) =>
                      handleFormChange("scheduleType", e.target.value)
                    }
                  >
                    <MenuItem value="Preventive">Preventive</MenuItem>
                    <MenuItem value="Predictive">Predictive</MenuItem>
                    <MenuItem value="Corrective">Corrective</MenuItem>
                    <MenuItem value="Emergency">Emergency</MenuItem>
                    <MenuItem value="Routine">Routine</MenuItem>
                    <MenuItem value="Overhaul">Overhaul</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    value={formData.frequency}
                    label="Frequency"
                    onChange={(e) =>
                      handleFormChange("frequency", e.target.value)
                    }
                  >
                    <MenuItem value="Daily">Daily</MenuItem>
                    <MenuItem value="Weekly">Weekly</MenuItem>
                    <MenuItem value="Monthly">Monthly</MenuItem>
                    <MenuItem value="Quarterly">Quarterly</MenuItem>
                    <MenuItem value="Semi-Annual">Semi-Annual</MenuItem>
                    <MenuItem value="Annual">Annual</MenuItem>
                    <MenuItem value="As Needed">As Needed</MenuItem>
                    <MenuItem value="Custom">Custom</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Next Due Date"
                  type="date"
                  value={formData.nextDueDate}
                  onChange={(e) =>
                    handleFormChange("nextDueDate", e.target.value)
                  }
                  error={!!formErrors.nextDueDate}
                  helperText={formErrors.nextDueDate}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Estimated Duration (hours)"
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={(e) =>
                    handleFormChange(
                      "estimatedDuration",
                      parseInt(e.target.value) || 0,
                    )
                  }
                  error={!!formErrors.estimatedDuration}
                  helperText={formErrors.estimatedDuration}
                  inputProps={{ min: 1 }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={formData.priority}
                    label="Priority"
                    onChange={(e) =>
                      handleFormChange("priority", e.target.value)
                    }
                  >
                    <MenuItem value="Routine">Routine</MenuItem>
                    <MenuItem value="Urgent">Urgent</MenuItem>
                    <MenuItem value="CASREP">CASREP</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) =>
                    handleFormChange("description", e.target.value)
                  }
                  error={!!formErrors.description}
                  helperText={formErrors.description}
                  multiline
                  rows={3}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Assigned Technician"
                  value={formData.assignedTechnician}
                  onChange={(e) =>
                    handleFormChange("assignedTechnician", e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Estimated Cost ($)"
                  type="number"
                  value={formData.estimatedCost}
                  onChange={(e) =>
                    handleFormChange(
                      "estimatedCost",
                      parseInt(e.target.value) || 0,
                    )
                  }
                  error={!!formErrors.estimatedCost}
                  helperText={formErrors.estimatedCost}
                  inputProps={{ min: 0 }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => handleFormChange("notes", e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>

            {/* Validation Errors */}
            {Object.keys(formErrors).length > 0 && (
              <Alert severity="error">
                Please fix the errors above before saving.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditModal}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleFormSubmit}
            disabled={Object.keys(formErrors).length > 0}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Details Modal */}
      <Dialog
        open={detailsModalOpen}
        onClose={closeDetailsModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Schedule Details - {selectedScheduleData?.id}</DialogTitle>
        <DialogContent>
          {selectedScheduleData && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <Typography>
                  <strong>Schedule ID:</strong> {selectedScheduleData.id}
                </Typography>
                <Typography>
                  <strong>Asset:</strong> {selectedScheduleData.assetName} (
                  {selectedScheduleData.assetId})
                </Typography>
                <Typography>
                  <strong>Type:</strong>
                  <Chip
                    label={selectedScheduleData.scheduleType}
                    color={getScheduleTypeColor(
                      selectedScheduleData.scheduleType,
                    )}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography>
                  <strong>Frequency:</strong> {selectedScheduleData.frequency}
                </Typography>
                <Typography>
                  <strong>Status:</strong>
                  <Chip
                    label={selectedScheduleData.status}
                    color={getStatusColor(selectedScheduleData.status)}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography>
                  <strong>Priority:</strong>
                  <Chip
                    label={selectedScheduleData.priority}
                    color={getPriorityColor(selectedScheduleData.priority)}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>
                  Schedule Details
                </Typography>
                <Typography>
                  <strong>Next Due Date:</strong>{" "}
                  {selectedScheduleData.nextDueDate.toLocaleDateString()}
                </Typography>
                {selectedScheduleData.lastCompleted && (
                  <Typography>
                    <strong>Last Completed:</strong>{" "}
                    {selectedScheduleData.lastCompleted.toLocaleDateString()}
                  </Typography>
                )}
                <Typography>
                  <strong>Estimated Duration:</strong>{" "}
                  {selectedScheduleData.estimatedDuration} hours
                </Typography>
                <Typography>
                  <strong>Assigned Technician:</strong>{" "}
                  {selectedScheduleData.assignedTechnician || "Unassigned"}
                </Typography>
                <Typography>
                  <strong>Estimated Cost:</strong> $
                  {selectedScheduleData.estimatedCost.toLocaleString()}
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                <Typography>{selectedScheduleData.description}</Typography>
              </Box>

              {selectedScheduleData.partsRequired &&
                selectedScheduleData.partsRequired.length > 0 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Parts Required
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {selectedScheduleData.partsRequired.map((part, index) => (
                        <Chip
                          key={index}
                          label={part}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}

              {selectedScheduleData.notes && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Notes
                  </Typography>
                  <Typography>{selectedScheduleData.notes}</Typography>
                </Box>
              )}

              {selectedScheduleData.workOrderId && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Related Work Order
                  </Typography>
                  <Typography>
                    <strong>Work Order ID:</strong>{" "}
                    {selectedScheduleData.workOrderId}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetailsModal}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              closeDetailsModal();
              if (selectedSchedule) {
                openEditModal(selectedSchedule);
              }
            }}
          >
            Edit Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteModalOpen}
        onClose={closeDeleteModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Maintenance Schedule</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this maintenance schedule? This
            action cannot be undone.
          </Typography>
          {selectedScheduleData && (
            <Box sx={{ mt: 2, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
              <Typography variant="subtitle2">
                <strong>Schedule ID:</strong> {selectedScheduleData.id}
              </Typography>
              <Typography variant="subtitle2">
                <strong>Asset:</strong> {selectedScheduleData.assetName}
              </Typography>
              <Typography variant="subtitle2">
                <strong>Description:</strong> {selectedScheduleData.description}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteModal}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
