import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Upload, X, Check, ArrowLeft, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db, uploadImageToStorage } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestoreUtils';

interface ProfilePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhotoUrl?: string;
  phoneNumber: string;
  onPhotoUpdated: (newPhotoUrl: string) => void;
}

export default function ProfilePhotoModal({
  isOpen,
  onClose,
  currentPhotoUrl,
  phoneNumber,
  onPhotoUpdated,
}: ProfilePhotoModalProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Start Camera Stream
  const startCamera = async (facing: 'user' | 'environment') => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported on this browser or device.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => console.warn('Video play error:', err));
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access in your browser settings or use Upload Photo.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera device detected. Please use the Upload Photo option.');
      } else {
        setCameraError(err.message || 'Unable to access camera.');
      }
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera' && !previewImage) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, facingMode, previewImage]);

  if (!isOpen) return null;

  // Toggle Camera Facing Mode
  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture Photo from Live Video Feed
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth || 640, video.videoHeight || 640);
    canvas.width = 512;
    canvas.height = 512;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Crop square from center of video frame
    const sx = ((video.videoWidth || 640) - size) / 2;
    const sy = ((video.videoHeight || 640) - size) / 2;

    // Mirror if front camera
    if (facingMode === 'user') {
      ctx.translate(512, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, sx, sy, size, size, 0, 0, 512, 512);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setPreviewImage(dataUrl);
    stopCamera();
  };

  // Handle File Input from Gallery/Disk
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 512, 512);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setPreviewImage(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Retake / Clear Preview
  const handleRetake = () => {
    setPreviewImage(null);
    if (activeTab === 'camera') {
      startCamera(facingMode);
    }
  };

  // Save to Firestore Profile Document
  const handleSaveProfilePhoto = async () => {
    if (!previewImage || !phoneNumber) return;
    setIsSaving(true);
    try {
      let finalUrl = previewImage;

      // Attempt to convert dataUrl to File & upload to Firebase Storage if available
      try {
        const res = await fetch(previewImage);
        const blob = await res.blob();
        const file = new File([blob], `avatar_${phoneNumber}_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const storageUrl = await uploadImageToStorage(file, `avatars/${phoneNumber}/${Date.now()}.jpg`);
        if (storageUrl) {
          finalUrl = storageUrl;
        }
      } catch (storageErr) {
        console.warn('Storage upload fallback to compressed dataUrl:', storageErr);
      }

      // Persist URL into user document in Firestore
      const userDocRef = doc(db, 'users', phoneNumber);
      try {
        await setDoc(
          userDocRef,
          {
            imageUrl: finalUrl,
            photoURL: finalUrl,
            avatarUrl: finalUrl,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (firestoreErr) {
        handleFirestoreError(firestoreErr, OperationType.UPDATE, `users/${phoneNumber}`);
      }

      onPhotoUpdated(finalUrl);
      showToast('Profile photo updated successfully!');
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      console.error('Failed to save profile photo:', err);
      showToast('Failed to update photo. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-60 bg-[#181a24] text-white px-4 py-2.5 rounded-full shadow-2xl border border-white/15 text-xs font-semibold flex items-center gap-2">
          <Check size={14} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="w-full max-w-sm bg-[#151722] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#6c1cf5]/20 flex items-center justify-center text-[#9b6df8]">
              <Camera size={16} />
            </div>
            <h3 className="text-base font-bold text-white">Profile Photo</h3>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        {!previewImage && (
          <div className="p-3 bg-[#11121a] flex gap-2 border-b border-white/5">
            <button
              onClick={() => {
                setActiveTab('camera');
                setPreviewImage(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'camera'
                  ? 'bg-[#6c1cf5] text-white shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Camera size={14} />
              <span>Camera API</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('upload');
                stopCamera();
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'upload'
                  ? 'bg-[#6c1cf5] text-white shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Upload size={14} />
              <span>Upload File</span>
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-5 flex-1 flex flex-col items-center justify-center">
          {previewImage ? (
            /* Preview State */
            <div className="flex flex-col items-center w-full">
              <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-[#6c1cf5] shadow-2xl p-1 bg-gradient-to-tr from-purple-600 to-indigo-500">
                <img
                  src={previewImage}
                  alt="Captured Profile"
                  className="w-full h-full rounded-full object-cover bg-black"
                />
              </div>
              <p className="text-xs text-white/70 mt-3 font-medium text-center">
                Preview your new profile picture
              </p>

              <div className="grid grid-cols-2 gap-3 w-full mt-6">
                <button
                  onClick={handleRetake}
                  disabled={isSaving}
                  className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-white/10 active:scale-95 transition-all"
                >
                  <ArrowLeft size={14} />
                  <span>Retake</span>
                </button>

                <button
                  onClick={handleSaveProfilePhoto}
                  disabled={isSaving}
                  className="py-3 px-4 rounded-2xl bg-gradient-to-r from-[#6c1cf5] to-[#8a41f6] hover:from-[#5b15d4] hover:to-[#743df5] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-purple-900/30 active:scale-95 transition-all"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Save Photo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : activeTab === 'camera' ? (
            /* Live Camera View */
            <div className="flex flex-col items-center w-full">
              {cameraError ? (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center w-full">
                  <AlertCircle size={28} className="text-amber-400 mx-auto mb-2" />
                  <p className="text-xs text-amber-200 font-medium leading-relaxed mb-3">
                    {cameraError}
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="py-2 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs"
                  >
                    Switch to File Upload
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative w-52 h-52 rounded-full overflow-hidden border-4 border-dashed border-[#6c1cf5]/70 shadow-2xl bg-black flex items-center justify-center">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                    />
                    {/* Face Overlay Guideline */}
                    <div className="absolute inset-0 border-2 border-white/20 rounded-full pointer-events-none" />
                  </div>

                  <p className="text-[11px] text-white/50 mt-3 text-center">
                    Center your face inside the circle
                  </p>

                  {/* Camera Controls */}
                  <div className="flex items-center justify-center gap-6 mt-5">
                    {/* Flip Camera Button */}
                    <button
                      onClick={toggleCameraFacing}
                      className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white/80 active:scale-90 transition-all border border-white/10"
                      title="Flip Camera"
                    >
                      <RefreshCw size={18} />
                    </button>

                    {/* Shutter Button */}
                    <button
                      onClick={handleCapturePhoto}
                      className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#6c1cf5] to-[#a855f7] p-1 shadow-lg shadow-purple-900/40 hover:scale-105 active:scale-95 transition-all"
                      title="Capture Photo"
                    >
                      <div className="w-full h-full rounded-full border-2 border-white flex items-center justify-center bg-white/10">
                        <div className="w-10 h-10 rounded-full bg-white shadow-sm" />
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Upload File View */
            <div className="flex flex-col items-center w-full">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-44 rounded-2xl border-2 border-dashed border-white/20 hover:border-[#6c1cf5] bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center cursor-pointer p-4 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-[#6c1cf5]/20 group-hover:bg-[#6c1cf5]/30 text-[#a855f7] flex items-center justify-center mb-2 transition-all">
                  <Upload size={22} />
                </div>
                <p className="text-xs font-bold text-white mb-1">Click to select photo</p>
                <p className="text-[10px] text-white/50 text-center">
                  Supports JPG, PNG, WEBP from your device
                </p>
              </div>

              {currentPhotoUrl && (
                <div className="mt-4 flex items-center gap-2 text-xs text-white/60">
                  <span>Current photo:</span>
                  <img
                    src={currentPhotoUrl}
                    alt="Current"
                    className="w-6 h-6 rounded-full object-cover border border-white/20"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
