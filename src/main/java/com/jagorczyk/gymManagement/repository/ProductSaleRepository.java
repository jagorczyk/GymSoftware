package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.ProductSale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductSaleRepository extends JpaRepository<ProductSale, Long> {
    List<ProductSale> findByGymIdOrderByCreatedAtDesc(Long gymId);
}
