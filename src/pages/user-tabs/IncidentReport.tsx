// src/pages/user-tabs/IncidentReport.tsx - Updated with Toast Messages
import React, { useState, useRef, useEffect } from 'react';
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
  IonToast,
  IonProgressBar,
  IonGrid,
  IonRow,
  IonCol,
  IonModal,
  IonSpinner,
  IonSkeletonText
} from '@ionic/react';
import {
  cameraOutline,
  locationOutline,
  warningOutline,
  checkmarkCircleOutline,
  closeCircle,
  addOutline,
  timeOutline,
  imageOutline
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { supabase } from '../../utils/supabaseClient';
import { Capacitor } from '@capacitor/core';
import ExifReader from 'exifreader';

interface IncidentReport {
  title: string | number | null | undefined;
  category: string;
  description: string;
  priority: string;
  location: string;
  barangay: string;
  coordinates: { lat: number; lng: number } | null;
  images: File[];
  reporter_email: string;
  reporter_name: string;
  reporter_address: string;
  reporter_contact: string;
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

// FIXED BARANGAY LIST - Original 22 Barangays of Manolo Fortich
const MANOLO_FORTICH_BARANGAYS = [
  'Agusan Canyon',
  'Alae',
  'Dahilayan',
  'Dalirig',
  'Damilag',
  'Dicklum',
  'Guilang-guilang',
  'Kalugmanan',
  'Lindaban',
  'Lingion',
  'Lunocan',
  'Maluko',
  'Mambatangan',
  'Mampayag',
  'Mantibugao',
  'Minsuro',
  'San Miguel',
  'Sankanan',
  'Santiago',
  'Santo Niño',
  'Tankulan',
  'Ticala'
];

// Barangay polygon data with accurate coordinates for automated detection
const barangayPolygons: {
  [key: string]: {
    polygons: { points: { lat: number; lng: number }[] }[];
    centroid: { lat: number; lng: number };
  }
} = {
  'Agusan Canyon': {
    polygons: [{
      points: [
        { lat: 8.3721, lng: 124.8134 },
        { lat: 8.3821, lng: 124.8334 },
        { lat: 8.3621, lng: 124.8434 },
        { lat: 8.3521, lng: 124.8234 },
        { lat: 8.3621, lng: 124.8034 }
      ]
    }],
    centroid: { lat: 8.3721, lng: 124.8234 }
  },
  'Alae': {
    polygons: [{
      points: [
        { lat: 8.4302, lng: 124.8856 },
        { lat: 8.4502, lng: 124.9056 },
        { lat: 8.4502, lng: 124.9256 },
        { lat: 8.4302, lng: 124.9256 },
        { lat: 8.4202, lng: 124.9056 }
      ]
    }],
    centroid: { lat: 8.4402, lng: 124.9056 }
  },
  'Dahilayan': {
    polygons: [{
      points: [
        { lat: 8.4489, lng: 124.8634 },
        { lat: 8.4689, lng: 124.8834 },
        { lat: 8.4689, lng: 124.9034 },
        { lat: 8.4489, lng: 124.9034 },
        { lat: 8.4389, lng: 124.8834 }
      ]
    }],
    centroid: { lat: 8.4589, lng: 124.8834 }
  },
  'Dalirig': {
    polygons: [{
      points: [
        { lat: 8.3923, lng: 124.9012 },
        { lat: 8.4123, lng: 124.9212 },
        { lat: 8.4123, lng: 124.9412 },
        { lat: 8.3923, lng: 124.9412 },
        { lat: 8.3823, lng: 124.9212 }
      ]
    }],
    centroid: { lat: 8.4023, lng: 124.9212 }
  },
  'Damilag': {
    polygons: [{
      points: [
        { lat: 8.3693, lng: 124.8564 },
        { lat: 8.3893, lng: 124.8764 },
        { lat: 8.3893, lng: 124.8964 },
        { lat: 8.3693, lng: 124.8964 },
        { lat: 8.3593, lng: 124.8764 }
      ]
    }],
    centroid: { lat: 8.3793, lng: 124.8764 }
  },
  'Dicklum': {
    polygons: [{
      points: [
        { lat: 8.3734, lng: 124.8123 },
        { lat: 8.3934, lng: 124.8323 },
        { lat: 8.3934, lng: 124.8523 },
        { lat: 8.3734, lng: 124.8523 },
        { lat: 8.3634, lng: 124.8323 }
      ]
    }],
    centroid: { lat: 8.3834, lng: 124.8323 }
  },
  'Guilang-guilang': {
    polygons: [{
      points: [
        { lat: 8.3812, lng: 124.8423 },
        { lat: 8.4012, lng: 124.8623 },
        { lat: 8.4012, lng: 124.8823 },
        { lat: 8.3812, lng: 124.8823 },
        { lat: 8.3712, lng: 124.8623 }
      ]
    }],
    centroid: { lat: 8.3912, lng: 124.8623 }
  },
  'Kalugmanan': {
    polygons: [{
      points: [
        { lat: 8.4156, lng: 124.8967 },
        { lat: 8.4356, lng: 124.9167 },
        { lat: 8.4356, lng: 124.9367 },
        { lat: 8.4156, lng: 124.9367 },
        { lat: 8.4056, lng: 124.9167 }
      ]
    }],
    centroid: { lat: 8.4256, lng: 124.9167 }
  },
  'Lindaban': {
    polygons: [{
      points: [
        { lat: 8.3567, lng: 124.8145 },
        { lat: 8.3767, lng: 124.8345 },
        { lat: 8.3767, lng: 124.8545 },
        { lat: 8.3567, lng: 124.8545 },
        { lat: 8.3467, lng: 124.8345 }
      ]
    }],
    centroid: { lat: 8.3667, lng: 124.8345 }
  },
  'Lingion': {
    polygons: [{
      points: [
        { lat: 8.3234, lng: 124.7923 },
        { lat: 8.3434, lng: 124.8123 },
        { lat: 8.3434, lng: 124.8323 },
        { lat: 8.3234, lng: 124.8323 },
        { lat: 8.3134, lng: 124.8123 }
      ]
    }],
    centroid: { lat: 8.3334, lng: 124.8123 }
  },
  'Lunocan': {
    polygons: [{
      points: [
        { lat: 8.3145, lng: 124.7834 },
        { lat: 8.3345, lng: 124.8034 },
        { lat: 8.3345, lng: 124.8234 },
        { lat: 8.3145, lng: 124.8234 },
        { lat: 8.3045, lng: 124.8034 }
      ]
    }],
    centroid: { lat: 8.3245, lng: 124.8034 }
  },
  'Maluko': {
    polygons: [{
      points: [
        { lat: 8.2923, lng: 124.7656 },
        { lat: 8.3123, lng: 124.7856 },
        { lat: 8.3123, lng: 124.8056 },
        { lat: 8.2923, lng: 124.8056 },
        { lat: 8.2823, lng: 124.7856 }
      ]
    }],
    centroid: { lat: 8.3023, lng: 124.7856 }
  },
  'Mambatangan': {
    polygons: [{
      points: [
        { lat: 8.2812, lng: 124.7534 },
        { lat: 8.3012, lng: 124.7734 },
        { lat: 8.3012, lng: 124.7934 },
        { lat: 8.2812, lng: 124.7934 },
        { lat: 8.2712, lng: 124.7734 }
      ]
    }],
    centroid: { lat: 8.2912, lng: 124.7734 }
  },
  'Mampayag': {
    polygons: [{
      points: [
        { lat: 8.3345, lng: 124.8089 },
        { lat: 8.3545, lng: 124.8289 },
        { lat: 8.3545, lng: 124.8489 },
        { lat: 8.3345, lng: 124.8489 },
        { lat: 8.3245, lng: 124.8289 }
      ]
    }],
    centroid: { lat: 8.3445, lng: 124.8289 }
  },
  'Mantibugao': {
    polygons: [{
      points: [
        { lat: 8.3456, lng: 124.8234 },
        { lat: 8.3656, lng: 124.8434 },
        { lat: 8.3656, lng: 124.8634 },
        { lat: 8.3456, lng: 124.8634 },
        { lat: 8.3356, lng: 124.8434 }
      ]
    }],
    centroid: { lat: 8.3556, lng: 124.8434 }
  },
  'Minsuro': {
    polygons: [{
      points: [
        { lat: 8.3678, lng: 124.8456 },
        { lat: 8.3878, lng: 124.8656 },
        { lat: 8.3878, lng: 124.8856 },
        { lat: 8.3678, lng: 124.8856 },
        { lat: 8.3578, lng: 124.8656 }
      ]
    }],
    centroid: { lat: 8.3778, lng: 124.8656 }
  },
  'San Miguel': {
    polygons: [{
      points: [
        { lat: 8.3823, lng: 124.8678 },
        { lat: 8.4023, lng: 124.8878 },
        { lat: 8.4023, lng: 124.9078 },
        { lat: 8.3823, lng: 124.9078 },
        { lat: 8.3723, lng: 124.8878 }
      ]
    }],
    centroid: { lat: 8.3923, lng: 124.8878 }
  },
  'Sankanan': {
    polygons: [{
      points: [
        { lat: 8.3945, lng: 124.8789 },
        { lat: 8.4145, lng: 124.8989 },
        { lat: 8.4145, lng: 124.9189 },
        { lat: 8.3945, lng: 124.9189 },
        { lat: 8.3845, lng: 124.8989 }
      ]
    }],
    centroid: { lat: 8.4045, lng: 124.8989 }
  },
  'Santiago': {
    polygons: [{
      points: [
        { lat: 8.4067, lng: 124.8923 },
        { lat: 8.4267, lng: 124.9123 },
        { lat: 8.4267, lng: 124.9323 },
        { lat: 8.4067, lng: 124.9323 },
        { lat: 8.3967, lng: 124.9123 }
      ]
    }],
    centroid: { lat: 8.4167, lng: 124.9123 }
  },
  'Santo Niño': {
    polygons: [{
      points: [
        { lat: 8.4189, lng: 124.9056 },
        { lat: 8.4389, lng: 124.9256 },
        { lat: 8.4389, lng: 124.9456 },
        { lat: 8.4189, lng: 124.9456 },
        { lat: 8.4089, lng: 124.9256 }
      ]
    }],
    centroid: { lat: 8.4289, lng: 124.9256 }
  },
  'Tankulan': {
    polygons: [{
      points: [
        { lat: 8.4312, lng: 124.9189 },
        { lat: 8.4512, lng: 124.9389 },
        { lat: 8.4512, lng: 124.9589 },
        { lat: 8.4312, lng: 124.9589 },
        { lat: 8.4212, lng: 124.9389 }
      ]
    }],
    centroid: { lat: 8.4412, lng: 124.9389 }
  },
  'Ticala': {
    polygons: [{
      points: [
        { lat: 8.4445, lng: 124.9323 },
        { lat: 8.4645, lng: 124.9523 },
        { lat: 8.4645, lng: 124.9723 },
        { lat: 8.4445, lng: 124.9723 },
        { lat: 8.4345, lng: 124.9523 }
      ]
    }],
    centroid: { lat: 8.4545, lng: 124.9523 }
  }
};

// Point in polygon detection function
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

// Enhanced barangay detection from GPS coordinates
const detectBarangayFromCoordinates = (lat: number, lng: number): string | null => {
  console.log('Detecting barangay for coordinates:', lat, lng);

  // First, try exact polygon matching
  for (const [barangay, barangayData] of Object.entries(barangayPolygons)) {
    for (const polygon of barangayData.polygons) {
      if (isPointInPolygon(lat, lng, polygon.points)) {
        console.log('Exact match found:', barangay);
        return barangay;
      }
    }
  }

  // If no exact match, find nearest barangay within reasonable distance
  let nearestBarangay = null;
  let minDistance = Infinity;
  const MAX_DISTANCE = 0.05; // approximately 5.5km

  for (const [barangay, barangayData] of Object.entries(barangayPolygons)) {
    const distance = Math.sqrt(
      Math.pow(lat - barangayData.centroid.lat, 2) +
      Math.pow(lng - barangayData.centroid.lng, 2)
    );

    if (distance < minDistance && distance < MAX_DISTANCE) {
      minDistance = distance;
      nearestBarangay = barangay;
    }
  }

  if (nearestBarangay) {
    console.log('Nearest barangay found:', nearestBarangay, 'Distance:', minDistance);
  } else {
    console.log('No nearby barangay found');
  }

  return nearestBarangay;
};

export { MANOLO_FORTICH_BARANGAYS, barangayPolygons, detectBarangayFromCoordinates };

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

// Enhanced GPS coordinate conversion
const convertExifGpsToDecimal = (coord: any, ref: string): number => {
  console.log('Converting coordinate:', coord, 'Ref:', ref);

  let decimal = 0;

  if (Array.isArray(coord)) {
    if (coord.length >= 3) {
      const degrees = parseFloat(coord[0]) || 0;
      const minutes = parseFloat(coord[1]) || 0;
      const seconds = parseFloat(coord[2]) || 0;
      decimal = degrees + (minutes / 60) + (seconds / 3600);
    }
    else if (coord.length === 2) {
      const degrees = parseFloat(coord[0]) || 0;
      const minutesWithSeconds = parseFloat(coord[1]) || 0;
      decimal = degrees + (minutesWithSeconds / 60);
    }
  }
  else if (typeof coord === 'number') {
    decimal = coord;
  }
  else if (coord?.value !== undefined) {
    decimal = parseFloat(coord.value) || 0;
  }
  else if (typeof coord === 'string') {
    const match = coord.match(/(\d+)°\s*(\d+)'\s*([\d.]+)"/);
    if (match) {
      const degrees = parseFloat(match[1]);
      const minutes = parseFloat(match[2]);
      const seconds = parseFloat(match[3]);
      decimal = degrees + (minutes / 60) + (seconds / 3600);
    } else {
      decimal = parseFloat(coord) || 0;
    }
  }

  if (ref === 'S' || ref === 'W') {
    decimal = -decimal;
  }

  console.log('Converted decimal:', decimal);
  return decimal;
};

// GPS coordinate validation
const isValidGPSCoordinate = (lat: number, lng: number): boolean => {
  if (isNaN(lat) || isNaN(lng)) {
    console.log('Coordinates are NaN');
    return false;
  }
  if (lat < -90 || lat > 90) {
    console.log('Latitude out of range:', lat);
    return false;
  }
  if (lng < -180 || lng > 180) {
    console.log('Longitude out of range:', lng);
    return false;
  }
  if (lat === 0 && lng === 0) {
    console.log('Coordinates are 0,0 (null island)');
    return false;
  }

  const isInPhilippines = (lat >= 4.0 && lat <= 21.0 && lng >= 116.0 && lng <= 127.0);

  if (!isInPhilippines) {
    console.log('Coordinates outside Philippines bounds:', lat, lng);
    console.warn('Coordinates outside typical Philippines area, but accepting anyway');
  }

  return true;
};

// Enhanced EXIF extraction
const extractExifData = async (file: File): Promise<ExifData | null> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const tags = ExifReader.load(arrayBuffer, { expanded: true });

    console.log('Full EXIF tags structure:', tags);

    const exifData: ExifData = {};

    try {
      const gps = (tags as any).gps;
      if (gps) {
        console.log('GPS tags found:', gps);

        const latitude = gps.GPSLatitude || gps.Latitude || gps.gpsLatitude;
        const longitude = gps.GPSLongitude || gps.Longitude || gps.gpsLongitude;
        const latRef = gps.GPSLatitudeRef?.value || gps.LatitudeRef || gps.gpsLatitudeRef || 'N';
        const lngRef = gps.GPSLongitudeRef?.value || gps.LongitudeRef || gps.gpsLongitudeRef || 'E';

        if (latitude !== undefined && longitude !== undefined) {
          const lat = convertExifGpsToDecimal(latitude, latRef);
          const lng = convertExifGpsToDecimal(longitude, lngRef);

          console.log('Converted GPS coordinates:', { lat, lng });

          if (isValidGPSCoordinate(lat, lng)) {
            exifData.gpsLatitude = lat;
            exifData.gpsLongitude = lng;
            exifData.gpsSource = 'photo_exif';

            const detectedBarangay = detectBarangayFromCoordinates(lat, lng);
            if (detectedBarangay) {
              exifData.detectedBarangay = detectedBarangay;
            }
          }
        }
      }
    } catch (gpsError) {
      console.warn('GPS extraction failed:', gpsError);
    }

    // Extract date/time
    const dateFields = ['DateTimeOriginal', 'DateTime', 'DateTimeDigitized', 'CreateDate'];
    for (const field of dateFields) {
      try {
        const exifData_any = (tags as any).exif;
        const ifd0Data = (tags as any).ifd0;
        const dateValue = exifData_any?.[field]?.value ||
          ifd0Data?.[field]?.value ||
          exifData_any?.[field]?.description ||
          ifd0Data?.[field]?.description;

        if (dateValue) {
          let dateString = dateValue.toString();
          if (dateString.includes(':')) {
            dateString = dateString.replace(/:/g, '-').replace(' ', 'T') + 'Z';
          }
          exifData.dateTimeOriginal = new Date(dateString).toISOString();
          break;
        }
      } catch (dateError) {
        console.warn(`Date extraction failed for ${field}:`, dateError);
      }
    }

    console.log('Final extracted EXIF data:', exifData);
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

// Skeleton Components
const SkeletonFormCard: React.FC<{ title?: string }> = ({ title }) => (
  <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
    <IonCardHeader>
      <IonCardTitle style={{ fontSize: '18px', color: '#1f2937' }}>
        {title && <IonSkeletonText animated style={{ width: '120px', height: '18px' }} />}
      </IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <IonSkeletonText animated style={{ width: '100%', height: '56px', borderRadius: '8px', marginBottom: '16px' }} />
      <IonSkeletonText animated style={{ width: '100%', height: '56px', borderRadius: '8px', marginBottom: '16px' }} />
      <IonSkeletonText animated style={{ width: '100%', height: '120px', borderRadius: '8px' }} />
    </IonCardContent>
  </IonCard>
);

const SkeletonPhotoCard: React.FC = () => (
  <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
    <IonCardHeader>
      <IonCardTitle style={{ fontSize: '18px', color: '#1f2937' }}>
        <IonSkeletonText animated style={{ width: '100px', height: '18px' }} />
      </IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <IonGrid>
        <IonRow>
          <IonCol size="6">
            <IonSkeletonText animated style={{ width: '100%', height: '60px', borderRadius: '12px' }} />
          </IonCol>
          <IonCol size="6">
            <IonSkeletonText animated style={{ width: '100%', height: '60px', borderRadius: '12px' }} />
          </IonCol>
        </IonRow>
      </IonGrid>

      {/* Image Preview Skeleton */}
      <div style={{ marginTop: '16px' }}>
        <IonSkeletonText animated style={{ width: '140px', height: '14px', marginBottom: '12px' }} />
        <IonGrid>
          <IonRow>
            {[1, 2, 3].map((item) => (
              <IonCol key={item} size="4">
                <IonSkeletonText animated style={{ width: '100%', height: '80px', borderRadius: '8px' }} />
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>
      </div>
    </IonCardContent>
  </IonCard>
);

const SkeletonInfoCard: React.FC = () => (
  <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
    <IonCardHeader>
      <IonCardTitle style={{ fontSize: '18px', color: '#1f2937' }}>
        <IonSkeletonText animated style={{ width: '140px', height: '18px' }} />
      </IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <IonSkeletonText animated style={{ width: '100%', height: '50px', borderRadius: '8px', marginBottom: '16px' }} />

      <IonSkeletonText animated style={{ width: '100%', height: '56px', borderRadius: '8px', marginBottom: '12px' }} />
      <IonSkeletonText animated style={{ width: '100%', height: '56px', borderRadius: '8px', marginBottom: '12px' }} />
      <IonSkeletonText animated style={{ width: '100%', height: '56px', borderRadius: '8px' }} />
    </IonCardContent>
  </IonCard>
);

const IncidentReport: React.FC = () => {
  const [formData, setFormData] = useState<IncidentReport>({
    title: '',
    category: '',
    description: '',
    priority: 'medium',
    location: '',
    barangay: '',
    coordinates: null,
    images: [],
    reporter_email: '',
    reporter_name: '',
    reporter_address: '',
    reporter_contact: '',
    photo_datetime: '',
    current_datetime: getCurrentDateTime()
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [extractedExifData, setExtractedExifData] = useState<ExifData | null>(null);
  const [extractionLoading, setExtractionLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isFormLoading, setIsFormLoading] = useState(true);

  // Show toast message with color
  const showToastMessage = (message: string, color: 'success' | 'danger' | 'warning' = 'success') => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  // Fetch user profile when component mounts
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User not authenticated');
        return;
      }

      // Get user profile from users table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('user_firstname, user_lastname, user_email, user_address, user_contact_number')
        .eq('user_email', user.email)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return;
      }

      if (profile) {
        setUserProfile(profile);

        // Auto-populate form data with user profile
        setFormData(prev => ({
          ...prev,
          reporter_email: profile.user_email,
          reporter_name: `${profile.user_firstname || ''} ${profile.user_lastname || ''}`.trim(),
          reporter_address: profile.user_address || '',
          reporter_contact: profile.user_contact_number || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    // Simulate form loading
    const timer = setTimeout(() => {
      setIsFormLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isFormLoading) {
    return (
      <IonContent style={{ '--background': 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' } as any}>
        <div style={{ padding: '20px' }}>
          {/* Header Skeleton */}
          <IonCard style={{
            borderRadius: '16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            marginBottom: '20px'
          }}>
            <IonCardHeader>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <IonSkeletonText animated style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  marginRight: '16px'
                }} />
                <div>
                  <IonSkeletonText animated style={{ width: '200px', height: '20px', marginBottom: '4px' }} />
                  <IonSkeletonText animated style={{ width: '250px', height: '14px' }} />
                </div>
              </div>
            </IonCardHeader>
          </IonCard>

          {/* Timestamp Skeleton */}
          <IonCard style={{
            borderRadius: '16px',
            marginBottom: '20px',
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            border: '1px solid #7dd3fc'
          }}>
            <IonCardContent>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <IonSkeletonText animated style={{ width: '20px', height: '20px', marginRight: '12px' }} />
                <div>
                  <IonSkeletonText animated style={{ width: '100px', height: '12px', marginBottom: '4px' }} />
                  <IonSkeletonText animated style={{ width: '180px', height: '14px' }} />
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Photo Section Skeleton */}
          <SkeletonPhotoCard />

          {/* Information Section Skeleton */}
          <SkeletonInfoCard />

          {/* Incident Details Skeleton */}
          <SkeletonFormCard title="Incident Details" />

          {/* Submit Button Skeleton */}
          <IonCard style={{ borderRadius: '16px' }}>
            <IonCardContent>
              <IonSkeletonText animated style={{ width: '100%', height: '52px', borderRadius: '12px' }} />
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    );
  }

  const incidentCategories = [
    'Road Incidents',
    'Utility Issues',
    'Natural Disasters',
    'Infrastructure Problems',
    'Public Safety',
    'Environmental Issues',
    'Others'
  ];

  const barangayList = Object.keys(barangayPolygons).sort();

  const processImage = async (imageBlob: Blob): Promise<{ file: File; exif: ExifData | null }> => {
    const exif = await extractExifData(new File([imageBlob], 'temp.jpg', { type: 'image/jpeg' }));
    const optimizedBlob = await optimizeImage(imageBlob, 1024, 0.8);
    const file = new File([optimizedBlob], `hazard-${Date.now()}.jpg`, { type: 'image/jpeg' });

    return { file, exif };
  };

  // Simplified permission checking for web compatibility
  const checkPermissions = async (type: 'camera' | 'location'): Promise<boolean> => {
    try {
      if (isNativePlatform()) {
        // For native apps, we'll rely on Capacitor's built-in permission handling
        return true;
      } else {
        // For web, check navigator permissions if available
        if (navigator.permissions) {
          const permission = await navigator.permissions.query({ name: type as PermissionName });
          return permission.state === 'granted' || permission.state === 'prompt';
        }
        return true; // Assume permission is available for web
      }
    } catch (error) {
      console.warn(`Permission check failed for ${type}:`, error);
      return true; // Fallback to attempting the operation
    }
  };

  // Get current location
  const getCurrentLocation = async (): Promise<{ lat: number; lng: number } | null> => {
    try {
      const hasLocationPermission = await checkPermissions('location');
      if (!hasLocationPermission) {
        console.warn('Location permission denied');
        return null;
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      if (isValidGPSCoordinate(lat, lng)) {
        return { lat, lng };
      }

      return null;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  };

  // Take photo function
  const takePhoto = async () => {
    try {
      const hasCameraPermission = await checkPermissions('camera');
      if (!hasCameraPermission) {
        showToastMessage('Camera permission is required to take photos.', 'warning');
        return;
      }

      let currentLocation = null;
      try {
        currentLocation = await getCurrentLocation();
        if (currentLocation) {
          console.log('Current location captured:', currentLocation);
        }
      } catch (locationError) {
        console.warn('Could not get current location:', locationError);
      }

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        correctOrientation: true,
        saveToGallery: true,
        promptLabelHeader: 'Take Photo',
        promptLabelPhoto: 'From Gallery',
        promptLabelPicture: 'Take Picture'
      });

      if (image.webPath) {
        const response = await fetch(image.webPath);
        const blob = await response.blob();

        const { file, exif } = await processImage(blob);
        const currentDateTime = getCurrentDateTime();

        // If EXIF doesn't contain GPS but we have current location, use it
        let enhancedExif = exif;
        if (!exif?.gpsLatitude && currentLocation) {
          enhancedExif = {
            ...exif,
            gpsLatitude: currentLocation.lat,
            gpsLongitude: currentLocation.lng,
            locationSource: 'device_gps'
          };

          // Detect barangay from device GPS
          const detectedBarangay = detectBarangayFromCoordinates(currentLocation.lat, currentLocation.lng);
          if (detectedBarangay) {
            enhancedExif.detectedBarangay = detectedBarangay;
          }
        }

        setFormData(prev => ({
          ...prev,
          images: [...prev.images, file],
          current_datetime: currentDateTime
        }));

        setImagePreview(prev => [...prev, image.webPath!]);

        if (enhancedExif && formData.images.length === 0) {
          setExtractedExifData(enhancedExif);
        }

        showToastMessage('Photo added successfully!' + (currentLocation ? ' Location captured.' : ''));
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      if (!error.message?.includes('User cancelled')) {
        if (error.message?.includes('Permission')) {
          showToastMessage('Camera permission denied. Please enable camera access in settings.', 'danger');
        } else {
          showToastMessage('Failed to capture photo. Please try again.', 'danger');
        }
      }
    }
  };

  // Select from gallery function
  const selectFromGallery = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        correctOrientation: true
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

        if (exif && formData.images.length === 0) {
          setExtractedExifData(exif);
        }

        showToastMessage('Photo added successfully!');
      }
    } catch (error: any) {
      if (!error.message?.includes('User cancelled')) {
        showToastMessage('Failed to select image. Please try again.', 'danger');
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
        showToastMessage('Please select an image file.', 'warning');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        showToastMessage('Image size must be less than 10MB.', 'warning');
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

        if (exif && formData.images.length === 0) {
          setExtractedExifData(exif);
        }

        showToastMessage('Photo added successfully!');
      } catch (error) {
        showToastMessage('Failed to process image. Please try another file.', 'danger');
      }
    }
    event.target.value = '';
  };

  const extractPhotoInformation = async () => {
    if (!extractedExifData) {
      showToastMessage('No extractable information found in the photos.', 'warning');
      return;
    }

    setExtractionLoading(true);

    try {
      let message = 'Photo information extracted!';
      let updatedFormData = { ...formData };
      let extractedItems = [];

      // GPS Coordinates
      if (extractedExifData.gpsLatitude && extractedExifData.gpsLongitude) {
        const gpsLocationString = `GPS: ${extractedExifData.gpsLatitude.toFixed(6)}, ${extractedExifData.gpsLongitude.toFixed(6)}`;

        updatedFormData.coordinates = {
          lat: extractedExifData.gpsLatitude,
          lng: extractedExifData.gpsLongitude
        };
        updatedFormData.location = gpsLocationString;
        extractedItems.push('GPS coordinates');
      }

      // Barangay
      if (extractedExifData.detectedBarangay) {
        updatedFormData.barangay = extractedExifData.detectedBarangay;
        extractedItems.push('barangay location');
      }

      // Date/Time
      if (extractedExifData.dateTimeOriginal) {
        updatedFormData.photo_datetime = extractedExifData.dateTimeOriginal;
        extractedItems.push('photo date/time');
      } else {
        updatedFormData.photo_datetime = formData.current_datetime || getCurrentDateTime();
      }

      setFormData(updatedFormData);

      if (extractedItems.length > 0) {
        message = `Extracted: ${extractedItems.join(', ')}`;
        showToastMessage(message);
      } else {
        showToastMessage('No location data found in photos. Please enter manually.', 'warning');
      }

    } catch (error) {
      console.error('Extraction error:', error);
      showToastMessage('Failed to extract photo information. Please try again.', 'danger');
    } finally {
      setExtractionLoading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImagePreview(prev => prev.filter((_, i) => i !== index));

    if (formData.images.length === 1) {
      setExtractedExifData(null);
      setFormData(prev => ({
        ...prev,
        coordinates: null,
        location: '',
        barangay: '',
        photo_datetime: ''
      }));
    }

    showToastMessage('Photo removed successfully!');
  };

  const submitReport = async () => {
    // Basic validation
    if (!formData.category) {
      showToastMessage('Please select an incident category.', 'warning');
      return;
    }

    // More robust description validation
    const description = formData.description?.trim() || '';
    if (description.length === 0 || !description.replace(/\s+/g, '').length) {
      showToastMessage('Please provide a description of the incident.', 'warning');
      return;
    }

    // Add validation for new fields
    if (!formData.reporter_address?.trim()) {
      showToastMessage('Please provide your complete address for emergency response.', 'warning');
      return;
    }

    if (!formData.reporter_contact?.trim()) {
      showToastMessage('Please provide your contact number for emergency response.', 'warning');
      return;
    }

    if (!formData.barangay) {
      showToastMessage('Please select a barangay.', 'warning');
      return;
    }

    if (formData.images.length === 0) {
      showToastMessage('Please add at least one photo of the incident.', 'warning');
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
        const fileName = `incident-reports/${user.id}/${Date.now()}-${i}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('hazard-images')
          .upload(fileName, image, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error details:', uploadError);
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
      const reportData = {
        title: (formData.title?.toString() || '').trim() || formData.category,
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
        location: formData.location.trim(),
        barangay: formData.barangay,
        coordinates: formData.coordinates ? formData.coordinates : null,
        image_urls: imageUrls,
        reporter_email: user.email,
        reporter_name: `${profile?.user_firstname || ''} ${profile?.user_lastname || ''}`.trim() || user.email,
        reporter_address: formData.reporter_address.trim(),
        reporter_contact: formData.reporter_contact.trim(),
        report_submitted: formData.current_datetime || getCurrentDateTime(),
        photo_datetime: formData.photo_datetime,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: insertData, error: insertError } = await supabase
        .from('incident_reports')
        .insert(reportData)
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to submit report: ${insertError.message}`);
      }

      // Reset form
      setFormData({
        title: '',
        category: '',
        description: '',
        priority: 'medium',
        location: '',
        barangay: '',
        coordinates: null,
        images: [],
        reporter_email: '',
        reporter_name: '',
        reporter_address: '',
        reporter_contact: '',
        photo_datetime: '',
        current_datetime: getCurrentDateTime()
      });
      setImagePreview([]);
      setExtractedExifData(null);
      setExtractionLoading(false);

      setShowSuccessModal(true);

    } catch (error: any) {
      console.error('Submit error:', error);
      showToastMessage(error.message || 'Failed to submit report. Please try again.', 'danger');
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
                  Report an Incident
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
          </IonCardContent>
        </IonCard>

        {/* Photo Information Section */}
        <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
          <IonCardHeader>
            <IonCardTitle style={{ fontSize: '18px', color: '#1f2937' }}>
              Photo Information
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {/* Extract Information Button */}
            <div style={{ marginBottom: '16px' }}>
              <IonButton
                expand="block"
                onClick={extractPhotoInformation}
                disabled={!extractedExifData || extractionLoading}
                style={{
                  '--background': extractedExifData ? '#f59e0b' : '#9ca3af',
                  '--color': 'white',
                  '--border-radius': '8px',
                  height: '50px'
                } as any}
              >
                {extractionLoading ? (
                  <IonSpinner name="lines-small" slot="start" />
                ) : (
                  <IonIcon icon={imageOutline} slot="start" />
                )}
                {extractionLoading ? 'Extracting...' : 'Extract Photo Information'}
              </IonButton>
              {!extractedExifData && formData.images.length > 0 && (
                <p style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  margin: '8px 0 0 0',
                  textAlign: 'center'
                }}>
                  No extractable information found in uploaded photos
                </p>
              )}
            </div>

            {/* Photo Date/Time */}
            <IonItem style={{ '--border-radius': '12px', marginBottom: '12px' } as any}>
              <IonLabel position="stacked">Photo Date/Time</IonLabel>
              <IonInput
                value={formData.photo_datetime ? formatDateTimeForDisplay(formData.photo_datetime) : ''}
                readonly={true}
                placeholder="Extract from photo metadata"
              />
            </IonItem>

            {/* GPS Coordinates */}
            <IonItem style={{ '--border-radius': '12px', marginBottom: '12px' } as any}>
              <IonLabel position="stacked">GPS Coordinates</IonLabel>
              <IonInput
                value={formData.coordinates ? `${formData.coordinates.lat.toFixed(6)}, ${formData.coordinates.lng.toFixed(6)}` : ''}
                readonly={true}
                placeholder="Extract from photo metadata"
              />
            </IonItem>

            {/* Barangay */}
            <IonItem style={{ '--border-radius': '12px' } as any}>
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
          </IonCardContent>
        </IonCard>

        {/* Incident Details */}
        <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
          <IonCardHeader>
            <IonCardTitle style={{ fontSize: '18px', color: '#1f2937' }}>
              Incident Details
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {/* Title Field - Optional */}
            <IonItem style={{ '--border-radius': '12px', marginBottom: '12px' } as any}>
              <IonLabel position="stacked">Title (Optional)</IonLabel>
              <IonInput
                value={formData.title}
                onIonChange={e => setFormData(prev => ({ ...prev, title: e.detail.value! }))}
                placeholder="Add a custom title for this report"
                maxlength={100}
              />
            </IonItem>

            <IonItem style={{ '--border-radius': '12px', marginBottom: '12px' } as any}>
              <IonLabel position="stacked">Incident Category <span style={{ color: '#ef4444' }}>*</span></IonLabel>
              <IonSelect
                value={formData.category}
                onIonChange={e => setFormData(prev => ({ ...prev, category: e.detail.value }))}
                interface="popover"
                placeholder="Select Category"
              >
                {incidentCategories.map(category => (
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
                placeholder="Briefly describe the incident and its location..."
                rows={3}
                maxlength={500}
              />
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
              {isSubmitting ? 'Submitting Report...' : 'SUBMIT INCIDENT REPORT'}
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
              Your incident report has been received by LDRRMO Manolo Fortich.
              You will receive updates on the status through notifications.
            </p>

            <IonButton
              routerLink="/it35-lab2/app/map"
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
              routerLink="/it35-lab2/app/dashboard"
              onClick={() => setShowSuccessModal(false)}
              style={{ '--color': '#6b7280' }}
            >
              Back to Dashboard
            </IonButton>
          </div>
        </IonContent>
      </IonModal>

      {/* Toast */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={4000}
        position="top"
        color={toastColor}
      />
    </IonContent>
  );
};

export default IncidentReport;