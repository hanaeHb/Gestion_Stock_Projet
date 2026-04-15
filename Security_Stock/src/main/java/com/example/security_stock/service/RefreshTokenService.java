package com.example.security_stock.service;


import com.example.security_stock.entities.RefreshToken;
import com.example.security_stock.entities.User;
import com.example.security_stock.repository.RefreshTokenRepository;
import com.example.security_stock.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class RefreshTokenService {

    @Value("${jwt.refresh-token.expiration:604800000}") // 7 jours par défaut
    private Long refreshTokenDurationMs;

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository,
            UserRepository userRepository
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public RefreshToken createRefreshToken(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Supprimer les anciens tokens de l'utilisateur
        refreshTokenRepository.deleteByUserId(userId);

        // Nettoyer les tokens expirés
        refreshTokenRepository.deleteExpiredTokens();

        // Créer nouveau token
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setExpiryDate(Instant.now().plusMillis(refreshTokenDurationMs));
        refreshToken.setRevoked(false);

        return refreshTokenRepository.save(refreshToken);
    }

    public RefreshToken verifyRefreshToken(String token) {
        return refreshTokenRepository.findByTokenAndRevokedFalse(token)
                .filter(refreshToken -> refreshToken.getExpiryDate().compareTo(Instant.now()) > 0)
                .orElseThrow(() -> new RuntimeException("Refresh token invalide ou expiré"));
    }

    @Transactional
    public void revokeRefreshToken(String token) {
        refreshTokenRepository.findByToken(token).ifPresent(refreshToken -> {
            refreshToken.setRevoked(true);
            refreshTokenRepository.save(refreshToken);
        });
    }

    @Transactional
    public void revokeAllUserTokens(Integer userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }
}

