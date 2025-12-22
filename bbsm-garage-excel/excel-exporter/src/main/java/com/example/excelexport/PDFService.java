package com.example.excelexport;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.font.PdfFontFactory.EmbeddingStrategy;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.element.Text;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class PDFService {

    private PdfFont turkishFont;

    private PdfFont getTurkishFont() throws IOException {
        if (turkishFont == null) {
            try {
                // Önce resources klasöründen font yüklemeyi dene
                InputStream fontStream = getClass().getClassLoader().getResourceAsStream("fonts/NotoSans-Regular.ttf");
                if (fontStream != null) {
                    byte[] fontBytes = new byte[fontStream.available()];
                    fontStream.read(fontBytes);
                    fontStream.close();
                    turkishFont = PdfFontFactory.createFont(fontBytes, PdfFontFactory.EmbeddingStrategy.PREFER_EMBEDDED);
                } else {
                    // Sistem fontlarını dene (Linux/Mac/Windows)
                    String[] systemFonts = {
                        "/System/Library/Fonts/Supplemental/Arial.ttf", // macOS
                        "/System/Library/Fonts/Helvetica.ttc", // macOS (alternatif)
                        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", // Linux
                        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf", // Linux alternative
                        "C:/Windows/Fonts/arial.ttf" // Windows
                    };
                    
                    boolean fontLoaded = false;
                    for (String fontPath : systemFonts) {
                        try {
                            java.io.File fontFile = new java.io.File(fontPath);
                            if (fontFile.exists()) {
                                turkishFont = PdfFontFactory.createFont(fontPath, PdfFontFactory.EmbeddingStrategy.PREFER_EMBEDDED);
                                fontLoaded = true;
                                break;
                            }
                        } catch (Exception e) {
                            // Bu font yüklenemedi, bir sonrakini dene
                            continue;
                        }
                    }
                    
                    // Hiçbir sistem fontu yüklenemezse, iTextPDF'in varsayılan Unicode fontunu kullan
                    if (!fontLoaded) {
                        // iTextPDF'in kendi Unicode font programlama özelliğini kullan
                        turkishFont = PdfFontFactory.createFont("Helvetica", PdfFontFactory.EmbeddingStrategy.PREFER_EMBEDDED);
                    }
                }
            } catch (Exception e) {
                // Son çare: iTextPDF'in varsayılan Unicode fontunu kullan
                turkishFont = PdfFontFactory.createFont("Helvetica", PdfFontFactory.EmbeddingStrategy.PREFER_EMBEDDED);
            }
        }
        return turkishFont;
    }

    public ByteArrayOutputStream exportPDF(
            Map<String, Object> vehicleInfo,
            List<Map<String, Object>> data,
            String notes
    ) throws IOException {

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfFont font = getTurkishFont();

        try (PdfDocument pdfDoc = new PdfDocument(new PdfWriter(out));
             Document document = new Document(pdfDoc)) {

            document.setMargins(40, 40, 60, 40);

            // ===== ÜST BAŞLIK VE TARİH =====
            Table headerTable = new Table(UnitValue.createPercentArray(new float[]{2, 1}))
                    .useAllAvailableWidth()
                    .setMarginBottom(25);

            // Sol: Firma Adı
            String firmaAdi = str(vehicleInfo.get("firmaAdi"));
            if (firmaAdi.equals("-") || firmaAdi.isEmpty()) {
                firmaAdi = "BBSM GARAGE"; // Varsayılan
            } else {
                firmaAdi = firmaAdi.toUpperCase(); // Tüm harfleri büyük yap
            }
            
            Cell firmaCell = new Cell()
                    .add(new Paragraph(firmaAdi).setFont(font).setBold().setFontSize(22))
                    .setBorder(Border.NO_BORDER)
                    .setPadding(0)
                    .setVerticalAlignment(com.itextpdf.layout.properties.VerticalAlignment.MIDDLE);
            headerTable.addCell(firmaCell);

            // Sağ Üst: Tarih
            String bugunTarih = LocalDate.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy"));
            Cell tarihCell = new Cell()
                    .add(new Paragraph("Tarih: " + bugunTarih).setFont(font).setFontSize(11))
                    .setBorder(Border.NO_BORDER)
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setPadding(0)
                    .setVerticalAlignment(com.itextpdf.layout.properties.VerticalAlignment.MIDDLE);
            headerTable.addCell(tarihCell);

            document.add(headerTable);

            // ===== ARAÇ BİLGİLERİ - SOL VE SAĞ =====
            Table infoTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                    .useAllAvailableWidth()
                    .setMarginBottom(25);

            // Sol Kolon: Plaka, Marka/Model, KM, Renk, Not
            Cell solKolon = new Cell().setBorder(Border.NO_BORDER).setPadding(8);
            solKolon.add(new Paragraph("Plaka: " + str(vehicleInfo.get("plaka"))).setFont(font).setFontSize(11).setMarginBottom(5));
            solKolon.add(new Paragraph("Marka/Model: " + str(vehicleInfo.get("markaModel"))).setFont(font).setFontSize(11).setMarginBottom(5));
            solKolon.add(new Paragraph("KM: " + str(vehicleInfo.get("km"))).setFont(font).setFontSize(11).setMarginBottom(5));
            solKolon.add(new Paragraph("Renk: " + str(vehicleInfo.get("renk"))).setFont(font).setFontSize(11).setMarginBottom(5));
            solKolon.add(new Paragraph("Not: " + (notes != null && !notes.trim().isEmpty() ? notes : "-")).setFont(font).setFontSize(11));
            infoTable.addCell(solKolon);

            // Sağ Kolon: Ad Soyad, Telefon, Şasi No, İşlem Tarihi
            Cell sagKolon = new Cell().setBorder(Border.NO_BORDER).setPadding(8);
            sagKolon.add(new Paragraph("Ad Soyad: " + str(vehicleInfo.get("adSoyad"))).setFont(font).setFontSize(11).setMarginBottom(5));
            sagKolon.add(new Paragraph("Telefon: " + str(vehicleInfo.get("telNo"))).setFont(font).setFontSize(11).setMarginBottom(5));
            sagKolon.add(new Paragraph("Şasi No: " + str(vehicleInfo.get("sasi"))).setFont(font).setFontSize(11).setMarginBottom(5));
            sagKolon.add(new Paragraph("Giriş Tarihi: " + str(vehicleInfo.get("girisTarihi"))).setFont(font).setFontSize(11));
            infoTable.addCell(sagKolon);

            document.add(infoTable);

            // ===== İŞLEMLER TABLOSU =====
            Table table = new Table(UnitValue.createPercentArray(new float[]{1.2f, 3f, 1.5f, 1.5f}))
                    .useAllAvailableWidth()
                    .setMarginBottom(20);

            // Başlık satırı - Kalın çerçeveli ama taralı değil
            addHeaderCell(table, "Birim Adedi", font);
            addHeaderCell(table, "Parça Adı", font);
            addHeaderCell(table, "Birim Fiyat", font);
            addHeaderCell(table, "Toplam Fiyat", font);

            double genelToplam = 0;

            // Verileri tabloya ekle
            for (Map<String, Object> row : data) {
                double birimFiyat = parseDouble(row.get("birimFiyati"));
                double toplamFiyat = parseDouble(row.get("toplamFiyat"));
                genelToplam += toplamFiyat;

                addDataCell(table, row.get("birimAdedi"), false, font);
                addDataCell(table, row.get("parcaAdi"), false, font);
                addDataCell(table, formatCurrency(birimFiyat), true, font);
                addDataCell(table, formatCurrency(toplamFiyat), true, font);
            }

            document.add(table);

            // ===== EN ALTA TOPLAM TUTAR (TEK SATIRDA) =====
            Paragraph totalParagraph = new Paragraph()
                    .add(new Text("Toplam Tutar : ").setFont(font).setBold())
                    .add(new Text(formatCurrency(genelToplam)).setFont(font).setBold())
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setFontSize(12)
                    .setMarginTop(15)
                    .setPadding(10);
            
            document.add(totalParagraph);
        }

        return out;
    }

    // ================== HELPERS ==================

    private void addHeaderCell(Table table, String text, PdfFont font) {
        Cell headerCell = new Cell()
                .add(new Paragraph(text).setFont(font).setBold().setFontSize(11))
                .setTextAlignment(TextAlignment.CENTER)
                .setPadding(10)
                .setBorder(new SolidBorder(ColorConstants.BLACK, 1.5f)); // Kalın çerçeve
        // Arka plan rengi YOK (taralı değil)
        table.addHeaderCell(headerCell);
    }

    private void addDataCell(Table table, Object value, boolean rightAlign, PdfFont font) {
        Cell cell = new Cell()
                .add(new Paragraph(str(value)).setFont(font).setFontSize(10))
                .setPadding(8)
                .setBorder(new SolidBorder(ColorConstants.BLACK, 0.5f));
        // Arka plan rengi YOK (beyaz, mürekkep tasarrufu)
        if (rightAlign) {
            cell.setTextAlignment(TextAlignment.RIGHT);
        }
        table.addCell(cell);
    }

    private String formatCurrency(double amount) {
        DecimalFormatSymbols s = new DecimalFormatSymbols(new Locale("tr", "TR"));
        s.setDecimalSeparator(',');
        s.setGroupingSeparator('.');
        return new DecimalFormat("#,##0.00", s).format(amount) + " TL";
    }

    private double parseDouble(Object obj) {
        if (obj == null) return 0;
        try {
            return Double.parseDouble(obj.toString().replace(",", ".").replaceAll("[^0-9.]", ""));
        } catch (Exception e) {
            return 0;
        }
    }

    private String str(Object o) {
        return o == null ? "-" : o.toString().trim();
    }
}
