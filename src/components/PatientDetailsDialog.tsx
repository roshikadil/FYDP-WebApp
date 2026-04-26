import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Avatar,
  Paper,
} from '@mui/material';
import {
  Person as PersonIcon,
  LocationOn as LocationIcon,
  AccessTime as AccessTimeIcon,
  MedicalServices as MedicalIcon,
  Phone as PhoneIcon,
  Assignment as AssignmentIcon,
  Info as InfoIcon,
  LocalHospital as HospitalIcon,
  DirectionsCar as AmbulanceIcon,
  Bed as BedIcon,
  CalendarToday as CalendarIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { HospitalIncident } from '../services/hospitalService';

interface PatientDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  incident: HospitalIncident | null;
  onAdmit?: (incident: HospitalIncident) => void;
  onDischarge?: (incident: HospitalIncident) => void;
  onAccept?: (incidentId: string) => void;
  onReject?: (incidentId: string) => void;
}

const PatientDetailsDialog: React.FC<PatientDetailsDialogProps> = ({
  open,
  onClose,
  incident,
  onAdmit,
  onDischarge,
  onAccept,
  onReject
}) => {
  if (!incident) return null;

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'incoming': return 'warning';
      case 'admitted': return 'primary';
      case 'discharged': return 'success';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatAddress = (address: string) => {
    return address.length > 100 ? `${address.substring(0, 100)}...` : address;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={600}>
                Patient Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ID: {(incident.id || incident._id || '').substring(0, 8)}
              </Typography>
            </Box>
          </Box>
          <Button onClick={onClose} sx={{ minWidth: 'auto' }}>
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Status and Priority Badges */}
        <Box display="flex" gap={2} mb={3}>
          <Chip
            label={incident.hospitalStatus?.toUpperCase() || 'PENDING'}
            color={getStatusColor(incident.hospitalStatus) as any}
            size="medium"
          />
          <Chip
            label={`Priority: ${incident.priority?.toUpperCase() || 'MEDIUM'}`}
            color={getPriorityColor(incident.priority) as any}
            size="medium"
          />
          <Chip
            label={`Incident: ${incident.status?.toUpperCase() || 'PENDING'}`}
            variant="outlined"
            size="medium"
          />
        </Box>

        <Grid container spacing={3}>
          {/* Left Column - Patient Information */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                <Box display="flex" alignItems="center" gap={1}>
                  <PersonIcon fontSize="small" />
                  Patient Information
                </Box>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <AssignmentIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Case ID" 
                    secondary={incident.id || incident._id} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <AccessTimeIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Reported At" 
                    secondary={formatDate(incident.createdAt)} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CalendarIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Last Updated" 
                    secondary={formatDate(incident.updatedAt)} 
                  />
                </ListItem>
                {incident.reportedBy && (
                  <ListItem>
                    <ListItemIcon>
                      <PersonIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Reported By" 
                      secondary={
                        <Box>
                          <Typography variant="body2">{incident.reportedBy.name}</Typography>
                          {incident.reportedBy.phone && (
                            <Typography variant="caption" display="flex" alignItems="center" gap={0.5}>
                              <PhoneIcon fontSize="inherit" />
                              {incident.reportedBy.phone}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </Paper>

            {/* Location Information */}
            <Paper sx={{ p: 2, borderRadius: 2, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                <Box display="flex" alignItems="center" gap={1}>
                  <LocationIcon fontSize="small" />
                  Location Details
                </Box>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <LocationIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Address" 
                    secondary={formatAddress(incident.location?.address || 'Unknown location')} 
                  />
                </ListItem>
                {incident.location?.coordinates && (
                  <ListItem>
                    <ListItemIcon>
                      <InfoIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Coordinates" 
                      secondary={`${incident.location.coordinates[0]?.toFixed(4)}, ${incident.location.coordinates[1]?.toFixed(4)}`} 
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>

          {/* Right Column - Medical Information */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                <Box display="flex" alignItems="center" gap={1}>
                  <MedicalIcon fontSize="small" />
                  Medical Information
                </Box>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <AssignmentIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Description" 
                    secondary={incident.description || 'No description provided'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Category" 
                    secondary={incident.category || 'Unknown'} 
                  />
                </ListItem>
                
                {/* Patient Status Information */}
                {incident.patientStatus && (
                  <>
                    {incident.patientStatus.condition && (
                      <ListItem>
                        <ListItemIcon>
                          <MedicalIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Condition" 
                          secondary={incident.patientStatus.condition} 
                        />
                      </ListItem>
                    )}
                    {incident.patientStatus.hospital && (
                      <ListItem>
                        <ListItemIcon>
                          <HospitalIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Hospital" 
                          secondary={incident.patientStatus.hospital} 
                        />
                      </ListItem>
                    )}
                    {incident.patientStatus.doctor && (
                      <ListItem>
                        <ListItemIcon>
                          <PersonIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Doctor" 
                          secondary={incident.patientStatus.doctor} 
                        />
                      </ListItem>
                    )}
                    {incident.patientStatus.bedNumber && (
                      <ListItem>
                        <ListItemIcon>
                          <BedIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Bed Number" 
                          secondary={incident.patientStatus.bedNumber} 
                        />
                      </ListItem>
                    )}
                    {incident.patientStatus.treatment && (
                      <ListItem>
                        <ListItemIcon>
                          <MedicalIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Treatment" 
                          secondary={incident.patientStatus.treatment} 
                        />
                      </ListItem>
                    )}
                    {incident.patientStatus.medicalNotes && (
                      <ListItem>
                        <ListItemIcon>
                          <InfoIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Medical Notes" 
                          secondary={incident.patientStatus.medicalNotes} 
                        />
                      </ListItem>
                    )}
                  </>
                )}
              </List>
            </Paper>

            {/* Ambulance Information */}
            {incident.assignedTo && (
              <Paper sx={{ p: 2, borderRadius: 2, mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  <Box display="flex" alignItems="center" gap={1}>
                    <AmbulanceIcon fontSize="small" />
                    Ambulance Service
                  </Box>
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <AssignmentIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Department" 
                      secondary={incident.assignedTo.department || 'Not assigned'} 
                    />
                  </ListItem>
                  {incident.assignedTo.driver && (
                    <ListItem>
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Driver" 
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              {incident.assignedTo.driver.name || 'Unknown driver'}
                            </Typography>
                            {incident.assignedTo.driver.phone && (
                              <Typography variant="caption" display="flex" alignItems="center" gap={0.5}>
                                <PhoneIcon fontSize="inherit" />
                                {incident.assignedTo.driver.phone}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  )}
                  {incident.assignedTo.assignedAt && (
                    <ListItem>
                      <ListItemIcon>
                        <CalendarIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Assigned At" 
                        secondary={formatDate(incident.assignedTo.assignedAt)} 
                      />
                    </ListItem>
                  )}
                </List>
              </Paper>
            )}
          </Grid>
        </Grid>

        {/* Incident Actions History */}
        {incident.actions && incident.actions.length > 0 && (
          <Paper sx={{ p: 2, borderRadius: 2, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Action History
            </Typography>
            <List dense>
              {incident.actions.slice(-5).reverse().map((action, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <InfoIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">
                          {action.action.replace(/_/g, ' ').toUpperCase()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(action.timestamp)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption">
                          Performed by: {action.performedBy?.name || 'System'} ({action.performedBy?.role || 'System'})
                        </Typography>
                        {action.details && Object.keys(action.details).length > 0 && (
                          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            Details: {JSON.stringify(action.details)}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        {incident.hospitalStatus === 'incoming' && onAdmit && (
          <Button 
            onClick={() => onAdmit(incident)} 
            variant="contained" 
            color="primary"
            startIcon={<MedicalIcon />}
          >
            Admit Patient
          </Button>
        )}
        {incident.hospitalStatus === 'admitted' && onDischarge && (
          <Button 
            onClick={() => onDischarge(incident)} 
            variant="contained" 
            color="secondary"
            startIcon={<HospitalIcon />}
          >
            Discharge Patient
          </Button>
        )}
        {incident.hospitalRequest?.status === 'pending' && onAccept && (
          <Button 
            onClick={() => onAccept(incident.id || incident._id || '')} 
            variant="contained" 
            sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
            startIcon={<CheckIcon />}
          >
            Accept Request
          </Button>
        )}
        {incident.hospitalRequest?.status === 'pending' && onReject && (
          <Button 
            onClick={() => onReject(incident.id || incident._id || '')} 
            variant="contained" 
            sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}
            startIcon={<CancelIcon />}
          >
            Reject Request
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PatientDetailsDialog;