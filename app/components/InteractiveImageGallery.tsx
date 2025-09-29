import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Chip,
  Fade,
  Zoom,
  Grid,
  Stack,
} from "@mui/material";
import InteractiveFeatureShowcase from "./InteractiveFeatureShowcase";
import {
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";

interface ImageData {
  src: string;
  alt: string;
  title: string;
  description: string;
  category: string;
  features: string[];
}

const imageData: ImageData[] = [
  {
    src: "/assets/demo.png",
    alt: "Demo flow",
    title: "System Demo Flow",
    description:
      "Interactive demonstration of the Navy PdM system workflow, showcasing the complete process from data collection to actionable insights.",
    category: "Workflow",
    features: [
      "Real-time Data Processing",
      "Automated Workflows",
      "User Interface Design",
    ],
  },
  {
    src: "/assets/end_2_end.png",
    alt: "End to end workflow",
    title: "End-to-End Workflow",
    description:
      "Comprehensive view of the complete maintenance lifecycle, from initial work order creation to final completion and reporting.",
    category: "Process",
    features: [
      "Work Order Management",
      "Status Tracking",
      "Completion Reporting",
    ],
  },
  {
    src: "/assets/edge_analytics.png",
    alt: "Edge analytics",
    title: "Edge Analytics Dashboard",
    description:
      "Advanced analytics capabilities deployed at the edge, providing real-time insights and predictive maintenance capabilities.",
    category: "Analytics",
    features: [
      "Real-time Processing",
      "Predictive Analytics",
      "Edge Computing",
    ],
  },
  {
    src: "/assets/maintianance_analytics.png",
    alt: "Maintenance analytics",
    title: "Maintenance Analytics Suite",
    description:
      "Comprehensive analytics platform for maintenance operations, featuring predictive modeling and performance optimization.",
    category: "Analytics",
    features: [
      "Predictive Maintenance",
      "Performance Metrics",
      "Cost Optimization",
    ],
  },
  {
    src: "/assets/logistic_analytics.png",
    alt: "Logistics analytics",
    title: "Logistics Analytics Platform",
    description:
      "Advanced logistics and supply chain analytics, optimizing resource allocation and improving operational efficiency.",
    category: "Logistics",
    features: [
      "Supply Chain Optimization",
      "Resource Allocation",
      "Inventory Management",
    ],
  },
];

export default function InteractiveImageGallery() {
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleImageClick = (image: ImageData, index: number) => {
    setSelectedImage(image);
    setCurrentIndex(index);
  };

  const handleClose = () => {
    setSelectedImage(null);
  };

  const handlePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : imageData.length - 1;
    setCurrentIndex(newIndex);
    setSelectedImage(imageData[newIndex]);
  };

  const handleNext = () => {
    const newIndex = currentIndex < imageData.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    setSelectedImage(imageData[newIndex]);
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Workflow: "#FF3621",
      Process: "#4CAF50",
      Analytics: "#FF9800",
      Logistics: "#9C27B0",
    };
    return colors[category] || "#757575";
  };

  return (
    <Box sx={{ flexGrow: 1, mt: 3 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ mb: 4, textAlign: "center", fontWeight: "bold" }}
      >
        Navy PdM System Overview
      </Typography>
      <Typography
        variant="subtitle1"
        sx={{ mb: 4, textAlign: "center", color: "text.secondary" }}
      >
        Explore our comprehensive platform through interactive visualizations
      </Typography>

      <Grid container spacing={3}>
        {imageData.map((image, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Fade in={true} timeout={500 + index * 100}>
              <Card
                sx={{
                  height: "100%",
                  cursor: "pointer",
                  transition: "all 0.3s ease-in-out",
                  transform:
                    hoveredIndex === index ? "scale(1.05)" : "scale(1)",
                  boxShadow: hoveredIndex === index ? 8 : 2,
                  "&:hover": {
                    boxShadow: 12,
                  },
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => handleImageClick(image, index)}
              >
                <Box sx={{ position: "relative" }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={image.src}
                    alt={image.alt}
                    sx={{
                      transition: "transform 0.3s ease-in-out",
                      "&:hover": {
                        transform: "scale(1.1)",
                      },
                    }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      backgroundColor: "rgba(0, 0, 0, 0.7)",
                      borderRadius: "50%",
                      p: 0.5,
                    }}
                  >
                    <ZoomInIcon sx={{ color: "white", fontSize: 20 }} />
                  </Box>
                  <Chip
                    label={image.category}
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      backgroundColor: getCategoryColor(image.category),
                      color: "white",
                      fontWeight: "bold",
                    }}
                  />
                </Box>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {image.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {image.description}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {image.features.map((feature, featureIndex) => (
                      <Chip
                        key={featureIndex}
                        label={feature}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.7rem" }}
                      />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        ))}
      </Grid>

      {/* Modal Dialog for Full-Size Image */}
      <Dialog
        open={!!selectedImage}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            color: "white",
          },
        }}
      >
        {selectedImage && (
          <>
            <DialogTitle
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography variant="h5" component="div">
                  {selectedImage.title}
                </Typography>
                <Chip
                  label={selectedImage.category}
                  size="small"
                  sx={{
                    backgroundColor: getCategoryColor(selectedImage.category),
                    color: "white",
                    mt: 1,
                  }}
                />
              </Box>
              <IconButton onClick={handleClose} sx={{ color: "white" }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0, position: "relative" }}>
              <Box
                sx={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <IconButton
                  onClick={handlePrevious}
                  sx={{
                    position: "absolute",
                    left: 16,
                    zIndex: 1,
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.3)",
                    },
                  }}
                >
                  <NavigateBeforeIcon />
                </IconButton>

                <Zoom in={true} timeout={300}>
                  <img
                    src={selectedImage.src}
                    alt={selectedImage.alt}
                    style={{
                      width: "100%",
                      height: "auto",
                      maxHeight: "70vh",
                      objectFit: "contain",
                    }}
                  />
                </Zoom>

                <IconButton
                  onClick={handleNext}
                  sx={{
                    position: "absolute",
                    right: 16,
                    zIndex: 1,
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.3)",
                    },
                  }}
                >
                  <NavigateNextIcon />
                </IconButton>
              </Box>

              <Box sx={{ p: 3 }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedImage.description}
                </Typography>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Key Features:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {selectedImage.features.map((feature, index) => (
                    <Chip
                      key={index}
                      label={feature}
                      variant="outlined"
                      sx={{
                        color: "white",
                        borderColor: "rgba(255, 255, 255, 0.5)",
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Interactive Feature Showcase */}
      <InteractiveFeatureShowcase />
    </Box>
  );
}
