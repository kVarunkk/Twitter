"use client";

export default function Avatar({ src, alt, size = "md" }) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-20 h-20",
  };

  return (
    <img
      className={`rounded-full ${sizeClasses[size]}`}
      src={src}
      alt={alt}
      onError={(e) => {
        e.currentTarget.onerror = null; // prevent infinite loop
        e.currentTarget.src = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/avatars/initial-avatar.png`;
      }}
    />
  );
}
