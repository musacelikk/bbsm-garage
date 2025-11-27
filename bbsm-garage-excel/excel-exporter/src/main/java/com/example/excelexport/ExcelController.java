package com.example.excelexport;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ExcelController {

    @Autowired
    private ExcelService excelService;

    @Autowired
    private PDFService pdfService;

    @PostMapping("/excel/download")
    public ResponseEntity<byte[]> generateExcel(@RequestBody Map<String, Object> data) {
        try {
            ByteArrayOutputStream outputStream = excelService.exportExcel(
                (Map<String, Object>) data.get("vehicleInfo"),
                (java.util.List<Map<String, Object>>) data.get("data"),
                (String) data.get("notes")
            );
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "output.xlsx");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(outputStream.toByteArray());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/excel/pdf")
    public ResponseEntity<byte[]> generatePDF(@RequestBody Map<String, Object> data) {
        try {
            ByteArrayOutputStream outputStream = pdfService.exportPDF(
                (Map<String, Object>) data.get("vehicleInfo"),
                (java.util.List<Map<String, Object>>) data.get("data"),
                (String) data.get("notes")
            );
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "output.pdf");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(outputStream.toByteArray());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
