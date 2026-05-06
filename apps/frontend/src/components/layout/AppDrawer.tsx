import {
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { logout } from '../../store/authSlice';
import { useNavItems } from './navItems';

const DRAWER_WIDTH = 280;

type Props = {
  open: boolean;
  onClose: () => void;
};

function getInitials(email: string): string {
  const [name] = email.split('@');
  return name.slice(0, 2).toUpperCase();
}

export function AppDrawer({ open, onClose }: Props) {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const items = useNavItems();

  const handleLogout = async () => {
    onClose();
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      slotProps={{ paper: { sx: { width: DRAWER_WIDTH } } }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Diana
        </Typography>
      </Box>
      <Divider />
      {user && (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ px: 2, py: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>{getInitials(user.email)}</Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">
              Connecté
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-all' }}>
              {user.email}
            </Typography>
          </Box>
        </Stack>
      )}
      <Divider />
      <List sx={{ flex: 1 }}>
        {items.map((item) => {
          const selected = location.pathname === item.to;
          return (
            <ListItemButton
              key={item.to}
              component={RouterLink}
              to={item.to}
              selected={selected}
              onClick={onClose}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Button fullWidth color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
          Déconnexion
        </Button>
      </Box>
    </Drawer>
  );
}
