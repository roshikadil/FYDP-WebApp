import AuthService from '../services/AuthService';

export const getImpersonationStatus = () => {
  return AuthService.getImpersonationStatus();
};

export const isImpersonating = () => {
  return AuthService.isImpersonationSession();
};

export const shouldShowBackButton = () => {
  return AuthService.shouldShowBackToSuperAdmin();
};

export const getCurrentUserDisplay = () => {
  const status = getImpersonationStatus();
  if (status.isImpersonating) {
    return {
      title: `${status.currentUser?.name}'s Dashboard`,
      subtitle: `Impersonating as ${status.currentUser?.role}`,
      isImpersonation: true,
      originalUser: status.originalUser
    };
  }
  return {
    title: 'Super Admin Control',
    subtitle: 'Complete System Management',
    isImpersonation: false
  };
};