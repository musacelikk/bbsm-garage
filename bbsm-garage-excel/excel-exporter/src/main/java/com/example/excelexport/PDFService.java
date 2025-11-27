package com.example.excelexport;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
public class PDFService {

    public ByteArrayOutputStream exportPDF(Map<String, Object> vehicleInfo, List<Map<String, Object>> data, String notes) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        
        try (PdfDocument pdfDoc = new PdfDocument(new PdfWriter(out));
             Document document = new Document(pdfDoc)) {
            
            // Araç bilgileri
            document.add(new Paragraph("ARAÇ BİLGİLERİ").setBold().setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("Plaka: " + toString(vehicleInfo.get("plaka"))));
            document.add(new Paragraph("Ad Soyad: " + toString(vehicleInfo.get("adSoyad"))));
            document.add(new Paragraph("Marka/Model: " + toString(vehicleInfo.get("markaModel"))));
            document.add(new Paragraph("Adres: " + toString(vehicleInfo.get("adres"))));
            document.add(new Paragraph("Renk: " + toString(vehicleInfo.get("renk"))));
            document.add(new Paragraph("KM: " + toString(vehicleInfo.get("km"))));
            document.add(new Paragraph("Şasi: " + toString(vehicleInfo.get("sasi"))));
            document.add(new Paragraph("Telefon: " + toString(vehicleInfo.get("telNo"))));
            document.add(new Paragraph("Giriş Tarihi: " + toString(vehicleInfo.get("girisTarihi"))));
            
            document.add(new Paragraph("\n"));
            
            // Tablo başlıkları
            Table table = new Table(UnitValue.createPercentArray(4)).useAllAvailableWidth();
            table.addHeaderCell(new Cell().add(new Paragraph("BİRİM ADEDİ")));
            table.addHeaderCell(new Cell().add(new Paragraph("PARÇA ADI")));
            table.addHeaderCell(new Cell().add(new Paragraph("BİRİM FİYATI")));
            table.addHeaderCell(new Cell().add(new Paragraph("TOPLAM FİYAT")));
            
            // Verileri tabloya ekle
            for (Map<String, Object> row : data) {
                table.addCell(new Cell().add(new Paragraph(toString(row.get("birimAdedi")))));
                table.addCell(new Cell().add(new Paragraph(toString(row.get("parcaAdi")))));
                table.addCell(new Cell().add(new Paragraph(toString(row.get("birimFiyati")))));
                table.addCell(new Cell().add(new Paragraph(toString(row.get("toplamFiyat")))));
            }
            
            document.add(table);
            
            // Notlar
            if (notes != null && !notes.isEmpty()) {
                document.add(new Paragraph("\nNOTLAR:").setBold());
                document.add(new Paragraph(notes));
            }
        }
        
        return out;
    }
    
    private String toString(Object obj) {
        return obj == null ? "" : obj.toString();
    }
} 