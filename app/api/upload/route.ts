import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  // Add timeout configuration
  timeout: 60000, // 60 seconds
});

// Increase the maximum duration for this API route (if using Vercel)
export const maxDuration = 60; // seconds

// Configure body size limit
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Adjust based on your needs
    },
  },
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' },
        { status: 400 }
      );
    }

    console.log('Starting upload:', file.name, 'Size:', file.size, 'bytes');

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    // Upload to Cloudinary with additional options
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'tusha-booking/properties',
      resource_type: 'image',
      // Optimize upload
      quality: 'auto',
      fetch_format: 'auto',
      // Add timeout for upload
      timeout: 60000,
    });

    console.log('Upload successful:', result.secure_url);

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    
    // Handle specific error types
    if (error.message?.includes('timeout')) {
      return NextResponse.json(
        { error: 'Upload timeout. Please try with a smaller image or check your connection.' },
        { status: 408 }
      );
    }
    
    if (error.http_code === 401) {
      return NextResponse.json(
        { error: 'Cloudinary authentication failed. Check your credentials.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Upload failed', 
        message: error.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}