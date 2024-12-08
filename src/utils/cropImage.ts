
import { Area } from 'react-easy-crop';

export const getCroppedImg = (imageSrc: string, pixelCrop: Area): Promise<File> => {
  return new Promise((resolve) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (ctx) {
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        );

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], 'croppedImage.png', { type: 'image/png' }));
          }
        }, 'image/png');
      }
    };
  });
};