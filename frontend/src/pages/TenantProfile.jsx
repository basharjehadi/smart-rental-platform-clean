import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationHeader from '../components/common/NotificationHeader';
import { useAuth } from '../contexts/AuthContext';
import TenantSidebar from '../components/TenantSidebar';
import { Lock, User, Camera, X, Check, Info, LogOut } from 'lucide-react';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import countryList from 'react-select-country-list';
import 'react-datepicker/dist/react-datepicker.css';

// Import signature canvas
import SignatureCanvas from 'react-signature-canvas';

// Debug signature canvas import
console.log('SignatureCanvas imported:', SignatureCanvas);

const TenantProfile = () => {
  const { user, api, logout } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [phoneVerificationSent, setPhoneVerificationSent] = useState(false);
  const [signaturePad, setSignaturePad] = useState(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [kycFiles, setKycFiles] = useState({
    idFront: null,
    idBack: null
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [showPhotoOverlay, setShowPhotoOverlay] = useState(false);
  const [showPhotoActions, setShowPhotoActions] = useState(false);
  const [currentSignature, setCurrentSignature] = useState(null);
  const [isSavingSignature, setIsSavingSignature] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [kycSubmissionError, setKycSubmissionError] = useState('');
  const [kycSubmissionSuccess, setKycSubmissionSuccess] = useState('');
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);
  const [kycStatus, setKycStatus] = useState('NOT_SUBMITTED');
  const [profileStatus, setProfileStatus] = useState({
    isComplete: false,
    completionPercentage: 0,
    missingFields: [],
    missingVerifications: [],
    phoneVerified: false,
    emailVerified: false
  });
  
  // Form validation and conditional fields state
  const [formErrors, setFormErrors] = useState({});
  const [formTouched, setFormTouched] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isFormShaking, setIsFormShaking] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [selectedCitizenship, setSelectedCitizenship] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [countries, setCountries] = useState([]);
  const [citizenshipOptions, setCitizenshipOptions] = useState([]);
  const [selectedProfession, setSelectedProfession] = useState(null);
  const [showOtherProfession, setShowOtherProfession] = useState(false);
  const [otherProfession, setOtherProfession] = useState('');
  const [originalFile, setOriginalFile] = useState(null);

  const formRef = useRef(null);
  const fileInputRef = useRef(null);

  // Profession options list
  const professionOptions = [
    { value: 'Accountant', label: 'Accountant' },
    { value: 'Architect', label: 'Architect' },
    { value: 'Artist', label: 'Artist' },
    { value: 'Chef', label: 'Chef' },
    { value: 'Designer', label: 'Designer' },
    { value: 'Doctor', label: 'Doctor' },
    { value: 'Driver', label: 'Driver' },
    { value: 'Engineer', label: 'Engineer' },
    { value: 'Farmer', label: 'Farmer' },
    { value: 'Freelancer', label: 'Freelancer' },
    { value: 'Lawyer', label: 'Lawyer' },
    { value: 'Mechanic', label: 'Mechanic' },
    { value: 'Nurse', label: 'Nurse' },
    { value: 'Other', label: 'Other' },
    { value: 'Project Manager', label: 'Project Manager' },
    { value: 'Salesperson', label: 'Salesperson' },
    { value: 'Software Developer', label: 'Software Developer' },
    { value: 'Student', label: 'Student' },
    { value: 'Teacher', label: 'Teacher' },
    { value: 'Waiter', label: 'Waiter' },
    { value: 'Writer', label: 'Writer' }
  ];

  // Function to get country flag emoji from ISO code
  const getCountryFlag = (countryCode) => {
    if (!countryCode || countryCode.length !== 2) return '🏳️';
    
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    
    return String.fromCodePoint(...codePoints);
  };

  // Initialize country list and citizenship options
  useEffect(() => {
    console.log('Initializing country list and citizenship options...');
    try {
      const countryData = countryList().getData();
      console.log('Country data sample:', countryData.slice(0, 3));
      
      // Add flag emojis to country data for dropdown display
      const countriesWithFlags = countryData.map(country => ({
        ...country,
        label: `${getCountryFlag(country.value)} ${country.label}`,
        flag: getCountryFlag(country.value)
      }));
      
      const polishOption = countriesWithFlags.find(country => country.value === 'PL');
      const otherCountries = countryData.filter(country => country.value !== 'PL').sort((a, b) => a.label.localeCompare(b.label));
      
      // Create citizenship options with proper flag handling
      const citizenshipOpts = [
        { value: 'Polish', label: '🇵🇱 Polish', countryCode: 'PL' }
      ];
      
      // Add other countries with proper flag handling
      otherCountries.forEach(country => {
        // Use original country data (without flags) for citizenship options
        const flag = getCountryFlag(country.value) || '🏳️';
        citizenshipOpts.push({
          value: country.label,
          label: `${flag} ${country.label}`,
          countryCode: country.value
        });
      });
      
      setCountries(countriesWithFlags);
      setCitizenshipOptions(citizenshipOpts);
      
      // Set default values if not already set
      if (!selectedCitizenship) {
        setSelectedCitizenship(citizenshipOpts[0]);
      }
      if (!selectedCountry) {
        setSelectedCountry(polishOption);
      }
      
      console.log('Country and citizenship options initialized successfully');
    } catch (error) {
      console.error('Error initializing country list:', error);
      // Set fallback options to prevent component from breaking
      setCountries([]);
      setCitizenshipOptions([{ value: 'Polish', label: '🇵🇱 Polish', countryCode: 'PL' }]);
      setSelectedCitizenship({ value: 'Polish', label: '🇵🇱 Polish', countryCode: 'PL' });
    }
  }, []);

  useEffect(() => {
    fetchProfileData();
    fetchProfileStatus();
  }, []);

  // Initialize signature pad when entering edit mode
  useEffect(() => {
    if (isEditing && signaturePad && profileData?.signatureBase64) {
      // Load existing signature into the canvas
      signaturePad.fromDataURL(profileData.signatureBase64);
    }
  }, [isEditing, signaturePad, profileData?.signatureBase64]);

  // Refetch profile data when country and citizenship options are loaded
  useEffect(() => {
    if (countries.length > 0 && citizenshipOptions.length > 0 && profileData) {
      // Re-set citizenship and country selections with the loaded options
      if (profileData.citizenship) {
        const citizenshipOption = citizenshipOptions.find(option => 
          option.value === profileData.citizenship || 
          option.label.includes(profileData.citizenship)
        );
        setSelectedCitizenship(citizenshipOption || citizenshipOptions[0]);
      } else {
        setSelectedCitizenship(citizenshipOptions[0]);
      }
      
      if (profileData.country && countries.length > 0) {
        const countryOption = countries.find(country => 
          country.label.includes(profileData.country) || 
          country.value === profileData.country
        );
        setSelectedCountry(countryOption);
      } else if (countries.length > 0) {
        // Default to Poland if no country is set
        const polandOption = countries.find(country => country.value === 'PL');
        setSelectedCountry(polandOption);
      }
    }
  }, [countries, citizenshipOptions, profileData]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      console.log('Fetching profile data...');
      const response = await api.get('/users/profile');
      console.log('Profile response:', response.data);
      setProfileData(response.data.user);
      
      // Check if user has signature
      if (response.data.user.signatureBase64) {
        setHasSignature(true);
        setCurrentSignature(response.data.user.signatureBase64);
      }
      
      // Set KYC status
      if (response.data.user.kycStatus) {
        setKycStatus(response.data.user.kycStatus);
      }
      
      // Set profile photo if available
      if (response.data.user.profileImage) {
        setProfilePhoto(response.data.user.profileImage);
      }
      
      // Set date of birth if available
      if (response.data.user.dateOfBirth) {
        setDateOfBirth(new Date(response.data.user.dateOfBirth));
      }
      
      // Set citizenship selection
      if (response.data.user.citizenship && citizenshipOptions.length > 0) {
        const citizenshipOption = citizenshipOptions.find(option => 
          option.value === response.data.user.citizenship || 
          option.label.includes(response.data.user.citizenship)
        );
        setSelectedCitizenship(citizenshipOption || citizenshipOptions[0]);
      } else if (citizenshipOptions.length > 0) {
        setSelectedCitizenship(citizenshipOptions[0]);
      }
      
      // Set profession selection
      if (response.data.user.profession) {
        const professionOption = professionOptions.find(option => 
          option.value === response.data.user.profession
        );
        if (professionOption) {
          setSelectedProfession(professionOption);
          setShowOtherProfession(false);
        } else {
          // If profession is not in the list, set as "Other"
          setSelectedProfession(professionOptions.find(option => option.value === 'Other'));
          setShowOtherProfession(true);
          setOtherProfession(response.data.user.profession);
        }
      }
      
      // Set country selection
      if (response.data.user.country && countries.length > 0) {
        const countryOption = countries.find(country => 
          country.label.includes(response.data.user.country) || 
          country.value === response.data.user.country
        );
        setSelectedCountry(countryOption);
      } else if (countries.length > 0) {
        // Default to Poland if no country is set
        const polandOption = countries.find(country => country.value === 'PL');
        setSelectedCountry(polandOption);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch profile status from backend
  const fetchProfileStatus = async () => {
    try {
      const response = await api.get('/users/profile/status');
      setProfileStatus(response.data);
    } catch (error) {
      console.error('Error fetching profile status:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      shakeForm();
      return;
    }
    
    try {
      const formData = new FormData(formRef.current);
      const updateData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        citizenship: selectedCitizenship?.value || selectedCitizenship?.label,
        pesel: formData.get('pesel'),
        passportNumber: formData.get('passportNumber'),
        phoneNumber: formData.get('phoneNumber'),
        street: formData.get('street'),
        city: formData.get('city'),
        zipCode: formData.get('zipCode'),
        country: selectedCountry?.label?.replace(/^[\u{1F1E6}-\u{1F1FF}]{2}\s*/u, '') || selectedCountry?.value || formData.get('country'),
        dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : null,
        profession: selectedProfession?.value === 'Other' ? otherProfession : selectedProfession?.value
      };

      await api.put('/users/profile', updateData);
      await fetchProfileData();
      setIsEditing(false);
      setHasUnsavedChanges(false);
      setFormErrors({});
      setFormTouched({});
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    }
  };

  const handlePhoneVerification = async () => {
    try {
      await api.post('/auth/send-phone-verification', {
        phoneNumber: profileData?.phoneNumber
      });
      setPhoneVerificationSent(true);
    } catch (error) {
      console.error('Error sending phone verification:', error);
      setError('Failed to send verification code');
    }
  };

  const handleSignatureSave = async () => {
    if (signaturePad && !signaturePad.isEmpty()) {
      try {
        setIsSavingSignature(true);
        const signatureData = signaturePad.toDataURL();
        await api.post('/users/signature', {
          signatureBase64: signatureData
        });
        setHasSignature(true);
        setIsEditing(false);
        setCurrentSignature(signatureData); // Set current signature immediately
        
        // Refresh profile data to get the updated signature
        await fetchProfileData();
      } catch (error) {
        console.error('Error saving signature:', error);
        setError('Failed to save signature');
      } finally {
        setIsSavingSignature(false);
      }
    }
  };

  const handleSignatureClear = () => {
    if (signaturePad) {
      signaturePad.clear();
      setHasSignature(false);
      setCurrentSignature(null);
    }
  };

  const handleKycUpload = (type, file) => {
    // Store file for later submission instead of immediate upload
    setKycFiles(prev => ({
      ...prev,
      [type]: file
    }));
    setKycSubmissionError(''); // Clear any previous errors
  };

  const handleKycSubmit = async () => {
    // Validate GDPR consent
    if (!gdprConsent) {
      setKycSubmissionError('You must accept GDPR / RODO terms before submitting.');
      return;
    }

    // Validate that both files are uploaded
    if (!kycFiles.idFront || !kycFiles.idBack) {
      setKycSubmissionError('Please upload both ID front and back documents.');
      return;
    }

    setIsSubmittingKyc(true);
    setKycSubmissionError('');
    setKycSubmissionSuccess('');

    try {
      console.log('Starting KYC submission...');
      console.log('Front file:', kycFiles.idFront);
      console.log('Back file:', kycFiles.idBack);
      
      // Upload ID Front
      const frontFormData = new FormData();
      frontFormData.append('identityDocument', kycFiles.idFront);
      frontFormData.append('type', 'idFront');
      frontFormData.append('gdprConsent', 'true');
      frontFormData.append('gdprConsentDate', new Date().toISOString());

      console.log('Uploading front document...');
      const frontResponse = await api.post('/users/upload-identity-document', frontFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('Front upload response:', frontResponse.data);

      // Upload ID Back
      const backFormData = new FormData();
      backFormData.append('identityDocument', kycFiles.idBack);
      backFormData.append('type', 'idBack');
      backFormData.append('gdprConsent', 'true');
      backFormData.append('gdprConsentDate', new Date().toISOString());

      console.log('Uploading back document...');
      const backResponse = await api.post('/users/upload-identity-document', backFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('Back upload response:', backResponse.data);

      // Clear files and show success
      setKycFiles({ idFront: null, idBack: null });
      setGdprConsent(false);
      setKycStatus('PENDING');
      setKycSubmissionSuccess('KYC documents submitted successfully! Your identity verification is now being processed.');
      
    } catch (error) {
      console.error('Error submitting KYC documents:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Provide more specific error messages
      if (error.response?.status === 400) {
        setKycSubmissionError(`Upload failed: ${error.response.data?.message || 'Invalid file format or size'}`);
      } else if (error.response?.status === 401) {
        setKycSubmissionError('Authentication failed. Please log in again.');
      } else if (error.response?.status === 413) {
        setKycSubmissionError('File too large. Please use files smaller than 10MB.');
      } else if (error.response?.status >= 500) {
        setKycSubmissionError('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR') {
        setKycSubmissionError('Network error. Please check your connection and try again.');
      } else {
        setKycSubmissionError(`Upload failed: ${error.message || 'Unknown error occurred'}`);
      }
    } finally {
      setIsSubmittingKyc(false);
    }
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: '' }));
    }
    setPasswordSuccess('');
    setPasswordError('');
  };

  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordData.currentPassword.trim()) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'New password must be at least 8 characters';
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const calculatePasswordStrength = (password) => {
    if (!password) return { strength: 'weak', color: 'bg-red-500', text: 'Weak', percentage: 0 };
    
    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    if (score <= 2) return { strength: 'weak', color: 'bg-red-500', text: 'Weak', percentage: 33 };
    if (score <= 4) return { strength: 'medium', color: 'bg-orange-500', text: 'Medium', percentage: 66 };
    return { strength: 'strong', color: 'bg-green-500', text: 'Strong', percentage: 100 };
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    setIsPasswordLoading(true);
    
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordSuccess('Password updated successfully.');
      setPasswordError('');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError('Current password is incorrect.');
      setPasswordSuccess('');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPG, JPEG, or PNG)');
      return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }
    
    // Store the original file for upload
    setOriginalFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target.result);
      setShowPhotoActions(true);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoSave = async () => {
    if (!photoPreview || !originalFile) return;
    
    setIsPhotoUploading(true);
    try {
      // Use the original file instead of converting base64 to blob
      const formData = new FormData();
      formData.append('profileImage', originalFile);
      
      const uploadResponse = await api.post('/users/profile/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setProfilePhoto(uploadResponse.data.photoUrl);
      setPhotoPreview(null);
      setOriginalFile(null);
      setShowPhotoActions(false);
      setShowPhotoOverlay(false);
      
      // Show success message
      setPasswordSuccess('Profile photo updated successfully.');
      setTimeout(() => setPasswordSuccess(''), 3000);
      
    } catch (error) {
      console.error('Error uploading photo:', error);
      setPasswordError('Failed to upload photo.');
      setTimeout(() => setPasswordError(''), 3000);
    } finally {
      setIsPhotoUploading(false);
    }
  };

  const handlePhotoCancel = () => {
    setPhotoPreview(null);
    setOriginalFile(null);
    setShowPhotoActions(false);
    setShowPhotoOverlay(false);
  };

  const handlePhotoRemove = async () => {
    setIsPhotoUploading(true);
    try {
      await api.delete('/users/profile/photo');
      setProfilePhoto(null);
      setPhotoPreview(null);
      setOriginalFile(null);
      setShowPhotoActions(false);
      setShowPhotoOverlay(false);
      
      // Show success message
      setPasswordSuccess('Profile photo removed successfully.');
      setTimeout(() => setPasswordSuccess(''), 3000);
      
    } catch (error) {
      console.error('Error removing photo:', error);
      setPasswordError('Failed to remove photo.');
      setTimeout(() => setPasswordError(''), 3000);
    } finally {
      setIsPhotoUploading(false);
    }
  };

  const handlePhotoClick = () => {
    if (showPhotoActions) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handlePhotoUpload(file);
    }
    // Reset input
    e.target.value = '';
  };

  const handleCitizenshipChange = (option) => {
    setSelectedCitizenship(option);
    setHasUnsavedChanges(true);
    
    // If switching to Polish and PESEL is provided, calculate date of birth
    if (option?.value === 'Polish' || option?.label?.includes('Polish')) {
      const pesel = formRef.current?.pesel?.value;
      if (pesel && pesel.length === 11) {
        const calculatedDate = calculateDateFromPESEL(pesel);
        if (calculatedDate) {
          setDateOfBirth(calculatedDate);
        }
      }
    }
    
    // Clear validation errors for fields that are now hidden
    setFormErrors(prev => {
      const newErrors = { ...prev };
      if (option?.value === 'Polish' || option?.label?.includes('Polish')) {
        delete newErrors.passportNumber;
        delete newErrors.dateOfBirth;
      } else {
        delete newErrors.pesel;
      }
      return newErrors;
    });
  };

  const handleCountryChange = (option) => {
    setSelectedCountry(option);
    setHasUnsavedChanges(true);
  };

  const handleProfessionChange = (option) => {
    setSelectedProfession(option);
    setShowOtherProfession(option?.value === 'Other');
    if (option?.value !== 'Other') {
      setOtherProfession('');
    }
    setHasUnsavedChanges(true);
  };

  const handlePESELChange = (value) => {
    handleFieldChange('pesel', value);
    
    // If Polish citizen and PESEL is valid, calculate date of birth
    if (selectedCitizenship?.value === 'Polish' || selectedCitizenship?.label?.includes('Polish')) {
      if (value && value.length === 11) {
        const calculatedDate = calculateDateFromPESEL(value);
        if (calculatedDate) {
          setDateOfBirth(calculatedDate);
        }
      }
    }
  };

  // Form validation functions
  const validateField = (name, value, citizenship) => {
    const errors = {};
    
    // PESEL validation (11 digits)
    if (name === 'pesel' && value && !/^\d{11}$/.test(value)) {
      errors[name] = 'PESEL must be exactly 11 digits';
    }
    
    // Phone number validation
    if (name === 'phoneNumber' && value && !/^[\+]?[0-9\s\-\(\)]{9,15}$/.test(value)) {
      errors[name] = 'Please enter a valid phone number';
    }
    
    // Required field validation based on citizenship
    const isPolish = citizenship?.value === 'Polish' || citizenship?.label?.includes('Polish');
    
    if (isPolish) {
      if (name === 'pesel' && !value) {
        errors[name] = 'PESEL is required for Polish citizens';
      }
    } else {
      if (name === 'passportNumber' && !value) {
        errors[name] = 'Passport number is required for non-Polish citizens';
      }
      if (name === 'dateOfBirth' && !value) {
        errors[name] = 'Date of birth is required for non-Polish citizens';
      }
    }
    
    // General required fields
    if (['firstName', 'lastName', 'phoneNumber', 'street', 'city', 'zipCode', 'country'].includes(name) && !value) {
      const fieldName = name === 'zipCode' ? 'ZIP Code' : name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1');
      errors[name] = `${fieldName} is required`;
    }
    
    return errors;
  };

  const handleFieldChange = (field, value) => {
    const citizenship = formRef.current?.citizenship?.value || profileData?.citizenship;
    const fieldErrors = validateField(field, value, citizenship);
    
    setFormErrors(prev => ({
      ...prev,
      [field]: fieldErrors[field]
    }));
    
    setFormTouched(prev => ({
      ...prev,
      [field]: true
    }));
    
    setHasUnsavedChanges(true);
  };

  const handleFieldBlur = (field, value) => {
    const citizenship = formRef.current?.citizenship?.value || profileData?.citizenship;
    const fieldErrors = validateField(field, value, citizenship);
    
    setFormErrors(prev => ({
      ...prev,
      [field]: fieldErrors[field]
    }));
    
    setFormTouched(prev => ({
      ...prev,
      [field]: true
    }));
  };

  const validateForm = () => {
    const formData = new FormData(formRef.current);
    const citizenship = selectedCitizenship?.value || selectedCitizenship?.label;
    const errors = {};
    
    // Validate all fields
    const fields = ['firstName', 'lastName', 'phoneNumber', 'street', 'city', 'zipCode'];
    const isPolish = citizenship === 'Polish' || citizenship?.includes('Polish');
    
    if (isPolish) {
      fields.push('pesel');
    } else {
      fields.push('passportNumber');
      if (!dateOfBirth) {
        errors.dateOfBirth = 'Date of birth is required for non-Polish citizens';
      }
    }
    
    // Add country validation
    if (!selectedCountry?.label) {
      errors.country = 'Country is required';
    }
    
    fields.forEach(field => {
      const value = formData.get(field);
      const fieldErrors = validateField(field, value, selectedCitizenship);
      if (fieldErrors[field]) {
        errors[field] = fieldErrors[field];
      }
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const shakeForm = () => {
    setIsFormShaking(true);
    setTimeout(() => setIsFormShaking(false), 500);
  };

  const getFieldVisibility = (field, citizenship) => {
    if (!citizenship) return true;
    
    const isPolish = citizenship?.value === 'Polish' || citizenship?.label?.includes('Polish');
    
    const visibilityRules = {
      Polish: {
        pesel: true,
        idCardNumber: true,
        passportNumber: false,
        dateOfBirth: false
      },
      'Non-Polish': {
        pesel: true,
        idCardNumber: false,
        passportNumber: true,
        dateOfBirth: true
      }
    };
    
    return isPolish ? visibilityRules.Polish[field] : visibilityRules['Non-Polish'][field];
  };

  const getFieldRequirement = (field, citizenship) => {
    if (!citizenship) return false;
    
    const isPolish = citizenship?.value === 'Polish' || citizenship?.label?.includes('Polish');
    
    const requirementRules = {
      Polish: {
        pesel: true,
        idCardNumber: false,
        passportNumber: false,
        dateOfBirth: false
      },
      'Non-Polish': {
        pesel: false,
        idCardNumber: false,
        passportNumber: true,
        dateOfBirth: true
      }
    };
    
    return isPolish ? requirementRules.Polish[field] : requirementRules['Non-Polish'][field];
  };

  // Custom styles for react-select
  const selectStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '42px',
      border: state.isFocused ? '2px solid #3b82f6' : formErrors[state.name] && formTouched[state.name] ? '1px solid #ef4444' : '1px solid #d1d5db',
      borderRadius: '8px',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
      '&:hover': {
        border: state.isFocused ? '2px solid #3b82f6' : '1px solid #9ca3af'
      }
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#f3f4f6' : 'white',
      color: state.isSelected ? 'white' : '#374151',
      '&:hover': {
        backgroundColor: state.isSelected ? '#3b82f6' : '#f3f4f6'
      }
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '8px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#374151'
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af'
    })
  };

  const calculateProfileCompletion = () => {
    if (!profileData) return 0;
    
    const fields = [
      'firstName',
      'lastName',
      'email',
      'phoneNumber',
      'citizenship',
      'country',
      'profession'
    ];
    
    const conditionalFields = [];
    
    // Add conditional fields based on citizenship
    if (selectedCitizenship?.value === 'Polish') {
      conditionalFields.push('pesel');
    } else {
      conditionalFields.push('passportNumber', 'dateOfBirth');
    }
    
    const totalFields = [...fields, ...conditionalFields];
    let completedFields = 0;
    
    totalFields.forEach(field => {
      let value = profileData[field];
      
      // Handle special cases
      if (field === 'profession') {
        value = selectedProfession?.value === 'Other' ? otherProfession : selectedProfession?.value;
      } else if (field === 'citizenship') {
        value = selectedCitizenship?.value;
      } else if (field === 'country') {
        value = selectedCountry?.value;
      } else if (field === 'dateOfBirth') {
        value = dateOfBirth;
      }
      
      if (value && value.toString().trim() !== '') {
        completedFields++;
      }
    });
    
    return Math.round((completedFields / totalFields.length) * 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  // PESEL calculation function
  const calculateDateFromPESEL = (pesel) => {
    if (!pesel || pesel.length !== 11) return null;
    
    const year = parseInt(pesel.substring(0, 2));
    const month = parseInt(pesel.substring(2, 4));
    const day = parseInt(pesel.substring(4, 6));
    
    let fullYear;
    if (month >= 1 && month <= 12) {
      fullYear = 1900 + year;
    } else if (month >= 21 && month <= 32) {
      fullYear = 2000 + year;
    } else if (month >= 41 && month <= 52) {
      fullYear = 2100 + year;
    } else if (month >= 61 && month <= 72) {
      fullYear = 2200 + year;
    } else if (month >= 81 && month <= 92) {
      fullYear = 1800 + year;
    } else {
      return null;
    }
    
    const adjustedMonth = month > 20 ? month - 20 : month > 40 ? month - 40 : month > 60 ? month - 60 : month > 80 ? month - 80 : month;
    
    return new Date(fullYear, adjustedMonth - 1, day);
  };

  // Function to get full URL for profile photo
  const getProfilePhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    
    // If it's already a full URL, return as is
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
      return photoPath;
    }
    
    // If it's just a filename, construct full URL to profile_images directory
    if (!photoPath.startsWith('/')) {
      const baseUrl = 'http://localhost:3001';
      return `${baseUrl}/uploads/profile_images/${photoPath}`;
    }
    
    // If it's a relative path starting with /uploads/, construct full URL
    if (photoPath.startsWith('/uploads/')) {
      const baseUrl = 'http://localhost:3001';
      return `${baseUrl}${photoPath}`;
    }
    
    // If it's a relative path, construct full URL
    const baseUrl = 'http://localhost:3001';
    return `${baseUrl}${photoPath}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary flex">
      {/* Left Sidebar */}
      <TenantSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="header-modern px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
            
            <div className="flex items-center space-x-4">
              <NotificationHeader />
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {error && (
              <div className="text-sm text-red-600 p-4 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            {/* Profile Header Card */}
            <div className="card-modern p-6">
              <div className="flex items-start justify-between">
                {/* Left side - Avatar and user info */}
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    {/* Profile Photo */}
                    <div 
                      className="relative w-24 h-24 rounded-full ring-2 ring-gray-200 overflow-hidden cursor-pointer group"
                      onMouseEnter={() => setShowPhotoOverlay(true)}
                      onMouseLeave={() => !showPhotoActions && setShowPhotoOverlay(false)}
                      onClick={handlePhotoClick}
                    >
                      {/* Photo Display */}
                      {(photoPreview || profilePhoto) ? (
                        <img
                          src={photoPreview || getProfilePhotoUrl(profilePhoto)}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Profile photo failed to load:', e.target.src);
                            e.target.style.display = 'none';
                          }}
                          onLoad={() => {
                            // Profile photo loaded successfully
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                          <User className="w-12 h-12 text-blue-600" />
                        </div>
                      )}
                      
                      {/* Hover Overlay */}
                      {showPhotoOverlay && !showPhotoActions && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-200">
                          <div className="text-center text-white">
                            <Camera className="w-6 h-6 mx-auto mb-1" />
                            <span className="text-sm">Change Photo</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Photo Actions Overlay */}
                      {showPhotoActions && (
                        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                          <div className="flex space-x-2">
                            <button
                              onClick={handlePhotoSave}
                              disabled={isPhotoUploading}
                              className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 transition-colors"
                              title="Save"
                            >
                              {isPhotoUploading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={handlePhotoCancel}
                              disabled={isPhotoUploading}
                              className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Remove Photo Button */}
                      {profilePhoto && !showPhotoActions && showPhotoOverlay && (
                        <button
                          onClick={handlePhotoRemove}
                          disabled={isPhotoUploading}
                          className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full border-2 border-white flex items-center justify-center hover:bg-red-600 disabled:opacity-50 transition-colors"
                          title="Remove Photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    
                    {/* Hidden File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                      {profileData?.firstName} {profileData?.lastName}
                    </h2>
                    <p className="text-gray-600 mb-1">{profileData?.email}</p>
                    <p className="text-sm text-gray-500 mb-2">Member since {formatDate(user?.createdAt)}</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Tenant
                    </span>
                  </div>
                </div>
                
                {/* Right side - Profile completion */}
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 mb-2">Profile completion {profileStatus.completionPercentage}%</p>
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                                              style={{ width: `${profileStatus.completionPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600">Complete</p>
                </div>
              </div>
            </div>

            {/* Personal Information & Address Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h2 className="text-lg font-semibold text-gray-900">Personal Information & Address</h2>
                </div>
                
                <button
                  onClick={handleEditToggle}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <form ref={formRef} onSubmit={handleFormSubmit} className={`${isFormShaking ? 'animate-pulse' : ''}`}>
                {/* Personal Information Section */}
                <div className="mb-8">
                  <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="firstName"
                          defaultValue={profileData?.firstName || ''}
                          onChange={(e) => handleFieldChange('firstName', e.target.value)}
                          onBlur={(e) => handleFieldBlur('firstName', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            formErrors.firstName && formTouched.firstName ? 'border-red-500' : 'border-gray-300'
                          }`}
                          required
                        />
                      ) : (
                        <p className="text-gray-900">{profileData?.firstName || 'Not provided'}</p>
                      )}
                      {formErrors.firstName && formTouched.firstName && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.firstName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="lastName"
                          defaultValue={profileData?.lastName || ''}
                          onChange={(e) => handleFieldChange('lastName', e.target.value)}
                          onBlur={(e) => handleFieldBlur('lastName', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            formErrors.lastName && formTouched.lastName ? 'border-red-500' : 'border-gray-300'
                          }`}
                          required
                        />
                      ) : (
                        <p className="text-gray-900">{profileData?.lastName || 'Not provided'}</p>
                      )}
                      {formErrors.lastName && formTouched.lastName && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.lastName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          name="phoneNumber"
                          defaultValue={profileData?.phoneNumber || ''}
                          onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                          onBlur={(e) => handleFieldBlur('phoneNumber', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            formErrors.phoneNumber && formTouched.phoneNumber ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="+48 123 456 789"
                          required
                        />
                      ) : (
                        <p className="text-gray-900">{profileData?.phoneNumber || 'Not provided'}</p>
                      )}
                      {formErrors.phoneNumber && formTouched.phoneNumber && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.phoneNumber}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Citizenship <span className="text-red-500">*</span>
                        <div className="inline-flex items-center ml-1" title="Select your citizenship to determine required identification documents">
                          <Info className="w-4 h-4 text-gray-400" />
                        </div>
                      </label>
                      {isEditing ? (
                        <Select
                          options={citizenshipOptions}
                          value={selectedCitizenship}
                          onChange={handleCitizenshipChange}
                          onBlur={() => handleFieldBlur('citizenship', selectedCitizenship?.value)}
                          className="w-full"
                          styles={selectStyles}
                          placeholder="Select citizenship"
                        />
                      ) : (
                                                  <p className="text-gray-900">{selectedCitizenship?.label?.replace(/^[\u{1F1E6}-\u{1F1FF}]{2}\s*/u, '') || profileData?.citizenship || 'Not provided'}</p>
                      )}
                      {formErrors.citizenship && formTouched.citizenship && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.citizenship}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Identification Section */}
                <div className="mb-8">
                  <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    Identification
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* PESEL - Visible for Polish, optional for Non-Polish */}
                    {getFieldVisibility('pesel', selectedCitizenship) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          PESEL {getFieldRequirement('pesel', selectedCitizenship) && <span className="text-red-500">*</span>}
                          <div className="inline-flex items-center ml-1" title="Polish national identification number (11 digits). Date of birth is automatically calculated from PESEL for Polish citizens.">
                            <Info className="w-4 h-4 text-gray-400" />
                          </div>
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="pesel"
                            defaultValue={profileData?.pesel || ''}
                            onChange={(e) => handlePESELChange(e.target.value)}
                            onBlur={(e) => handleFieldBlur('pesel', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                              formErrors.pesel && formTouched.pesel ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="12345678901"
                            maxLength="11"
                            required={getFieldRequirement('pesel', selectedCitizenship)}
                          />
                        ) : (
                          <p className="text-gray-900">{profileData?.pesel || 'Not provided'}</p>
                        )}
                        {formErrors.pesel && formTouched.pesel && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.pesel}</p>
                        )}
                        {/* Show calculated date of birth for Polish citizens */}
                        {selectedCitizenship?.value === 'Polish' && profileData?.pesel && dateOfBirth && (
                          <p className="mt-1 text-sm text-green-600">
                            Date of birth calculated from PESEL: {dateOfBirth.toLocaleDateString('en-GB')}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Passport Number - Visible for Non-Polish, required */}
                    {getFieldVisibility('passportNumber', selectedCitizenship) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Passport Number {getFieldRequirement('passportNumber', selectedCitizenship) && <span className="text-red-500">*</span>}
                          <div className="inline-flex items-center ml-1" title="Required for non-Polish citizens. Please provide your valid passport number.">
                            <Info className="w-4 h-4 text-gray-400" />
                          </div>
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="passportNumber"
                            defaultValue={profileData?.passportNumber || ''}
                            onChange={(e) => handleFieldChange('passportNumber', e.target.value)}
                            onBlur={(e) => handleFieldBlur('passportNumber', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                              formErrors.passportNumber && formTouched.passportNumber ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="AB1234567"
                            required={getFieldRequirement('passportNumber', selectedCitizenship)}
                          />
                        ) : (
                          <p className="text-gray-900">{profileData?.passportNumber || 'Not provided'}</p>
                        )}
                        {formErrors.passportNumber && formTouched.passportNumber && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.passportNumber}</p>
                        )}
                      </div>
                    )}
                    
                    {/* Date of Birth - Visible for Non-Polish, required */}
                    {getFieldVisibility('dateOfBirth', selectedCitizenship) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date of Birth {getFieldRequirement('dateOfBirth', selectedCitizenship) && <span className="text-red-500">*</span>}
                          <div className="inline-flex items-center ml-1" title="Required for non-Polish citizens. For Polish citizens, this is automatically calculated from PESEL.">
                            <Info className="w-4 h-4 text-gray-400" />
                          </div>
                        </label>
                        {isEditing ? (
                          <DatePicker
                            selected={dateOfBirth}
                            onChange={(date) => {
                              setDateOfBirth(date);
                              handleFieldChange('dateOfBirth', date);
                            }}
                            onBlur={() => handleFieldBlur('dateOfBirth', dateOfBirth)}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                              formErrors.dateOfBirth && formTouched.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                            }`}
                            dateFormat="dd/MM/yyyy"
                            maxDate={new Date()}
                            minDate={new Date(1900, 0, 1)}
                            showYearDropdown
                            scrollableYearDropdown
                            yearDropdownItemNumber={150}
                            placeholderText="DD/MM/YYYY"
                            required={getFieldRequirement('dateOfBirth', selectedCitizenship)}
                            openToDate={dateOfBirth || new Date(1990, 0, 1)}
                          />
                        ) : (
                          <p className="text-gray-900">
                            {dateOfBirth ? dateOfBirth.toLocaleDateString('en-GB') : 'Not provided'}
                          </p>
                        )}
                        {formErrors.dateOfBirth && formTouched.dateOfBirth && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.dateOfBirth}</p>
                        )}
                      </div>
                    )}
                    
                    {/* ID Card Number - Visible for Polish, optional */}
                    {getFieldVisibility('idCardNumber', selectedCitizenship) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ID Card Number
                          <div className="inline-flex items-center ml-1" title="Polish ID card number (optional)">
                            <Info className="w-4 h-4 text-gray-400" />
                          </div>
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="idCardNumber"
                            defaultValue={profileData?.dowodOsobistyNumber || ''}
                            onChange={(e) => handleFieldChange('idCardNumber', e.target.value)}
                            onBlur={(e) => handleFieldBlur('idCardNumber', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            placeholder="ABC123456"
                          />
                        ) : (
                          <p className="text-gray-900">{profileData?.dowodOsobistyNumber || 'Not provided'}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="mb-8">
                  <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address <span className="text-red-500">*</span>
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="street"
                          defaultValue={profileData?.street || ''}
                          onChange={(e) => handleFieldChange('street', e.target.value)}
                          onBlur={(e) => handleFieldBlur('street', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            formErrors.street && formTouched.street ? 'border-red-500' : 'border-gray-300'
                          }`}
                          required
                        />
                      ) : (
                        <p className="text-gray-900">{profileData?.street || 'Not provided'}</p>
                      )}
                      {formErrors.street && formTouched.street && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.street}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City <span className="text-red-500">*</span>
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="city"
                          defaultValue={profileData?.city || ''}
                          onChange={(e) => handleFieldChange('city', e.target.value)}
                          onBlur={(e) => handleFieldBlur('city', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            formErrors.city && formTouched.city ? 'border-red-500' : 'border-gray-300'
                          }`}
                          required
                        />
                      ) : (
                        <p className="text-gray-900">{profileData?.city || 'Not provided'}</p>
                      )}
                      {formErrors.city && formTouched.city && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.city}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP Code <span className="text-red-500">*</span>
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="zipCode"
                          defaultValue={profileData?.zipCode || ''}
                          onChange={(e) => handleFieldChange('zipCode', e.target.value)}
                          onBlur={(e) => handleFieldBlur('zipCode', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            formErrors.zipCode && formTouched.zipCode ? 'border-red-500' : 'border-gray-300'
                          }`}
                          required
                        />
                      ) : (
                        <p className="text-gray-900">{profileData?.zipCode || 'Not provided'}</p>
                      )}
                      {formErrors.zipCode && formTouched.zipCode && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.zipCode}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country <span className="text-red-500">*</span>
                      </label>
                      {isEditing ? (
                        <Select
                          options={countries}
                          value={selectedCountry}
                          onChange={handleCountryChange}
                          onBlur={() => handleFieldBlur('country', selectedCountry?.label)}
                          className="w-full"
                          styles={selectStyles}
                          placeholder="Select country"
                        />
                      ) : (
                                                  <p className="text-gray-900">{selectedCountry?.label?.replace(/^[\u{1F1E6}-\u{1F1FF}]{2}\s*/u, '') || profileData?.country || 'Not provided'}</p>
                      )}
                      {formErrors.country && formTouched.country && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.country}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profession Section */}
                <div className="mb-8">
                  <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                    </svg>
                    Professional Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Profession <span className="text-red-500">*</span>
                      </label>
                      {isEditing ? (
                        <div>
                          <Select
                            options={professionOptions}
                            value={selectedProfession}
                            onChange={handleProfessionChange}
                            onBlur={() => handleFieldBlur('profession', selectedProfession?.value)}
                            className="w-full"
                            styles={selectStyles}
                            placeholder="Select your profession"
                            isSearchable={true}
                            isClearable={false}
                          />
                          {showOtherProfession && (
                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Specify Profession <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={otherProfession}
                                onChange={(e) => setOtherProfession(e.target.value)}
                                onBlur={() => handleFieldBlur('profession', otherProfession)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                  formErrors.profession && formTouched.profession ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Enter your profession"
                                required
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-900">
                          {selectedProfession?.value === 'Other' ? otherProfession : selectedProfession?.value || profileData?.profession || 'Not provided'}
                        </p>
                      )}
                      {formErrors.profession && formTouched.profession && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.profession}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Save Changes Button */}
                {isEditing && (
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!hasUnsavedChanges}
                      className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                        hasUnsavedChanges 
                          ? 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500' 
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Digital Signature Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900">Digital Signature (Required)</h2>
              </div>
              
              {hasSignature && !isEditing ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <p className="text-green-800 font-medium">Digital signature saved</p>
                        <p className="text-green-700 text-sm">Saved on Aug 8, 2025</p>
                      </div>
                    </div>
                    <button
                      onClick={handleEditToggle}
                      className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  </div>
                  
                  {/* Signature Preview */}
                  {(currentSignature || profileData?.signatureBase64) && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Signature Preview:</p>
                      <div className="flex justify-center">
                        <img 
                          src={currentSignature || profileData.signatureBase64} 
                          alt="Your signature" 
                          className="max-w-full h-24 object-contain border border-gray-300 rounded"
                          onError={(e) => {
                            console.error('Error loading signature preview:', e);
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
                    {console.log('Rendering SignatureCanvas component')}
                    <SignatureCanvas
                      ref={(ref) => {
                        console.log('SignatureCanvas ref:', ref);
                        setSignaturePad(ref);
                      }}
                      canvasProps={{
                        className: 'w-full h-32 border border-gray-300 rounded'
                      }}
                    />
                    <p className="text-sm text-gray-500 mt-2">Draw your signature above</p>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSignatureClear}
                      className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Clear signature
                    </button>
                    
                    <button
                      onClick={handleSignatureSave}
                      disabled={isSavingSignature}
                      className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingSignature ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          Save signature
                        </>
                      )}
                    </button>
                    
                    {isEditing && (
                      <button
                        onClick={handleEditToggle}
                        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Contact Verification Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Verification</h2>
              
              <div className="space-y-4">
                {/* Phone Verification */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-gray-900">{profileData?.phoneNumber || '+48573997766'}</span>
                  </div>
                  <button
                    onClick={handlePhoneVerification}
                    disabled={phoneVerificationSent}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Send OTP
                  </button>
                </div>
                
                {/* Email Verification */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-900">{profileData?.email || 'tenant@test.com'}</span>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Identity Verification (KYC) Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <h2 className="text-lg font-semibold text-gray-900">Identity Verification (KYC)</h2>
                </div>
                
                {/* KYC Status Badge */}
                {kycStatus !== 'NOT_SUBMITTED' && (
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    kycStatus === 'APPROVED' 
                      ? 'bg-green-100 text-green-800' 
                      : kycStatus === 'REJECTED' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {kycStatus === 'APPROVED' && (
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {kycStatus === 'REJECTED' && (
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    {kycStatus === 'PENDING' && (
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {kycStatus === 'APPROVED' ? 'Approved' : kycStatus === 'REJECTED' ? 'Rejected' : 'Pending Review'}
                  </div>
                )}
              </div>
              
              {/* Success Message */}
              {kycSubmissionSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                  {kycSubmissionSuccess}
                </div>
              )}
              
              {/* Error Message */}
              {kycSubmissionError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {kycSubmissionError}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    {kycFiles.idFront ? (
                      <div className="mb-4">
                        <div className="flex items-center justify-center mb-2">
                          <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm font-medium text-green-600">ID Front uploaded</span>
                        </div>
                        <p className="text-xs text-gray-500">{kycFiles.idFront.name}</p>
                        <button
                          onClick={() => setKycFiles(prev => ({ ...prev, idFront: null }))}
                          className="mt-2 text-xs text-red-600 hover:text-red-800"
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg className="w-8 h-8 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Upload ID Front</h3>
                        <p className="text-xs text-gray-500 mb-4">JPG, PNG (max 5MB)</p>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={(e) => handleKycUpload('idFront', e.target.files[0])}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                    />
                  </div>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    {kycFiles.idBack ? (
                      <div className="mb-4">
                        <div className="flex items-center justify-center mb-2">
                          <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm font-medium text-green-600">ID Back uploaded</span>
                        </div>
                        <p className="text-xs text-gray-500">{kycFiles.idBack.name}</p>
                        <button
                          onClick={() => setKycFiles(prev => ({ ...prev, idBack: null }))}
                          className="mt-2 text-xs text-red-600 hover:text-red-800"
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg className="w-8 h-8 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Upload ID Back</h3>
                        <p className="text-xs text-gray-500 mb-4">JPG, PNG (max 5MB)</p>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={(e) => handleKycUpload('idBack', e.target.files[0])}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* GDPR / RODO Consent Section - Only show after both files are uploaded */}
              {(kycFiles.idFront && kycFiles.idBack) && (
                <>
                  <div className="border border-gray-200 rounded-md p-4 bg-gray-50 mb-6">
                    <div className="space-y-4">
                      {/* English Consent */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">GDPR / RODO Consent (English)</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          I hereby consent to the processing of my personal data, including identity documents, by RentDash for the purpose of verifying my identity in accordance with applicable law. My data will be processed and stored securely for the duration of my account and in compliance with Regulation (EU) 2016/679 (GDPR). I understand that I have the right to access, correct, delete, or limit the processing of my data at any time, as well as the right to lodge a complaint with the relevant supervisory authority. Providing my data is voluntary, however refusal may result in the inability to use certain services.
                        </p>
                      </div>
                      
                      {/* Polish Consent */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">GDPR / RODO Consent (Polski)</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Wyrażam zgodę na przetwarzanie moich danych osobowych, w tym dokumentów tożsamości, przez RentDash w celu weryfikacji mojej tożsamości zgodnie z obowiązującymi przepisami prawa. Moje dane będą przetwarzane i przechowywane w sposób bezpieczny przez czas trwania mojego konta, zgodnie z Rozporządzeniem (UE) 2016/679 (RODO). Rozumiem, że mam prawo do dostępu, sprostowania, usunięcia lub ograniczenia przetwarzania moich danych w dowolnym momencie, a także prawo do wniesienia skargi do właściwego organu nadzorczego. Podanie danych jest dobrowolne, jednak ich brak może uniemożliwić korzystanie z niektórych usług.
                        </p>
                      </div>
                      
                      {/* Consent Checkbox */}
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="gdprConsent"
                          checked={gdprConsent}
                          onChange={(e) => setGdprConsent(e.target.checked)}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="gdprConsent" className="text-sm font-medium text-gray-900">
                          I have read and accept the GDPR / RODO terms
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button - Only show after both files are uploaded */}
                  <div className="flex justify-center">
                    <button
                      onClick={handleKycSubmit}
                      disabled={!gdprConsent || isSubmittingKyc}
                      className="flex items-center px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {isSubmittingKyc ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Submit KYC Documents
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-6"></div>

            {/* Security Settings Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <Lock className="w-5 h-5 text-gray-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
              </div>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                {/* Success/Error Messages */}
                {passwordSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    {passwordSuccess}
                  </div>
                )}
                
                {passwordError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {passwordError}
                  </div>
                )}

                {/* Current Password */}
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    aria-label="Current password"
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    placeholder="Enter current password"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      passwordErrors.currentPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {passwordErrors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    aria-label="New password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    placeholder="Enter new password"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      passwordErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  
                  {/* Password Strength Indicator */}
                  {passwordData.newPassword && (
                    <div className="mt-2" aria-live="polite">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-500">Password strength</span>
                        <span className={`text-sm font-medium ${
                          calculatePasswordStrength(passwordData.newPassword).strength === 'weak' ? 'text-red-600' :
                          calculatePasswordStrength(passwordData.newPassword).strength === 'medium' ? 'text-orange-600' :
                          'text-green-600'
                        }`}>
                          {calculatePasswordStrength(passwordData.newPassword).text}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${calculatePasswordStrength(passwordData.newPassword).color}`}
                          style={{ width: `${calculatePasswordStrength(passwordData.newPassword).percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    aria-label="Confirm new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    placeholder="Confirm new password"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                  )}
                </div>

                {/* Save Changes Button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isPasswordLoading}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isPasswordLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>


      </div>
    </div>
  );
};

export default TenantProfile; 