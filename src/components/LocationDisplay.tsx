import React, { useState, useEffect } from 'react';
import { Typography } from '@mui/material';
import { isCoordinates, getAddressFromCoordinates } from '../utils/locationUtils';

interface LocationDisplayProps {
  address: string;
  coordinates?: number[];
  variant?: 'body1' | 'body2' | 'caption' | 'subtitle1' | 'subtitle2';
  color?: string;
  noWrap?: boolean;
}

const LocationDisplay: React.FC<LocationDisplayProps> = ({ 
  address, 
  coordinates, 
  variant = 'body2', 
  color = 'text.secondary',
  noWrap = false 
}) => {
  const [displayAddress, setDisplayAddress] = useState(address);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const resolve = async () => {
      if (isCoordinates(address) && coordinates && coordinates.length === 2) {
        setLoading(true);
        const resolved = await getAddressFromCoordinates(coordinates[1], coordinates[0]);
        if (resolved) {
          setDisplayAddress(resolved);
        }
        setLoading(false);
      } else {
        setDisplayAddress(address);
      }
    };
    resolve();
  }, [address, coordinates]);

  return (
    <Typography variant={variant} color={color} noWrap={noWrap}>
      {loading ? 'Resolving address...' : displayAddress || 'Unknown location'}
    </Typography>
  );
};

export default LocationDisplay;
