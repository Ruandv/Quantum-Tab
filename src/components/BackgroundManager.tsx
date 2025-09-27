import React, { useState, useRef, useCallback } from 'react';
import { BackgroundManagerProps } from '../types/common';
import { validateImageFile, fileToDataURL } from '../utils/helpers';

const BackgroundManager: React.FC<BackgroundManagerProps> = ({
  className = '',
  onBackgroundChange,
  isLocked
}: BackgroundManagerProps) => {
  if (isLocked) return null;
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setIsUploading(true);

    try {
      const imageUrl = await fileToDataURL(file);
      setUploadedImage(imageUrl);
      onBackgroundChange?.(imageUrl);
    } catch (err) {
      setError('Failed to read file. Please try again.');
      console.error('File read error:', err);
    } finally {
      setIsUploading(false);
    }
  }, [onBackgroundChange]);

  const handleRemoveBackground = useCallback(() => {
    setUploadedImage(null);
    setError(null);
    onBackgroundChange?.('');
  }, [onBackgroundChange]);

  const handleRestoreDefault = useCallback(() => {
    setUploadedImage(null);
    setError(null);
    onBackgroundChange?.('default');
  }, [onBackgroundChange]);

  const renderUploadArea = () => {
    if (isUploading) {
      return (
        <div className="upload-content">
          <div className="upload-spinner" />
          <span>Uploading...</span>
        </div>
      );
    }

    return (
      <div className="upload-content">
        <div className="upload-icon">📁</div>
        <span className="upload-text">Click to upload image</span>
        <small className="upload-hint">PNG, JPG, JPEG, GIF, WebP (max 5MB)</small>
      </div>
    );
  };

  const renderPreview = () => (
    <div className="preview-section">
      <div className="image-preview">
        <img
          src={uploadedImage!}
          alt="Background preview"
          className="preview-image"
        />
        <div className="preview-overlay">
          <span className="preview-label">Current Background</span>
        </div>
      </div>
    </div>
  );

  const renderControls = () => {
    if (uploadedImage) {
      return (
        <>
          <button
            className="control-btn change-btn"
            onClick={handleFileSelect}
            title="Change background image"
          >
            📁 Change
          </button>
          <button
            className="control-btn default-btn"
            onClick={handleRestoreDefault}
            title="Restore default gradient background"
          >
            🎨 Default
          </button>
          <button
            className="control-btn remove-btn"
            onClick={handleRemoveBackground}
            title="Remove background image"
          >
            🗑️ Remove
          </button>
        </>
      );
    }

    return (
      <button
        className="control-btn default-btn"
        onClick={handleRestoreDefault}
        title="Restore default gradient background"
      >
        🎨 Default Gradient
      </button>
    );
  };

  return (
    <div className={`background-manager-widget ${className}`}>
      <h3 className="widget-title">Background Manager</h3>

      <div className="upload-section">
        {!uploadedImage ? (
          <div className="upload-area" onClick={handleFileSelect}>
            {renderUploadArea()}
          </div>
        ) : (
          renderPreview()
        )}

        {error && (
          <div className="error-message" style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {error}
          </div>
        )}
      </div>

      <div className="control-buttons">
        {renderControls()}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default BackgroundManager;