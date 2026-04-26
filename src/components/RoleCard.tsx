import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
} from '@mui/material';
import { SvgIconComponent } from '@mui/icons-material';

interface RoleCardProps {
  title: string;
  total: number;
  active: number;
  color: string;
  icon: SvgIconComponent;
  subtitle?: string;
}

const RoleCard: React.FC<RoleCardProps> = ({
  title,
  total,
  active,
  color,
  icon: Icon,
  subtitle
}) => {
  return (
    <Card sx={{ 
      mb: 2,
      borderRadius: 2,
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: 3
      }
    }}>
      <CardContent sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ 
            bgcolor: `${color}20`, 
            color: color,
            width: 48,
            height: 48
          }}>
            <Icon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography fontWeight={600} variant="subtitle1">
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle || `Total: ${total} • Active: ${active}`}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography 
              variant="h5" 
              fontWeight={700}
              color={color}
            >
              {active}/{total}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Active
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RoleCard;