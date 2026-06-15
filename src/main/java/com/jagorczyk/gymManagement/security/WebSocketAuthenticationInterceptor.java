package com.jagorczyk.gymManagement.security;

import com.jagorczyk.gymManagement.domain.User;
import com.jagorczyk.gymManagement.repository.UserRepository;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class WebSocketAuthenticationInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public WebSocketAuthenticationInterceptor(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String token = accessor.getFirstNativeHeader("Authorization");
            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
                try {
                    io.jsonwebtoken.Claims claims = jwtService.extractClaims(token);
                    String email = claims.getSubject();
                    if (email != null) {
                        Optional<User> userOptional = userRepository.findByEmail(email);
                        if (userOptional.isPresent()) {
                            CustomUserPrincipal principal = new CustomUserPrincipal(userOptional.get());
                            UsernamePasswordAuthenticationToken auth =
                                    new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                            accessor.setUser(auth);
                        }
                    }
                } catch (Exception e) {
                    // Invalid token
                }
            }
        }
        return message;
    }
}
