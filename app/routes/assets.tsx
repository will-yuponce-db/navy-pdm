import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  LinearProgress,
  IconButton,
  Tooltip,
  Badge,
  Modal,
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
  Snackbar,
  InputAdornment,
  Autocomplete,
  Tabs,
  Tab,
  Pagination,
  Switch,
  FormControlLabel,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Skeleton,
} from "@mui/material";
import {
  DirectionsBoat,
  Build,
  Warning,
  CheckCircle,
  Visibility,
  Edit,
  History,
  LocationOn,
  Speed,
  BatteryAlert,
  Schedule,
  Search,
  FilterList,
  Download,
  Refresh,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Assessment,
  Timeline,
  BarChart,
  PieChart,
  ExpandMore,
  ExpandLess,
  Sort,
  ViewList,
  ViewModule,
  Settings,
  Notifications,
  Star,
  StarBorder,
} from "@mui/icons-material";
import { tableStyles } from "../utils/tableStyles";
import WorkOrderModal from "../components/WorkOrderModal";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { fetchAssets, updateAsset, setSelectedAsset } from "../redux/services/assetSlice";
import { addNotification } from "../redux/services/notificationSlice";
import type {
  CreateMaintenanceScheduleForm,
  MaintenanceScheduleType,
  MaintenanceFrequency,
  Priority,
  Asset,
} from "../types";

export function meta() {
  return [
    { title: "Asset Management" },
    { name: "description", content: "Navy PDM Asset Management System" },
  ];
}

// Helper function to get system status color
const getSystemStatusColor = (status: string) => {
  switch (status) {
    case "operational":
      return "success";
    case "degraded":
      return "warning";
    case "critical":
      return "error";
    default:
      return "default";
  }
};

// Enhanced filter and sort types
interface AssetFilters {
  search: string;
  status: string[];
  type: string[];
  location: string[];
  readinessRange: [number, number];
  criticalIssuesRange: [number, number];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  viewMode: 'table' | 'cards' | 'analytics';
  showFavorites: boolean;
}

interface AssetAnalytics {
  totalAssets: number;
  operationalAssets: number;
  maintenanceAssets: number;
  deployedAssets: number;
  criticalAssets: number;
  avgReadinessScore: number;
  totalCriticalIssues: number;
  totalMaintenanceCost: number;
  avgFuelEfficiency: number;
  readinessTrend: 'up' | 'down' | 'stable';
  costTrend: 'up' | 'down' | 'stable';
}

export default function Assets() {
  const dispatch = useAppDispatch();
  const { assets, loading, error, selectedAsset } = useAppSelector((state) => state.assets);
  
  // Modal states
  const [workOrderModalOpen, setWorkOrderModalOpen] = useState(false);
  const [assetDetailsModalOpen, setAssetDetailsModalOpen] = useState(false);
  const [maintenanceHistoryModalOpen, setMaintenanceHistoryModalOpen] = useState(false);
  const [editAssetModalOpen, setEditAssetModalOpen] = useState(false);
  const [maintenanceScheduleModalOpen, setMaintenanceScheduleModalOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  
  // Enhanced state management
  const [filters, setFilters] = useState<AssetFilters>({
    search: '',
    status: [],
    type: [],
    location: [],
    readinessRange: [0, 100],
    criticalIssuesRange: [0, 10],
    sortBy: 'name',
    sortOrder: 'asc',
    viewMode: 'table',
    showFavorites: false,
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [analytics, setAnalytics] = useState<AssetAnalytics | null>(null);
  
  // Edit form state
  const [editFormData, setEditFormData] = useState({
    name: "",
    type: "",
    class: "",
    status: "Operational" as const,
    location: "",
    lastMaintenance: "",
    nextMaintenance: "",
    operationalHours: 0,
    readinessScore: 0,
    criticalIssues: 0,
    maintenanceCost: 0,
    fuelEfficiency: 0,
  });
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});

  // Maintenance schedule form state
  const [scheduleFormData, setScheduleFormData] = useState<CreateMaintenanceScheduleForm>({
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
  const [scheduleFormErrors, setScheduleFormErrors] = useState<Record<string, string>>({});

  // Fetch assets on component mount
  useEffect(() => {
    dispatch(fetchAssets());
  }, [dispatch]);

  // Auto-refresh functionality
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchAssets());
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [dispatch]);

  // Calculate analytics
  useEffect(() => {
    if (assets.length > 0) {
      const analyticsData: AssetAnalytics = {
        totalAssets: assets.length,
        operationalAssets: assets.filter(a => a.status === 'Operational').length,
        maintenanceAssets: assets.filter(a => a.status === 'Maintenance').length,
        deployedAssets: assets.filter(a => a.status === 'Deployed').length,
        criticalAssets: assets.filter(a => a.status === 'Critical').length,
        avgReadinessScore: Math.round(assets.reduce((sum, a) => sum + a.readinessScore, 0) / assets.length),
        totalCriticalIssues: assets.reduce((sum, a) => sum + a.criticalIssues, 0),
        totalMaintenanceCost: assets.reduce((sum, a) => sum + a.maintenanceCost, 0),
        avgFuelEfficiency: Math.round(assets.reduce((sum, a) => sum + a.fuelEfficiency, 0) / assets.length),
        readinessTrend: 'stable', // Would be calculated from historical data
        costTrend: 'up', // Would be calculated from historical data
      };
      setAnalytics(analyticsData);
    }
  }, [assets]);

  // Enhanced filtering and sorting
  const filteredAndSortedAssets = useMemo(() => {
    const filtered = assets.filter(asset => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          asset.name.toLowerCase().includes(searchLower) ||
          asset.id.toLowerCase().includes(searchLower) ||
          asset.type.toLowerCase().includes(searchLower) ||
          asset.location.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(asset.status)) {
        return false;
      }

      // Type filter
      if (filters.type.length > 0 && !filters.type.includes(asset.type)) {
        return false;
      }

      // Location filter
      if (filters.location.length > 0 && !filters.location.includes(asset.location)) {
        return false;
      }

      // Readiness range filter
      if (asset.readinessScore < filters.readinessRange[0] || asset.readinessScore > filters.readinessRange[1]) {
        return false;
      }

      // Critical issues range filter
      if (asset.criticalIssues < filters.criticalIssuesRange[0] || asset.criticalIssues > filters.criticalIssuesRange[1]) {
        return false;
      }

      // Favorites filter
      if (filters.showFavorites && !favorites.has(asset.id)) {
        return false;
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'readiness':
          aValue = a.readinessScore;
          bValue = b.readinessScore;
          break;
        case 'criticalIssues':
          aValue = a.criticalIssues;
          bValue = b.criticalIssues;
          break;
        case 'maintenanceCost':
          aValue = a.maintenanceCost;
          bValue = b.maintenanceCost;
          break;
        case 'operationalHours':
          aValue = a.operationalHours;
          bValue = b.operationalHours;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (typeof aValue === 'string') {
        return filters.sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return filters.sortOrder === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }
    });

    return filtered;
  }, [assets, filters, favorites]);

  // Pagination
  const paginatedAssets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedAssets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedAssets, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedAssets.length / itemsPerPage);

  // Get unique values for filter options
  const filterOptions = useMemo(() => ({
    statuses: [...new Set(assets.map(a => a.status))],
    types: [...new Set(assets.map(a => a.type))],
    locations: [...new Set(assets.map(a => a.location))],
  }), [assets]);

  // Enhanced handlers
  const handleFilterChange = useCallback((key: keyof AssetFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const handleToggleFavorite = useCallback((assetId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(assetId)) {
        newFavorites.delete(assetId);
      } else {
        newFavorites.add(assetId);
      }
      return newFavorites;
    });
  }, []);

  const handleSelectAsset = useCallback((assetId: string) => {
    setSelectedAssets(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(assetId)) {
        newSelected.delete(assetId);
      } else {
        newSelected.add(assetId);
      }
      return newSelected;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedAssets.size === paginatedAssets.length) {
      setSelectedAssets(new Set());
    } else {
      setSelectedAssets(new Set(paginatedAssets.map(a => a.id)));
    }
  }, [selectedAssets.size, paginatedAssets]);

  const handleExportAssets = useCallback(() => {
    const dataToExport = selectedAssets.size > 0 
      ? assets.filter(a => selectedAssets.has(a.id))
      : filteredAndSortedAssets;
    
    const csvContent = [
      ['Name', 'ID', 'Type', 'Class', 'Status', 'Location', 'Readiness Score', 'Critical Issues', 'Maintenance Cost', 'Operational Hours', 'Fuel Efficiency', 'Last Maintenance', 'Next Maintenance'].join(','),
      ...dataToExport.map(asset => [
        `"${asset.name}"`,
        `"${asset.id}"`,
        `"${asset.type}"`,
        `"${asset.class}"`,
        `"${asset.status}"`,
        `"${asset.location}"`,
        asset.readinessScore,
        asset.criticalIssues,
        asset.maintenanceCost,
        asset.operationalHours,
        asset.fuelEfficiency,
        `"${asset.lastMaintenance}"`,
        `"${asset.nextMaintenance}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assets-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    // Show success notification
    dispatch(addNotification({
      id: Date.now().toString(),
      type: "success",
      title: "Export Complete",
      message: `Successfully exported ${dataToExport.length} assets to CSV.`,
      timestamp: new Date().toISOString(),
      priority: "medium",
      category: "update",
      read: false,
    }));
  }, [selectedAssets, assets, filteredAndSortedAssets, dispatch]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Operational":
        return "success";
      case "Maintenance":
        return "warning";
      case "Deployed":
        return "info";
      case "Critical":
        return "error";
      default:
        return "default";
    }
  };


  const getReadinessColor = (score: number) => {
    if (score >= 90) return "success";
    if (score >= 75) return "warning";
    return "error";
  };

  // Use analytics data for summary cards
  const totalAssets = analytics?.totalAssets || 0;
  const operationalAssets = analytics?.operationalAssets || 0;
  const maintenanceAssets = analytics?.maintenanceAssets || 0;
  const totalCriticalIssues = analytics?.totalCriticalIssues || 0;

  // Modal handlers
  const openWorkOrderModal = () => setWorkOrderModalOpen(true);
  const closeWorkOrderModal = () => setWorkOrderModalOpen(false);
  
  const openAssetDetailsModal = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (asset) {
      dispatch(setSelectedAsset(asset));
    }
    setAssetDetailsModalOpen(true);
  };
  const closeAssetDetailsModal = () => {
    setAssetDetailsModalOpen(false);
    dispatch(setSelectedAsset(null));
  };
  
  const openMaintenanceHistoryModal = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (asset) {
      dispatch(setSelectedAsset(asset));
    }
    setMaintenanceHistoryModalOpen(true);
  };
  const closeMaintenanceHistoryModal = () => {
    setMaintenanceHistoryModalOpen(false);
    dispatch(setSelectedAsset(null));
  };
  
  const openEditAssetModal = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (asset) {
      dispatch(setSelectedAsset(asset));
      setEditFormData({
        name: asset.name,
        type: asset.type,
        class: asset.class,
        status: asset.status,
        location: asset.location,
        lastMaintenance: asset.lastMaintenance,
        nextMaintenance: asset.nextMaintenance,
        operationalHours: asset.operationalHours,
        readinessScore: asset.readinessScore,
        criticalIssues: asset.criticalIssues,
        maintenanceCost: asset.maintenanceCost,
        fuelEfficiency: asset.fuelEfficiency,
      });
    }
    setEditFormErrors({});
    setEditAssetModalOpen(true);
  };
  const closeEditAssetModal = () => {
    setEditAssetModalOpen(false);
    dispatch(setSelectedAsset(null));
    setEditFormData({
      name: "",
      type: "",
      class: "",
      status: "Operational",
      location: "",
      lastMaintenance: "",
      nextMaintenance: "",
      operationalHours: 0,
      readinessScore: 0,
      criticalIssues: 0,
      maintenanceCost: 0,
      fuelEfficiency: 0,
    });
    setEditFormErrors({});
  };

  // Maintenance schedule modal handlers
  const openMaintenanceScheduleModal = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (asset) {
      dispatch(setSelectedAsset(asset));
    }
    if (asset) {
      setScheduleFormData({
        assetId: asset.id,
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
    }
    setScheduleFormErrors({});
    setMaintenanceScheduleModalOpen(true);
  };

  const closeMaintenanceScheduleModal = () => {
    setMaintenanceScheduleModalOpen(false);
    dispatch(setSelectedAsset(null));
    setScheduleFormData({
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
    setScheduleFormErrors({});
  };

  // Get selected asset data
  const selectedAssetData = selectedAsset;

  // Form validation
  const validateEditForm = () => {
    const errors: Record<string, string> = {};
    
    if (!editFormData.name.trim()) {
      errors.name = "Asset name is required";
    }
    if (!editFormData.type.trim()) {
      errors.type = "Asset type is required";
    }
    if (!editFormData.class.trim()) {
      errors.class = "Asset class is required";
    }
    if (!editFormData.location.trim()) {
      errors.location = "Location is required";
    }
    if (editFormData.operationalHours < 0) {
      errors.operationalHours = "Operational hours cannot be negative";
    }
    if (editFormData.readinessScore < 0 || editFormData.readinessScore > 100) {
      errors.readinessScore = "Readiness score must be between 0 and 100";
    }
    if (editFormData.criticalIssues < 0) {
      errors.criticalIssues = "Critical issues cannot be negative";
    }
    if (editFormData.maintenanceCost < 0) {
      errors.maintenanceCost = "Maintenance cost cannot be negative";
    }
    if (editFormData.fuelEfficiency < 0 || editFormData.fuelEfficiency > 100) {
      errors.fuelEfficiency = "Fuel efficiency must be between 0 and 100";
    }
    
    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form field changes
  const handleEditFormChange = (field: string, value: string | number) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (editFormErrors[field]) {
      setEditFormErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Handle form submission
  const handleEditFormSubmit = async () => {
    if (!validateEditForm()) {
      return;
    }
    
    if (!selectedAsset) {
      return;
    }
    
    try {
      const updatedAsset: Asset = {
        ...selectedAsset,
        ...editFormData,
      };
      
      await dispatch(updateAsset(updatedAsset)).unwrap();
      
      // Show success notification
      dispatch(addNotification({
        id: Date.now().toString(),
        type: "success",
        title: "Asset Updated",
        message: `${updatedAsset.name} has been updated successfully.`,
        timestamp: new Date().toISOString(),
        priority: "medium",
        category: "update",
        read: false,
      }));
      
      setSnackbarMessage("Asset updated successfully!");
      setSnackbarOpen(true);
      closeEditAssetModal();
    } catch (error) {
      // Show error notification
      dispatch(addNotification({
        id: Date.now().toString(),
        type: "error",
        title: "Update Failed",
        message: "Failed to update asset. Please try again.",
        timestamp: new Date().toISOString(),
        priority: "high",
        category: "alert",
        read: false,
      }));
      
      setSnackbarMessage("Failed to update asset. Please try again.");
      setSnackbarOpen(true);
    }
  };

  // Maintenance schedule form validation
  const validateScheduleForm = () => {
    const errors: Record<string, string> = {};
    
    if (!scheduleFormData.description.trim()) {
      errors.description = "Description is required";
    }
    if (!scheduleFormData.nextDueDate) {
      errors.nextDueDate = "Next due date is required";
    }
    if (scheduleFormData.estimatedDuration <= 0) {
      errors.estimatedDuration = "Estimated duration must be greater than 0";
    }
    if (scheduleFormData.estimatedCost < 0) {
      errors.estimatedCost = "Estimated cost cannot be negative";
    }
    
    setScheduleFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle maintenance schedule form field changes
  const handleScheduleFormChange = (field: string, value: string | number | string[]) => {
    setScheduleFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (scheduleFormErrors[field]) {
      setScheduleFormErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Handle maintenance schedule form submission
  const handleScheduleFormSubmit = () => {
    if (!validateScheduleForm()) {
      return;
    }
    
    // In a real application, this would create the maintenance schedule in the database
    console.log("Maintenance schedule created:", scheduleFormData);
    
    // Show success message
    alert("Maintenance schedule created successfully!");
    
    closeMaintenanceScheduleModal();
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Enhanced Header */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          flexDirection: { xs: "column", md: "row" },
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Asset Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredAndSortedAssets.length} of {assets.length} assets
            {filters.search && ` matching "${filters.search}"`}
          </Typography>
        </Box>
        
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", width: { xs: "100%", md: "auto" } }}>
          {/* View Mode Toggle */}
          <Box sx={{ display: "flex", border: 1, borderColor: "divider", borderRadius: 1 }}>
            <IconButton
              size="small"
              onClick={() => handleFilterChange('viewMode', 'table')}
              color={filters.viewMode === 'table' ? 'primary' : 'default'}
            >
              <ViewList />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleFilterChange('viewMode', 'cards')}
              color={filters.viewMode === 'cards' ? 'primary' : 'default'}
            >
              <ViewModule />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleFilterChange('viewMode', 'analytics')}
              color={filters.viewMode === 'analytics' ? 'primary' : 'default'}
            >
              <Assessment />
            </IconButton>
          </Box>

          {/* Export Button */}
          <Button 
            variant="outlined" 
            startIcon={<Download />}
            onClick={handleExportAssets}
            disabled={filteredAndSortedAssets.length === 0}
          >
            Export
          </Button>

          {/* Refresh Button */}
          <Button 
            variant="outlined" 
            startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
            onClick={() => dispatch(fetchAssets())}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>

          {/* Action Buttons */}
          <Button 
            variant="outlined" 
            startIcon={<History />}
            onClick={() => setMaintenanceHistoryModalOpen(true)}
          >
            History
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<Schedule />}
            onClick={() => window.location.href = "/maintenance-schedule"}
          >
            Schedules
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Build />}
            onClick={openWorkOrderModal}
          >
            Schedule Work
          </Button>
        </Box>
      </Box>

      {/* Enhanced Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FilterList />
              Filters & Search
            </Typography>
            <IconButton
              onClick={() => setExpandedFilters(!expandedFilters)}
              size="small"
            >
              {expandedFilters ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>

          {/* Basic Search */}
          <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
            <TextField
              placeholder="Search assets..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: { xs: "100%", sm: 300 }, flex: 1 }}
            />
            
            <FormControl sx={{ minWidth: { xs: "100%", sm: 120 } }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={filters.sortBy}
                label="Sort By"
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="status">Status</MenuItem>
                <MenuItem value="readiness">Readiness</MenuItem>
                <MenuItem value="criticalIssues">Critical Issues</MenuItem>
                <MenuItem value="maintenanceCost">Maintenance Cost</MenuItem>
                <MenuItem value="operationalHours">Operational Hours</MenuItem>
              </Select>
            </FormControl>

            <IconButton
              onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
              color="primary"
            >
              <Sort sx={{ transform: filters.sortOrder === 'desc' ? 'rotate(180deg)' : 'none' }} />
            </IconButton>
          </Box>

          {/* Advanced Filters */}
          <Collapse in={expandedFilters}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
              <Autocomplete
                multiple
                options={filterOptions.statuses}
                value={filters.status}
                onChange={(_, value) => handleFilterChange('status', value)}
                renderInput={(params) => (
                  <TextField {...params} label="Status" placeholder="Select statuses" />
                )}
                sx={{ minWidth: { xs: "100%", sm: 200 } }}
              />

              <Autocomplete
                multiple
                options={filterOptions.types}
                value={filters.type}
                onChange={(_, value) => handleFilterChange('type', value)}
                renderInput={(params) => (
                  <TextField {...params} label="Type" placeholder="Select types" />
                )}
                sx={{ minWidth: { xs: "100%", sm: 200 } }}
              />

              <Autocomplete
                multiple
                options={filterOptions.locations}
                value={filters.location}
                onChange={(_, value) => handleFilterChange('location', value)}
                renderInput={(params) => (
                  <TextField {...params} label="Location" placeholder="Select locations" />
                )}
                sx={{ minWidth: { xs: "100%", sm: 200 } }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={filters.showFavorites}
                    onChange={(e) => handleFilterChange('showFavorites', e.target.checked)}
                  />
                }
                label="Favorites Only"
              />
            </Box>
          </Collapse>

          {/* Active Filters */}
          {(filters.status.length > 0 || filters.type.length > 0 || filters.location.length > 0 || filters.showFavorites) && (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Typography variant="body2" color="text.secondary" sx={{ alignSelf: "center" }}>
                Active filters:
              </Typography>
              {filters.status.map(status => (
                <Chip
                  key={status}
                  label={`Status: ${status}`}
                  size="small"
                  onDelete={() => handleFilterChange('status', filters.status.filter(s => s !== status))}
                />
              ))}
              {filters.type.map(type => (
                <Chip
                  key={type}
                  label={`Type: ${type}`}
                  size="small"
                  onDelete={() => handleFilterChange('type', filters.type.filter(t => t !== type))}
                />
              ))}
              {filters.location.map(location => (
                <Chip
                  key={location}
                  label={`Location: ${location}`}
                  size="small"
                  onDelete={() => handleFilterChange('location', filters.location.filter(l => l !== location))}
                />
              ))}
              {filters.showFavorites && (
                <Chip
                  label="Favorites Only"
                  size="small"
                  onDelete={() => handleFilterChange('showFavorites', false)}
                />
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Summary Cards */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 4 }}>
        <Box sx={{ flex: "1 1 250px", minWidth: "250px" }}>
          <Card sx={{ 
            background: "linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(25, 118, 210, 0.05) 100%)",
            border: "1px solid rgba(25, 118, 210, 0.2)"
          }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <DirectionsBoat color="primary" />
                  <Box>
                    <Typography variant="h6" color="text.secondary">Total Assets</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>{totalAssets}</Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="body2" color="text.secondary">
                    {analytics?.avgReadinessScore}% avg readiness
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={analytics?.avgReadinessScore || 0}
                    sx={{ width: 60, height: 4, borderRadius: 2, mt: 0.5 }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: "1 1 250px", minWidth: "250px" }}>
          <Card sx={{ 
            background: "linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)",
            border: "1px solid rgba(76, 175, 80, 0.2)"
          }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <CheckCircle color="success" />
                  <Box>
                    <Typography variant="h6" color="text.secondary">Operational</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>{operationalAssets}</Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="body2" color="text.secondary">
                    {totalAssets > 0 ? Math.round((operationalAssets / totalAssets) * 100) : 0}% of fleet
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                    <TrendingUp fontSize="small" color="success" />
                    <Typography variant="caption" color="success.main">+2%</Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: "1 1 250px", minWidth: "250px" }}>
          <Card sx={{ 
            background: "linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 152, 0, 0.05) 100%)",
            border: "1px solid rgba(255, 152, 0, 0.2)"
          }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Build color="warning" />
                  <Box>
                    <Typography variant="h6" color="text.secondary">In Maintenance</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>{maintenanceAssets}</Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="body2" color="text.secondary">
                    {analytics?.totalMaintenanceCost ? `$${(analytics.totalMaintenanceCost / 1000000).toFixed(1)}M` : '$0M'}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                    <TrendingUp fontSize="small" color="warning" />
                    <Typography variant="caption" color="warning.main">+5%</Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: "1 1 250px", minWidth: "250px" }}>
          <Card sx={{ 
            background: "linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(244, 67, 54, 0.05) 100%)",
            border: "1px solid rgba(244, 67, 54, 0.2)"
          }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Warning color="error" />
                  <Box>
                    <Typography variant="h6" color="text.secondary">Critical Issues</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>{totalCriticalIssues}</Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="body2" color="text.secondary">
                    {analytics?.criticalAssets || 0} assets affected
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                    <TrendingDown fontSize="small" color="error" />
                    <Typography variant="caption" color="error.main">-1</Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Enhanced Asset Views */}
      {filters.viewMode === 'analytics' ? (
        // Analytics View
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Typography variant="h5" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <Assessment />
            Fleet Analytics
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Readiness Distribution</Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {[
                      { label: "Excellent (90-100%)", count: assets.filter(a => a.readinessScore >= 90).length, color: "success" },
                      { label: "Good (75-89%)", count: assets.filter(a => a.readinessScore >= 75 && a.readinessScore < 90).length, color: "info" },
                      { label: "Fair (60-74%)", count: assets.filter(a => a.readinessScore >= 60 && a.readinessScore < 75).length, color: "warning" },
                      { label: "Poor (<60%)", count: assets.filter(a => a.readinessScore < 60).length, color: "error" },
                    ].map((item) => (
                      <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Box sx={{ width: 100 }}>
                          <Typography variant="body2">{item.label}</Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={totalAssets > 0 ? (item.count / totalAssets) * 100 : 0}
                            color={item.color as any}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ minWidth: 30, textAlign: "right" }}>
                          {item.count}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Status Breakdown</Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {[
                      { status: "Operational", count: operationalAssets, color: "success" },
                      { status: "Maintenance", count: maintenanceAssets, color: "warning" },
                      { status: "Deployed", count: analytics?.deployedAssets || 0, color: "info" },
                      { status: "Critical", count: analytics?.criticalAssets || 0, color: "error" },
                    ].map((item) => (
                      <Box key={item.status} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Chip
                          label={item.status}
                          color={item.color as any}
                          size="small"
                          sx={{ minWidth: 100 }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={totalAssets > 0 ? (item.count / totalAssets) * 100 : 0}
                            color={item.color as any}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ minWidth: 30, textAlign: "right" }}>
                          {item.count}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Top Assets by Performance</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Asset</TableCell>
                          <TableCell>Readiness Score</TableCell>
                          <TableCell>Critical Issues</TableCell>
                          <TableCell>Maintenance Cost</TableCell>
                          <TableCell>Fuel Efficiency</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {assets
                          .sort((a, b) => b.readinessScore - a.readinessScore)
                          .slice(0, 5)
                          .map((asset) => (
                            <TableRow key={asset.id}>
                              <TableCell>
                                <Box>
                                  <Typography variant="subtitle2">{asset.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {asset.id}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={asset.readinessScore}
                                    color={getReadinessColor(asset.readinessScore)}
                                    sx={{ width: 60, height: 6, borderRadius: 3 }}
                                  />
                                  <Typography variant="body2">{asset.readinessScore}%</Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Badge badgeContent={asset.criticalIssues} color="error">
                                  <Warning color={asset.criticalIssues > 0 ? "error" : "disabled"} />
                                </Badge>
                              </TableCell>
                              <TableCell>${(asset.maintenanceCost / 1000).toFixed(0)}K</TableCell>
                              <TableCell>{asset.fuelEfficiency}%</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      ) : filters.viewMode === 'cards' ? (
        // Enhanced Cards View
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h5">Fleet Overview</Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {selectedAssets.size > 0 && `${selectedAssets.size} selected`}
              </Typography>
              {selectedAssets.size > 0 && (
                <Button
                  size="small"
                  startIcon={<Download />}
                  onClick={handleExportAssets}
                >
                  Export Selected
                </Button>
              )}
            </Box>
          </Box>

          <Grid container spacing={3}>
            {paginatedAssets.map((asset) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={asset.id}>
                <Card 
                  sx={{ 
                    height: "100%",
                    cursor: "pointer",
                    border: selectedAssets.has(asset.id) ? "2px solid" : "1px solid",
                    borderColor: selectedAssets.has(asset.id) ? "primary.main" : "divider",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 4,
                    }
                  }}
                  onClick={() => handleSelectAsset(asset.id)}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                          {asset.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {asset.id} • {asset.type}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(asset.id);
                          }}
                        >
                          {favorites.has(asset.id) ? <Star color="warning" /> : <StarBorder />}
                        </IconButton>
                        <Chip
                          label={asset.status}
                          color={getStatusColor(asset.status)}
                          size="small"
                        />
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="body2">{asset.location}</Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <Speed fontSize="small" color="action" />
                        <Typography variant="body2">
                          {asset.operationalHours.toLocaleString()} hrs
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <BatteryAlert fontSize="small" color="action" />
                        <Typography variant="body2">
                          {asset.fuelEfficiency}% efficiency
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Readiness Score
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: "100%", mr: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={asset.readinessScore}
                            color={getReadinessColor(asset.readinessScore)}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                        <Typography variant="body2" fontWeight="bold">
                          {asset.readinessScore}%
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        System Status
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {asset.systems.slice(0, 3).map((system, index) => (
                          <Chip
                            key={index}
                            label={system.name}
                            color={getSystemStatusColor(system.status)}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {asset.systems.length > 3 && (
                          <Chip
                            label={`+${asset.systems.length - 3}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        fullWidth
                        onClick={(e) => {
                          e.stopPropagation();
                          openAssetDetailsModal(asset.id);
                        }}
                      >
                        View Details
                      </Button>
                      <Button 
                        variant="contained" 
                        size="small" 
                        fullWidth
                        onClick={(e) => {
                          e.stopPropagation();
                          openWorkOrderModal();
                        }}
                      >
                        Schedule Work
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination for Cards View */}
          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </Box>
      ) : (
        // Enhanced Table View
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h5">Fleet Overview</Typography>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary">
                {selectedAssets.size > 0 && `${selectedAssets.size} selected`}
              </Typography>
              {selectedAssets.size > 0 && (
                <Button
                  size="small"
                  startIcon={<Download />}
                  onClick={handleExportAssets}
                >
                  Export Selected
                </Button>
              )}
            </Box>
          </Box>

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
                  <TableCell padding="checkbox">
                    <input
                      type="checkbox"
                      checked={selectedAssets.size === paginatedAssets.length && paginatedAssets.length > 0}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Asset</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Readiness</TableCell>
                  <TableCell>Next Maintenance</TableCell>
                  <TableCell>Critical Issues</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: itemsPerPage }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton variant="rectangular" width={20} height={20} /></TableCell>
                      <TableCell><Skeleton variant="text" width="80%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                      <TableCell><Skeleton variant="rectangular" width={80} height={24} /></TableCell>
                      <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                      <TableCell><Skeleton variant="rectangular" width="100%" height={8} /></TableCell>
                      <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                      <TableCell><Skeleton variant="rectangular" width={24} height={24} /></TableCell>
                      <TableCell><Skeleton variant="rectangular" width={120} height={32} /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  paginatedAssets.map((asset) => (
                    <TableRow 
                      key={asset.id} 
                      hover
                      selected={selectedAssets.has(asset.id)}
                      sx={{ 
                        cursor: "pointer",
                        "&:hover": { backgroundColor: "action.hover" }
                      }}
                      onClick={() => handleSelectAsset(asset.id)}
                    >
                      <TableCell padding="checkbox">
                        <input
                          type="checkbox"
                          checked={selectedAssets.has(asset.id)}
                          onChange={() => handleSelectAsset(asset.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(asset.id);
                            }}
                          >
                            {favorites.has(asset.id) ? <Star color="warning" fontSize="small" /> : <StarBorder fontSize="small" />}
                          </IconButton>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {asset.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {asset.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{asset.type}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {asset.class}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={asset.status}
                          color={getStatusColor(asset.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <LocationOn fontSize="small" color="action" />
                          <Typography variant="body2">{asset.location}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box sx={{ width: "100%", mr: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={asset.readinessScore}
                              color={getReadinessColor(asset.readinessScore)}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                          <Typography variant="body2" fontWeight="bold">
                            {asset.readinessScore}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {asset.nextMaintenance}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Badge badgeContent={asset.criticalIssues} color="error">
                          <Warning
                            color={asset.criticalIssues > 0 ? "error" : "disabled"}
                          />
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                openAssetDetailsModal(asset.id);
                              }}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Asset">
                            <IconButton 
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditAssetModal(asset.id);
                              }}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Maintenance History">
                            <IconButton 
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                openMaintenanceHistoryModal(asset.id);
                              }}
                            >
                              <History />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Create Maintenance Schedule">
                            <IconButton 
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                openMaintenanceScheduleModal(asset.id);
                              }}
                            >
                              <Schedule />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination for Table View */}
          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedAssets.length)} of {filteredAndSortedAssets.length} assets
              </Typography>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </Box>
      )}


      {/* Work Order Modal */}
      <WorkOrderModal
        modalOpen={workOrderModalOpen}
        handleModalClose={closeWorkOrderModal}
      />

      {/* Asset Details Modal */}
      <Dialog
        open={assetDetailsModalOpen}
        onClose={closeAssetDetailsModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Asset Details - {selectedAssetData?.name}
        </DialogTitle>
        <DialogContent>
          {selectedAssetData && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography variant="h6" gutterBottom>Basic Information</Typography>
                <Typography><strong>ID:</strong> {selectedAssetData.id}</Typography>
                <Typography><strong>Type:</strong> {selectedAssetData.type}</Typography>
                <Typography><strong>Class:</strong> {selectedAssetData.class}</Typography>
                <Typography><strong>Status:</strong> 
                  <Chip 
                    label={selectedAssetData.status} 
                    color={getStatusColor(selectedAssetData.status)} 
                    size="small" 
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography><strong>Location:</strong> {selectedAssetData.location}</Typography>
              </Box>
              
              <Box>
                <Typography variant="h6" gutterBottom>Performance Metrics</Typography>
                <Typography><strong>Operational Hours:</strong> {selectedAssetData.operationalHours.toLocaleString()} hrs</Typography>
                <Typography><strong>Readiness Score:</strong> {selectedAssetData.readinessScore}%</Typography>
                <Typography><strong>Fuel Efficiency:</strong> {selectedAssetData.fuelEfficiency}%</Typography>
                <Typography><strong>Maintenance Cost:</strong> ${selectedAssetData.maintenanceCost.toLocaleString()}</Typography>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>Maintenance Schedule</Typography>
                <Typography><strong>Last Maintenance:</strong> {selectedAssetData.lastMaintenance}</Typography>
                <Typography><strong>Next Maintenance:</strong> {selectedAssetData.nextMaintenance}</Typography>
                <Typography><strong>Critical Issues:</strong> {selectedAssetData.criticalIssues}</Typography>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>System Status</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {selectedAssetData.systems.map((system, index) => (
                    <Chip
                      key={index}
                      label={`${system.name}: ${system.status}`}
                      color={getSystemStatusColor(system.status)}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAssetDetailsModal}>Close</Button>
          <Button 
            variant="outlined" 
            onClick={() => {
              closeAssetDetailsModal();
              if (selectedAsset) {
                openMaintenanceScheduleModal(selectedAsset);
              }
            }}
            startIcon={<Schedule />}
          >
            Create Schedule
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              closeAssetDetailsModal();
              openWorkOrderModal();
            }}
          >
            Schedule Maintenance
          </Button>
        </DialogActions>
      </Dialog>

      {/* Maintenance History Modal */}
      <Dialog
        open={maintenanceHistoryModalOpen}
        onClose={closeMaintenanceHistoryModal}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Maintenance History {selectedAssetData ? `- ${selectedAssetData.name}` : ''}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="body1" color="text.secondary">
              {selectedAssetData 
                ? `Maintenance history for ${selectedAssetData.name} (${selectedAssetData.id})`
                : 'Maintenance history for all assets'
              }
            </Typography>
            
            {/* Mock maintenance history data */}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Cost</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>2024-01-15</TableCell>
                    <TableCell>Routine</TableCell>
                    <TableCell>Quarterly inspection and maintenance</TableCell>
                    <TableCell>
                      <Chip label="Completed" color="success" size="small" />
                    </TableCell>
                    <TableCell>3 days</TableCell>
                    <TableCell>$125,000</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2023-10-20</TableCell>
                    <TableCell>Emergency</TableCell>
                    <TableCell>Propulsion system repair</TableCell>
                    <TableCell>
                      <Chip label="Completed" color="success" size="small" />
                    </TableCell>
                    <TableCell>5 days</TableCell>
                    <TableCell>$250,000</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2023-07-10</TableCell>
                    <TableCell>Preventive</TableCell>
                    <TableCell>Annual overhaul</TableCell>
                    <TableCell>
                      <Chip label="Completed" color="success" size="small" />
                    </TableCell>
                    <TableCell>14 days</TableCell>
                    <TableCell>$500,000</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeMaintenanceHistoryModal}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Asset Modal */}
      <Dialog
        open={editAssetModalOpen}
        onClose={closeEditAssetModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Edit Asset - {selectedAssetData?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 2 }}>
            {/* Basic Information */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Asset Name"
                    value={editFormData.name}
                    onChange={(e) => handleEditFormChange("name", e.target.value)}
                    error={!!editFormErrors.name}
                    helperText={editFormErrors.name}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Asset Type"
                    value={editFormData.type}
                    onChange={(e) => handleEditFormChange("type", e.target.value)}
                    error={!!editFormErrors.type}
                    helperText={editFormErrors.type}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Asset Class"
                    value={editFormData.class}
                    onChange={(e) => handleEditFormChange("class", e.target.value)}
                    error={!!editFormErrors.class}
                    helperText={editFormErrors.class}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={editFormData.status}
                      label="Status"
                      onChange={(e) => handleEditFormChange("status", e.target.value)}
                    >
                      <MenuItem value="Operational">Operational</MenuItem>
                      <MenuItem value="Maintenance">Maintenance</MenuItem>
                      <MenuItem value="Deployed">Deployed</MenuItem>
                      <MenuItem value="Critical">Critical</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={editFormData.location}
                    onChange={(e) => handleEditFormChange("location", e.target.value)}
                    error={!!editFormErrors.location}
                    helperText={editFormErrors.location}
                    required
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Maintenance Information */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Maintenance Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Maintenance"
                    type="date"
                    value={editFormData.lastMaintenance}
                    onChange={(e) => handleEditFormChange("lastMaintenance", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Next Maintenance"
                    type="date"
                    value={editFormData.nextMaintenance}
                    onChange={(e) => handleEditFormChange("nextMaintenance", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Performance Metrics */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Operational Hours"
                    type="number"
                    value={editFormData.operationalHours}
                    onChange={(e) => handleEditFormChange("operationalHours", parseInt(e.target.value) || 0)}
                    error={!!editFormErrors.operationalHours}
                    helperText={editFormErrors.operationalHours}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Readiness Score (%)"
                    type="number"
                    value={editFormData.readinessScore}
                    onChange={(e) => handleEditFormChange("readinessScore", parseInt(e.target.value) || 0)}
                    error={!!editFormErrors.readinessScore}
                    helperText={editFormErrors.readinessScore}
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Critical Issues"
                    type="number"
                    value={editFormData.criticalIssues}
                    onChange={(e) => handleEditFormChange("criticalIssues", parseInt(e.target.value) || 0)}
                    error={!!editFormErrors.criticalIssues}
                    helperText={editFormErrors.criticalIssues}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Maintenance Cost ($)"
                    type="number"
                    value={editFormData.maintenanceCost}
                    onChange={(e) => handleEditFormChange("maintenanceCost", parseInt(e.target.value) || 0)}
                    error={!!editFormErrors.maintenanceCost}
                    helperText={editFormErrors.maintenanceCost}
                    inputProps={{ min: 0 }}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Fuel Efficiency (%)"
                    type="number"
                    value={editFormData.fuelEfficiency}
                    onChange={(e) => handleEditFormChange("fuelEfficiency", parseInt(e.target.value) || 0)}
                    error={!!editFormErrors.fuelEfficiency}
                    helperText={editFormErrors.fuelEfficiency}
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Validation Errors */}
            {Object.keys(editFormErrors).length > 0 && (
              <Alert severity="error">
                Please fix the errors above before saving.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditAssetModal}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleEditFormSubmit}
            disabled={Object.keys(editFormErrors).length > 0}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Maintenance Schedule Modal */}
      <Dialog
        open={maintenanceScheduleModalOpen}
        onClose={closeMaintenanceScheduleModal}
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
                    value={scheduleFormData.assetId}
                    label="Asset"
                    onChange={(e) => handleScheduleFormChange("assetId", e.target.value)}
                    error={!!scheduleFormErrors.assetId}
                  >
                    {assets.map((asset) => (
                      <MenuItem key={asset.id} value={asset.id}>
                        {asset.name} ({asset.id})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Schedule Type</InputLabel>
                  <Select
                    value={scheduleFormData.scheduleType}
                    label="Schedule Type"
                    onChange={(e) => handleScheduleFormChange("scheduleType", e.target.value)}
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
                    value={scheduleFormData.frequency}
                    label="Frequency"
                    onChange={(e) => handleScheduleFormChange("frequency", e.target.value)}
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
                  value={scheduleFormData.nextDueDate}
                  onChange={(e) => handleScheduleFormChange("nextDueDate", e.target.value)}
                  error={!!scheduleFormErrors.nextDueDate}
                  helperText={scheduleFormErrors.nextDueDate}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Estimated Duration (hours)"
                  type="number"
                  value={scheduleFormData.estimatedDuration}
                  onChange={(e) => handleScheduleFormChange("estimatedDuration", parseInt(e.target.value) || 0)}
                  error={!!scheduleFormErrors.estimatedDuration}
                  helperText={scheduleFormErrors.estimatedDuration}
                  inputProps={{ min: 1 }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={scheduleFormData.priority}
                    label="Priority"
                    onChange={(e) => handleScheduleFormChange("priority", e.target.value)}
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
                  value={scheduleFormData.description}
                  onChange={(e) => handleScheduleFormChange("description", e.target.value)}
                  error={!!scheduleFormErrors.description}
                  helperText={scheduleFormErrors.description}
                  multiline
                  rows={3}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Assigned Technician"
                  value={scheduleFormData.assignedTechnician}
                  onChange={(e) => handleScheduleFormChange("assignedTechnician", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Estimated Cost ($)"
                  type="number"
                  value={scheduleFormData.estimatedCost}
                  onChange={(e) => handleScheduleFormChange("estimatedCost", parseInt(e.target.value) || 0)}
                  error={!!scheduleFormErrors.estimatedCost}
                  helperText={scheduleFormErrors.estimatedCost}
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
                  value={scheduleFormData.notes}
                  onChange={(e) => handleScheduleFormChange("notes", e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>

            {/* Validation Errors */}
            {Object.keys(scheduleFormErrors).length > 0 && (
              <Alert severity="error">
                Please fix the errors above before saving.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeMaintenanceScheduleModal}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleScheduleFormSubmit}
            disabled={Object.keys(scheduleFormErrors).length > 0}
          >
            Create Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
}
