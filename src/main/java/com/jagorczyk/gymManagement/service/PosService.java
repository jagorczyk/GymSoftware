package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.GymDtos.*;
import com.jagorczyk.gymManagement.domain.*;
import com.jagorczyk.gymManagement.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class PosService {

    private final ProductRepository productRepository;
    private final ProductSaleRepository productSaleRepository;
    private final GymRepository gymRepository;
    private final GuestRepository guestRepository;
    private final AuditLogService auditLogService;

    public PosService(
            ProductRepository productRepository,
            ProductSaleRepository productSaleRepository,
            GymRepository gymRepository,
            GuestRepository guestRepository,
            AuditLogService auditLogService
    ) {
        this.productRepository = productRepository;
        this.productSaleRepository = productSaleRepository;
        this.gymRepository = gymRepository;
        this.guestRepository = guestRepository;
        this.auditLogService = auditLogService;
    }

    private Gym requireOwnerGym(Long ownerUserId, Long gymId) {
        return gymRepository.findById(gymId)
                .filter(g -> g.getOwnerUser().getId().equals(ownerUserId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono siłowni lub brak uprawnień właściciela."));
    }

    private Gym requireGym(Long gymId) {
        return gymRepository.findById(gymId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono siłowni o ID: " + gymId));
    }

    @Transactional(readOnly = true)
    public List<ProductView> getGymProductsForOwner(Long ownerUserId, Long gymId) {
        requireOwnerGym(ownerUserId, gymId);
        return productRepository.findByGymId(gymId).stream()
                .map(this::toProductView)
                .toList();
    }

    @Transactional
    public ProductView createProduct(Long ownerUserId, Long gymId, CreateProductRequest request) {
        Gym gym = requireOwnerGym(ownerUserId, gymId);

        Product product = new Product();
        product.setGym(gym);
        product.setName(request.name());
        product.setPrice(request.price());
        product.setQuantity(request.quantity());
        product.setCategory(request.category());
        product.setBarcode(request.barcode());

        Product saved = productRepository.save(product);
        auditLogService.log(gym, gym.getOwnerUser(), "CREATE_PRODUCT", 
                String.format("Utworzono produkt: %s (cena: %s, ilość: %d, kategoria: %s)", 
                        saved.getName(), saved.getPrice(), saved.getQuantity(), saved.getCategory()));

        return toProductView(saved);
    }

    @Transactional
    public ProductView updateProduct(Long ownerUserId, Long gymId, Long productId, UpdateProductRequest request) {
        Gym gym = requireOwnerGym(ownerUserId, gymId);
        Product product = productRepository.findById(productId)
                .filter(p -> p.getGym().getId().equals(gymId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono produktu o ID: " + productId));

        product.setName(request.name());
        product.setPrice(request.price());
        product.setQuantity(request.quantity());
        product.setCategory(request.category());
        product.setBarcode(request.barcode());

        Product saved = productRepository.save(product);
        auditLogService.log(gym, gym.getOwnerUser(), "UPDATE_PRODUCT", 
                String.format("Zaktualizowano produkt ID %d: %s (cena: %s, ilość: %d, kategoria: %s)", 
                        saved.getId(), saved.getName(), saved.getPrice(), saved.getQuantity(), saved.getCategory()));

        return toProductView(saved);
    }

    @Transactional
    public void deleteProduct(Long ownerUserId, Long gymId, Long productId) {
        Gym gym = requireOwnerGym(ownerUserId, gymId);
        Product product = productRepository.findById(productId)
                .filter(p -> p.getGym().getId().equals(gymId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono produktu o ID: " + productId));

        productRepository.delete(product);
        auditLogService.log(gym, gym.getOwnerUser(), "DELETE_PRODUCT", 
                String.format("Usunięto produkt ID %d: %s", product.getId(), product.getName()));
    }

    @Transactional(readOnly = true)
    public List<ProductSaleView> getGymSalesForOwner(Long ownerUserId, Long gymId) {
        requireOwnerGym(ownerUserId, gymId);
        return productSaleRepository.findByGymIdOrderByCreatedAtDesc(gymId).stream()
                .map(this::toProductSaleView)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProductView> getGymProductsForEmployee(Long gymId) {
        return productRepository.findByGymId(gymId).stream()
                .map(this::toProductView)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductView getProductByBarcode(Long gymId, String barcode) {
        return productRepository.findByGymIdAndBarcode(gymId, barcode)
                .map(this::toProductView)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono produktu o kodzie kreskowym: " + barcode));
    }

    @Transactional(readOnly = true)
    public List<ProductSaleView> getEmployeeSalesHistory(Long soldByUserId, Long gymId) {
        return productSaleRepository.findByGymIdOrderByCreatedAtDesc(gymId).stream()
                .filter(s -> s.getSoldBy() != null && s.getSoldBy().getId().equals(soldByUserId))
                .limit(50)
                .map(this::toProductSaleView)
                .toList();
    }

    @Transactional
    public ProductSaleView checkout(User soldBy, Long gymId, ProductSaleRequest request) {
        Gym gym = requireGym(gymId);

        Guest guest = null;
        if (request.guestId() != null) {
            guest = guestRepository.findById(request.guestId())
                    .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono klienta o ID: " + request.guestId()));
            if (!guest.getGym().getId().equals(gymId)) {
                throw new IllegalArgumentException("Klient nie należy do tej siłowni.");
            }
        }

        if (request.items().isEmpty()) {
            throw new IllegalArgumentException("Koszyk nie może być pusty.");
        }

        ProductSale sale = new ProductSale();
        sale.setGym(gym);
        sale.setSoldBy(soldBy);
        sale.setGuest(guest);
        sale.setPaymentMethod(request.paymentMethod());
        sale.setTotalAmount(BigDecimal.ZERO);

        BigDecimal calculatedTotal = BigDecimal.ZERO;
        List<ProductSaleItem> items = new ArrayList<>();

        for (ProductSaleItemRequest itemReq : request.items()) {
            Product product = productRepository.findById(itemReq.productId())
                    .filter(p -> p.getGym().getId().equals(gymId))
                    .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono produktu o ID: " + itemReq.productId() + " na tej siłowni."));

            if (product.getQuantity() < itemReq.quantity()) {
                throw new IllegalArgumentException(String.format("Brak wystarczającej ilości produktu '%s' na magazynie. Dostępne: %d, żądane: %d", 
                        product.getName(), product.getQuantity(), itemReq.quantity()));
            }

            product.setQuantity(product.getQuantity() - itemReq.quantity());
            productRepository.save(product);

            ProductSaleItem saleItem = new ProductSaleItem();
            saleItem.setProductSale(sale);
            saleItem.setProduct(product);
            saleItem.setQuantity(itemReq.quantity());
            saleItem.setUnitPrice(product.getPrice());
            items.add(saleItem);

            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(itemReq.quantity()));
            calculatedTotal = calculatedTotal.add(lineTotal);
        }

        sale.setTotalAmount(calculatedTotal);
        sale.setItems(items);

        ProductSale savedSale = productSaleRepository.save(sale);

        String guestName = guest != null ? guest.getFirstName() + " " + guest.getLastName() : "Gość";
        auditLogService.log(gym, soldBy, "PRODUCT_SALE", 
                String.format("Zarejestrowano sprzedaż produktów (Suma: %s PLN, płatność: %s, dla: %s, ID transakcji: %d)", 
                        savedSale.getTotalAmount(), savedSale.getPaymentMethod(), guestName, savedSale.getId()));

        return toProductSaleView(savedSale);
    }

    private ProductView toProductView(Product product) {
        return new ProductView(
                product.getId(),
                product.getName(),
                product.getPrice(),
                product.getQuantity(),
                product.getCategory(),
                product.getBarcode()
        );
    }

    private ProductSaleView toProductSaleView(ProductSale sale) {
        String guestName = sale.getGuest() != null 
                ? sale.getGuest().getFirstName() + " " + sale.getGuest().getLastName() 
                : "Gość";
        
        List<ProductSaleItemView> itemViews = sale.getItems().stream()
                .map(item -> new ProductSaleItemView(
                        item.getId(),
                        item.getProduct().getId(),
                        item.getProduct().getName(),
                        item.getQuantity(),
                        item.getUnitPrice()
                ))
                .toList();

        return new ProductSaleView(
                sale.getId(),
                sale.getSoldBy().getEmail(),
                guestName,
                sale.getTotalAmount(),
                sale.getPaymentMethod(),
                sale.getCreatedAt(),
                itemViews
        );
    }
}
