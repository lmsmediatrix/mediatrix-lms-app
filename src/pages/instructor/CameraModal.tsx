import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Dialog from "../../components/common/Dialog";
import Button from "../../components/common/Button";

interface CameraModalProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

export default function CameraModal({ onCapture, onClose }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError(
          "Failed to access camera. Please ensure camera permissions are granted."
        );
      }
    }

    if (!capturedImage) {
      setupCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    };
  }, [capturedImage]);

  // Handle modal close to ensure stream is stopped
  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    onClose();
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 300);

      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageData = canvasRef.current.toDataURL("image/jpeg");
        setCapturedImage(imageData);
        // Stop the stream after capturing
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          setStream(null);
        }
      }
    }
  };

  const handleKeep = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      handleClose(); // Close modal after keeping the image
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    // Stream will be restarted by useEffect due to capturedImage change
  };

  return (
    <Dialog
      isOpen={true}
      onClose={handleClose}
      title="Capture Profile Photo"
      size="xl"
      position="center"
      backdrop="blur"
      animation="pop"
      showCloseButton={true}
    >
      {error ? (
        <p className="text-red-500 text-center">{error}</p>
      ) : (
        <div className="relative flex flex-col items-center">
          {capturedImage ? (
            <div className="w-full max-h-128">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full max-h-128 rounded-lg mb-4 object-cover"
              />
              <div className="flex gap-4 w-full">
                <Button
                  variant="cancel"
                  onClick={handleClose}
                  className="w-full"
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRetake}
                  className="w-full"
                >
                  Retake
                </Button>
                <Button
                  variant="primary"
                  onClick={handleKeep}
                  className="w-full"
                >
                  Keep
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative w-full max-h-128">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full max-h-128 rounded-lg mb-4"
                />
                <AnimatePresence>
                  {showFlash && (
                    <motion.div
                      className="absolute inset-0 bg-white rounded-lg"
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  )}
                </AnimatePresence>
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex gap-4 w-full">
                <Button
                  variant="cancel"
                  onClick={handleClose}
                  className="w-full"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={captureImage}
                  className="w-full"
                >
                  Capture
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Dialog>
  );
}
