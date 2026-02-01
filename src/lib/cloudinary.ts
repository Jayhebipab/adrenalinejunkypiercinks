// lib/cloudinary.ts

export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  
  // Siguraduhin na ang mga ito ay nasa .env.local mo
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary config is missing in .env");
  }

  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to upload image");
    }

    const data = await response.json();
    return data.secure_url; // Ito yung HTTPS link na ibabalik niya
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw error;
  }
};