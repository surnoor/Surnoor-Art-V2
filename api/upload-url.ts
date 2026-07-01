import type { VercelRequest, VercelResponse } from '@vercel/node';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const R2_ACCESS_KEY = process.env.CLOUDFLARE_ACCESS_KEY_ID;
const R2_SECRET_KEY = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.CLOUDFLARE_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL;

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY || '',
    secretAccessKey: R2_SECRET_KEY || '',
  },
  forcePathStyle: true, // Cloudflare R2 requires path-style, otherwise DNS resolution fails (Load failed)
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filename, contentType } = req.body;
    if (!filename || !contentType) {
      return res.status(400).json({ error: 'Filename and contentType are required' });
    }

    // Generate unique key
    const uniqueKey = `archive/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: uniqueKey,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(s3, command, { 
      expiresIn: 3600,
      signableHeaders: new Set(['content-type']) // Force SDK to sign content-type to fix R2 SignatureDoesNotMatch
    });
    
    // Fallback if env var is missing in Vercel
    const baseUrl = R2_PUBLIC_URL || `https://pub-2ff9e3b996114aab81e1957cdfcb97c0.r2.dev`; 
    const publicUrl = `${baseUrl}/${uniqueKey}`;

    return res.status(200).json({ signedUrl, publicUrl, key: uniqueKey });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return res.status(500).json({ error: 'Failed to generate upload URL' });
  }
}
