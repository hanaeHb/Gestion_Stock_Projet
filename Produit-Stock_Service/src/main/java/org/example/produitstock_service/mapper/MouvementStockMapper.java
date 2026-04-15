package org.example.produitstock_service.mapper;

import org.example.produitstock_service.dto.MouvementStockRequestDTO;
import org.example.produitstock_service.dto.MouvementStockResponseDTO;
import org.example.produitstock_service.entity.MouvementStock;
import org.example.produitstock_service.entity.Produit;
import org.example.produitstock_service.entity.TypeMouvement;
import org.springframework.stereotype.Component;
import java.time.LocalDate;

@Component
public class MouvementStockMapper {

    public MouvementStockResponseDTO toResponseDTO(MouvementStock m) {
        if (m == null) return null;

        MouvementStockResponseDTO dto = new MouvementStockResponseDTO();
        dto.setIdMouvement(m.getIdMouvement());
        dto.setType(m.getType().toString());
        dto.setQuantite(m.getQuantite());
        dto.setDateMouvement(m.getDateMouvement());

        dto.setReferenceDocument(m.getReferenceDocument());
        dto.setEffectuePar(m.getEffectuePar());

        if (m.getProduit() != null) {
            dto.setProduitId(m.getProduit().getId());
            dto.setProduitNom(m.getProduit().getNom());
        }

        return dto;
    }

    public MouvementStock toEntity(MouvementStockRequestDTO dto, Produit produit) {
        if (dto == null) return null;

        MouvementStock m = new MouvementStock();
        m.setType(TypeMouvement.valueOf(dto.getType().toUpperCase()));
        m.setQuantite(dto.getQuantite());
        m.setDateMouvement(LocalDate.now());
        m.setReferenceDocument(dto.getReferenceDocument());
        m.setProduit(produit);

        return m;
    }
}