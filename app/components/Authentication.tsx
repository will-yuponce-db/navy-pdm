import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Link,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Person,
  Email,
  Lock,
  Security,
  Edit,
  Delete,
  Add,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import {
  login,
  logout,
  selectAuth,
  selectUser,
  selectIsAuthenticated,
  hasPermission,
  canManageUsers,
} from "../redux/services/authSlice";
import { InputValidator, InputSanitizer } from "../services/security";
import { errorMonitoringService } from "../services/errorMonitoring";

// Login component
export const LoginForm: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector(selectAuth);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleInputChange = (field: string, value: string) => {
    const sanitizedValue = InputSanitizer.sanitizeString(value);
    setFormData((prev) => ({ ...prev, [field]: sanitizedValue }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const schema = {
      email: InputValidator.getEmailSchema().email,
      password: {
        required: true,
        minLength: 1,
        message: "Password is required",
      },
    };

    const validation = InputValidator.validate(schema, formData);

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    try {
      await dispatch(login(formData)).unwrap();
      errorMonitoringService.logUserAction("login_success");
    } catch (error: unknown) {
      errorMonitoringService.logUserAction("login_failure");
      console.error("Login failed:", error);
    }
  };

  return (
    <Card sx={{ maxWidth: 400, mx: "auto", mt: 8 }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Avatar sx={{ mx: "auto", mb: 2, bgcolor: "primary.main" }}>
            <Security />
          </Avatar>
          <Typography variant="h4" component="h1" gutterBottom>
            Navy PDM
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to your account
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            error={!!validationErrors.email}
            helperText={validationErrors.email}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email />
                </InputAdornment>
              ),
            }}
            autoComplete="email"
            autoFocus
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            error={!!validationErrors.password}
            helperText={validationErrors.password}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            autoComplete="current-password"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading}
            sx={{ mt: 3, mb: 2 }}
          >
            {isLoading ? <CircularProgress size={24} /> : "Sign In"}
          </Button>

          <Box sx={{ textAlign: "center" }}>
            <Link href="#" variant="body2">
              Forgot your password?
            </Link>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// User profile component
export const UserProfile: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    homeport: user?.homeport || "",
    department: user?.department || "",
  });

  const handleSave = async () => {
    try {
      // Update user profile logic would go here
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const handleChangePassword = async () => {
    // Change password logic would go here
  };

  if (!user) return null;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Avatar sx={{ mr: 2, bgcolor: "primary.main" }}>
            <Person />
          </Avatar>
          <Box>
            <Typography variant="h6">
              {user.firstName} {user.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
            <Chip
              label={user.role.replace("_", " ").toUpperCase()}
              size="small"
              color="primary"
              sx={{ mt: 1 }}
            />
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {isEditing ? (
          <Box>
            <TextField
              fullWidth
              label="First Name"
              value={editData.firstName}
              onChange={(e) =>
                setEditData((prev) => ({ ...prev, firstName: e.target.value }))
              }
              margin="normal"
            />
            <TextField
              fullWidth
              label="Last Name"
              value={editData.lastName}
              onChange={(e) =>
                setEditData((prev) => ({ ...prev, lastName: e.target.value }))
              }
              margin="normal"
            />
            <TextField
              fullWidth
              label="Homeport"
              value={editData.homeport}
              onChange={(e) =>
                setEditData((prev) => ({ ...prev, homeport: e.target.value }))
              }
              margin="normal"
            />
            <TextField
              fullWidth
              label="Department"
              value={editData.department}
              onChange={(e) =>
                setEditData((prev) => ({ ...prev, department: e.target.value }))
              }
              margin="normal"
            />
            <Box sx={{ mt: 2 }}>
              <Button onClick={handleSave} variant="contained" sx={{ mr: 1 }}>
                Save
              </Button>
              <Button onClick={() => setIsEditing(false)}>Cancel</Button>
            </Box>
          </Box>
        ) : (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Homeport:</strong> {user.homeport || "Not specified"}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Department:</strong> {user.department || "Not specified"}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Last Login:</strong>{" "}
              {user.lastLogin
                ? new Date(user.lastLogin).toLocaleString()
                : "Never"}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Member Since:</strong>{" "}
              {new Date(user.createdAt).toLocaleDateString()}
            </Typography>

            <Box>
              <Button
                onClick={() => setIsEditing(true)}
                startIcon={<Edit />}
                sx={{ mr: 1 }}
              >
                Edit Profile
              </Button>
              <Button
                onClick={handleChangePassword}
                startIcon={<Lock />}
                sx={{ mr: 1 }}
              >
                Change Password
              </Button>
              <Button onClick={() => dispatch(logout())} color="error">
                Sign Out
              </Button>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// User management component (admin only)
export const UserManagement: React.FC = () => {
  const user = useSelector(selectUser);
  const [users] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<unknown>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (canManageUsers(user)) {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      // Load users from API
      // const response = await usersApi.getAll();
      // setUsers(response.data);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (user: unknown) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        // Delete user logic
        await loadUsers();
      } catch (error) {
        console.error("Failed to delete user:", error);
      }
    }
  };

  const handleToggleUserStatus = async () => {
    try {
      // Toggle user status logic
      await loadUsers();
    } catch (error) {
      console.error("Failed to toggle user status:", error);
    }
  };

  if (!canManageUsers(user)) {
    return (
      <Alert severity="error">
        You don&apos;t have permission to manage users.
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">User Management</Typography>
          <Button
            startIcon={<Add />}
            variant="contained"
            onClick={() => {
              console.log("Add User clicked");
              // TODO: Implement add user functionality
            }}
          >
            Add User
          </Button>
        </Box>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {users.map((user) => (
              <ListItem key={user.id} divider>
                <Avatar sx={{ mr: 2, bgcolor: "primary.main" }}>
                  <Person />
                </Avatar>
                <ListItemText
                  primary={`${user.firstName} ${user.lastName}`}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={user.role.replace("_", " ").toUpperCase()}
                          size="small"
                          color="primary"
                          sx={{ mr: 1 }}
                        />
                        <Chip
                          label={user.isActive ? "Active" : "Inactive"}
                          size="small"
                          color={user.isActive ? "success" : "error"}
                        />
                      </Box>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Switch
                      checked={user.isActive}
                      onChange={(e) =>
                        handleToggleUserStatus(user.id, e.target.checked)
                      }
                      sx={{ mr: 1 }}
                    />
                    <IconButton
                      onClick={() => {
                        handleEditUser(user);
                        console.log("Edit user clicked for:", user.id);
                      }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() => {
                        handleDeleteUser(user.id);
                        console.log("Delete user clicked for:", user.id);
                      }}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}

        {/* Edit User Dialog */}
        <Dialog
          open={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Edit User</DialogTitle>
          <DialogContent>
            {selectedUser && (
              <Box sx={{ pt: 1 }}>
                <TextField
                  fullWidth
                  label="First Name"
                  defaultValue={selectedUser.firstName}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  defaultValue={selectedUser.lastName}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Email"
                  defaultValue={selectedUser.email}
                  margin="normal"
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel>Role</InputLabel>
                  <Select defaultValue={selectedUser.role}>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="commander">Commander</MenuItem>
                    <MenuItem value="maintenance_manager">
                      Maintenance Manager
                    </MenuItem>
                    <MenuItem value="maintainer">Maintainer</MenuItem>
                    <MenuItem value="pmo_officer">PMO Officer</MenuItem>
                    <MenuItem value="viewer">Viewer</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Homeport"
                  defaultValue={selectedUser.homeport}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Department"
                  defaultValue={selectedUser.department}
                  margin="normal"
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setIsEditDialogOpen(false);
                console.log("Cancel edit user dialog");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                console.log("Save user changes");
                setIsEditDialogOpen(false);
                // TODO: Implement save user functionality
              }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

// Permission-based component wrapper
export const PermissionGate: React.FC<{
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ permission, children, fallback }) => {
  const user = useSelector(selectUser);

  if (!hasPermission(user, permission)) {
    return fallback || null;
  }

  return <>{children}</>;
};

// Role-based component wrapper
export const RoleGate: React.FC<{
  roles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ roles, children, fallback }) => {
  const user = useSelector(selectUser);

  if (!user || !roles.includes(user.role)) {
    return fallback || null;
  }

  return <>{children}</>;
};
