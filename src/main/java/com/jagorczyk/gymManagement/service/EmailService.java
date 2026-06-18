package com.jagorczyk.gymManagement.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username:}")
    private String fromAddress;

    public void sendVerificationEmail(String to, String code) {
        if (mailSender == null) {
            logger.info("Mocking email to: {} with code: {}", to, code);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject("Weryfikacja adresu e-mail");
            
            String htmlBody = buildHtmlTemplate("Weryfikacja konta", 
                "<h2>Witaj!</h2>" +
                "<p>Twój kod weryfikacyjny to:</p>" +
                "<div style=\"background: #f3f4f6; padding: 20px; font-size: 28px; font-weight: bold; letter-spacing: 8px; text-align: center; border-radius: 8px; margin: 30px 0; color: #1f2937;\">" + code + "</div>" +
                "<p>Wpisz ten kod w aplikacji, aby aktywować swoje konto.</p>"
            );
            
            helper.setText(htmlBody, true);
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
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            
            // Zachowujemy formatowanie tekstu w HTML (zamiana enterów na nowe linie)
            String formattedBody = body.replace("\n", "<br>");
            
            String htmlBody = buildHtmlTemplate(subject, "<p>" + formattedBody + "</p>");
            
            helper.setText(htmlBody, true);
            mailSender.send(message);
        } catch (Exception e) {
            logger.error("Błąd podczas wysyłania e-maila kampanii: {}", e.getMessage());
        }
    }
    
    private String buildHtmlTemplate(String title, String contentHtml) {
        return "<!DOCTYPE html>" +
               "<html>" +
               "<head>" +
               "<meta charset=\"UTF-8\">" +
               "<style>" +
               "  body { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; color: #374151; }" +
               "  .wrapper { padding: 40px 20px; }" +
               "  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }" +
               "  .header { background: linear-gradient(135deg, #1f2937 0%, #111827 100%); padding: 40px 30px; text-align: center; }" +
               "  .header h1 { color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; }" +
               "  .header .subtitle { color: #9ca3af; font-size: 14px; margin-top: 10px; }" +
               "  .content { padding: 40px 40px; line-height: 1.6; font-size: 16px; }" +
               "  .footer { background-color: #f3f4f6; padding: 25px 40px; text-align: center; font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; }" +
               "  .footer-logo { font-weight: bold; color: #374151; margin-bottom: 5px; }" +
               "</style>" +
               "</head>" +
               "<body>" +
               "  <div class=\"wrapper\">" +
               "    <div class=\"container\">" +
               "      <div class=\"header\">" +
               "        <h1>GYMLOS</h1>" +
               "        <div class=\"subtitle\">Twoje centrum treningowe</div>" +
               "      </div>" +
               "      <div class=\"content\">" +
               contentHtml +
               "      </div>" +
               "      <div class=\"footer\">" +
               "        <div class=\"footer-logo\">Gymlos Software</div>" +
               "        Ta wiadomość została wygenerowana automatycznie.<br>Prosimy na nią nie odpowiadać." +
               "      </div>" +
               "    </div>" +
               "  </div>" +
               "</body>" +
               "</html>";
    }
}
