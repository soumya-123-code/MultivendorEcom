import React, { useState, useRef } from 'react';
import {
  Box, Button, Typography, IconButton, CircularProgress, Paper,
  ImageList, ImageListItem, ImageListItemBar,
} from '@mui/material';
import {
  CloudUpload as UploadIcon, Delete as DeleteIcon, Add as AddIcon,
} from '@mui/icons-material';

interface ImageUploadProps {
  images: { id?: number; url: string; file?: File }[];
  onChange: (images: { id?: number; url: string; file?: File }[]) => void;
  maxImages?: number;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onChange,
  maxImages = 5,
  accept = 'image/*',
  maxSizeMB = 5,
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setError(null);
    const newImages: { url: string; file: File }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File "${file.name}" exceeds ${maxSizeMB}MB limit`);
        continue;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError(`File "${file.name}" is not an image`);
        continue;
      }

      // Check max images limit
      if (images.length + newImages.length >= maxImages) {
        setError(`Maximum ${maxImages} images allowed`);
        break;
      }

      // Create preview URL
      const url = URL.createObjectURL(file);
      newImages.push({ url, file });
    }

    if (newImages.length > 0) {
      onChange([...images, ...newImages]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const imageToRemove = images[index];
    // Revoke object URL if it's a preview
    if (imageToRemove.file) {
      URL.revokeObjectURL(imageToRemove.url);
    }
    onChange(images.filter((_, i) => i !== index));
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer.files;
    if (files && fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      for (let i = 0; i < files.length; i++) {
        dataTransfer.items.add(files[i]);
      }
      fileInputRef.current.files = dataTransfer.files;
      handleFileSelect({ target: { files: dataTransfer.files } } as any);
    }
  };

  return (
    <Box>
      {/* Upload Area */}
      {images.length < maxImages && (
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            textAlign: 'center',
            border: '2px dashed',
            borderColor: 'divider',
            backgroundColor: 'action.hover',
            cursor: disabled ? 'default' : 'pointer',
            transition: 'border-color 0.2s',
            '&:hover': {
              borderColor: disabled ? 'divider' : 'primary.main',
            },
          }}
          onDragOver={handleDragOver}
          onDrop={disabled ? undefined : handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept={accept}
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            disabled={disabled}
          />
          {uploading ? (
            <CircularProgress size={40} />
          ) : (
            <>
              <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body1" gutterBottom>
                Click or drag images to upload
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Max {maxSizeMB}MB per file • {maxImages - images.length} remaining
              </Typography>
            </>
          )}
        </Paper>
      )}

      {/* Error Message */}
      {error && (
        <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
          {error}
        </Typography>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <ImageList sx={{ mt: 2 }} cols={4} rowHeight={120}>
          {images.map((image, index) => (
            <ImageListItem key={index} sx={{ borderRadius: 1, overflow: 'hidden' }}>
              <img
                src={image.url}
                alt={`Upload ${index + 1}`}
                loading="lazy"
                style={{ height: '100%', objectFit: 'cover' }}
              />
              <ImageListItemBar
                sx={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
                }}
                position="bottom"
                actionIcon={
                  <IconButton
                    sx={{ color: 'white' }}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(index);
                    }}
                    disabled={disabled}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }
              />
            </ImageListItem>
          ))}
          {images.length < maxImages && (
            <ImageListItem
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'action.hover',
                borderRadius: 1,
                cursor: disabled ? 'default' : 'pointer',
                border: '2px dashed',
                borderColor: 'divider',
              }}
              onClick={() => !disabled && fileInputRef.current?.click()}
            >
              <AddIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
            </ImageListItem>
          )}
        </ImageList>
      )}
    </Box>
  );
};

export default ImageUpload;
