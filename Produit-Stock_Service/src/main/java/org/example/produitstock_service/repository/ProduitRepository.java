package org.example.produitstock_service.repository;

import aj.org.objectweb.asm.commons.Remapper;
import org.example.produitstock_service.entity.Produit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProduitRepository extends JpaRepository<Produit, Long> {
    Optional<Produit> findBySku(String sku);
    List<Produit> findByCategory_Id(Long categoryId);
}
