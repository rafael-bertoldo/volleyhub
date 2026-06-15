import Image from "next/image";

interface AnuncioImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function AnuncioImage({ src, alt, className = "" }: AnuncioImageProps) {
  return (
    <div className={`relative w-full overflow-hidden rounded-lg bg-gray-100 ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={800}
        height={600}
        className="w-full h-auto object-contain max-h-96"
        sizes="(max-width: 768px) 100vw, 600px"
        unoptimized
      />
    </div>
  );
}
