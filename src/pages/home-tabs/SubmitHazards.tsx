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
  detectedBarangay?: string;
  [key: string]: any;
}

interface BarangayPolygon {
  polygons: { points: { lat: number; lng: number }[] }[];
  centroid: { lat: number; lng: number };
}

const isNativePlatform = () => {
  return Capacitor.isNativePlatform();
};

// Updated with more accurate coordinates for Manolo Fortich barangays
const barangayPolygons: { [key: string]: BarangayPolygon } = {
  'Agusan Canyon': {
    polygons: [
      {
        points: [
          { lat: 8.3821, lng: 124.8234 }, { lat: 8.3821, lng: 124.8434 },
          { lat: 8.3621, lng: 124.8434 }, { lat: 8.3521, lng: 124.8234 },
          { lat: 8.3621, lng: 124.8034 }
        ]
      }
    ],
    centroid: { lat: 8.3721, lng: 124.8234 }
  },
  'Alae': {
    polygons: [
      {
        points: [
          { lat: 8.4502, lng: 124.9056 }, { lat: 8.4502, lng: 124.9256 },
          { lat: 8.4302, lng: 124.9256 }, { lat: 8.4202, lng: 124.9056 },
          { lat: 8.4302, lng: 124.8856 }
        ]
      }
    ],
    centroid: { lat: 8.4402, lng: 124.9056 }
  },
  'Dahilayan': {
    polygons: [
      {
        points: [
          { lat: 8.4689, lng: 124.8834 }, { lat: 8.4689, lng: 124.9034 },
          { lat: 8.4489, lng: 124.9034 }, { lat: 8.4389, lng: 124.8834 },
          { lat: 8.4489, lng: 124.8634 }
        ]
      }
    ],
    centroid: { lat: 8.4589, lng: 124.8834 }
  },
  'Dalirig': {
    polygons: [
      {
        points: [
          { lat: 8.4123, lng: 124.9212 }, { lat: 8.4123, lng: 124.9412 },
          { lat: 8.3923, lng: 124.9412 }, { lat: 8.3823, lng: 124.9212 },
          { lat: 8.3923, lng: 124.9012 }
        ]
      }
    ],
    centroid: { lat: 8.4023, lng: 124.9212 }
  },
  'Damilag': {
    polygons: [
      {
        points: [
          { lat: 8.3893, lng: 124.8764 }, { lat: 8.3893, lng: 124.8964 },
          { lat: 8.3693, lng: 124.8964 }, { lat: 8.3593, lng: 124.8764 },
          { lat: 8.3693, lng: 124.8564 }
        ]
      }
    ],
    centroid: { lat: 8.3793, lng: 124.8764 }
  },
  'Dicklum': {
    polygons: [
      {
        points: [
          { lat: 8.3934, lng: 124.8323 }, { lat: 8.3934, lng: 124.8523 },
          { lat: 8.3734, lng: 124.8523 }, { lat: 8.3634, lng: 124.8323 },
          { lat: 8.3734, lng: 124.8123 }
        ]
      }
    ],
    centroid: { lat: 8.3834, lng: 124.8323 }
  },
  'Guilang-guilang': {
    polygons: [
      {
        points: [
          { lat: 8.4012, lng: 124.8623 }, { lat: 8.4012, lng: 124.8823 },
          { lat: 8.3812, lng: 124.8823 }, { lat: 8.3712, lng: 124.8623 },
          { lat: 8.3812, lng: 124.8423 }
        ]
      }
    ],
    centroid: { lat: 8.3912, lng: 124.8623 }
  },
  'Kalugmanan': {
    polygons: [
      {
        points: [
          { lat: 8.4356, lng: 124.9167 }, { lat: 8.4356, lng: 124.9367 },
          { lat: 8.4156, lng: 124.9367 }, { lat: 8.4056, lng: 124.9167 },
          { lat: 8.4156, lng: 124.8967 }
        ]
      }
    ],
    centroid: { lat: 8.4256, lng: 124.9167 }
  },
  'Lindaban': {
    polygons: [
      {
        points: [
          { lat: 8.3767, lng: 124.8345 }, { lat: 8.3767, lng: 124.8545 },
          { lat: 8.3567, lng: 124.8545 }, { lat: 8.3467, lng: 124.8345 },
          { lat: 8.3567, lng: 124.8145 }
        ]
      }
    ],
    centroid: { lat: 8.3667, lng: 124.8345 }
  },
  'Lingion': {
    polygons: [
      {
        points: [
          { lat: 8.3434, lng: 124.8123 }, { lat: 8.3434, lng: 124.8323 },
          { lat: 8.3234, lng: 124.8323 }, { lat: 8.3134, lng: 124.8123 },
          { lat: 8.3234, lng: 124.7923 }
        ]
      }
    ],
    centroid: { lat: 8.3334, lng: 124.8123 }
  },
  'Lunocan': {
    polygons: [
      {
        points: [
          { lat: 8.3345, lng: 124.8034 }, { lat: 8.3345, lng: 124.8234 },
          { lat: 8.3145, lng: 124.8234 }, { lat: 8.3045, lng: 124.8034 },
          { lat: 8.3145, lng: 124.7834 }
        ]
      }
    ],
    centroid: { lat: 8.3245, lng: 124.8034 }
  },
  'Maluko': {
    polygons: [
      {
        points: [
          { lat: 8.3123, lng: 124.7856 }, { lat: 8.3123, lng: 124.8056 },
          { lat: 8.2923, lng: 124.8056 }, { lat: 8.2823, lng: 124.7856 },
          { lat: 8.2923, lng: 124.7656 }
        ]
      }
    ],
    centroid: { lat: 8.3023, lng: 124.7856 }
  },
  'Mambatangan': {
    polygons: [
      {
        points: [
          { lat: 8.3012, lng: 124.7734 }, { lat: 8.3012, lng: 124.7934 },
          { lat: 8.2812, lng: 124.7934 }, { lat: 8.2712, lng: 124.7734 },
          { lat: 8.2812, lng: 124.7534 }
        ]
      }
    ],
    centroid: { lat: 8.2912, lng: 124.7734 }
  },
  'Mampayag': {
    polygons: [
      {
        points: [
          { lat: 8.3545, lng: 124.8289 }, { lat: 8.3545, lng: 124.8489 },
          { lat: 8.3345, lng: 124.8489 }, { lat: 8.3245, lng: 124.8289 },
          { lat: 8.3345, lng: 124.8089 }
        ]
      }
    ],
    centroid: { lat: 8.3445, lng: 124.8289 }
  },
  'Mantibugao': {
    polygons: [
      {
        points: [
          { lat: 8.3656, lng: 124.8434 }, { lat: 8.3656, lng: 124.8634 },
          { lat: 8.3456, lng: 124.8634 }, { lat: 8.3356, lng: 124.8434 },
          { lat: 8.3456, lng: 124.8234 }
        ]
      }
    ],
    centroid: { lat: 8.3556, lng: 124.8434 }
  },
  'Minsuro': {
    polygons: [
      {
        points: [
          { lat: 8.3878, lng: 124.8656 }, { lat: 8.3878, lng: 124.8856 },
          { lat: 8.3678, lng: 124.8856 }, { lat: 8.3578, lng: 124.8656 },
          { lat: 8.3678, lng: 124.8456 }
        ]
      }
    ],
    centroid: { lat: 8.3778, lng: 124.8656 }
  },
  'San Miguel': {
    polygons: [
      {
        points: [
          { lat: 8.4023, lng: 124.8878 }, { lat: 8.4023, lng: 124.9078 },
          { lat: 8.3823, lng: 124.9078 }, { lat: 8.3723, lng: 124.8878 },
          { lat: 8.3823, lng: 124.8678 }
        ]
      }
    ],
    centroid: { lat: 8.3923, lng: 124.8878 }
  },
  'Sankanan': {
    polygons: [
      {
        points: [
          { lat: 8.4145, lng: 124.8989 }, { lat: 8.4145, lng: 124.9189 },
          { lat: 8.3945, lng: 124.9189 }, { lat: 8.3845, lng: 124.8989 },
          { lat: 8.3945, lng: 124.8789 }
        ]
      }
    ],
    centroid: { lat: 8.4045, lng: 124.8989 }
  },
  'Santiago': {
    polygons: [
      {
        points: [
          { lat: 8.4267, lng: 124.9123 }, { lat: 8.4267, lng: 124.9323 },
          { lat: 8.4067, lng: 124.9323 }, { lat: 8.3967, lng: 124.9123 },
          { lat: 8.4067, lng: 124.8923 }
        ]
      }
    ],
    centroid: { lat: 8.4167, lng: 124.9123 }
  },
  'Santo Niño': {
    polygons: [
      {
        points: [
          { lat: 8.4389, lng: 124.9256 }, { lat: 8.4389, lng: 124.9456 },
          { lat: 8.4189, lng: 124.9456 }, { lat: 8.4089, lng: 124.9256 },
          { lat: 8.4189, lng: 124.9056 }
        ]
      }
    ],
    centroid: { lat: 8.4289, lng: 124.9256 }
  },
  'Tankulan': {
    polygons: [
      {
        points: [
          { lat: 8.4512, lng: 124.9389 }, { lat: 8.4512, lng: 124.9589 },
          { lat: 8.4312, lng: 124.9589 }, { lat: 8.4212, lng: 124.9389 },
          { lat: 8.4312, lng: 124.9189 }
        ]
      }
    ],
    centroid: { lat: 8.4412, lng: 124.9389 }
  },
  'Ticala': {
    polygons: [
      {
        points: [
          { lat: 8.4645, lng: 124.9523 }, { lat: 8.4645, lng: 124.9723 },
          { lat: 8.4445, lng: 124.9723 }, { lat: 8.4345, lng: 124.9523 },
          { lat: 8.4445, lng: 124.9323 }
        ]
      }
    ],
    centroid: { lat: 8.4545, lng: 124.9523 }
  }
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

// Enhanced EXIF GPS coordinate conversion
const convertExifGpsToDecimal = (coord: any, ref: string): number => {
  let decimal = 0;
  
  if (Array.isArray(coord) && coord.length >= 3) {
    const degrees = parseFloat(coord[0]) || 0;
    const minutes = parseFloat(coord[1]) || 0;
    const seconds = parseFloat(coord[2]) || 0;
    decimal = degrees + (minutes / 60) + (seconds / 3600);
  } else if (typeof coord === 'number') {
    decimal = coord;
  } else if (coord?.value !== undefined) {
    decimal = parseFloat(coord.value) || 0;
  }
  
  if (ref === 'S' || ref === 'W') {
    decimal = -decimal;
  }
  
  return decimal;
};

// GPS coordinate validation
const isValidGPSCoordinate = (lat: number, lng: number): boolean => {
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  if (lat === 0 && lng === 0) return false;
  
  // Check if coordinates are within reasonable bounds for Philippines
  if (lat < 4 || lat > 22) return false;
  if (lng < 116 || lng > 127) return false;
  
  return true;
};

// Point in polygon detection
const isPointInPolygon = (lat: number, lng: number, polygon: { lat: number, lng: number }[]): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat;
    const yi = polygon[i].lng;
    const xj = polygon[j].lat;
    const yj = polygon[j].lng;
    
    const intersect = ((yi > lng) !== (yj > lng)) &&
        (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

// Enhanced barangay detection
const detectBarangayFromCoordinates = (lat: number, lng: number): string | null => {
  for (const [barangay, barangayData] of Object.entries(barangayPolygons)) {
    for (const polygon of barangayData.polygons) {
      if (isPointInPolygon(lat, lng, polygon.points)) {
        return barangay;
      }
    }
  }
  return null;
};

// Enhanced EXIF extraction
const extractExifData = async (file: File): Promise<ExifData | null> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const tags = ExifReader.load(arrayBuffer, { expanded: true });

    const exifData: ExifData = {};
    
    // Extract GPS coordinates with better error handling
    if ((tags as any).gps) {
      try {
        const gpsData = (tags as any).gps;
        const latRef = String(gpsData.GPSLatitudeRef?.description || gpsData.GPSLatitudeRef || 'N');
        const lngRef = String(gpsData.GPSLongitudeRef?.description || gpsData.GPSLongitudeRef || 'E');
        
        if (gpsData.Latitude && gpsData.Longitude) {
          const lat = convertExifGpsToDecimal(gpsData.Latitude, latRef);
          const lng = convertExifGpsToDecimal(gpsData.Longitude, lngRef);

          if (isValidGPSCoordinate(lat, lng)) {
            exifData.gpsLatitude = lat;
            exifData.gpsLongitude = lng;
            
            const detectedBarangay = detectBarangayFromCoordinates(lat, lng);
            if (detectedBarangay) {
              exifData.detectedBarangay = detectedBarangay;
            }
          }
        }
      } catch (gpsError) {
        console.error('GPS extraction error:', gpsError);
      }
    }

    // Extract date/time
    const dateFields = ['DateTimeOriginal', 'DateTime', 'DateTimeDigitized'];
    for (const field of dateFields) {
      const exifData_any = (tags as any).exif;
      const ifd0Data = (tags as any).ifd0;
      const dateValue = exifData_any?.[field]?.description || ifd0Data?.[field]?.description;
      if (dateValue && typeof dateValue === 'string') {
        exifData.dateTimeOriginal = dateValue.replace(/:/g, '-').replace(' ', 'T') + 'Z';
        break;
      }
    }

    // Extract camera info
    const exifData_any = (tags as any).exif;
    if (exifData_any?.Make?.description) {
      exifData.make = exifData_any.Make.description;
    }
    if (exifData_any?.Model?.description) {
      exifData.model = exifData_any.Model.description;
    }

    return exifData;
    
  } catch (error) {
    console.error('EXIF extraction failed:', error);
    return null;
  }
};

const getCurrentDateTime = (): string => {
  return new Date().toISOString();
};

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
  const [hasPhotoData, setHasPhotoData] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const hazardCategories = [
    'Road Hazards',
    'Utility Issues', 
    'Natural Disasters',
    'Infrastructure Problems',
    'Public Safety',
    'Environmental Issues',
    'Others'
  ];

  const barangayList = Object.keys(barangayPolygons);

  const processImage = async (imageBlob: Blob): Promise<{ file: File; exif: ExifData | null }> => {
    const exif = await extractExifData(new File([imageBlob], 'temp.jpg', { type: 'image/jpeg' }));
    const optimizedBlob = await optimizeImage(imageBlob, 1024, 0.8);
    const file = new File([optimizedBlob], `hazard-${Date.now()}.jpg`, { type: 'image/jpeg' });

    return { file, exif };
  };

  const handleExifData = (exif: ExifData | null, currentDateTime: string) => {
    let message = 'Photo added successfully!';
    let hasGPS = false;
    let hasDateTime = false;

    if (exif?.gpsLatitude && exif?.gpsLongitude) {
      const gpsLocationString = `GPS: ${exif.gpsLatitude.toFixed(6)}, ${exif.gpsLongitude.toFixed(6)}`;
      
      setFormData(prev => ({
        ...prev,
        coordinates: { lat: exif.gpsLatitude!, lng: exif.gpsLongitude! },
        location: gpsLocationString,
        barangay: exif.detectedBarangay || prev.barangay
      }));

      if (exif.detectedBarangay) {
        message += ` Location and barangay auto-detected: ${exif.detectedBarangay}`;
      } else {
        message += ' GPS location extracted, please select barangay manually.';
      }
      hasGPS = true;
    }

    if (exif?.dateTimeOriginal) {
      setFormData(prev => ({ ...prev, photo_datetime: exif.dateTimeOriginal! }));
      message += ' Photo date/time extracted.';
      hasDateTime = true;
    } else {
      setFormData(prev => ({ ...prev, photo_datetime: currentDateTime }));
    }

    setHasPhotoData(hasGPS || hasDateTime);
    setToastMessage(message);
    setShowToast(true);
  };

  const takePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 90,
        allowEditing: false,
        width: 1920,
        height: 1920,
        saveToGallery: true
      });

      if (image.webPath) {
        const response = await fetch(image.webPath);
        const blob = await response.blob();

        const { file, exif } = await processImage(blob);
        const currentDateTime = getCurrentDateTime();

        setFormData(prev => ({
          ...prev,
          images: [...prev.images, file],
          current_datetime: currentDateTime
        }));

        setImagePreview(prev => [...prev, image.webPath!]);
        handleExifData(exif, currentDateTime);
      }
    } catch (error: any) {
      if (!error.message?.includes('User cancelled')) {
        setAlertMessage('Failed to capture photo. Please try again.');
        setShowAlert(true);
      }
    }
  };

  const selectFromGallery = async () => {
    try {
      const image = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        quality: 90
      });

      if (image.webPath) {
        const response = await fetch(image.webPath);
        const blob = await response.blob();

        const { file, exif } = await processImage(blob);
        const currentDateTime = getCurrentDateTime();

        setFormData(prev => ({
          ...prev,
          images: [...prev.images, file],
          current_datetime: currentDateTime
        }));

        setImagePreview(prev => [...prev, image.webPath!]);
        handleExifData(exif, currentDateTime);
      }
    } catch (error: any) {
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
        const { file: optimizedFile, exif } = await processImage(file);
        const currentDateTime = getCurrentDateTime();

        setFormData(prev => ({
          ...prev,
          images: [...prev.images, optimizedFile],
          current_datetime: currentDateTime
        }));

        setImagePreview(prev => [...prev, previewUrl]);
        handleExifData(exif, currentDateTime);
      } catch (error) {
        setAlertMessage('Failed to process image. Please try another file.');
        setShowAlert(true);
      }
    }
    event.target.value = '';
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 60000
      });

      const { latitude, longitude } = coordinates.coords;
      const detectedBarangay = detectBarangayFromCoordinates(latitude, longitude);
      const gpsLocationString = `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      setFormData(prev => ({
        ...prev,
        coordinates: { lat: latitude, lng: longitude },
        barangay: detectedBarangay || prev.barangay,
        location: gpsLocationString
      }));

      if (detectedBarangay) {
        setToastMessage(`Current location captured! Detected barangay: ${detectedBarangay}`);
      } else {
        setToastMessage('Current location captured! Please select your barangay manually.');
      }

      setShowToast(true);
      setHasPhotoData(true);

    } catch (error: any) {
      setAlertMessage('Failed to get location. Please enable location services and try again.');
      setShowAlert(true);
    } finally {
      setLocationLoading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImagePreview(prev => prev.filter((_, i) => i !== index));

    if (formData.images.length === 1) {
      setHasPhotoData(false);
      setFormData(prev => ({
        ...prev,
        coordinates: null,
        location: '',
        barangay: '',
        photo_datetime: ''
      }));
    }
  };

  const submitReport = async () => {
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

      // Prepare report data with metadata
      let description = formData.description.trim();
      
      if (formData.photo_datetime) {
        description += `\n\n[Photo Date: ${formatDateTimeForDisplay(formData.photo_datetime)}]`;
      }
      
      description += `\n\n[Report Submitted: ${formatDateTimeForDisplay(formData.current_datetime || getCurrentDateTime())}]`;
      
      if (formData.coordinates) {
        description += `\n\n[GPS Location: ${formData.coordinates.lat.toFixed(6)}, ${formData.coordinates.lng.toFixed(6)}]`;
      }

      const reportData = {
        title: formData.category,
        description: description,
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

      const { data: insertData, error: insertError } = await supabase
        .from('hazard_reports')
        .insert(reportData)
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to submit report: ${insertError.message}`);
      }

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
      setHasPhotoData(false);
      setLocationLoading(false);

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

            {/* Auto-Extracted Photo Data */}
            {hasPhotoData && (
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
                  Auto-Extracted Data
                </p>

                {formData.photo_datetime && (
                  <div style={{ marginBottom: '8px', fontSize: '12px', color: '#1e40af' }}>
                    Date/Time: {formatDateTimeForDisplay(formData.photo_datetime)}
                  </div>
                )}

                {formData.coordinates && (
                  <div style={{ marginBottom: '8px', fontSize: '12px', color: '#1e40af' }}>
                    GPS: {formData.coordinates.lat.toFixed(6)}, {formData.coordinates.lng.toFixed(6)}
                  </div>
                )}

                {formData.barangay && (
                  <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: 'bold' }}>
                    Barangay: {formData.barangay}
                  </div>
                )}
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
          </IonCardHeader>
          <IonCardContent>
            {/* Show current location button only if no coordinates from photo */}
            {!formData.coordinates && (
              <div style={{ marginBottom: '16px' }}>
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
                  {locationLoading ? 'Getting Location...' : 'Get Current Location'}
                </IonButton>
              </div>
            )}

            <IonItem style={{ '--border-radius': '12px', marginBottom: '12px' } as any}>
              <IonLabel position="stacked">
                Barangay <span style={{ color: '#ef4444' }}>*</span>
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

            <IonItem style={{ '--border-radius': '12px' } as any}>
              <IonLabel position="stacked">
                Specific Location/Address
              </IonLabel>
              <IonInput
                value={formData.location}
                onIonChange={e => setFormData(prev => ({ ...prev, location: e.detail.value! }))}
                placeholder="Specific location or address"
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
              routerLink="/it35-lab2/app/reports"
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