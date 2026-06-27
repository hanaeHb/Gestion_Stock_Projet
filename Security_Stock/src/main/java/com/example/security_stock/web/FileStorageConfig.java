package com.example.security_stock.web;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Component
public class FileStorageConfig {

    @Value("${file.upload-dir:uploads/cv}")
    private String uploadDir;

    @PostConstruct
    public void init() {
        try {
            Path uploadPath = getUploadPath();
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                System.out.println("✅ Created upload directory: " + uploadPath.toAbsolutePath());
            }
            System.out.println("📁 Upload directory: " + uploadPath.toAbsolutePath());
        } catch (IOException e) {
            System.err.println("❌ Failed to create upload directory: " + e.getMessage());
        }
    }

    public Path getUploadPath() {
        return Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    public Path getCVPath(String fileName) {
        return getUploadPath().resolve(fileName);
    }
}