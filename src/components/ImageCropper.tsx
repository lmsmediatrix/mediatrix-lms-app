import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { toast } from "react-toastify";
import Dialog from "./common/Dialog";
import Button from "./common/Button";

interface ImageCropperProps {
  imageSrc: string | null;
  isOpen: boolean;
  onClose: () => void;
  aspectRatio: number;
  onCropComplete: (croppedImage: File | null) => void;
}

// Utility function to generate cropped image
const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<File | null> => {
  const image = new Image();
  image.src = imageSrc;
  image.crossOrigin = "anonymous"; // Handle cross-origin images
  await new Promise((resolve) => (image.onload = resolve));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Calculate the bounding box for the rotated image
  const rotRad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rotRad);
  const sin = Math.sin(rotRad);
  const bBoxWidth = Math.abs(cos * image.width) + Math.abs(sin * image.height);
  const bBoxHeight = Math.abs(sin * image.width) + Math.abs(cos * image.height);

  // Set canvas size to the cropped area
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Translate and rotate the canvas
  ctx.translate(pixelCrop.width / 2, pixelCrop.height / 2);
  ctx.rotate(rotRad);
  ctx.translate(-pixelCrop.width / 2, -pixelCrop.height / 2);

  // Draw the image with the correct offset
  const scaleX = image.width / bBoxWidth;
  const scaleY = image.height / bBoxHeight;
  const scaledCropX = pixelCrop.x * scaleX;
  const scaledCropY = pixelCrop.y * scaleY;

  ctx.drawImage(
    image,
    scaledCropX,
    scaledCropY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise<File | null>((resolve) => {
    canvas.toBlob((blob: Blob | null) => {
      if (blob) {
        resolve(new File([blob], "cropped-image.jpg", { type: "image/jpeg" }));
      } else {
        resolve(null);
      }
    }, "image/jpeg", 0.80); 
  });
};

export default function ImageCropper({
  imageSrc,
  isOpen,
  onClose,
  aspectRatio = 1,
  onCropComplete,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const handleCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (imageSrc && croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(
          imageSrc,
          croppedAreaPixels,
          rotation
        );
        onCropComplete(croppedImage);
        onClose();
      } catch (e) {
        toast.error("Error cropping image");
      }
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Crop Image"
      backdrop="blur"
      size="full"
      contentClassName="w-full md:w-[30vw] md:min-w-[500px] max-w-[600px]"
    >
      {imageSrc && (
        <div className="relative w-full h-[400px]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspectRatio}
            showGrid={true}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={handleCropComplete}
            maxZoom={10}
          />
        </div>
      )}
      <div className="mt-4 space-y-4 p-3 bg-gray-50 rounded-md">
        <div>
          <label
            htmlFor="rotation"
            className="block text-sm font-medium text-gray-900"
          >
            Rotate Image
          </label>
          <input
            type="range"
            id="rotation"
            min="0"
            max="360"
            step="1"
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer accent-primary hover:accent-primary/80
        [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full
        [&::-webkit-slider-thumb]:bg-primary [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3
        [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary"
          />
          <div className="mt-1 text-sm text-gray-600">
            Rotation: {rotation}°
          </div>
        </div>
        <div>
          <label
            htmlFor="zoom"
            className="block text-sm font-medium text-gray-900"
          >
            Zoom Image
          </label>
          <input
            type="range"
            id="zoom"
            min="1"
            max="10"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer accent-primary hover:accent-primary/80
        [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full
        [&::-webkit-slider-thumb]:bg-primary [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3
        [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary"
          />
          <div className="mt-1 text-sm text-gray-600">Zoom: {zoom}x</div>
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-4">
        <Button
          type="button"
          onClick={onClose}
          className="bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleCrop}
          className="bg-primary text-white hover:bg-primary/90"
        >
          Crop
        </Button>
      </div>
    </Dialog>
  );
}