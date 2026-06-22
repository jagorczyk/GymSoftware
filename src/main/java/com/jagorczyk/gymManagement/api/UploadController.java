package com.jagorczyk.gymManagement.api;

import com.jagorczyk.gymManagement.service.ImageUploadValidator;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/upload")
@PreAuthorize("isAuthenticated()")
public class UploadController {

    private final Path uploadDir = Paths.get("uploads", "images");
    private final ImageUploadValidator imageUploadValidator;

    public UploadController(ImageUploadValidator imageUploadValidator) {
        this.imageUploadValidator = imageUploadValidator;
        try {
            Files.createDirectories(uploadDir);
        } catch (Exception e) {
            throw new RuntimeException("Could not create upload directory!");
        }
    }

    @PostMapping("/image")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String extension = imageUploadValidator.validateAndResolveExtension(file);
            String filename = UUID.randomUUID() + extension;
            Path targetLocation = uploadDir.resolve(filename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return ResponseEntity.ok(Map.of("url", "/uploads/images/" + filename));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Wystąpił błąd podczas wgrywania pliku"));
        }
    }
}
