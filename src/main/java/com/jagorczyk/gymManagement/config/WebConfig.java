package com.jagorczyk.gymManagement.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import com.jagorczyk.gymManagement.security.SubscriptionCheckInterceptor;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final SubscriptionCheckInterceptor subscriptionCheckInterceptor;

    public WebConfig(SubscriptionCheckInterceptor subscriptionCheckInterceptor) {
        this.subscriptionCheckInterceptor = subscriptionCheckInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(subscriptionCheckInterceptor)
                .addPathPatterns("/api/owner/gyms/**", "/api/employee/gyms/**", "/api/client/gyms/**");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadDir = Paths.get("uploads");
        String uploadPath = uploadDir.toFile().getAbsolutePath();

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadPath + "/");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:5173", "https://gymlos.pl", "http://gymlos.pl", "https://www.gymlos.pl", "http://www.gymlos.pl")
                .allowedMethods("*")
                .allowedHeaders("*");
    }
}
