import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Collapse,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import {
  Search,
  Refresh,
  Download,
  LocalShipping,
  Inventory,
  Info,
  KeyboardArrowDown,
  KeyboardArrowUp,
} from "@mui/icons-material";
import { tableStyles } from "../utils/tableStyles";
import { databricksApi } from "../services/api";
import {
  mapDatabricksPartsRequisitionsToPartsRequisitions,
  getDatabricksPartsRequisitionStats,
  type DatabricksPartsRequisition,
  type PartsRequisition,
} from "../utils/databricksMapper";
import FleetMap from "../components/FleetMap";

// Interface for grouped orders
interface GroupedOrder {
  orderNumber: string;
  parts: PartsRequisition[];
  totalQuantity: number;
  uniquePartTypes: number;
  shipName: string;
  stockLocation: string;
}

export function meta() {
  return [
    { title: "Supply Orders" },
    {
      name: "description",
      content: "Navy PDM Supply Orders and Parts Requisition System",
    },
  ];
}

// Component for each expandable row
function OrderRow({ order }: { order: GroupedOrder }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow hover sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Chip
            label={order.orderNumber}
            size="small"
            color="primary"
            variant="outlined"
          />
        </TableCell>
        <TableCell>
          <Chip
            label={`${order.parts.length} parts`}
            size="small"
            color="info"
          />
        </TableCell>
        <TableCell align="right">
          <Chip
            label={order.totalQuantity}
            size="small"
            color={order.totalQuantity > 5 ? "warning" : "default"}
          />
        </TableCell>
        <TableCell>{order.shipName}</TableCell>
        <TableCell>
          <Chip
            label={order.stockLocation}
            size="small"
            color="success"
            variant="outlined"
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Typography variant="h6" gutterBottom component="div">
                Parts Detail
              </Typography>
              <Table size="small" aria-label="parts">
                <TableHead>
                  <TableRow>
                    <TableCell>Part Type</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell>Ship Designation</TableCell>
                    <TableCell>Stock Location</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.parts.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell component="th" scope="row">
                        {part.partType}
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={part.quantityShipped}
                          size="small"
                          color={
                            part.quantityShipped > 1 ? "warning" : "default"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={part.shipDesignation} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={part.stockLocation}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function PartsRequisitionRoute() {
  const [requisitions, setRequisitions] = useState<PartsRequisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [partTypeFilter, setPartTypeFilter] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [stats, setStats] = useState<ReturnType<
    typeof getDatabricksPartsRequisitionStats
  > | null>(null);

  // Fetch data with timeout and fallback to mock data
  const fetchRequisitions = async () => {
    setLoading(true);
    setError(null);

    // Create a timeout promise (5 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Request timeout")), 5000);
    });

    try {
      const response = (await Promise.race([
        databricksApi.getPartsRequisitions({
          limit: 1000, // Get all for client-side filtering
        }),
        timeoutPromise,
      ])) as Awaited<ReturnType<typeof databricksApi.getPartsRequisitions>>;

      if (response.success && Array.isArray(response.data)) {
        const databricksRequisitions =
          response.data as DatabricksPartsRequisition[];
        const mappedRequisitions =
          mapDatabricksPartsRequisitionsToPartsRequisitions(
            databricksRequisitions,
          );
        setRequisitions(mappedRequisitions);

        // Calculate stats
        const requisitionStats = getDatabricksPartsRequisitionStats(
          databricksRequisitions,
        );
        setStats(requisitionStats);

        console.log(
          `Successfully loaded ${mappedRequisitions.length} parts requisitions from Databricks`,
        );
      } else {
        const errorMsg = "Failed to fetch parts requisitions from Databricks";
        console.error(errorMsg, response);
        setError(errorMsg + " - Using empty dataset");
      }
    } catch (err) {
      console.error("Error fetching parts requisitions:", err);
      console.warn(
        "Backend API not available - displaying empty state. To use this feature, implement the backend API endpoints in server.js",
      );

      // Show informative error in development
      setError(
        "Backend API not implemented. Parts requisition data requires a backend server with Databricks connection. See console for details.",
      );

      // Set empty data
      setRequisitions([]);
      setStats({
        total: 0,
        uniqueOrders: 0,
        uniquePartTypes: 0,
        totalQuantity: 0,
        averageQuantity: 0,
        uniqueShips: 0,
        byPartType: {},
        byStockLocation: {},
        byShip: {},
        quantityByType: {},
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequisitions();
  }, []);

  // Filter requisitions
  const filteredRequisitions = requisitions.filter((req) => {
    const matchesSearch =
      searchTerm === "" ||
      req.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.shipName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.partType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.stockLocation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPartType =
      partTypeFilter === "" || req.partType === partTypeFilter;

    const matchesLocation =
      locationFilter === "" || req.stockLocation === locationFilter;

    return matchesSearch && matchesPartType && matchesLocation;
  });

  // Group requisitions by order number
  const groupedOrders: GroupedOrder[] = Object.values(
    filteredRequisitions.reduce((acc, req) => {
      if (!acc[req.orderNumber]) {
        acc[req.orderNumber] = {
          orderNumber: req.orderNumber,
          parts: [],
          totalQuantity: 0,
          uniquePartTypes: 0,
          shipName: req.shipName,
          stockLocation: req.stockLocation,
        };
      }
      acc[req.orderNumber].parts.push(req);
      acc[req.orderNumber].totalQuantity += req.quantityShipped;
      return acc;
    }, {} as Record<string, GroupedOrder>),
  ).map((order) => ({
    ...order,
    uniquePartTypes: new Set(order.parts.map((p) => p.partType)).size,
  }));

  // Pagination on grouped orders
  const paginatedOrders = groupedOrders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handlePartTypeChange = (event: SelectChangeEvent<string>) => {
    setPartTypeFilter(event.target.value);
    setPage(0);
  };

  const handleLocationChange = (event: SelectChangeEvent<string>) => {
    setLocationFilter(event.target.value);
    setPage(0);
  };

  // Get unique part types and locations for filters
  const uniquePartTypes = Array.from(
    new Set(requisitions.map((r) => r.partType)),
  ).sort();
  const uniqueLocations = Array.from(
    new Set(requisitions.map((r) => r.stockLocation)),
  ).sort();

  const handleExport = () => {
    // Create CSV content with grouped structure
    const headers = [
      "Order Number",
      "Total Parts",
      "Total Quantity",
      "Part Type",
      "Quantity",
      "Ship Name",
      "Ship Designation",
      "Stock Location",
    ];
    
    const rows: string[] = [];
    groupedOrders.forEach((order) => {
      order.parts.forEach((part, index) => {
        rows.push([
          index === 0 ? order.orderNumber : "",
          index === 0 ? order.parts.length.toString() : "",
          index === 0 ? order.totalQuantity.toString() : "",
          `"${part.partType}"`,
          part.quantityShipped.toString(),
          `"${part.shipName}"`,
          part.shipDesignation,
          `"${part.stockLocation}"`,
        ].join(","));
      });
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `supply-orders-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Supply Orders
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track parts requisitions, orders, and shipments across the fleet
        </Typography>
      </Box>

      {/* Stats Cards */}
      {stats && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 2,
            mb: 3,
          }}
        >
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Inventory color="primary" />
                <Box>
                  <Typography variant="h5">{stats.total}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Requisitions
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LocalShipping color="success" />
                <Box>
                  <Typography variant="h5">{stats.uniqueOrders}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Unique Orders
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Info color="info" />
                <Box>
                  <Typography variant="h5">{stats.uniquePartTypes}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Part Types
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Inventory color="warning" />
                <Box>
                  <Typography variant="h5">{stats.totalQuantity}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Parts Shipped
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Fleet Map */}
      <Box
        sx={{
          height: "600px",
          mb: 3,
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <FleetMap />
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "2fr 1fr 1fr auto",
            },
            gap: 2,
            alignItems: "center",
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Search by order, ship, part type, or location..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Part Type</InputLabel>
            <Select
              value={partTypeFilter}
              onChange={handlePartTypeChange}
              label="Part Type"
            >
              <MenuItem value="">All Types</MenuItem>
              {uniquePartTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Stock Location</InputLabel>
            <Select
              value={locationFilter}
              onChange={handleLocationChange}
              label="Stock Location"
            >
              <MenuItem value="">All Locations</MenuItem>
              {uniqueLocations.map((location) => (
                <MenuItem key={location} value={location}>
                  {location}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              justifyContent: { xs: "flex-start", md: "flex-end" },
            }}
          >
            <Tooltip title="Refresh">
              <IconButton onClick={fetchRequisitions} color="primary">
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export to CSV">
              <IconButton onClick={handleExport} color="primary">
                <Download />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <IconButton
              aria-label="retry"
              color="inherit"
              size="small"
              onClick={fetchRequisitions}
            >
              <Refresh />
            </IconButton>
          }
        >
          <Typography variant="subtitle2" gutterBottom>
            <strong>Error Loading Supply Orders</strong>
          </Typography>
          <Typography variant="body2">{error}</Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            This page requires a connection to Databricks. Please check your
            network connection and Databricks configuration.
          </Typography>
        </Alert>
      )}

      {/* Table */}
      <TableContainer component={Paper}>
        <Table sx={tableStyles}>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Order Number</TableCell>
              <TableCell>Parts Count</TableCell>
              <TableCell align="right">Total Quantity</TableCell>
              <TableCell>Ship Name</TableCell>
              <TableCell>Stock Location</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No supply orders found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => (
                <OrderRow key={order.orderNumber} order={order} />
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={groupedOrders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
}
