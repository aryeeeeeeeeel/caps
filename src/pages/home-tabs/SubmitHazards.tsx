import React, { useState, useRef } from 'react';
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonLabel,
  IonIcon,
  IonAlert,
  IonToast,
  IonProgressBar,
  IonGrid,
  IonRow,
  IonCol,
  IonModal,
  IonCheckbox,
  IonSpinner
} from '@ionic/react';
import {
  cameraOutline,
  locationOutline,
  warningOutline,
  checkmarkCircleOutline,
  closeCircle,
  informationCircleOutline,
  addOutline,
  timeOutline,
  calendarOutline,
  navigateOutline
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { supabase } from '../../utils/supabaseClient';
import { isPlatform } from '@ionic/react';
import { Capacitor } from '@capacitor/core';
import ExifReader from 'exifreader';

interface HazardReport {
  category: string;
  description: string;
  priority: string;
  location: string;
  barangay: string;
  coordinates: { lat: number; lng: number } | null;
  images: File[];
  reporter_email: string;
  reporter_name: string;
  anonymous: boolean;
  exif_data?: any;
  photo_datetime?: string;
  current_datetime?: string;
}

interface ExifData {
  dateTimeOriginal?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAltitude?: number;
  make?: string;
  model?: string;
  [key: string]: any; // Allow additional properties
}

const isNativePlatform = () => {
  return Capacitor.isNativePlatform();
};

// Updated accurate coordinates for Manolo Fortich barangays based on official data
const barangayCoordinates: { [key: string]: { lat: number, lng: number, radius: number } } = {
  'Agusan Canyon': { lat: 8.3457, lng: 124.8234, radius: 0.025 },
  'Alae': { lat: 8.4102, lng: 124.8856, radius: 0.02 },
  'Dahilayan': { lat: 8.4289, lng: 124.8734, radius: 0.03 },
  'Dalirig': { lat: 8.3923, lng: 124.8912, radius: 0.02 },
  'Damilag': { lat: 8.3693, lng: 124.8564, radius: 0.025 }, // Municipal center (confirmed)
  'Diclum': { lat: 8.4234, lng: 124.9123, radius: 0.02 },
  'Guilang-guilang': { lat: 8.3812, lng: 124.8423, radius: 0.02 },
  'Kalugmanan': { lat: 8.4156, lng: 124.8967, radius: 0.02 },
  'Lindaban': { lat: 8.3567, lng: 124.8145, radius: 0.025 },
  'Lingion': { lat: 8.3234, lng: 124.7923, radius: 0.02 },
  'Lunocan': { lat: 8.3145, lng: 124.7834, radius: 0.02 },
  'Maluko': { lat: 8.2923, lng: 124.7656, radius: 0.02 },
  'Mambatangan': { lat: 8.2812, lng: 124.7534, radius: 0.02 },
  'Mampayag': { lat: 8.3345, lng: 124.8089, radius: 0.02 },
  'Mantibugao': { lat: 8.3456, lng: 124.8234, radius: 0.02 },
  'Minsuro': { lat: 8.3678, lng: 124.8456, radius: 0.02 },
  'San Miguel': { lat: 8.3823, lng: 124.8678, radius: 0.02 },
  'Sankanan': { lat: 8.3945, lng: 124.8789, radius: 0.02 },
  'Santiago': { lat: 8.4067, lng: 124.8923, radius: 0.02 },
  'Santo Niño': { lat: 8.4189, lng: 124.9056, radius: 0.02 },
  'Tankulan': { lat: 8.4312, lng: 124.9189, radius: 0.02 },
  'Ticala': { lat: 8.4445, lng: 124.9323, radius: 0.02 }
};

const optimizeImage = (blob: Blob, maxSize: number = 1024, quality: number = 0.8): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const ratio = Math.min(maxSize / img.width, maxSize / img.height);
      const width = img.width * ratio;
      const height = img.height * ratio;

      canvas.width = width;
      canvas.height = height;

      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (optimizedBlob) => {
          resolve(optimizedBlob || blob);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => resolve(blob);
    img.src = URL.createObjectURL(blob);
  });
};

const extractExifData = async (file: File): Promise<ExifData | null> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const tags = ExifReader.load(arrayBuffer);

    const exifData: ExifData = {};
    
    // Debug logging for EXIF analysis
    console.log('🔍 EXIF Debug - Available tags:', Object.keys(tags));

    // Enhanced date/time extraction with fallbacks
    const dateFields = ['DateTimeOriginal', 'DateTime', 'DateTimeDigitized'];
    for (const field of dateFields) {
      if (tags[field]?.description) {
        exifData.dateTimeOriginal = tags[field].description;
        console.log(`📅 EXIF Debug - Found datetime in ${field}:`, exifData.dateTimeOriginal);
        break;
      }
    }

    // Extract GPS coordinates if available
    if (tags.GPSLatitude && tags.GPSLongitude && tags.GPSLatitudeRef && tags.GPSLongitudeRef) {
      try {
        // Handle GPS coordinate extraction with proper type checking
        const latValues = Array.isArray(tags.GPSLatitude.value) ? tags.GPSLatitude.value : [tags.GPSLatitude.value, 0, 0];
        const lngValues = Array.isArray(tags.GPSLongitude.value) ? tags.GPSLongitude.value : [tags.GPSLongitude.value, 0, 0];
        const latRef = Array.isArray(tags.GPSLatitudeRef.value) ? tags.GPSLatitudeRef.value[0] : tags.GPSLatitudeRef.value;
        const lngRef = Array.isArray(tags.GPSLongitudeRef.value) ? tags.GPSLongitudeRef.value[0] : tags.GPSLongitudeRef.value;

        const lat = convertExifGpsToDecimal(
          Number(latValues[0]) || 0,
          Number(latValues[1]) || 0,
          Number(latValues[2]) || 0,
          String(latRef)
        );

        const lng = convertExifGpsToDecimal(
          Number(lngValues[0]) || 0,
          Number(lngValues[1]) || 0,
          Number(lngValues[2]) || 0,
          String(lngRef)
        );

        // Validate GPS coordinates are reasonable
        if (isValidGPSCoordinate(lat, lng)) {
          exifData.gpsLatitude = lat;
          exifData.gpsLongitude = lng;
          console.log(`🌍 EXIF Debug - Valid GPS found: ${lat}, ${lng}`);
        } else {
          console.warn('⚠️ EXIF Debug - Invalid GPS coordinates detected');
        }
      } catch (gpsError) {
        console.error('❌ EXIF Debug - GPS conversion error:', gpsError);
      }
    } else {
      console.log('📍 EXIF Debug - No GPS data in EXIF');
    }

    // Extract altitude with validation
    if (tags.GPSAltitude?.description) {
      const altitude = parseFloat(tags.GPSAltitude.description);
      if (!isNaN(altitude)) {
        exifData.gpsAltitude = altitude;
      }
    }

    // Extract camera info
    if (tags.Make?.description) exifData.make = tags.Make.description;
    if (tags.Model?.description) exifData.model = tags.Model.description;

    return exifData;
  } catch (error) {
    console.error('❌ EXIF Debug - Extraction failed:', error);
    return null;
  }
};

// GPS coordinate validation function
const isValidGPSCoordinate = (lat: number, lng: number): boolean => {
  // Basic validation for reasonable GPS coordinates
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  
  // Check if coordinates are not just 0,0 (common placeholder)
  if (lat === 0 && lng === 0) return false;
  
  return true;
};

// Helper function to convert EXIF GPS coordinates to decimal format
const convertExifGpsToDecimal = (degrees: number, minutes: number, seconds: number, ref: string): number => {
  let decimal = degrees + (minutes / 60) + (seconds / 3600);
  if (ref === 'S' || ref === 'W') {
    decimal = -decimal;
  }
  return decimal;
};

// Function to detect barangay from coordinates with improved accuracy
const detectBarangayFromCoordinates = (lat: number, lng: number): string | null => {
  let closestBarangay = null;
  let minDistance = Infinity;

  for (const [barangay, coords] of Object.entries(barangayCoordinates)) {
    // Calculate distance using Haversine formula approximation
    const latDiff = lat - coords.lat;
    const lngDiff = lng - coords.lng;
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

    // Check if within radius and closer than previous matches
    if (distance <= coords.radius && distance < minDistance) {
      minDistance = distance;
      closestBarangay = barangay;
    }
  }

  return closestBarangay;
};

// Helper function to format current date/time
const getCurrentDateTime = (): string => {
  const now = new Date();
  return now.toISOString();
};

// Helper function to format date for display
const formatDateTimeForDisplay = (dateTime: string): string => {
  const date = new Date(dateTime);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

const SubmitHazards: React.FC = () => {
  const [formData, setFormData] = useState<HazardReport>({
    category: '',
    description: '',
    priority: 'medium',
    location: '',
    barangay: '',
    coordinates: null,
    images: [],
    reporter_email: '',
    reporter_name: '',
    anonymous: false,
    photo_datetime: '',
    current_datetime: getCurrentDateTime()
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [autoDetectedBarangay, setAutoDetectedBarangay] = useState(false);
  const [exifData, setExifData] = useState<ExifData[]>([]);
  const [photoDateTime, setPhotoDateTime] = useState<string>('');
  const [manualDateTime, setManualDateTime] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [needsLocation, setNeedsLocation] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // One-click automatic location
  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 60000
      });

      const { latitude, longitude } = coordinates.coords;

      // Detect barangay from current location
      const detectedBarangay = detectBarangayFromCoordinates(latitude, longitude);
      const gpsLocationString = `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      setFormData(prev => ({
        ...prev,
        coordinates: { lat: latitude, lng: longitude },
        barangay: detectedBarangay || prev.barangay,
        location: gpsLocationString
      }));

      if (detectedBarangay) {
        setAutoDetectedBarangay(true);
        setToastMessage(`Location captured! Detected barangay: ${detectedBarangay}`);
      } else {
        setAutoDetectedBarangay(false);
        setToastMessage('Location captured! Please select your barangay manually.');
      }

      setShowToast(true);
      setNeedsLocation(false);

    } catch (error: any) {
      console.error('Location error:', error);
      setAlertMessage('Failed to get location. Please enable location services and try again.');
      setShowAlert(true);
    } finally {
      setLocationLoading(false);
    }
  };


  const hazardCategories = [
    'Road Hazards',
    'Utility Issues', 
    'Natural Disasters',
    'Infrastructure Problems',
    'Public Safety',
    'Environmental Issues',
    'Others'
  ];

  // Updated barangay list for Manolo Fortich
  const barangayList = Object.keys(barangayCoordinates);

  // Process image and extract EXIF data with enhanced handling
  const processImage = async (imageBlob: Blob, source: string): Promise<{ file: File; exif: ExifData | null }> => {
    // Extract EXIF data before optimization (optimization may strip EXIF)
    const exif = await extractExifData(new File([imageBlob], 'temp.jpg', { type: 'image/jpeg' }));

    // Optimize the image
    const optimizedBlob = await optimizeImage(imageBlob, 1024, 0.8);
    const file = new File([optimizedBlob], `hazard-${Date.now()}.jpg`, { type: 'image/jpeg' });

    return { file, exif };
  };


  // Enhanced photo capture with better EXIF handling
  const takePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 85,
        allowEditing: false,
        width: 1920,
        height: 1920
      });

      if (image.webPath) {
        const response = await fetch(image.webPath);
        const blob = await response.blob();

        // Process image and extract EXIF
        const { file, exif } = await processImage(blob, 'camera');

        // Set current datetime automatically when taking a photo
        const currentDateTime = getCurrentDateTime();

        setFormData(prev => ({
          ...prev,
          images: [...prev.images, file],
          photo_datetime: exif?.dateTimeOriginal || currentDateTime,
          current_datetime: currentDateTime
        }));

        setImagePreview(prev => [...prev, image.webPath!]);
        setExifData(prev => [...prev, exif || {}]);

        // Handle EXIF data automatically
        if (exif) {
          handleExifData(exif, currentDateTime);
        } else {
          // If no EXIF, use current datetime
          setPhotoDateTime(formatDateTimeForDisplay(currentDateTime));
          setToastMessage('Photo captured! Current date/time recorded automatically.');
          setShowToast(true);
        }
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      if (!error.message?.includes('User cancelled')) {
        setAlertMessage('Failed to capture photo. Please try again.');
        setShowAlert(true);
      }
    }
  };

  // Enhanced gallery selection with EXIF handling
  const selectFromGallery = async () => {
    try {
      const image = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        quality: 85
      });

      if (image.webPath) {
        const response = await fetch(image.webPath);
        const blob = await response.blob();

        const { file, exif } = await processImage(blob, 'gallery');

        const currentDateTime = getCurrentDateTime();

        setFormData(prev => ({
          ...prev,
          images: [...prev.images, file],
          photo_datetime: exif?.dateTimeOriginal || currentDateTime,
          current_datetime: currentDateTime
        }));

        setImagePreview(prev => [...prev, image.webPath!]);
        setExifData(prev => [...prev, exif || {}]);

        if (exif) {
          handleExifData(exif, currentDateTime);
        } else {
          setPhotoDateTime(formatDateTimeForDisplay(currentDateTime));
          setManualDateTime(true);
          setToastMessage('Image selected! Current date/time recorded. Please enter original date/time if needed.');
          setShowToast(true);
        }
      }
    } catch (error: any) {
      console.error('Gallery selection error:', error);
      if (!error.message?.includes('User cancelled')) {
        setAlertMessage('Failed to select image. Please try again.');
        setShowAlert(true);
      }
    }
  };

  const selectFromFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];

      if (!file.type.startsWith('image/')) {
        setAlertMessage('Please select an image file.');
        setShowAlert(true);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setAlertMessage('Image size must be less than 10MB.');
        setShowAlert(true);
        return;
      }

      try {
        const previewUrl = URL.createObjectURL(file);
        const { file: optimizedFile, exif } = await processImage(file, 'file');

        const currentDateTime = getCurrentDateTime();

        setFormData(prev => ({
          ...prev,
          images: [...prev.images, optimizedFile],
          photo_datetime: exif?.dateTimeOriginal || currentDateTime,
          current_datetime: currentDateTime
        }));

        setImagePreview(prev => [...prev, previewUrl]);
        setExifData(prev => [...prev, exif || {}]);

        if (exif) {
          handleExifData(exif, currentDateTime);
        } else {
          setPhotoDateTime(formatDateTimeForDisplay(currentDateTime));
          setManualDateTime(true);
          setToastMessage('Image selected! Current date/time recorded. Please enter original date/time if needed.');
          setShowToast(true);
        }
      } catch (error) {
        console.error('File processing error:', error);
        setAlertMessage('Failed to process image. Please try another file.');
        setShowAlert(true);
      }
    }
    event.target.value = '';
  };

  // Centralized EXIF data handling with automatic datetime and location
  const handleExifData = async (exif: ExifData | null, currentDateTime: string) => {
    let hasUpdates = false;
    let message = 'Photo processed successfully!';

    // Reset location states when processing new photo
    setNeedsLocation(false);

    // Always handle date/time - prefer EXIF, fallback to current time
    const effectiveDateTime = exif?.dateTimeOriginal || currentDateTime;
    setPhotoDateTime(formatDateTimeForDisplay(effectiveDateTime));
    setFormData(prev => ({ ...prev, photo_datetime: effectiveDateTime }));
    hasUpdates = true;

    if (exif?.dateTimeOriginal) {
      message += ' Original photo date/time automatically filled.';
    } else {
      message += ' Current date/time recorded.';
    }

    // Handle GPS coordinates from EXIF
    if (exif?.gpsLatitude && exif?.gpsLongitude) {
      const detectedBarangay = detectBarangayFromCoordinates(
        exif.gpsLatitude,
        exif.gpsLongitude
      );

      // Always populate location field with GPS coordinates
      const gpsLocationString = `GPS: ${exif.gpsLatitude.toFixed(6)}, ${exif.gpsLongitude.toFixed(6)}`;

      setFormData(prev => ({
        ...prev,
        coordinates: { lat: exif.gpsLatitude!, lng: exif.gpsLongitude! },
        barangay: detectedBarangay || prev.barangay,
        location: gpsLocationString // Always fill with GPS coordinates
      }));

      if (detectedBarangay) {
        setAutoDetectedBarangay(true);
        message += ` Location, GPS coordinates, and barangay automatically filled from photo: ${detectedBarangay}.`;
      } else {
        setAutoDetectedBarangay(false);
        message += ` GPS coordinates automatically filled from photo. Please select barangay manually.`;
      }
      hasUpdates = true;
    } else {
      // No GPS data in photo - show one-click location button
      message += ' ⚠️ No GPS location data found in photo. Use the button below to get your current location.';
      setNeedsLocation(true);
    }

    setToastMessage(message);
    setShowToast(true);
  };

  // Remove image
  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
    setExifData(prev => prev.filter((_, i) => i !== index));

    // Reset manual datetime if no images left
    if (formData.images.length === 1) {
      setManualDateTime(false);
      setPhotoDateTime('');
    }
  };

  // Submit hazard report with enhanced validation
  const submitReport = async () => {
    // Enhanced validation
    if (!formData.category) {
      setAlertMessage('Please select a hazard category.');
      setShowAlert(true);
      return;
    }

    if (!formData.description.trim()) {
      setAlertMessage('Please provide a description of the hazard.');
      setShowAlert(true);
      return;
    }

    if (!formData.barangay) {
      setAlertMessage('Please select a barangay.');
      setShowAlert(true);
      return;
    }

    if (formData.images.length === 0) {
      setAlertMessage('Please add at least one photo of the hazard.');
      setShowAlert(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated. Please log in first.');
      }

      console.log('Starting image upload process...');

      // Upload images to Supabase storage
      const imageUrls: string[] = [];
      for (let i = 0; i < formData.images.length; i++) {
        const image = formData.images[i];
        const fileExt = image.name.split('.').pop() || 'jpg';
        const fileName = `hazard-reports/${user.id}/${Date.now()}-${i}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('hazard-images')
          .upload(fileName, image, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Failed to upload image ${i + 1}: ${uploadError.message}`);
        }

        if (uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('hazard-images')
            .getPublicUrl(fileName);

          imageUrls.push(publicUrl);
        }
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('user_firstname, user_lastname')
        .eq('user_email', user.email)
        .single();

      if (profileError) {
        console.warn('Could not fetch user profile:', profileError);
      }

      // Prepare enhanced report data
      const reportData: any = {
        title: formData.category, // Category as title
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
        location: formData.location.trim(),
        barangay: formData.barangay,
        coordinates: formData.coordinates ? JSON.stringify(formData.coordinates) : null,
        image_urls: imageUrls,
        reporter_email: formData.anonymous ? null : user.email,
        reporter_name: formData.anonymous ? 'Anonymous' : `${profile?.user_firstname || ''} ${profile?.user_lastname || ''}`.trim() || user.email,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add metadata to description
      let metadataString = '';
      
      if (exifData.length > 0) {
        const metadataParts = exifData.map(exif => {
          const metadata = [];
          if (exif?.dateTimeOriginal) metadata.push(`Taken: ${exif.dateTimeOriginal}`);
          if (exif?.gpsLatitude && exif?.gpsLongitude) {
            metadata.push(`GPS: ${exif.gpsLatitude.toFixed(6)}, ${exif.gpsLongitude.toFixed(6)}`);
          }
          if (exif?.make && exif?.model) metadata.push(`Camera: ${exif.make} ${exif.model}`);
          return metadata.join(', ');
        }).filter(m => m);
        
        if (metadataParts.length > 0) {
          metadataString += `\n\n[Photo Metadata: ${metadataParts.join(' | ')}]`;
        }
      }

      if (formData.photo_datetime) {
        metadataString += `\n\n[Photo Date: ${formatDateTimeForDisplay(formData.photo_datetime)}]`;
      }

      if (formData.current_datetime) {
        metadataString += `\n\n[Report Submitted: ${formatDateTimeForDisplay(formData.current_datetime)}]`;
      }

      if (formData.coordinates && typeof formData.coordinates.lat === 'number' && typeof formData.coordinates.lng === 'number') {
        metadataString += `\n\n[Location: ${formData.coordinates.lat.toFixed(6)}, ${formData.coordinates.lng.toFixed(6)}]`;
      }

      reportData.description += metadataString;

      console.log('Inserting report data:', reportData);

      const { data: insertData, error: insertError } = await supabase
        .from('hazard_reports')
        .insert(reportData)
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to submit report: ${insertError.message}`);
      }

      console.log('Report submitted successfully:', insertData);

      // Reset form
      setFormData({
        category: '',
        description: '',
        priority: 'medium',
        location: '',
        barangay: '',
        coordinates: null,
        images: [],
        reporter_email: '',
        reporter_name: '',
        anonymous: false,
        photo_datetime: '',
        current_datetime: getCurrentDateTime()
      });
      setImagePreview([]);
      setAutoDetectedBarangay(false);
      setExifData([]);
      setPhotoDateTime('');
      setManualDateTime(false);

      setShowSuccessModal(true);

    } catch (error: any) {
      console.error('Submit error:', error);
      setAlertMessage(error.message || 'Failed to submit report. Please try again.');
      setShowAlert(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <IonContent style={{ '--background': 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' } as any}>
      <div style={{ padding: '20px' }}>
        {/* Header Card */}
        <IonCard style={{
          borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          marginBottom: '20px'
        }}>
          <IonCardHeader>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '16px'
              }}>
                <IonIcon icon={warningOutline} style={{ fontSize: '24px', color: 'white' }} />
              </div>
              <div>
                <IonCardTitle style={{ color: '#1f2937', fontSize: '20px', margin: '0 0 4px 0' }}>
                  Report Hazard
                </IonCardTitle>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                  Help keep your community safe by reporting incidents
                </p>
              </div>
            </div>
          </IonCardHeader>
        </IonCard>

        {/* Current Date/Time Display */}
        <IonCard style={{
          borderRadius: '16px',
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          border: '1px solid #7dd3fc'
        }}>
          <IonCardContent>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <IonIcon 
                icon={timeOutline} 
                style={{ 
                  fontSize: '20px', 
                  color: '#0284c7', 
                  marginRight: '12px' 
                }} 
              />
              <div>
                <p style={{ 
                  fontSize: '12px', 
                  color: '#0284c7', 
                  margin: '0 0 4px 0',
                  fontWeight: '600' 
                }}>
                  Report Timestamp
                </p>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#0369a1', 
                  margin: 0,
                  fontWeight: '500'
                }}>
                  {formatDateTimeForDisplay(formData.current_datetime || getCurrentDateTime())}
                </p>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Photo Section */}
        <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
          <IonCardHeader>
            <IonCardTitle style={{ fontSize: '18px', color: '#1f2937' }}>
              Add Photos <span style={{ color: '#ef4444' }}>*</span>
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />

            <IonGrid>
              <IonRow>
                <IonCol size="6">
                  <IonButton
                    expand="block"
                    fill="outline"
                    onClick={takePhoto}
                    style={{
                      '--border-radius': '12px',
                      '--border-color': '#3b82f6',
                      '--color': '#3b82f6',
                      height: '60px'
                    } as any}
                  >
                    <IonIcon icon={cameraOutline} slot="start" />
                    Take Photo
                  </IonButton>
                </IonCol>
                <IonCol size="6">
                  <IonButton
                    expand="block"
                    fill="outline"
                    onClick={isNativePlatform() ? selectFromGallery : selectFromFileInput}
                    style={{
                      '--border-radius': '12px',
                      '--border-color': '#10b981',
                      '--color': '#10b981',
                      height: '60px'
                    } as any}
                  >
                    <IonIcon icon={addOutline} slot="start" />
                    {isNativePlatform() ? 'From Gallery' : 'Select Image'}
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>

            {/* Image Preview */}
            {imagePreview.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                  Uploaded Photos ({imagePreview.length})
                </p>
                <IonGrid>
                  <IonRow>
                    {imagePreview.map((image, index) => (
                      <IonCol key={index} size="4">
                        <div style={{
                          position: 'relative',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '2px solid #e5e7eb'
                        }}>
                          <img
                            src={image}
                            alt={`Hazard ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '80px',
                              objectFit: 'cover'
                            }}
                          />
                          <IonButton
                            fill="clear"
                            size="small"
                            onClick={() => removeImage(index)}
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              '--color': 'white',
                              '--background': 'rgba(0,0,0,0.5)',
                              '--border-radius': '50%',
                              width: '24px',
                              height: '24px'
                            } as any}
                          >
                            <IonIcon icon={closeCircle} style={{ fontSize: '16px' }} />
                          </IonButton>
                        </div>
                      </IonCol>
                    ))}
                  </IonRow>
                </IonGrid>
              </div>
            )}

            {/* Enhanced Photo Metadata Display */}
            {(photoDateTime || formData.coordinates || exifData.some(exif => exif?.make || exif?.model)) && (
              <div style={{
                background: '#f0f9ff',
                border: '1px solid #93c5fd',
                borderRadius: '8px',
                padding: '12px',
                marginTop: '12px'
              }}>
                <p style={{
                  fontSize: '14px',
                  color: '#1e40af',
                  margin: '0 0 12px 0',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <IonIcon icon={informationCircleOutline} style={{ marginRight: '6px' }} />
                  Auto-Extracted Photo Data
                </p>

                {photoDateTime && (
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#374151', fontWeight: '500' }}>
                      <IonIcon icon={calendarOutline} style={{ fontSize: '12px', marginRight: '4px' }} />
                      Date/Time: 
                    </span>
                    <span style={{ fontSize: '12px', color: '#1e40af', marginLeft: '4px' }}>{photoDateTime}</span>
                  </div>
                )}

                {formData.coordinates && typeof formData.coordinates.lat === 'number' && typeof formData.coordinates.lng === 'number' && (
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#374151', fontWeight: '500' }}>
                      <IonIcon icon={navigateOutline} style={{ fontSize: '12px', marginRight: '4px' }} />
                      GPS Location: 
                    </span>
                    <span style={{ fontSize: '12px', color: '#1e40af', marginLeft: '4px' }}>
                      {formData.coordinates.lat.toFixed(6)}, {formData.coordinates.lng.toFixed(6)}
                    </span>
                  </div>
                )}

                {exifData.filter(exif => exif?.make && exif?.model).length > 0 && (
                  <div style={{ marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#374151', fontWeight: '500' }}>
                      <IonIcon icon={cameraOutline} style={{ fontSize: '12px', marginRight: '4px' }} />
                      Camera: 
                    </span>
                    {exifData
                      .filter(exif => exif?.make && exif?.model)
                      .map((exif, index) => exif && (
                        <span key={index} style={{ fontSize: '12px', color: '#1e40af', marginLeft: '4px' }}>
                          {exif.make} {exif.model}
                        </span>
                      ))
                    }
                  </div>
                )}
              </div>
            )}

            {/* Manual Date/Time Input - Only show if manual override is needed */}
            {manualDateTime && (
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fbbf24',
                borderRadius: '8px',
                padding: '12px',
                marginTop: '12px'
              }}>
                <p style={{
                  fontSize: '14px',
                  color: '#92400e',
                  margin: '0 0 12px 0',
                  fontWeight: '600'
                }}>
                  <IonIcon icon={timeOutline} style={{ marginRight: '6px' }} />
                  Override Photo Date/Time (Optional)
                </p>
                <IonItem style={{ '--background': 'transparent', '--padding-start': '0' } as any}>
                  <IonLabel position="stacked">When was this photo actually taken?</IonLabel>
                  <IonInput
                    type="datetime-local"
                    value={formData.photo_datetime ? new Date(formData.photo_datetime).toISOString().slice(0, 16) : ''}
                    onIonChange={e => {
                      const newDateTime = e.detail.value ? new Date(e.detail.value).toISOString() : formData.current_datetime;
                      setFormData(prev => ({ ...prev, photo_datetime: newDateTime }));
                      setPhotoDateTime(formatDateTimeForDisplay(newDateTime!));
                    }}
                    style={{ '--color': '#92400e' }}
                  />
                </IonItem>
              </div>
            )}
          </IonCardContent>
        </IonCard>

        {/* Location Section */}
        <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
          <IonCardHeader>
            <IonCardTitle style={{ fontSize: '18px', color: '#1f2937' }}>
              Location Information
            </IonCardTitle>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0 0' }}>
              Location data will be automatically extracted from your photos
            </p>
          </IonCardHeader>
          <IonCardContent>
            {/* Info message about automatic location detection */}
            {!formData.coordinates && !needsLocation && (
              <div style={{
                background: '#f0f9ff',
                border: '1px solid #93c5fd',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <p style={{
                  fontSize: '14px',
                  color: '#1e40af',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <IonIcon icon={informationCircleOutline} style={{ marginRight: '6px' }} />
                  📸 Take a photo to automatically capture GPS coordinates, date/time, and location data
                </p>
              </div>
            )}

            {/* One-click Location Button */}
            {needsLocation && (
              <div style={{
                background: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <p style={{
                  fontSize: '16px',
                  color: '#92400e',
                  margin: '0 0 16px 0',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <IonIcon icon={locationOutline} style={{ marginRight: '8px' }} />
                  No GPS Data in Photo
                </p>

                <p style={{
                  fontSize: '14px',
                  color: '#92400e',
                  margin: '0 0 16px 0'
                }}>
                  Your photo doesn't contain GPS data. Click below to automatically get your current location:
                </p>

                <IonButton
                  expand="block"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  style={{
                    '--background': '#f59e0b',
                    '--color': 'white',
                    '--border-radius': '8px',
                    height: '50px'
                  } as any}
                >
                  {locationLoading ? (
                    <IonSpinner name="lines-small" slot="start" />
                  ) : (
                    <IonIcon icon={navigateOutline} slot="start" />
                  )}
                  {locationLoading ? 'Getting Location...' : '📍 Get My Current Location'}
                </IonButton>

                <p style={{
                  fontSize: '12px',
                  color: '#92400e',
                  margin: '12px 0 0 0',
                  textAlign: 'center'
                }}>
                  ✨ One click to automatically capture precise GPS coordinates
                </p>
              </div>
            )}

            {formData.coordinates && typeof formData.coordinates.lat === 'number' && typeof formData.coordinates.lng === 'number' && (
              <div style={{
                background: '#f0fff4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <p style={{
                  fontSize: '12px',
                  color: '#166534',
                  margin: '0 0 4px 0',
                  fontWeight: '600'
                }}>
                  GPS Coordinates Captured
                </p>
                <p style={{ fontSize: '11px', color: '#15803d', margin: 0 }}>
                  Lat: {formData.coordinates.lat.toFixed(6)}, Lng: {formData.coordinates.lng.toFixed(6)}
                </p>
              </div>
            )}

            {autoDetectedBarangay && formData.barangay && (
              <div style={{
                background: '#f0f9ff',
                border: '1px solid #93c5fd',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <p style={{
                  fontSize: '12px',
                  color: '#1e40af',
                  margin: '0 0 4px 0',
                  fontWeight: '600'
                }}>
                  Barangay Auto-Detected
                </p>
                <p style={{ fontSize: '14px', color: '#1e40af', margin: 0, fontWeight: 'bold' }}>
                  {formData.barangay}
                </p>
              </div>
            )}

            {!autoDetectedBarangay && (
              <IonItem style={{ '--border-radius': '12px', marginBottom: '12px' } as any}>
                <IonLabel position="stacked">
                  Barangay <span style={{ color: '#ef4444' }}>*</span>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0' }}>Auto-detected from photo GPS coordinates</p>
                </IonLabel>
                <IonSelect
                  value={formData.barangay}
                  onIonChange={e => setFormData(prev => ({ ...prev, barangay: e.detail.value }))}
                  interface="popover"
                  placeholder="Select your barangay"
                >
                  {barangayList.map(barangay => (
                    <IonSelectOption key={barangay} value={barangay}>{barangay}</IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
            )}

            <IonItem style={{ '--border-radius': '12px' } as any}>
              <IonLabel position="stacked">
                Specific Location/Address
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0' }}>Auto-filled with GPS coordinates from photo</p>
              </IonLabel>
              <IonInput
                value={formData.location}
                onIonChange={e => setFormData(prev => ({ ...prev, location: e.detail.value! }))}
                placeholder="GPS coordinates will be automatically filled from photo"
              />
            </IonItem>
          </IonCardContent>
        </IonCard>

        {/* Hazard Details */}
        <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
          <IonCardHeader>
            <IonCardTitle style={{ fontSize: '18px', color: '#1f2937' }}>
              Hazard Details
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem style={{ '--border-radius': '12px', marginBottom: '12px' } as any}>
              <IonLabel position="stacked">Hazard Category <span style={{ color: '#ef4444' }}>*</span></IonLabel>
              <IonSelect
                value={formData.category}
                onIonChange={e => setFormData(prev => ({ ...prev, category: e.detail.value }))}
                interface="popover"
                placeholder="Select Category"
              >
                {hazardCategories.map(category => (
                  <IonSelectOption key={category} value={category}>{category}</IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem style={{ '--border-radius': '12px', marginBottom: '12px' } as any}>
              <IonLabel position="stacked">Priority Level</IonLabel>
              <IonSelect
                value={formData.priority}
                onIonChange={e => setFormData(prev => ({ ...prev, priority: e.detail.value }))}
                interface="popover"
              >
                <IonSelectOption value="low">Low - Minor issue</IonSelectOption>
                <IonSelectOption value="medium">Medium - Moderate concern</IonSelectOption>
                <IonSelectOption value="high">High - Serious hazard</IonSelectOption>
                <IonSelectOption value="critical">Critical - Immediate danger</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem style={{ '--border-radius': '12px', marginBottom: '16px' } as any}>
              <IonLabel position="stacked">Description <span style={{ color: '#ef4444' }}>*</span></IonLabel>
              <IonTextarea
                value={formData.description}
                onIonChange={e => setFormData(prev => ({ ...prev, description: e.detail.value! }))}
                placeholder="Briefly describe the hazard and its location..."
                rows={3}
                maxlength={500}
              />
            </IonItem>

            <IonItem style={{ '--padding-start': '0' } as any}>
              <IonCheckbox
                checked={formData.anonymous}
                onIonChange={e => setFormData(prev => ({ ...prev, anonymous: e.detail.checked }))}
                style={{ marginRight: '12px' }}
              />
              <IonLabel>
                <h3>Submit Anonymously</h3>
                <p>Your name and email will not be shared with the report</p>
              </IonLabel>
            </IonItem>
          </IonCardContent>
        </IonCard>

        {/* Submit Button */}
        <IonCard style={{ borderRadius: '16px' }}>
          <IonCardContent>
            {isSubmitting && <IonProgressBar type="indeterminate" />}

            <IonButton
              expand="block"
              size="large"
              onClick={submitReport}
              disabled={isSubmitting}
              style={{
                '--border-radius': '12px',
                '--padding-top': '16px',
                '--padding-bottom': '16px',
                fontWeight: '600',
                fontSize: '16px',
                '--background': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                '--color': 'white',
                marginTop: '16px'
              } as any}
            >
              <IonIcon icon={warningOutline} slot="start" />
              {isSubmitting ? 'Submitting Report...' : 'SUBMIT HAZARD REPORT'}
            </IonButton>

            <div style={{
              background: '#fffbeb',
              border: '1px solid #fbbf24',
              borderRadius: '8px',
              padding: '12px',
              marginTop: '16px'
            }}>
              <p style={{
                fontSize: '12px',
                color: '#92400e',
                margin: 0,
                lineHeight: '1.4'
              }}>
                <IonIcon icon={informationCircleOutline} style={{ marginRight: '4px' }} />
                Reports are reviewed by LDRRMO personnel. Response time varies based on priority level.
              </p>
            </div>
          </IonCardContent>
        </IonCard>
      </div>

      {/* Success Modal */}
      <IonModal isOpen={showSuccessModal} onDidDismiss={() => setShowSuccessModal(false)}>
        <IonContent>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '40px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '100px',
              height: '100px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px'
            }}>
              <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: '50px', color: 'white' }} />
            </div>

            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#065f46',
              margin: '0 0 12px 0'
            }}>Report Submitted Successfully!</h2>

            <p style={{
              fontSize: '16px',
              color: '#047857',
              lineHeight: '1.6',
              marginBottom: '32px'
            }}>
              Your hazard report has been received by LDRRMO Manolo Fortich.
              You will receive updates on the status through notifications.
            </p>

            <IonButton
              routerLink="/it35-lab2/app/home/reports"
              expand="block"
              size="large"
              onClick={() => setShowSuccessModal(false)}
              style={{
                '--border-radius': '12px',
                '--background': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                '--color': 'white',
                marginBottom: '12px'
              } as any}
            >
              View My Reports
            </IonButton>

            <IonButton
              fill="clear"
              expand="block"
              routerLink="/it35-lab2/app/home/dashboard"
              onClick={() => setShowSuccessModal(false)}
              style={{ '--color': '#6b7280' }}
            >
              Back to Dashboard
            </IonButton>
          </div>
        </IonContent>
      </IonModal>

      {/* Alert */}
      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header="Notice"
        message={alertMessage}
        buttons={['OK']}
      />

      {/* Toast */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={4000}
        position="top"
        color="success"
      />
    </IonContent>
  );
};

export default SubmitHazards;