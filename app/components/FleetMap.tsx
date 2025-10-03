import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";

// API base URL
const API_BASE_URL = "http://localhost:8000/api";

interface Platform {
  designation: string;
  name: string;
  id: string;
  status: string;
  homeport: string;
  lat: number;
  long: number;
  open_work_orders: number;
}

interface StockLocation {
  stock_location_id: string;
  stock_location: string;
  lat: number;
  long: number;
  parts_count: number;
  total_stock: number;
}

interface ShippingRoute {
  id: string;
  order_number: string;
  type: string;
  qty_shipped: number;
  stock_location_id: string;
  stock_name: string;
  designator: string;
  source_lat: number;
  source_lng: number;
  target_lat: number;
  target_lng: number;
  created_at: string;
}

// Client-side only Map component
function ClientOnlyMap({
  platforms,
  stockLocations,
  shippingRoutes,
}: {
  platforms: Platform[];
  stockLocations: StockLocation[];
  shippingRoutes: ShippingRoute[];
}) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    // Dynamically import all Leaflet components
    import("react-leaflet").then((module) => {
      import("leaflet").then((L) => {
        import("leaflet/dist/leaflet.css");

        // Fix Leaflet default marker icons
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        });

        // Custom icons with better visuals
        const platformIcon = new L.Icon({
          iconUrl:
            "data:image/svg+xml;base64," +
            btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
              <defs>
                <linearGradient id="shipGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#1976d2;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#0d47a1;stop-opacity:1" />
                </linearGradient>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
                </filter>
              </defs>
              <g filter="url(#shadow)">
                <!-- Ship hull -->
                <path d="M 20 8 L 28 18 L 28 24 L 26 26 L 14 26 L 12 24 L 12 18 Z" fill="url(#shipGrad)" stroke="#fff" stroke-width="1.5"/>
                <!-- Deck -->
                <rect x="16" y="12" width="8" height="6" fill="#1565c0" stroke="#fff" stroke-width="1"/>
                <!-- Superstructure -->
                <rect x="18" y="8" width="4" height="4" fill="#0d47a1" stroke="#fff" stroke-width="1"/>
                <!-- Radar/antenna -->
                <line x1="20" y1="8" x2="20" y2="5" stroke="#fff" stroke-width="1.5"/>
                <circle cx="20" cy="5" r="1.5" fill="#f44336"/>
              </g>
            </svg>
          `),
          iconSize: [40, 40],
          iconAnchor: [20, 26],
          popupAnchor: [0, -26],
        });

        const stockIcon = new L.Icon({
          iconUrl:
            "data:image/svg+xml;base64," +
            btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
              <defs>
                <linearGradient id="warehouseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#00acc1;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#00838f;stop-opacity:1" />
                </linearGradient>
                <filter id="wshadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
                </filter>
              </defs>
              <g filter="url(#wshadow)">
                <!-- Building base -->
                <rect x="8" y="16" width="20" height="12" fill="url(#warehouseGrad)" stroke="#fff" stroke-width="1.5"/>
                <!-- Roof -->
                <path d="M 6 16 L 18 8 L 30 16 Z" fill="#00838f" stroke="#fff" stroke-width="1.5"/>
                <!-- Door -->
                <rect x="14" y="20" width="8" height="8" fill="#004d40" stroke="#fff" stroke-width="1"/>
                <!-- Windows -->
                <rect x="10" y="18" width="3" height="3" fill="#80deea" stroke="#fff" stroke-width="0.5"/>
                <rect x="23" y="18" width="3" height="3" fill="#80deea" stroke="#fff" stroke-width="0.5"/>
              </g>
            </svg>
          `),
          iconSize: [36, 36],
          iconAnchor: [18, 28],
          popupAnchor: [0, -28],
        });

        // Component to fit bounds
        function FitBounds({ bounds }: { bounds: L.LatLngBounds | null }) {
          const map = module.useMap();
  useEffect(() => {
            if (bounds) {
              map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
    }
          }, [bounds, map]);
  return null;
        }

        // Calculate bounds
        const allPoints: [number, number][] = [
          ...platforms.map((p) => [p.lat, p.long] as [number, number]),
          ...stockLocations.map((s) => [s.lat, s.long] as [number, number]),
        ];
        const bounds = allPoints.length > 0 ? L.latLngBounds(allPoints) : null;

        // Create the map component
        const Map = () => (
          <module.MapContainer
            center={[34.5, -112.0]}
            zoom={4}
        style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
      >
            <module.TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

            <FitBounds bounds={bounds} />

            {/* Platform Markers */}
            {platforms.map((platform) => (
              <module.Marker
                key={platform.id}
                position={[platform.lat, platform.long]}
                icon={platformIcon}
              >
                <module.Popup>
                <Box sx={{ minWidth: 200 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      {platform.designation}
                  </Typography>
                    <Typography variant="body2">
                      <strong>Name:</strong> {platform.name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong> {platform.status}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Homeport:</strong> {platform.homeport}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Open Work Orders:</strong>{" "}
                      {platform.open_work_orders}
                    </Typography>
                  </Box>
                </module.Popup>
              </module.Marker>
            ))}

            {/* Stock Location Markers */}
            {stockLocations.map((location) => (
              <module.Marker
                key={location.stock_location_id}
                position={[location.lat, location.long]}
                icon={stockIcon}
              >
                <module.Popup>
                  <Box sx={{ minWidth: 200 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      {location.stock_location}
                  </Typography>
                    <Typography variant="body2">
                      <strong>ID:</strong> {location.stock_location_id}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Parts Count:</strong> {location.parts_count}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Total Stock:</strong> {location.total_stock}
                    </Typography>
                  </Box>
                </module.Popup>
              </module.Marker>
            ))}

            {/* Shipping Route Arcs */}
            {shippingRoutes.map((route) => {
              // Calculate curved path (quadratic bezier curve)
              const start: [number, number] = [route.source_lat, route.source_lng];
              const end: [number, number] = [route.target_lat, route.target_lng];
              
              // Calculate control point for curve (offset perpendicular to the line)
              const midLat = (start[0] + end[0]) / 2;
              const midLng = (start[1] + end[1]) / 2;
              
              // Calculate perpendicular offset (creates the arc)
              const dx = end[1] - start[1];
              const dy = end[0] - start[0];
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              // Offset proportional to distance (creates nice arcs)
              const offsetFactor = distance * 0.2;
              const perpLat = -dx / distance * offsetFactor;
              const perpLng = dy / distance * offsetFactor;
              
              const controlPoint: [number, number] = [
                midLat + perpLat,
                midLng + perpLng
              ];
              
              // Create curved path with multiple points
              const curvePoints: [number, number][] = [];
              const steps = 30;
              for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const invT = 1 - t;
                const lat = invT * invT * start[0] + 2 * invT * t * controlPoint[0] + t * t * end[0];
                const lng = invT * invT * start[1] + 2 * invT * t * controlPoint[1] + t * t * end[1];
                curvePoints.push([lat, lng]);
              }
              
              return (
                <React.Fragment key={route.id}>
                  <module.Polyline
                    positions={curvePoints}
                    pathOptions={{
                      color: "#10b981",
                      weight: Math.max(3, Math.min(route.qty_shipped / 10, 10)),
                      opacity: 0.7,
                      dashArray: "10, 5",
                      lineCap: "round",
                      lineJoin: "round",
                    }}
                  >
                  <module.Popup>
                    <Box sx={{ minWidth: 200 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        Shipment: {route.order_number}
                      </Typography>
                      <Typography variant="body2">
                        <strong>From:</strong> {route.stock_name}
                      </Typography>
                      <Typography variant="body2">
                        <strong>To:</strong> {route.designator}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Type:</strong> {route.type}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Quantity:</strong> {route.qty_shipped}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontSize: "0.75rem", mt: 1 }}
                      >
                        {new Date(route.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  </module.Popup>
                  </module.Polyline>
                  
                  {/* Arrow markers along the route to show direction */}
                  {[0.33, 0.66].map((position, idx) => {
                    const pointIndex = Math.floor(position * curvePoints.length);
                    const point = curvePoints[pointIndex];
                    const nextPoint = curvePoints[Math.min(pointIndex + 1, curvePoints.length - 1)];
                    
                    // Calculate arrow angle
                    const angle = Math.atan2(
                      nextPoint[0] - point[0],
                      nextPoint[1] - point[1]
                    ) * (180 / Math.PI);
                    
                    const arrowIcon = new L.DivIcon({
                      html: `
                        <div style="
                          transform: rotate(${angle}deg);
                          width: 0;
                          height: 0;
                          border-left: 8px solid transparent;
                          border-right: 8px solid transparent;
                          border-bottom: 16px solid #10b981;
                          opacity: 0.8;
                          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
                        "></div>
                      `,
                      className: 'arrow-icon',
                      iconSize: [16, 16],
                      iconAnchor: [8, 8],
                    });
                    
                    return (
                      <module.Marker
                        key={`${route.id}-arrow-${idx}`}
                        position={point}
                        icon={arrowIcon}
                      />
                    );
                  })}
                </React.Fragment>
              );
            })}
          </module.MapContainer>
        );

        setMapComponent(() => Map);
      });
    });
  }, [platforms, stockLocations, shippingRoutes]);

  if (!MapComponent) {
            return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <MapComponent />;
}

export default function FleetMap() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [stockLocations, setStockLocations] = useState<StockLocation[]>([]);
  const [shippingRoutes, setShippingRoutes] = useState<ShippingRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const fetchMapData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all map data in parallel
        const [platformsRes, stockRes, routesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/map/platforms`),
          fetch(`${API_BASE_URL}/map/stock-locations`),
          fetch(`${API_BASE_URL}/map/shipping-routes`),
        ]);

        if (!platformsRes.ok || !stockRes.ok || !routesRes.ok) {
          throw new Error("Failed to fetch map data");
        }

        const [platformsData, stockData, routesData] = await Promise.all([
          platformsRes.json(),
          stockRes.json(),
          routesRes.json(),
        ]);

        if (
          !platformsData.success ||
          !stockData.success ||
          !routesData.success
        ) {
          throw new Error(
            platformsData.error || stockData.error || routesData.error
          );
        }

        setPlatforms(platformsData.data);
        setStockLocations(stockData.data);
        setShippingRoutes(routesData.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching map data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load map data"
        );
        setLoading(false);
      }
    };

    fetchMapData();
  }, [isClient]);

  // Don't render on server-side
  if (!isClient) {
  return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
                </Box>
    );
  }

  if (loading) {
    return (
              <Box
                sx={{
                  display: "flex",
          justifyContent: "center",
                  alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
                </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="h6">Error Loading Map</Typography>
          <Typography>{error}</Typography>
        </Alert>
              </Box>
    );
  }

  return (
                    <Box
                      sx={{
        width: "100%",
        height: "100vh",
                        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header Stats */}
          <Card
            sx={{
          m: 2,
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
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
            Fleet Logistics Map
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
                Real-time supply chain visualization showing ships, warehouses, and active shipping routes
              </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
            <Chip
              icon={<Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#1976d2', ml: 1 }} />}
              label={`${platforms.length} Naval Platforms`}
              sx={{ fontWeight: 600, bgcolor: 'rgba(25, 118, 210, 0.1)' }}
            />
                          <Chip
              icon={<Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#00acc1', ml: 1 }} />}
              label={`${stockLocations.length} Warehouses`}
              sx={{ fontWeight: 600, bgcolor: 'rgba(0, 172, 193, 0.1)' }}
                          />
                          <Chip
              icon={<Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#10b981', ml: 1 }} />}
              label={`${shippingRoutes.length} Active Supply Routes`}
              sx={{ fontWeight: 600, bgcolor: 'rgba(16, 185, 129, 0.1)' }}
            />
              </Box>
            </CardContent>
          </Card>

      {/* Leaflet Map */}
      <Box sx={{ flex: 1, position: "relative", minHeight: 0 }}>
        <ClientOnlyMap
          platforms={platforms}
          stockLocations={stockLocations}
          shippingRoutes={shippingRoutes}
        />
      </Box>
    </Box>
  );
}
