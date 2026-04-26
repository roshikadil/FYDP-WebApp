import React, { useState, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  LayersControl,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Slider,
  Button,
  Grid,
  Divider,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  GpsFixed as GpsFixedIcon,
  Layers as LayersIcon,
} from '@mui/icons-material';
import { Incident } from '../contexts/AuthContext';
import { formatDistanceToNow, parseISO } from 'date-fns';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface IncidentMapProps {
  incidents: Incident[];
  onIncidentClick?: (incident: Incident) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
}

const IncidentMap: React.FC<IncidentMapProps> = ({
  incidents,
  onIncidentClick,
  initialCenter = [24.8607, 67.0011], // Karachi, Pakistan coordinates
  initialZoom = 12,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [priorityRange, setPriorityRange] = useState<[number, number]>([0, 100]);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);

  // Custom marker icons based on category and priority
  const getMarkerIcon = (incident: Incident) => {
    const priority = incident.priority || 'medium';
    
    const iconColors: Record<string, string> = {
      urgent: '#DC2626',
      high: '#EF4444',
      medium: '#F59E0B',
      low: '#10B981',
    };
    
    return L.divIcon({
      html: `
        <div style="
          position: relative;
          width: 32px;
          height: 32px;
          background: ${iconColors[priority] || '#6B7280'};
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.2s;
        ">
          <div style="font-size: 16px;">⚠️</div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
      className: 'incident-marker',
    });
  };

  // Helper function to safely extract coordinates
  const getCoordinates = (incident: Incident): [number, number] | null => {
    if (!incident.location) return null;
    
    // Object format: {lat, lng} or {latitude, longitude}
    const latObj = (incident.location as any).lat || (incident.location as any).latitude;
    const lngObj = (incident.location as any).lng || (incident.location as any).longitude || (incident.location as any).lon;
    
    if (latObj !== undefined && lngObj !== undefined) {
      return [Number(latObj), Number(lngObj)];
    }

    if (!incident.location.coordinates) return null;
    
    const coords = incident.location.coordinates;
    
    if (Array.isArray(coords) && coords.length >= 2) {
      const c0 = Number(coords[0]);
      const c1 = Number(coords[1]);
      
      // Auto-detect lat/lng based on Karachi values (lat ~24, lng ~67)
      // If c0 is around 67 and c1 is around 24, it's [lng, lat]
      if (c0 > 40 && c1 < 40) {
        return [c1, c0]; // Return [lat, lng]
      } else {
        return [c0, c1]; // Return [lat, lng]
      }
    } else if (coords && typeof coords === 'object') {
      const lat = (coords as any).lat || (coords as any).latitude;
      const lng = (coords as any).lng || (coords as any).longitude || (coords as any).lon;
      
      if (lat !== undefined && lng !== undefined) {
        return [Number(lat), Number(lng)];
      }
    }
    
    return null;
  };

  // Filter incidents based on selected filters
  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const matchesCategory = 
        selectedCategory === 'all' || 
        incident.category === selectedCategory;
      
      const matchesStatus = 
        selectedStatus === 'all' || 
        incident.status === selectedStatus;
      
      const aiScore = incident.aiDetectionScore || 0;
      const matchesPriority = 
        aiScore >= priorityRange[0] && aiScore <= priorityRange[1];
      
      return matchesCategory && matchesStatus && matchesPriority;
    });
  }, [incidents, selectedCategory, selectedStatus, priorityRange]);

  // Get unique categories and statuses for filters
  const categories = useMemo(() => {
    const uniqueCats = Array.from(
      new Set(incidents.map(i => i.category).filter(Boolean))
    );
    return ['all', ...uniqueCats];
  }, [incidents]);

  const statuses = useMemo(() => {
    const uniqueStats = Array.from(
      new Set(incidents.map(i => i.status).filter(Boolean))
    );
    return ['all', ...uniqueStats];
  }, [incidents]);

  // Count incidents with valid coordinates
  const incidentsWithCoordinates = useMemo(() => {
    return filteredIncidents.filter(incident => getCoordinates(incident) !== null);
  }, [filteredIncidents]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Map Controls Panel */}
      <Paper
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: 2,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedStatus}
                label="Status"
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                {statuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status === 'all' ? 'All Statuses' : status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ px: 2 }}>
              <Typography variant="caption" color="text.secondary">
                AI Score Range: {priorityRange[0]}% - {priorityRange[1]}%
              </Typography>
              <Slider
                value={priorityRange}
                onChange={(_, newValue) => setPriorityRange(newValue as [number, number])}
                valueLabelDisplay="auto"
                min={0}
                max={100}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Box display="flex" gap={1}>
              <Tooltip title="Heatmap View">
                <IconButton
                  size="small"
                  color={showHeatmap ? 'primary' : 'default'}
                  onClick={() => setShowHeatmap(!showHeatmap)}
                >
                  <LayersIcon />
                </IconButton>
              </Tooltip>
              <Button
                size="small"
                variant="outlined"
                startIcon={<GpsFixedIcon />}
              >
                Fit View
              </Button>
            </Box>
          </Grid>
        </Grid>
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          Showing {incidentsWithCoordinates.length} incidents with locations
          {incidentsWithCoordinates.length !== filteredIncidents.length && 
            ` (${filteredIncidents.length - incidentsWithCoordinates.length} without coordinates)`}
        </Typography>
      </Paper>

      {/* Map Container */}
      <Box sx={{ flex: 1, position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
        <MapContainer
          center={initialCenter}
          zoom={initialZoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <LayersControl position="topright">
            {/* Base Maps */}
            <LayersControl.BaseLayer checked name="OpenStreetMap Streets">
              <TileLayer
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
            
            <LayersControl.BaseLayer name="OpenStreetMap Dark">
              <TileLayer
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/dark/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
            
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer
                attribution='Tiles © Esri'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* Incident Markers */}
          {incidentsWithCoordinates.map((incident) => {
            const coordinates = getCoordinates(incident);
            if (!coordinates) return null;
            
            return (
              <Marker
                key={incident._id}
                position={coordinates}
                icon={getMarkerIcon(incident)}
                eventHandlers={{
                  click: () => onIncidentClick?.(incident),
                }}
              >
                <Popup>
                  <Box sx={{ p: 1, minWidth: 200 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {incident.category}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {incident.description?.substring(0, 100)}...
                    </Typography>
                    
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Chip
                        label={incident.status}
                        size="small"
                        sx={{
                          bgcolor: `${
                            incident.status === 'pending' ? '#F59E0B20' :
                            incident.status === 'approved' ? '#10B98120' :
                            '#6B728020'
                          }`,
                          color: incident.status === 'pending' ? '#F59E0B' :
                                 incident.status === 'approved' ? '#10B981' : '#6B7280',
                        }}
                      />
                      {incident.aiDetectionScore && (
                        <Chip
                          label={`AI ${incident.aiDetectionScore}%`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    
                    <Typography variant="caption" display="block">
                      <LocationIcon sx={{ fontSize: 12, mr: 0.5 }} />
                      {incident.location?.address || 'Unknown location'}
                    </Typography>
                    
                    <Typography variant="caption" display="block">
                      Reported {formatDistanceToNow(parseISO(incident.createdAt), {
                        addSuffix: true,
                      })}
                    </Typography>
                    
                    <Button
                      size="small"
                      variant="outlined"
                      fullWidth
                      sx={{ mt: 1 }}
                      onClick={() => onIncidentClick?.(incident)}
                    >
                      View Details
                    </Button>
                  </Box>
                </Popup>
              </Marker>
            );
          })}

          {/* Heatmap Layer (Simulated with CircleMarkers) */}
          {showHeatmap && incidentsWithCoordinates.map((incident) => {
            const coordinates = getCoordinates(incident);
            if (!coordinates) return null;

            const aiScore = incident.aiDetectionScore || 0;
            const radius = Math.max(aiScore / 5, 10);
            const opacity = aiScore / 100 * 0.6;

            return (
              <CircleMarker
                key={`heat-${incident._id}`}
                center={coordinates}
                radius={radius}
                pathOptions={{
                  fillColor: aiScore >= 80 ? '#EF4444' : 
                            aiScore >= 60 ? '#F59E0B' : '#10B981',
                  color: 'white',
                  weight: 1,
                  opacity: opacity,
                  fillOpacity: opacity,
                }}
              />
            );
          })}
        </MapContainer>

        {/* Map Legend */}
        <Paper
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            p: 2,
            borderRadius: 2,
            bgcolor: 'background.paper',
            boxShadow: 3,
            zIndex: 1000,
            maxWidth: 200,
          }}
        >
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Map Legend
          </Typography>
          
          <Box display="flex" alignItems="center" mb={1}>
            <Box sx={{ width: 12, height: 12, bgcolor: '#DC2626', borderRadius: '50%', mr: 1 }} />
            <Typography variant="caption">Urgent</Typography>
          </Box>
          
          <Box display="flex" alignItems="center" mb={1}>
            <Box sx={{ width: 12, height: 12, bgcolor: '#EF4444', borderRadius: '50%', mr: 1 }} />
            <Typography variant="caption">High</Typography>
          </Box>
          
          <Box display="flex" alignItems="center" mb={1}>
            <Box sx={{ width: 12, height: 12, bgcolor: '#F59E0B', borderRadius: '50%', mr: 1 }} />
            <Typography variant="caption">Medium</Typography>
          </Box>
          
          <Box display="flex" alignItems="center">
            <Box sx={{ width: 12, height: 12, bgcolor: '#10B981', borderRadius: '50%', mr: 1 }} />
            <Typography variant="caption">Low</Typography>
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          <Typography variant="caption" color="text.secondary">
            Showing {incidentsWithCoordinates.length} of {incidents.length} incidents
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default IncidentMap;