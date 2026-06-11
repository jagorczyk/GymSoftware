import { useState, useRef } from "react";
import { Camera, Loader2, User as UserIcon } from "lucide-react";
import { uploadAvatar } from "../api";
import { useAuth } from "../authContext";

interface AvatarUploadProps {
  currentUrl?: string | null;
  onUploadSuccess: (url: string) => void;
  className?: string;
}

export function AvatarUpload({ currentUrl, onUploadSuccess, className = "" }: AvatarUploadProps) {
  const { auth } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Plik jest za duży (max 5MB).");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Wybierz plik graficzny (np. JPG, PNG).");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      if (!auth) {
        setError("Brak autoryzacji");
        return;
      }
      const { url } = await uploadAvatar(auth, file);
      onUploadSuccess(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd podczas wgrywania zdjęcia.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getFullUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `http://localhost:8080${url}`;
  };

  const displayUrl = getFullUrl(currentUrl);

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="relative group">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-md flex items-center justify-center">
          {displayUrl ? (
            <img src={displayUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-10 h-10 text-slate-400" />
          )}
        </div>
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          title="Zmień zdjęcie"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
        </button>
      </div>
      
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />
    </div>
  );
}
