package org.example.produitstock_service.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.produitstock_service.dto.StockRequestDTO;
import org.example.produitstock_service.dto.StockResponseDTO;
import org.example.produitstock_service.entity.Stock;
import org.example.produitstock_service.mapper.StockMapper;
import org.example.produitstock_service.repository.StockRepository;
import org.example.produitstock_service.service.StockService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class StockServiceImpl implements StockService {
    public StockServiceImpl(StockMapper stockMapper, StockRepository stockRepository) {
        this.stockMapper = stockMapper;
        this.stockRepository = stockRepository;
    }

    private final StockRepository stockRepository;
    private final StockMapper stockMapper;

    @Override
    public StockResponseDTO updateStockLevel(StockRequestDTO request) {
        Stock stock = stockRepository.findByProduitId(request.getProduitId())
                .orElseThrow(() -> new RuntimeException("Stock non trouvé pour ce produit"));

        stock.setQuantiteDisponible(request.getQuantiteDisponible());
        stock.setSeuilCritique(request.getSeuilCritique());
        stock.setEmplacement(request.getEmplacement());
        stock.setDateDerniereMiseAJour(LocalDate.now());

        return stockMapper.toResponseDTO(stockRepository.save(stock));
    }

    @Override
    public StockResponseDTO getStockByProduitId(Long produitId) {
        return stockRepository.findByProduitId(produitId)
                .map(stockMapper::toResponseDTO)
                .orElseThrow(() -> new RuntimeException("Stock non trouvé"));
    }

    @Override
    public List<StockResponseDTO> getStocksCritiques() {
        // Hna kansiftu ghir l-produits li quantité dyalhom <= seuil
        return stockRepository.findAll().stream()
                .filter(s -> s.getQuantiteDisponible() <= s.getSeuilCritique())
                .map(stockMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void updateEmplacement(Long produitId, String newEmplacement) {
        Stock stock = stockRepository.findByProduitId(produitId)
                .orElseThrow(() -> new RuntimeException("Stock non trouvé"));
        stock.setEmplacement(newEmplacement);
        stockRepository.save(stock);
    }
}