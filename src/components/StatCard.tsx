import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import { SvgIconComponent } from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: number | string;
  color: string;
  icon: SvgIconComponent;
  hoverEffect?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  color,
  icon: Icon,
  hoverEffect
}) => {
  return (
    <Card
      sx={{
        background: color,
        color: '#fff',
        borderRadius: 3,
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100%',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: hoverEffect || '0 20px 40px rgba(0, 0, 0, 0.2)'
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icon sx={{ fontSize: '2rem' }} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {title}
            </Typography>
            <Typography variant="h3" fontWeight={700}>
              {value}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;