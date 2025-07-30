import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Check, RotateCcw } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

const CameraConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useBodyScrollLock(isOpen);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      onClose();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setImageSrc(null);
    }
    return stopCamera;
  }, [isOpen]);

  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/png');
      setImageSrc(dataUrl);
      stopCamera();
    }
  };

  const handleConfirm = () => {
    onConfirm(imageSrc);
    onClose();
  };

  const handleRetake = () => {
    setImageSrc(null);
    startCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[80] flex justify-center items-center p-4">
      <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-2xl w-full max-w-lg border border-[var(--color-border)] p-4">
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          {imageSrc ? (
            <img src={imageSrc} alt="Captured" className="w-full h-full object-contain" />
          ) : (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
          )}
          <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
        
        <div className="flex justify-center items-center gap-4 mt-4">
          {imageSrc ? (
            <>
              <button 
                onClick={handleRetake} 
                title='Tomar de Nuevo' 
                className="p-3 rounded-full bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30"
              >
                <RotateCcw className="h-6 w-6" />
              </button>
              <button 
                onClick={handleConfirm} 
                title='Confirmar' 
                className="p-4 rounded-full bg-green-500 text-white hover:bg-green-600"
              >
                <Check className="h-8 w-8" />
              </button>
            </>
          ) : (
            <button 
              onClick={takePicture} 
              title='Tomar Foto' 
              className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 animate-pulse"
            >
              <Camera className="h-8 w-8" />
            </button>
          )}
        </div>
        
        <button 
          onClick={onClose} 
          className="absolute top-2 right-2 text-white bg-black/50 rounded-full p-1.5"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default CameraConfirmationModal;