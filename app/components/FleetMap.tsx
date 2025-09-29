import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Badge,
  Paper,
  LinearProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
} from "@mui/material";
import {
  LocationOn,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  FlightTakeoff,
  LocalShipping,
  Refresh,
  FilterList,
} from "@mui/icons-material";

// Dynamic imports for Leaflet components to avoid SSR issues
let MapContainer: React.ComponentType<unknown>;
let TileLayer: React.ComponentType<unknown>;
let Marker: React.ComponentType<unknown>;
let Popup: React.ComponentType<unknown>;
let Polyline: React.ComponentType<unknown>;
let useMap: () => unknown;
let L: unknown;

// Load Leaflet components only on client side
const loadLeafletComponents = async () => {
  if (typeof window !== "undefined") {
    const leafletModule = await import("leaflet");
    const reactLeafletModule = await import("react-leaflet");

    L = leafletModule.default;
    MapContainer = reactLeafletModule.MapContainer;
    TileLayer = reactLeafletModule.TileLayer;
    Marker = reactLeafletModule.Marker;
    Popup = reactLeafletModule.Popup;
    Polyline = reactLeafletModule.Polyline;
    useMap = reactLeafletModule.useMap;

    // Import CSS
    await import("leaflet/dist/leaflet.css");
  }
};

interface Ship {
  id: string;
  name: string;
  designation: string;
  latitude: number;
  longitude: number;
  status: "operational" | "maintenance" | "casrep" | "deployed";
  healthScore: number;
  lastUpdate: Date;
  anomalies: number;
  predictedFailures: number;
  homeport: string;
  gteCount: number;
  maintenanceLevel: "S/F" | "I" | "D";
}

interface SupplyRoute {
  id: string;
  from: string;
  to: string;
  parts: string[];
  eta: number;
  status: "in-transit" | "delivered" | "pending";
  priority: "routine" | "priority" | "casrep";
  transportType: "air" | "ground" | "sea";
}

// Mock data for ships and supply routes
const mockShips: Ship[] = [
  {
    id: "1",
    name: "USS Enterprise",
    designation: "CVN-65",
    latitude: 36.7783,
    longitude: -119.4179,
    status: "operational",
    healthScore: 92,
    lastUpdate: new Date(Date.now() - 300000),
    anomalies: 2,
    predictedFailures: 1,
    homeport: "San Diego",
    gteCount: 8,
    maintenanceLevel: "S/F",
  },
  {
    id: "2",
    name: "USS Cole",
    designation: "DDG-67",
    latitude: 32.7157,
    longitude: -117.1611,
    status: "casrep",
    healthScore: 45,
    lastUpdate: new Date(Date.now() - 600000),
    anomalies: 7,
    predictedFailures: 3,
    homeport: "Norfolk",
    gteCount: 4,
    maintenanceLevel: "I",
  },
  {
    id: "3",
    name: "USS Bainbridge",
    designation: "DDG-96",
    latitude: 25.7617,
    longitude: -80.1918,
    status: "maintenance",
    healthScore: 78,
    lastUpdate: new Date(Date.now() - 180000),
    anomalies: 4,
    predictedFailures: 2,
    homeport: "Mayport",
    gteCount: 4,
    maintenanceLevel: "S/F",
  },
  {
    id: "4",
    name: "USS Arleigh Burke",
    designation: "DDG-51",
    latitude: 40.7128,
    longitude: -74.006,
    status: "deployed",
    healthScore: 88,
    lastUpdate: new Date(Date.now() - 120000),
    anomalies: 1,
    predictedFailures: 0,
    homeport: "Norfolk",
    gteCount: 4,
    maintenanceLevel: "S/F",
  },
  {
    id: "5",
    name: "USS Defiant",
    designation: "DDG-1000",
    latitude: 47.6062,
    longitude: -122.3321,
    status: "operational",
    healthScore: 95,
    lastUpdate: new Date(Date.now() - 90000),
    anomalies: 0,
    predictedFailures: 0,
    homeport: "Everett",
    gteCount: 2,
    maintenanceLevel: "S/F",
  },
];

const mockSupplyRoutes: SupplyRoute[] = [
  {
    id: "1",
    from: "RMC Norfolk",
    to: "USS Cole",
    parts: ["Turbine Blade Set", "Bearing Assembly"],
    eta: 2,
    status: "in-transit",
    priority: "casrep",
    transportType: "air",
  },
  {
    id: "2",
    from: "RMC San Diego",
    to: "USS Bainbridge",
    parts: ["Fuel Pump", "Control Valve"],
    eta: 5,
    status: "in-transit",
    priority: "priority",
    transportType: "ground",
  },
  {
    id: "3",
    from: "Supplier A",
    to: "RMC Norfolk",
    parts: ["Turbine Blade Set", "Seal Kit"],
    eta: 7,
    status: "pending",
    priority: "routine",
    transportType: "sea",
  },
];

const getStatusColor = (status: Ship["status"]) => {
  switch (status) {
    case "operational":
      return "success";
    case "maintenance":
      return "warning";
    case "casrep":
      return "error";
    case "deployed":
      return "info";
    default:
      return "default";
  }
};

const getStatusIcon = (status: Ship["status"]) => {
  switch (status) {
    case "operational":
      return <CheckCircle />;
    case "maintenance":
      return <Warning />;
    case "casrep":
      return <ErrorIcon />;
    case "deployed":
      return <FlightTakeoff />;
    default:
      return <LocationOn />;
  }
};

const getTransportIcon = (type: SupplyRoute["transportType"]) => {
  switch (type) {
    case "air":
      return <FlightTakeoff />;
    case "ground":
      return <LocalShipping />;
    case "sea":
      return <LocalShipping />;
    default:
      return <LocalShipping />;
  }
};

// Memoized icon cache to prevent recreating icons unnecessarily
const iconCache = new Map<string, unknown>();

// Create custom ship icons for different statuses (memoized)
const createShipIcon = (status: Ship["status"], healthScore: number) => {
  if (!L) return null;

  // Create cache key based on status and health score range
  const healthRange = healthScore > 80 ? 'high' : healthScore > 60 ? 'medium' : 'low';
  const cacheKey = `${status}-${healthRange}`;
  
  // Return cached icon if available
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey);
  }

  const getIconColor = (status: Ship["status"]) => {
    switch (status) {
      case "operational":
        return "#4caf50";
      case "maintenance":
        return "#ff9800";
      case "casrep":
        return "#f44336";
      case "deployed":
        return "#2196f3";
      default:
        return "#757575";
    }
  };

  const iconColor = getIconColor(status);
  const size = healthScore > 80 ? 25 : healthScore > 60 ? 20 : 15;

  const icon = L.divIcon({
    className: "custom-ship-icon",
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${iconColor};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
      ">
        <div style="
          width: ${size * 0.6}px;
          height: ${size * 0.6}px;
          background-color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${size * 0.4}px;
          color: ${iconColor};
        ">⚓</div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });

  // Cache the icon
  iconCache.set(cacheKey, icon);
  return icon;
};

// Component to handle map events
const MapEventHandler = ({
  selectedShip,
}: {
  selectedShip: Ship | null;
}) => {
  if (!useMap) return null;

  const map = useMap();

  useEffect(() => {
    if (selectedShip) {
      map.setView([selectedShip.latitude, selectedShip.longitude], 8);
    }
  }, [selectedShip, map]);

  return null;
};
ClientOnlyMap.displayName = 'ClientOnlyMap';

// Client-only map component (memoized to prevent unnecessary re-renders)
const ClientOnlyMap = memo(({
  mapCenter,
  mapZoom,
  filteredShips,
  showSupplyRoutes,
  supplyRoutes,
  supplyRouteCoordinates,
  selectedShip,
  handleShipSelect,
}: {
  mapCenter: [number, number];
  mapZoom: number;
  filteredShips: Ship[];
  showSupplyRoutes: boolean;
  supplyRoutes: SupplyRoute[];
  supplyRouteCoordinates: Record<string, [number, number][]>;
  selectedShip: Ship | null;
  handleShipSelect: (ship: Ship) => void;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadLeafletComponents().then(() => {
      setIsLoaded(true);
    });
  }, []);

  if (!isLoaded || typeof window === "undefined") {
    return (
      <Box
        sx={{
          height: 400,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
          borderRadius: 2,
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Typography variant="h6" sx={{ color: "text.secondary" }}>
          Loading map...
        </Typography>
      </Box>
    );
  }

  return (
    <MapContainer
      center={mapCenter}
      zoom={mapZoom}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Ship Markers */}
      {filteredShips.map((ship) => {
        const icon = createShipIcon(ship.status, ship.healthScore);
        if (!icon) return null;

        return (
          <Marker
            key={ship.id}
            position={[ship.latitude, ship.longitude]}
            icon={icon}
            eventHandlers={{
              click: () => handleShipSelect(ship),
            }}
          >
            <Popup>
              <Box sx={{ minWidth: 200 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  {ship.name}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  {ship.designation} • {ship.homeport}
                </Typography>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  {getStatusIcon(ship.status)}
                  <Chip
                    label={ship.status}
                    size="small"
                    color={getStatusColor(ship.status)}
                    variant="outlined"
                  />
                </Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Health Score: <strong>{ship.healthScore}%</strong>
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Anomalies: <strong>{ship.anomalies}</strong>
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Predicted Failures: <strong>{ship.predictedFailures}</strong>
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  GTE Count: <strong>{ship.gteCount}</strong>
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Maintenance Level: <strong>{ship.maintenanceLevel}</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Last Update: {ship.lastUpdate.toLocaleTimeString()}
                </Typography>
              </Box>
            </Popup>
          </Marker>
        );
      })}

      {/* Supply Routes */}
      {showSupplyRoutes &&
        supplyRoutes.map((route) => {
          const coordinates = supplyRouteCoordinates[route.id];
          if (!coordinates) return null;

          const getRouteColor = (priority: SupplyRoute["priority"]) => {
            switch (priority) {
              case "casrep":
                return "#f44336";
              case "priority":
                return "#ff9800";
              case "routine":
                return "#4caf50";
              default:
                return "#757575";
            }
          };

          return (
            <Polyline
              key={route.id}
              positions={coordinates}
              color={getRouteColor(route.priority)}
              weight={3}
              opacity={0.7}
              dashArray={route.status === "in-transit" ? "10, 10" : undefined}
            />
          );
        })}

      <MapEventHandler
        selectedShip={selectedShip}
        onShipSelect={handleShipSelect}
      />
    </MapContainer>
  );
});

export default function FleetMap() {
  const [ships, setShips] = useState<Ship[]>(mockShips);
  const [supplyRoutes] =
    useState<SupplyRoute[]>(mockSupplyRoutes);
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showSupplyRoutes, setShowSupplyRoutes] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    36.7783, -119.4179,
  ]);
  const [mapZoom, setMapZoom] = useState(4);

  // Optimized real-time updates with reduced frequency and batched changes
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setShips((prevShips) => {
        // Batch all updates in a single state change
        const updatedShips = prevShips.map((ship) => {
          const randomChange = (Math.random() - 0.5) * 1.5; // Reduced change magnitude
          const newHealthScore = Math.max(
            0,
            Math.min(100, ship.healthScore + randomChange),
          );
          
          // Only update anomalies occasionally to reduce unnecessary re-renders
          const shouldUpdateAnomalies = Math.random() > 0.98; // Reduced from 0.95
          
          return {
            ...ship,
            healthScore: newHealthScore,
            lastUpdate: new Date(),
            anomalies: shouldUpdateAnomalies 
              ? Math.max(0, ship.anomalies + (Math.random() > 0.5 ? 1 : -1))
              : ship.anomalies,
          };
        });
        
        return updatedShips;
      });
    }, 10000); // Increased interval from 5s to 10s

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filteredShips = useMemo(() => 
    ships.filter(
      (ship) => filterStatus === "all" || ship.status === filterStatus,
    ), [ships, filterStatus]
  );

  // Virtual rendering: only show markers when zoomed in enough
  const shouldShowMarkers = mapZoom >= 3;
  const visibleShips = useMemo(() => 
    shouldShowMarkers ? filteredShips : [], [shouldShowMarkers, filteredShips]
  );

  // Add coordinates for supply routes (simplified for demo)
  const supplyRouteCoordinates = useMemo(() => {
    const routeCoords: { [key: string]: [number, number][] } = {
      "1": [
        [36.7783, -119.4179],
        [32.7157, -117.1611],
      ], // Norfolk to USS Cole
      "2": [
        [32.7157, -117.1611],
        [25.7617, -80.1918],
      ], // San Diego to USS Bainbridge
      "3": [
        [40.7128, -74.006],
        [36.7783, -119.4179],
      ], // Supplier to Norfolk
    };
    return routeCoords;
  }, []);

  // Debounced ship selection to prevent rapid state changes
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const handleShipSelect = useCallback((ship: Ship) => {
    // Clear existing timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    // Set new timeout for debounced execution
    const timeout = setTimeout(() => {
      setSelectedShip(ship);
      setMapCenter([ship.latitude, ship.longitude]);
      setMapZoom(8);
    }, 150); // 150ms debounce
    
    setDebounceTimeout(timeout);
  }, [debounceTimeout]);


  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  const fleetStats = useMemo(() => ({
    total: ships.length,
    operational: ships.filter((s) => s.status === "operational").length,
    maintenance: ships.filter((s) => s.status === "maintenance").length,
    casrep: ships.filter((s) => s.status === "casrep").length,
    deployed: ships.filter((s) => s.status === "deployed").length,
    avgHealthScore: Math.round(
      ships.reduce((sum, ship) => sum + ship.healthScore, 0) / ships.length,
    ),
    totalAnomalies: ships.reduce((sum, ship) => sum + ship.anomalies, 0),
    totalPredictedFailures: ships.reduce(
      (sum, ship) => sum + ship.predictedFailures,
      0,
    ),
  }), [ships]);

  return (
    <Box sx={{ width: "100%", height: "100vh", p: 2 }}>
      <style>
        {`
          .custom-ship-icon {
            background: transparent !important;
            border: none !important;
          }
          .leaflet-popup-content-wrapper {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          }
          .leaflet-popup-tip {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
          }
        `}
      </style>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
        }}
      >
        {/* Left Panel - Fleet Overview */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            height: "100%",
          }}
        >
          {/* Fleet Stats */}
          <Card
            sx={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 3,
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            }}
          >
            <CardContent>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Fleet Overview
              </Typography>

              <Box sx={{ display: "flex", gap: 2 }}>
                <Box sx={{ flex: 1, textAlign: "center" }}>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 800, color: "primary.main" }}
                  >
                    {fleetStats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Ships
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, textAlign: "center" }}>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 800, color: "success.main" }}
                  >
                    {fleetStats.avgHealthScore}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Health
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={fleetStats.avgHealthScore}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    background: "rgba(255,255,255,0.1)",
                    "& .MuiLinearProgress-bar": {
                      background:
                        "linear-gradient(90deg, #4caf50 0%, #388e3c 100%)",
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>

              <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  label={`${fleetStats.operational} Operational`}
                  color="success"
                  size="small"
                />
                <Chip
                  label={`${fleetStats.maintenance} Maintenance`}
                  color="warning"
                  size="small"
                />
                <Chip
                  label={`${fleetStats.casrep} CASREP`}
                  color="error"
                  size="small"
                />
                <Chip
                  label={`${fleetStats.deployed} Deployed`}
                  color="info"
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>

          {/* Critical Alerts */}
          <Card
            sx={{
              background:
                "linear-gradient(135deg, rgba(183, 28, 28, 0.1) 0%, rgba(183, 28, 28, 0.05) 100%)",
              backdropFilter: "blur(20px)",
              border: "2px solid rgba(183, 28, 28, 0.4)",
              borderRadius: 3,
              boxShadow: "0 8px 32px rgba(183, 28, 28, 0.2)",
              backgroundColor: "error.light",
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "text.primary",
                  mb: 2,
                  padding: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Warning />
                Critical Alerts
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Alert severity="error" sx={{ mb: 1 }}>
                <Typography variant="body2">
                  <strong>{fleetStats.totalAnomalies} Active Anomalies</strong>{" "}
                  detected across fleet
                </Typography>
              </Alert>
              <Alert severity="warning" sx={{ mb: 1 }}>
                <Typography variant="body2">
                  <strong>
                    {fleetStats.totalPredictedFailures} Predicted Failures
                  </strong>{" "}
                  in next 30 days
                </Typography>
              </Alert>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>3 Supply Routes</strong> in progress
                </Typography>
              </Alert>
            </CardContent>
          </Card>

          {/* Ship List */}
          <Card
            sx={{
              flex: 1,
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 3,
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            }}
          >
            <CardContent
              sx={{ height: "100%", display: "flex", flexDirection: "column" }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Fleet Status
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Tooltip title="Auto Refresh">
                    <IconButton
                      size="small"
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      color={autoRefresh ? "primary" : "default"}
                    >
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Filter">
                    <IconButton size="small">
                      <FilterList />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Box sx={{ flex: 1, overflow: "auto" }}>
                {filteredShips.map((ship) => (
                  <Paper
                    key={ship.id}
                    sx={{
                      p: 2,
                      mb: 1,
                      cursor: "pointer",
                      background:
                        selectedShip?.id === ship.id
                          ? "rgba(102, 126, 234, 0.1)"
                          : "rgba(255,255,255,0.05)",
                      border:
                        selectedShip?.id === ship.id
                          ? "2px solid rgba(102, 126, 234, 0.3)"
                          : "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 2,
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        background: "rgba(102, 126, 234, 0.1)",
                        border: "1px solid rgba(102, 126, 234, 0.3)",
                        transform: "translateY(-2px)",
                      },
                    }}
                    onClick={() => handleShipSelect(ship)}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Badge
                          badgeContent={ship.anomalies}
                          color="error"
                          invisible={ship.anomalies === 0}
                        >
                          {getStatusIcon(ship.status)}
                        </Badge>
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600 }}
                          >
                            {ship.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {ship.designation} • {ship.homeport}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: "right" }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {ship.healthScore}%
                        </Typography>
                        <Chip
                          label={ship.status}
                          size="small"
                          color={getStatusColor(ship.status)}
                          variant="outlined"
                        />
                      </Box>
                    </Box>

                    <Box sx={{ mt: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={ship.healthScore}
                        color={
                          ship.healthScore > 80
                            ? "success"
                            : ship.healthScore > 60
                              ? "warning"
                              : "error"
                        }
                        sx={{ height: 4, borderRadius: 2 }}
                      />
                    </Box>
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Right Panel - Map and Supply Routes */}
        <Box sx={{ flex: 1 }}>
          <Card
            sx={{
              height: "100%",
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 3,
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            }}
          >
            <CardContent
              sx={{ height: "100%", display: "flex", flexDirection: "column" }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Fleet Map & Supply Routes
              </Typography>

              {/* Interactive Map */}
              <Box
                sx={{
                  flex: 1,
                  borderRadius: 2,
                  overflow: "hidden",
                  position: "relative",
                  border: "2px solid rgba(255,255,255,0.1)",
                }}
              >
        <ClientOnlyMap
          mapCenter={mapCenter}
          mapZoom={mapZoom}
          filteredShips={visibleShips}
          showSupplyRoutes={showSupplyRoutes}
          supplyRoutes={supplyRoutes}
          supplyRouteCoordinates={supplyRouteCoordinates}
          selectedShip={selectedShip}
          handleShipSelect={handleShipSelect}
        />

                {/* Map Controls */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  <Paper
                    sx={{
                      p: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    <Tooltip title="Show Supply Routes">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={showSupplyRoutes}
                            onChange={(e) =>
                              setShowSupplyRoutes(e.target.checked)
                            }
                            size="small"
                          />
                        }
                        label="Routes"
                        sx={{ m: 0 }}
                      />
                    </Tooltip>
                    <Tooltip title="Filter Ships">
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          label="Status"
                          size="small"
                        >
                          <MenuItem value="all">All Ships</MenuItem>
                          <MenuItem value="operational">Operational</MenuItem>
                          <MenuItem value="maintenance">Maintenance</MenuItem>
                          <MenuItem value="casrep">CASREP</MenuItem>
                          <MenuItem value="deployed">Deployed</MenuItem>
                        </Select>
                      </FormControl>
                    </Tooltip>
                  </Paper>
                </Box>

                {/* Map Legend */}
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 10,
                    left: 10,
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(10px)",
                    borderRadius: 2,
                    p: 2,
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, mb: 1 }}
                  >
                    Legend
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: "#4caf50",
                          border: "1px solid white",
                        }}
                      />
                      <Typography variant="caption">Operational</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: "#ff9800",
                          border: "1px solid white",
                        }}
                      />
                      <Typography variant="caption">Maintenance</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: "#f44336",
                          border: "1px solid white",
                        }}
                      />
                      <Typography variant="caption">CASREP</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: "#2196f3",
                          border: "1px solid white",
                        }}
                      />
                      <Typography variant="caption">Deployed</Typography>
                    </Box>
                    <Box
                      sx={{
                        mt: 1,
                        pt: 1,
                        borderTop: "1px solid rgba(0,0,0,0.1)",
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Supply Routes:
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mt: 0.5,
                        }}
                      >
                        <Box
                          sx={{
                            width: 20,
                            height: 2,
                            backgroundColor: "#f44336",
                          }}
                        />
                        <Typography variant="caption">CASREP</Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mt: 0.5,
                        }}
                      >
                        <Box
                          sx={{
                            width: 20,
                            height: 2,
                            backgroundColor: "#ff9800",
                          }}
                        />
                        <Typography variant="caption">Priority</Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mt: 0.5,
                        }}
                      >
                        <Box
                          sx={{
                            width: 20,
                            height: 2,
                            backgroundColor: "#4caf50",
                          }}
                        />
                        <Typography variant="caption">Routine</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Supply Routes Summary */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Supply Routes Summary
                </Typography>
                <Grid container spacing={2}>
                  {supplyRoutes.map((route) => (
                    <Grid item xs={12} sm={6} md={4} key={route.id}>
                      <Paper
                        sx={{
                          p: 2,
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 2,
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            background: "rgba(255,255,255,0.1)",
                            transform: "translateY(-2px)",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          {getTransportIcon(route.transportType)}
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600 }}
                          >
                            {route.from} → {route.to}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          ETA: {route.eta} days
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          Parts: {route.parts.join(", ")}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          <Chip
                            label={route.priority}
                            size="small"
                            color={
                              route.priority === "casrep"
                                ? "error"
                                : route.priority === "priority"
                                  ? "warning"
                                  : "default"
                            }
                            variant="outlined"
                          />
                          <Chip
                            label={route.status}
                            size="small"
                            color={
                              route.status === "in-transit"
                                ? "info"
                                : route.status === "delivered"
                                  ? "success"
                                  : "default"
                            }
                            variant="outlined"
                          />
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
