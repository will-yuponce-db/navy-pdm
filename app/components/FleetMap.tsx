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

        // Custom icons
        const platformIcon = new L.Icon({
          iconUrl:
            "data:image/svg+xml;base64," +
            btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="12" fill="#FF8C00" stroke="#fff" stroke-width="2"/>
              <text x="16" y="20" font-size="14" text-anchor="middle" fill="#fff" font-weight="bold">S</text>
            </svg>
          `),
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16],
        });

        const stockIcon = new L.Icon({
          iconUrl:
            "data:image/svg+xml;base64," +
            btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="12" fill="#00CCFF" stroke="#fff" stroke-width="2"/>
              <text x="16" y="20" font-size="14" text-anchor="middle" fill="#fff" font-weight="bold">W</text>
            </svg>
          `),
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16],
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

            {/* Shipping Route Polylines */}
            {shippingRoutes.map((route) => (
              <module.Polyline
                key={route.id}
                positions={[
                  [route.source_lat, route.source_lng],
                  [route.target_lat, route.target_lng],
                ]}
                pathOptions={{
                  color: "#3CDC82",
                  weight: Math.max(2, Math.min(route.qty_shipped / 10, 8)),
                  opacity: 0.6,
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
            ))}
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
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Chip
              label={`${platforms.length} Platforms`}
              color="primary"
                            sx={{ fontWeight: 600 }}
            />
                          <Chip
              label={`${stockLocations.length} Stock Locations`}
              color="info"
              sx={{ fontWeight: 600 }}
                          />
                          <Chip
              label={`${shippingRoutes.length} Shipping Routes`}
              color="success"
              sx={{ fontWeight: 600 }}
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
