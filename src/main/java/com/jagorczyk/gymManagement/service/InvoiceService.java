package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.domain.GymPass;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
public class InvoiceService {

    public byte[] generateInvoicePdf(GymPass pass) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.open();

            // Fonts
            Font titleFont = new Font(Font.HELVETICA, 20, Font.BOLD);
            Font headerFont = new Font(Font.HELVETICA, 12, Font.BOLD);
            Font normalFont = new Font(Font.HELVETICA, 10, Font.NORMAL);

            // Title
            Paragraph title = new Paragraph("POTWIERDZENIE ZAKUPU / FAKTURA", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Details
            document.add(new Paragraph("Klub Fitness: " + pass.getGym().getName(), headerFont));
            document.add(new Paragraph("Adres: " + pass.getGym().getAddress(), normalFont));
            document.add(new Paragraph("Klient: " + pass.getGuest().getFirstName() + " " + pass.getGuest().getLastName(), normalFont));
            if (pass.getGuest().getEmail() != null) {
                document.add(new Paragraph("E-mail: " + pass.getGuest().getEmail(), normalFont));
            }
            document.add(new Paragraph("--------------------------------------------------------------------------------------------------", normalFont));

            document.add(new Paragraph("Szczegóły płatności:", headerFont));
            document.add(new Paragraph("Karnet: " + pass.getPassType(), normalFont));
            document.add(new Paragraph("Okres ważności: " + pass.getStartDate() + " do " + pass.getEndDate(), normalFont));
            document.add(new Paragraph("Kwota: " + pass.getPrice() + " PLN", normalFont));
            document.add(new Paragraph("Status: OPŁACONE", normalFont));
            document.add(new Paragraph("Data transakcji: " + pass.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")), normalFont));
            document.add(new Paragraph("Identyfikator transakcji: PASS-TX-" + pass.getId(), normalFont));
            
            document.add(new Paragraph("--------------------------------------------------------------------------------------------------", normalFont));
            Paragraph footer = new Paragraph("Dziękujemy za zakup i życzymy udanych treningów!", normalFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Błąd podczas generowania faktury PDF", e);
        }
    }
}
