const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const getS3Client = () => {
  return new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    // If running on EC2 with IAM role, credentials are auto-discovered
    // For local dev with explicit credentials:
    ...(process.env.AWS_ACCESS_KEY_ID ? {
      credentials: {
        accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    } : {}),
  });
};

const uploadPDF = async (key, pdfBuffer) => {
  const s3 = getS3Client();
  const command = new PutObjectCommand({
    Bucket:      process.env.S3_BUCKET,
    Key:         key,
    Body:        pdfBuffer,
    ContentType: 'application/pdf',
  });
  await s3.send(command);
  return key;
};

const getPresignedUrl = async (key, expiresInSeconds = 3600) => {
  const s3 = getS3Client();
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key:    key,
  });
  return await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
};

module.exports = { uploadPDF, getPresignedUrl };
