export const padImageToAspectRatio = (base64Image: string, targetAspectRatioValue: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const [widthRatio, heightRatio] = targetAspectRatioValue.split(':').map(Number);
            const targetAspectRatio = widthRatio / heightRatio;
            const imageAspectRatio = img.width / img.height;

            let canvasWidth: number;
            let canvasHeight: number;

            if (imageAspectRatio > targetAspectRatio) {
                // Image is wider than target, so match width and calculate new height
                canvasWidth = img.width;
                canvasHeight = img.width / targetAspectRatio;
            } else {
                // Image is taller than or equal to target, so match height and calculate new width
                canvasHeight = img.height;
                canvasWidth = img.height * targetAspectRatio;
            }

            const canvas = document.createElement('canvas');
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }

            // Fill with semi-transparent gray background matching the theme
            ctx.fillStyle = 'rgba(75, 85, 99, 0.7)'; // base-300 with transparency
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Calculate centered position
            const dx = (canvas.width - img.width) / 2;
            const dy = (canvas.height - img.height) / 2;

            // Draw original image on top
            ctx.drawImage(img, dx, dy);

            resolve(canvas.toDataURL());
        };
        img.onerror = (err) => {
            reject(err);
        };
        img.src = base64Image;
    });
};

export const cropImageToAspectRatio = (base64Image: string, targetAspectRatioValue: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const [widthRatio, heightRatio] = targetAspectRatioValue.split(':').map(Number);
            const targetAspectRatio = widthRatio / heightRatio;
            const imageAspectRatio = img.width / img.height;

            let sx = 0;
            let sy = 0;
            let sWidth = img.width;
            let sHeight = img.height;

            if (imageAspectRatio > targetAspectRatio) {
                // Image is wider than the target, crop the sides
                sWidth = img.height * targetAspectRatio;
                sx = (img.width - sWidth) / 2;
            } else if (imageAspectRatio < targetAspectRatio) {
                // Image is taller than the target, crop the top and bottom
                sHeight = img.width / targetAspectRatio;
                sy = (img.height - sHeight) / 2;
            }
            // If aspect ratios are the same, no cropping is needed

            const canvas = document.createElement('canvas');
            canvas.width = sWidth;
            canvas.height = sHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }

            // Draw the cropped portion of the image onto the canvas
            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

            resolve(canvas.toDataURL());
        };
        img.onerror = (err) => {
            reject(err);
        };
        img.src = base64Image;
    });
};

export const downloadImage = (base64Image: string, filename: string, format: 'image/jpeg' | 'image/png', quality: number = 0.8): void => {
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get canvas context for download');
            return;
        }
        ctx.drawImage(img, 0, 0);

        const dataUrl = canvas.toDataURL(format, quality);

        const link = document.createElement('a');
        const extension = format === 'image/png' ? 'png' : 'jpg';
        link.download = `${filename}.${extension}`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    img.onerror = (err) => {
        console.error('Failed to load image for download:', err);
    };
    img.src = base64Image;
};