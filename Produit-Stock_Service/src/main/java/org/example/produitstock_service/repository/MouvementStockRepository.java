package org.example.produitstock_service.repository;

import org.example.produitstock_service.entity.MouvementStock;
import org.example.produitstock_service.entity.TypeMouvement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MouvementStockRepository extends JpaRepository<MouvementStock, Long> {
    List<MouvementStock> findByProduitId(Long produitId);
    List<MouvementStock> findByType(TypeMouvement type);
}
