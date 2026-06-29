package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.GymDtos.PayoutStatusView;
import com.jagorczyk.gymManagement.config.StripeProperties;
import com.jagorczyk.gymManagement.domain.Gym;
import com.jagorczyk.gymManagement.repository.GymRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.Account;
import com.stripe.model.AccountLink;
import com.stripe.model.Balance;
import com.stripe.model.LoginLink;
import com.stripe.net.RequestOptions;
import com.stripe.param.AccountCreateParams;
import com.stripe.param.AccountLinkCreateParams;
import com.stripe.param.LoginLinkCreateOnAccountParams;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StripeConnectService {

    private final GymRepository gymRepository;
    private final StripeProperties stripeProperties;

    @Value("${FRONTEND_URL:http://localhost:5173}")
    private String frontendUrl;

    public StripeConnectService(GymRepository gymRepository, StripeProperties stripeProperties) {
        this.gymRepository = gymRepository;
        this.stripeProperties = stripeProperties;
    }

    public boolean isStripeConfigured() {
        String key = stripeProperties.getApi().getKey();
        return key != null && !key.isBlank() && !key.contains("placeholder");
    }

    public boolean canAcceptOnlinePayments(Gym gym) {
        return gym.getStripeConnectAccountId() != null && gym.isStripeConnectChargesEnabled();
    }

    @Transactional
    public PayoutStatusView getPayoutStatus(Long ownerUserId, Long gymId) {
        Gym gym = requireOwnerGym(ownerUserId, gymId);
        if (!isStripeConfigured()) {
            return new PayoutStatusView(
                    false,
                    gym.getStripeConnectAccountId(),
                    gym.isStripeConnectChargesEnabled(),
                    gym.isStripeConnectPayoutsEnabled(),
                    gym.isStripeConnectDetailsSubmitted(),
                    null,
                    null,
                    "pln",
                    feePercent()
            );
        }
        if (gym.getStripeConnectAccountId() != null) {
            try {
                syncAccountStatus(gym);
            } catch (StripeException e) {
                // Keep cached flags if Stripe is temporarily unreachable.
            }
        }
        return buildView(gym);
    }

    @Transactional
    public Map<String, String> startOnboarding(Long ownerUserId, Long gymId) throws StripeException {
        Gym gym = requireOwnerGym(ownerUserId, gymId);
        if (!isStripeConfigured()) {
            throw new IllegalArgumentException("Płatności Stripe nie są skonfigurowane na platformie.");
        }
        String accountId = gym.getStripeConnectAccountId();
        if (accountId == null) {
            accountId = createExpressAccount(gym);
            gym.setStripeConnectAccountId(accountId);
            gymRepository.save(gym);
        }
        String onboardingUrl = createAccountLink(accountId, gymId);
        return Map.of("onboardingUrl", onboardingUrl);
    }

    @Transactional(readOnly = true)
    public Map<String, String> createDashboardLink(Long ownerUserId, Long gymId) throws StripeException {
        Gym gym = requireOwnerGym(ownerUserId, gymId);
        if (gym.getStripeConnectAccountId() == null) {
            throw new IllegalArgumentException("Najpierw skonfiguruj konto wypłat.");
        }
        LoginLink loginLink = LoginLink.createOnAccount(
                gym.getStripeConnectAccountId(),
                LoginLinkCreateOnAccountParams.builder().build()
        );
        return Map.of("dashboardUrl", loginLink.getUrl());
    }

    @Transactional
    public void handleAccountUpdated(Account account) {
        String gymIdStr = account.getMetadata() != null ? account.getMetadata().get("gymId") : null;
        if (gymIdStr == null) {
            return;
        }
        gymRepository.findById(Long.valueOf(gymIdStr)).ifPresent(gym -> {
            if (account.getId().equals(gym.getStripeConnectAccountId())) {
                applyAccountFlags(gym, account);
                gymRepository.save(gym);
            }
        });
    }

    private String createExpressAccount(Gym gym) throws StripeException {
        String country = stripeProperties.getConnect().getCountry();
        AccountCreateParams params = AccountCreateParams.builder()
                .setType(AccountCreateParams.Type.EXPRESS)
                .setCountry(country)
                .setEmail(gym.getOwnerUser().getEmail())
                .setBusinessProfile(
                        AccountCreateParams.BusinessProfile.builder()
                                .setName(gym.getName())
                                .build()
                )
                .setCapabilities(
                        AccountCreateParams.Capabilities.builder()
                                .setCardPayments(
                                        AccountCreateParams.Capabilities.CardPayments.builder()
                                                .setRequested(true)
                                                .build()
                                )
                                .setTransfers(
                                        AccountCreateParams.Capabilities.Transfers.builder()
                                                .setRequested(true)
                                                .build()
                                )
                                .build()
                )
                .putMetadata("gymId", gym.getId().toString())
                .build();
        Account account = Account.create(params);
        return account.getId();
    }

    private String createAccountLink(String accountId, Long gymId) throws StripeException {
        String base = frontendUrl + "/owner/payouts?gymId=" + gymId;
        AccountLinkCreateParams params = AccountLinkCreateParams.builder()
                .setAccount(accountId)
                .setRefreshUrl(base + "&onboarding=refresh")
                .setReturnUrl(base + "&onboarding=complete")
                .setType(AccountLinkCreateParams.Type.ACCOUNT_ONBOARDING)
                .build();
        AccountLink link = AccountLink.create(params);
        return link.getUrl();
    }

    private void syncAccountStatus(Gym gym) throws StripeException {
        Account account = Account.retrieve(gym.getStripeConnectAccountId());
        applyAccountFlags(gym, account);
        gymRepository.save(gym);
    }

    private void applyAccountFlags(Gym gym, Account account) {
        gym.setStripeConnectChargesEnabled(Boolean.TRUE.equals(account.getChargesEnabled()));
        gym.setStripeConnectPayoutsEnabled(Boolean.TRUE.equals(account.getPayoutsEnabled()));
        gym.setStripeConnectDetailsSubmitted(Boolean.TRUE.equals(account.getDetailsSubmitted()));
    }

    private PayoutStatusView buildView(Gym gym) {
        Long available = null;
        Long pending = null;
        if (gym.getStripeConnectAccountId() != null && gym.isStripeConnectChargesEnabled()) {
            try {
                RequestOptions options = RequestOptions.builder()
                        .setStripeAccount(gym.getStripeConnectAccountId())
                        .build();
                Balance balance = Balance.retrieve(options);
                if (balance.getAvailable() != null && !balance.getAvailable().isEmpty()) {
                    available = balance.getAvailable().get(0).getAmount();
                }
                if (balance.getPending() != null && !balance.getPending().isEmpty()) {
                    pending = balance.getPending().get(0).getAmount();
                }
            } catch (StripeException ignored) {
                // Balance is optional in the status view.
            }
        }
        return new PayoutStatusView(
                true,
                gym.getStripeConnectAccountId(),
                gym.isStripeConnectChargesEnabled(),
                gym.isStripeConnectPayoutsEnabled(),
                gym.isStripeConnectDetailsSubmitted(),
                available,
                pending,
                "pln",
                feePercent()
        );
    }

    private int feePercent() {
        return stripeProperties.getConnect() != null
                ? stripeProperties.getConnect().getApplicationFeePercent()
                : 5;
    }

    private Gym requireOwnerGym(Long ownerUserId, Long gymId) {
        return gymRepository.findById(gymId)
                .filter(g -> g.getOwnerUser().getId().equals(ownerUserId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono siłowni lub brak uprawnień właściciela."));
    }
}
