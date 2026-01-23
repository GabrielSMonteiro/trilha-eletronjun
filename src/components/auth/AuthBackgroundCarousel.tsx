import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BackgroundImage {
  id: string;
  image_url: string;
  title: string | null;
  display_order: number;
}

const AuthBackgroundCarousel = () => {
  const [images, setImages] = useState<BackgroundImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      const { data, error } = await supabase
        .from("auth_background_images")
        .select("id, image_url, title, display_order")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (!error && data && data.length > 0) {
        setImages(data);
      }
      setIsLoading(false);
    };

    fetchImages();
  }, []);

  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  if (isLoading) {
    return <div className="absolute inset-0 bg-black" />;
  }

  if (images.length === 0) {
    return <div className="absolute inset-0 bg-black" />;
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      {images.map((image, index) => (
        <div
          key={image.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={image.image_url}
            alt={image.title || "Background"}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
      ))}
    </div>
  );
};

export default AuthBackgroundCarousel;
