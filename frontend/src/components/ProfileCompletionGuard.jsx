import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

// COMMENTED OUT FOR TESTING - Profile completion guard disabled
const ProfileCompletionGuard = ({ children, required = true }) => {
  // Always render children without any profile completion checks
  return children;
};

export default ProfileCompletionGuard;
