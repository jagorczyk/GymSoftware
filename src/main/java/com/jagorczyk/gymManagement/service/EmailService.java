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

    @org.springframework.beans.factory.annotation.Value("${FRONTEND_URL:http://localhost:5173}")
    private String frontendUrl;

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
                "<div style=\"background: #eff6ff; border: 1px dashed #bfdbfe; padding: 20px; font-size: 32px; font-weight: 800; letter-spacing: 12px; text-align: center; border-radius: 8px; margin: 30px 0; color: #2155e5;\">" + code + "</div>" +
                "<p>Wpisz ten kod w aplikacji, aby potwierdzić swój adres e-mail i w pełni aktywować swoje konto.</p>"
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
               "  body { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #334155; }" +
               "  .wrapper { padding: 40px 20px; }" +
               "  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border: 1px solid #f1f5f9; }" +
               "  .header { background: #ffffff; padding: 30px 20px 20px 20px; text-align: center; border-bottom: 1px solid #f1f5f9; }" +
               "  .header img { max-width: 100%; height: auto; display: block; margin: 0 auto; border-radius: 8px; }" +
               "  .content { padding: 40px; line-height: 1.7; font-size: 16px; color: #475569; }" +
               "  .content h2 { color: #1e293b; font-size: 24px; margin-top: 0; margin-bottom: 20px; font-weight: 700; }" +
               "  .content p { margin-bottom: 20px; }" +
               "  .footer { background-color: #f8fafc; padding: 30px 40px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9; }" +
               "  .footer-logo { font-weight: 700; color: #64748b; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; font-size: 12px; }" +
               "</style>" +
               "</head>" +
               "<body>" +
               "  <div class=\"wrapper\">" +
               "    <div class=\"container\">" +
               "      <div class=\"header\">" +
               "        <img src=\"" + frontendUrl + "/email-banner.png\" alt=\"Gymlos\" width=\"500\" />" +
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
