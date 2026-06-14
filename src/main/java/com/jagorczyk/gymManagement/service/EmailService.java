package com.jagorczyk.gymManagement.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendVerificationEmail(String to, String code) {
        if (mailSender == null) {
            logger.info("Mocking email to: {} with code: {}", to, code);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Weryfikacja adresu e-mail");
        message.setText("Twój kod weryfikacyjny to: " + code);
        try {
            mailSender.send(message);
        } catch (Exception e) {
            logger.error("Błąd podczas wysyłania e-maila: {}", e.getMessage());
        }
    }

    public void sendCampaignEmail(String to, String subject, String body) {
        if (mailSender == null) {
            logger.info("Mocking campaign email to: {} with subject: {}", to, subject);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        try {
            mailSender.send(message);
        } catch (Exception e) {
            logger.error("Błąd podczas wysyłania e-maila kampanii: {}", e.getMessage());
        }
    }
}
