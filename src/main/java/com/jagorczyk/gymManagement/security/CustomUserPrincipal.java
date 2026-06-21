package com.jagorczyk.gymManagement.security;

import com.jagorczyk.gymManagement.domain.Role;
import com.jagorczyk.gymManagement.domain.User;
import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public class CustomUserPrincipal implements UserDetails {
    private final User user;

    public CustomUserPrincipal(User user) {
        this.user = user;
    }

    public Long getUserId() {
        return user.getId();
    }

    public Role getRole() {
        return user.getRole();
    }

    public User getUser() {
        return user;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
    }

    @Override
    public String getPassword() {
        return user.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return user.getEmail();
    }
}
