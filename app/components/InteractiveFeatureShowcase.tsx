import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Fade,
  Zoom,
  LinearProgress,
  Alert,
  Grid,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  Build as BuildIcon,
  Timeline as TimelineIcon,
} from "@mui/icons-material";

interface InteractiveFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
  progress: number;
  color: string;
}

const interactiveFeatures: InteractiveFeature[] = [
  {
    icon: <AnalyticsIcon />,
    title: "Real-time Analytics",
    description: "Live data processing and visualization",
    progress: 95,
    color: "#FF3621",
  },
  {
    icon: <TrendingUpIcon />,
    title: "Predictive Modeling",
    description: "AI-powered maintenance predictions",
    progress: 88,
    color: "#4CAF50",
  },
  {
    icon: <SpeedIcon />,
    title: "Performance Optimization",
    description: "Automated efficiency improvements",
    progress: 92,
    color: "#FF9800",
  },
  {
    icon: <SecurityIcon />,
    title: "Security & Compliance",
    description: "Enterprise-grade security measures",
    progress: 98,
    color: "#9C27B0",
  },
  {
    icon: <BuildIcon />,
    title: "Maintenance Automation",
    description: "Streamlined work order management",
    progress: 85,
    color: "#F44336",
  },
  {
    icon: <TimelineIcon />,
    title: "Timeline Tracking",
    description: "Complete maintenance lifecycle visibility",
    progress: 90,
    color: "#607D8B",
  },
];

export default function InteractiveFeatureShowcase() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setActiveFeature((prev) => (prev + 1) % interactiveFeatures.length);
        setIsAnimating(false);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ textAlign: "center", mb: 3 }}>
        Interactive System Features
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Live Demo:</strong> Watch the interactive features cycle
          through automatically, or click on any feature to explore it in
          detail.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {interactiveFeatures.map((feature, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Fade in={true} timeout={500 + index * 100}>
              <Card
                sx={{
                  cursor: "pointer",
                  transition: "all 0.3s ease-in-out",
                  transform:
                    activeFeature === index ? "scale(1.05)" : "scale(1)",
                  boxShadow: activeFeature === index ? 8 : 2,
                  border:
                    activeFeature === index
                      ? `2px solid ${feature.color}`
                      : "2px solid transparent",
                  "&:hover": {
                    boxShadow: 12,
                    transform: "scale(1.02)",
                  },
                }}
                onClick={() => setActiveFeature(index)}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Box
                      sx={{
                        backgroundColor: feature.color,
                        borderRadius: "50%",
                        p: 1,
                        mr: 2,
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                      {feature.title}
                    </Typography>
                    {activeFeature === index && (
                      <Zoom in={true}>
                        <Chip
                          label="Active"
                          size="small"
                          sx={{
                            backgroundColor: feature.color,
                            color: "white",
                            fontWeight: "bold",
                          }}
                        />
                      </Zoom>
                    )}
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {feature.description}
                  </Typography>

                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Performance: {feature.progress}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={feature.progress}
                      sx={{
                        mt: 0.5,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: "rgba(0, 0, 0, 0.1)",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: feature.color,
                          borderRadius: 3,
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        ))}
      </Grid>

      {/* Active Feature Details */}
      <Fade in={!isAnimating} timeout={300}>
        <Card sx={{ mt: 3, backgroundColor: "primary.main", color: "white" }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Box
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  borderRadius: "50%",
                  p: 1,
                  mr: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {interactiveFeatures[activeFeature]?.icon}
              </Box>
              <Typography variant="h5">
                {interactiveFeatures[activeFeature]?.title}
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {interactiveFeatures[activeFeature]?.description}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              This feature is currently running at{" "}
              {interactiveFeatures[activeFeature]?.progress}% efficiency,
              providing optimal performance for Navy maintenance operations.
            </Typography>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
}
