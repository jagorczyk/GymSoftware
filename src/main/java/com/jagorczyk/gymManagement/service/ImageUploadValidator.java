package com.jagorczyk.gymManagement.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class ImageUploadValidator {
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".webp", ".gif");
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    private final long maxBytes;

    public ImageUploadValidator(@Value("${app.upload.max-bytes:5242880}") long maxBytes) {
        this.maxBytes = maxBytes;
    }

    public String validateAndResolveExtension(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Plik jest pusty.");
        }
        if (file.getSize() > maxBytes) {
            throw new IllegalArgumentException("Plik jest zbyt duży. Maksymalny rozmiar to " + (maxBytes / 1024 / 1024) + " MB.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Dozwolone są tylko pliki JPEG, PNG, WebP i GIF.");
        }

        String extension = extensionFromContentType(contentType);
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && originalFilename.contains(".")) {
            String fromName = originalFilename.substring(originalFilename.lastIndexOf('.')).toLowerCase(Locale.ROOT);
            if (!ALLOWED_EXTENSIONS.contains(fromName)) {
                throw new IllegalArgumentException("Niedozwolone rozszerzenie pliku.");
            }
            if (!fromName.equals(extension) && !(fromName.equals(".jpg") && extension.equals(".jpeg"))) {
                throw new IllegalArgumentException("Rozszerzenie pliku nie zgadza się z typem MIME.");
            }
        }

        validateMagicBytes(file, contentType.toLowerCase(Locale.ROOT));
        return extension;
    }

    private static String extensionFromContentType(String contentType) {
        return switch (contentType.toLowerCase(Locale.ROOT)) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> throw new IllegalArgumentException("Nieobsługiwany typ pliku.");
        };
    }

    private static void validateMagicBytes(MultipartFile file, String contentType) {
        try (InputStream input = file.getInputStream()) {
            byte[] header = input.readNBytes(12);
            if (!matchesMagic(header, contentType)) {
                throw new IllegalArgumentException("Zawartość pliku nie odpowiada deklarowanemu formatowi obrazu.");
            }
        } catch (IOException ex) {
            throw new IllegalArgumentException("Nie udało się odczytać pliku.");
        }
    }

    private static boolean matchesMagic(byte[] header, String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> header.length >= 3
                    && header[0] == (byte) 0xFF && header[1] == (byte) 0xD8 && header[2] == (byte) 0xFF;
            case "image/png" -> header.length >= 8
                    && header[0] == (byte) 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47;
            case "image/gif" -> header.length >= 6
                    && header[0] == 'G' && header[1] == 'I' && header[2] == 'F';
            case "image/webp" -> header.length >= 12
                    && header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F'
                    && header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P';
            default -> false;
        };
    }
}
