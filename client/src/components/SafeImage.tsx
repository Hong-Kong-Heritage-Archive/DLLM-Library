import React, { useState, useEffect, useRef } from 'react';
import * as nsfwjs from 'nsfwjs';
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert
} from '@mui/material';
import { Warning } from '@mui/icons-material';

interface SafeImageProps {
  src: string;
  alt?: string;
  style?: React.CSSProperties;
  maxWidth?: string | number;
  maxHeight?: string | number;
}

interface NSFWPrediction {
  className: string;
  probability: number;
}

/**
 * SafeImage component that uses NSFWJS to detect and blur NSFW content.
 * Users can consent to view the original image if it is flagged as NSFW.
 */
const SafeImage: React.FC<SafeImageProps> = ({ 
  src, 
  alt = "Image", 
  style = {}, 
  maxWidth = "200px", 
  maxHeight = "200px" 
}) => {
  const [model, setModel] = useState<nsfwjs.NSFWJS | null>(null);
  const [isNSFW, setIsNSFW] = useState<boolean | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userConsent, setUserConsent] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Load NSFWJS model
  useEffect(() => {
    loadModel();
  }, []);

const loadModel = async () => {
    try {
    //const loadedModel = await nsfwjs.load("/mobilenet_v2/");
    const loadedModel = await nsfwjs.load();
    if (loadedModel) {
       setModel(loadedModel);
    }
    if (loading) {
        console.log('Image is loading, will check after load');
        checkImage();
    }
    } catch (err) {
    console.error('Error loading NSFWJS model:', err);
    setError('Failed to load content filter');
    setLoading(false);
    }
};


  // Check image when model is loaded and image is loaded
  const checkImage = async () => {
    console.log('Checking image:', imgRef.current);
    console.log('Model loaded:', model);
    if (!model || !imgRef.current) return;
    console.log('Checking image:', src);
    try {
      setLoading(true);
      const predictions: NSFWPrediction[] = await model.classify(imgRef.current);
      
      // Check if any NSFW categories have high probability
      const nsfwThreshold = 0.6; // Adjust this threshold as needed
      const hasNSFWContent = predictions.some(prediction => {
        const nsfwCategories = ['Porn', 'Hentai', 'Sexy'];
        return nsfwCategories.includes(prediction.className) && 
               prediction.probability > nsfwThreshold;
      });

      setIsNSFW(hasNSFWContent);
      setShowOriginal(!hasNSFWContent); // Auto-show if safe
      setLoading(false);
    } catch (err) {
      console.error('Error classifying image:', err);
      setError('Failed to analyze image content');
      setShowOriginal(true); // Show image if analysis fails
      setLoading(false);
    }
  };

  const handleImageLoad = () => {
    
    if (model) {
      checkImage();
    } else {
      console.warn('Model not loaded yet, will check image later');
      //setLoading(true);
    }
  };

  const handleConsentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserConsent(event.target.checked);
    if (event.target.checked) {
      setShowOriginal(true);
    } else {
      setShowOriginal(false);
    }
  };

  const imageStyle: React.CSSProperties = {
    maxWidth,
    maxHeight,
    objectFit: 'cover',
    borderRadius: '8px',
    ...style,
    ...(isNSFW && !showOriginal ? {
      filter: 'blur(20px)',
      transition: 'filter 0.3s ease'
    } : {
      filter: 'none',
      transition: 'filter 0.3s ease'
    })
  };

  return (
    model &&
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      {/* Hidden image for NSFWJS analysis */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        style={{ display: 'none' }}
        onLoad={handleImageLoad}
        onError={() => {
          setError('Failed to load image');
          setLoading(false);
        }}
      />

      {/* Visible image */}
      <img
        src={src}
        alt={alt}
        style={imageStyle}
      />

      {/* Loading overlay */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '8px'
          }}
        >
          <CircularProgress size={24} />
        </Box>
      )}

      {/* NSFW Warning overlay */}
      {isNSFW && !showOriginal && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            borderRadius: '8px',
            padding: 2
          }}
        >
          <Warning sx={{ fontSize: 32, mb: 1, color: 'orange' }} />
          <Typography variant="body2" align="center" sx={{ mb: 2 }}>
            This image may contain adult content
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={userConsent}
                onChange={handleConsentChange}
                sx={{ 
                  color: 'white',
                  '&.Mui-checked': {
                    color: 'orange'
                  }
                }}
              />
            }
            label={
              <Typography variant="caption" sx={{ color: 'white' }}>
                I confirm I want to view this content
              </Typography>
            }
          />
        </Box>
      )}

      {/* Error display */}
      {error && (
        <Box sx={{ mt: 1 }}>
          <Alert severity="warning" sx={{ fontSize: '0.75rem' }}>
            {error}
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default SafeImage;