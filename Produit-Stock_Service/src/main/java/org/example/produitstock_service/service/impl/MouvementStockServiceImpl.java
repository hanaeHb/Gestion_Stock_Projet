package org.example.produitstock_service.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.produitstock_service.client.BudgetClient;
import org.example.produitstock_service.dto.LowStockEvent;
import org.example.produitstock_service.dto.MouvementStockRequestDTO;
import org.example.produitstock_service.dto.MouvementStockResponseDTO;
import org.example.produitstock_service.dto.ReceptionRequestDTO;
import org.example.produitstock_service.entity.MouvementStock;
import org.example.produitstock_service.entity.Produit;
import org.example.produitstock_service.entity.Stock;
import org.example.produitstock_service.entity.TypeMouvement;
import org.example.produitstock_service.mapper.MouvementStockMapper;
import org.example.produitstock_service.repository.MouvementStockRepository;
import org.example.produitstock_service.repository.ProduitRepository;
import org.example.produitstock_service.repository.StockRepository;
import org.example.produitstock_service.service.MouvementStockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional

public class MouvementStockServiceImpl implements MouvementStockService {

    private final MouvementStockRepository mouvementRepository;
    private final ProduitRepository produitRepository;
    private final MouvementStockMapper mouvementMapper;
    private final BudgetClient budgetClient;
    private final StockRepository stockRepository;

    public MouvementStockServiceImpl(MouvementStockMapper mouvementMapper, MouvementStockRepository mouvementRepository, ProduitRepository produitRepository, BudgetClient budgetClient, StockRepository stockRepository) {
        this.mouvementMapper = mouvementMapper;
        this.mouvementRepository = mouvementRepository;
        this.produitRepository = produitRepository;
        this.budgetClient = budgetClient;
        this.stockRepository = stockRepository;
    }

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Override
    @Transactional
    public MouvementStockResponseDTO addMouvement(MouvementStockRequestDTO request) {
        Produit produit = produitRepository.findById(request.getProduitId())
                .orElseThrow(() -> new RuntimeException("Produit non trouvé"));

        Stock stock = produit.getStock();
        if (stock == null) {
            throw new RuntimeException("Ce produit n'a pas de stock associé !");
        }

        TypeMouvement type = TypeMouvement.valueOf(request.getType().toUpperCase());

        if (type == TypeMouvement.ENTREE) {
            stock.setQuantiteDisponible(stock.getQuantiteDisponible() + request.getQuantite());
        } else {
            if (stock.getQuantiteDisponible() < request.getQuantite()) {
                throw new RuntimeException("Stock insuffisant !");
            }
            stock.setQuantiteDisponible(stock.getQuantiteDisponible() - request.getQuantite());

            if (stock.getQuantiteDisponible() <= stock.getSeuilCritique()) {
                sendLowStockAlert(produit, stock);
            }
        }
        stock.setDateDerniereMiseAJour(java.time.LocalDate.now());
        MouvementStock mouvement = mouvementMapper.toEntity(request, produit);
        mouvement.setEffectuePar("Inventory_Manager_1");

        return mouvementMapper.toResponseDTO(mouvementRepository.save(mouvement));
    }

    private void sendLowStockAlert(Produit produit, Stock stock) {
        try {
            LowStockEvent event = new LowStockEvent(
                    produit.getNom(),
                    produit.getId(),
                                stock.getQuantiteDisponible(),
                                stock.getSeuilCritique()
                        );

            kafkaTemplate.send("low-stock-alert", event);
            System.out.println("🚀 Alerte Kafka : Le stock de " + produit.getNom() + " est critique !");
        } catch (Exception e) {
            System.err.println("❌ Erreur Kafka: " + e.getMessage());
        }
    }
    @Override
    public List<MouvementStockResponseDTO> getAllMouvements() {
        return mouvementRepository.findAll().stream()
                .map(mouvementMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<MouvementStockResponseDTO> getMouvementsByProduitId(Long produitId) {
        return mouvementRepository.findByProduitId(produitId).stream()
                .map(mouvementMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<MouvementStockResponseDTO> getMouvementsByType(String type) {
        return mouvementRepository.findByType(TypeMouvement.valueOf(type.toUpperCase())).stream()
                .map(mouvementMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void processOrderReception(ReceptionRequestDTO request) {
        try {
            ResponseEntity<String> budgetResponse = budgetClient.consume(request.getTotalPrice());
            if (budgetResponse.getStatusCode() != HttpStatus.OK) {
                throw new RuntimeException("Budget insuffisant !");
            }
        } catch (Exception e) {
            throw new RuntimeException("Problème Budget : " + e.getMessage());
        }

        Produit produit = produitRepository.findById(request.getProduitId())
                .orElseThrow(() -> new RuntimeException("Produit non trouvé"));

        MouvementStock mouvement = new MouvementStock();
        mouvement.setProduit(produit);
        mouvement.setQuantite(request.getQuantite());
        mouvement.setType(TypeMouvement.ENTREE);
        mouvement.setDateMouvement(LocalDate.now());
        mouvement.setReferenceDocument("RECEPTION_AUTO_" + request.getProduitId());
        mouvement.setEffectuePar("Procurement Manager");
        mouvementRepository.save(mouvement);

        Stock stock = stockRepository.findByProduitId(request.getProduitId())
                .orElseThrow(() -> new RuntimeException("Stock non trouvé pour le produit ID: " + request.getProduitId()));

        stock.setQuantiteDisponible(stock.getQuantiteDisponible() + request.getQuantite());
        stock.setDateDerniereMiseAJour(LocalDate.now());

        stockRepository.save(stock);
    }
}