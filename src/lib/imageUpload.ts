import axios from "axios";
import Compressor from "compressorjs";

// Helper to convert blob to File
function blobToFile(blob: Blob, fileName: string): File {
	return new File([blob], fileName, { type: blob.type });
}

// Validate image transparency
export async function validateTransparency(file: File): Promise<{ isValid: boolean; transparencyPercentage: number; error?: string }> {
	return new Promise((resolve) => {
		// Only validate PNG and GIF files
		if (!file.type.includes('png') && !file.type.includes('gif')) {
			resolve({ isValid: false, transparencyPercentage: 0, error: 'Only PNG and GIF files can have transparency' });
			return;
		}

		const img = new Image();
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		img.onload = () => {
			canvas.width = img.width;
			canvas.height = img.height;
			
			if (!ctx) {
				resolve({ isValid: false, transparencyPercentage: 0, error: 'Failed to create canvas context' });
				return;
			}

			ctx.drawImage(img, 0, 0);
			
			try {
				const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				const data = imageData.data;
				
				let transparentPixels = 0;
				let totalPixels = 0;
				
				// Check alpha channel of each pixel (every 4th value in the data array)
				for (let i = 3; i < data.length; i += 4) {
					totalPixels++;
					if (data[i] < 255) { // Alpha less than 255 means some transparency
						transparentPixels++;
					}
				}
				
				const transparencyPercentage = (transparentPixels / totalPixels) * 100;
				const isValid = transparencyPercentage >= 10; // Minimum 10% transparency required
				
				resolve({
					isValid,
					transparencyPercentage: Math.round(transparencyPercentage * 100) / 100,
					error: isValid ? undefined : `Transparency is ${transparencyPercentage.toFixed(1)}%. Minimum 10% transparency required for AR filters.`
				});
			} catch (error) {
				resolve({ isValid: false, transparencyPercentage: 0, error: 'Failed to analyze image transparency' });
			}
		};

		img.onerror = () => {
			resolve({ isValid: false, transparencyPercentage: 0, error: 'Failed to load image for transparency analysis' });
		};

		img.src = URL.createObjectURL(file);
	});
}

// Compress single image file
export async function compressImage(image: File): Promise<File> {
	return new Promise((resolve, reject) => {
		new Compressor(image, {
			quality: 0.6,
			success(result) {
				const compressedImage = blobToFile(result, image.name);
				resolve(compressedImage);
			},
			error(err) {
				reject(err);
			},
		});
	});
}

// Upload a single image, returns the uploaded filename or URL
export async function uploadImage(image: File, folderName: string) {
	const file = new File([image], image.name || "image.jpg");
	const formData = new FormData();
	formData.append("folder", `rong-digital/${folderName}`);
	formData.append("image", file);

	const { data } = await axios.post(import.meta.env.VITE_FILE_UPLOAD_URL!, formData, {
		headers: {
			"Content-Type": "multipart/form-data",
			username: import.meta.env.VITE_FILE_UPLOAD_ID,
			password: import.meta.env.VITE_FILE_UPLOAD_PASS,
		},
	});

	return data.files.image; // or adjust as per your API's response
}


export async function uploadImages(images: File[], folderName: string): Promise<string[]> {
	const uploaded: string[] = [];
	for (const image of images) {
		const compressed = await compressImage(image);
		const url = await uploadImage(compressed, folderName);
		uploaded.push(url);
	}
	return uploaded;
}
