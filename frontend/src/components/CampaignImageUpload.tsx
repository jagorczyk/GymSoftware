import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadImage } from "../api";
import { useAuth } from "../authContext";
import { secondaryButtonClassName } from "./formStyles";

type CampaignImageUploadProps = {
  imageUrl: string | null;
  onImageUrlChange: (url: string | null) => void;
  disabled?: boolean;
};

export function CampaignImageUpload({
  imageUrl,
  onImageUrlChange,
  disabled = false,
}: CampaignImageUploadProps) {
  const { auth } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !auth) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Plik jest za duży (max 5 MB).");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Wybierz plik graficzny (JPG, PNG lub WebP).");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const { url } = await uploadImage(auth, file);
      onImageUrlChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się wgrać zdjęcia.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className={secondaryButtonClassName}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
          Dodaj zdjęcie
        </button>
        {imageUrl ? (
          <button
            type="button"
            onClick={() => onImageUrlChange(null)}
            disabled={disabled || uploading}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 hover:text-rose-700"
          >
            <X className="w-4 h-4" />
            Usuń zdjęcie
          </button>
        ) : null}
      </div>

      {imageUrl ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-950/40">
          <img src={imageUrl} alt="Podgląd zdjęcia kampanii" className="w-full max-h-56 object-cover" />
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Wgraj własne zdjęcie promocyjne. Nie dodajemy żadnych grafik systemowych — tylko to, co sam wybierzesz.
        </p>
      )}

      {error ? <p className="text-sm text-rose-500 font-medium">{error}</p> : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />
    </div>
  );
}
