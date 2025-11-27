package com.example.excelexport;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;

@Service
public class ExcelService {

    private static final Logger logger = LoggerFactory.getLogger(ExcelService.class);

    private static final int MAX_ROWS_PER_SHEET = 24;

    public ByteArrayOutputStream exportExcel(Map<String, Object> vehicleInfo, List<Map<String, Object>> data, String notes) throws IOException {
        String templatePath = "/syoto.xlsx";  // Şablon dosyasının yolu
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        logger.info("Excel şablonu okunuyor: {}", templatePath);

        try (InputStream is = getClass().getResourceAsStream(templatePath)) {
            if (is == null) {
                logger.error("Şablon dosyası bulunamadı: {}", templatePath);
                throw new IOException("Şablon dosyası bulunamadı: " + templatePath);
            }
            Workbook workbook = new XSSFWorkbook(is);
            Sheet sheet = workbook.getSheetAt(0);
            fillSheetWithVehicleInfo(sheet, vehicleInfo);

            // Currency format for price cells
            CellStyle currencyCellStyle = workbook.createCellStyle();
            DataFormat format = workbook.createDataFormat();
            currencyCellStyle.setDataFormat(format.getFormat("#,##0.00 ₺"));

            int rowCount = 0;
            int sheetCount = 0;
            int totalRows = data.size();

            logger.info("Toplam {} adet yapılanlar var.", totalRows);

            for (int i = 0; i < totalRows; i++) {
                if (rowCount >= MAX_ROWS_PER_SHEET) {
                    // Sayfanın toplamını 43. satıra yaz
                    writeTotalToSheet(sheet, rowCount, currencyCellStyle, sheetCount);

                    // Yeni sayfa oluştur
                    sheetCount++;
                    sheet = copySheet(workbook, workbook.getSheetAt(0), "Sayfa" + (sheetCount + 1));
                    fillSheetWithVehicleInfo(sheet, vehicleInfo);
                    rowCount = 0;
                }
                Row row = sheet.createRow(8 + rowCount);
                Map<String, Object> rowData = data.get(i);

                Cell cell0 = row.createCell(0);
                cell0.setCellValue(toString(rowData.get("birimAdedi")));

                Cell cell1 = row.createCell(1);
                cell1.setCellValue(toString(rowData.get("parcaAdi")));

                Cell cell2 = row.createCell(2);
                cell2.setCellValue(toString(rowData.get("birimFiyati")));

                Cell cell3 = row.createCell(3);
                cell3.setCellValue(toDouble(rowData.get("toplamFiyat")));
                cell3.setCellStyle(currencyCellStyle);

                logger.info("Satır {} dolduruldu: {}", 8 + rowCount, rowData);
                rowCount++;
            }
            logger.info("Veriler dolduruldu.");

            // Son sayfanın toplamını yaz
            writeTotalToSheet(sheet, rowCount, currencyCellStyle, sheetCount);

            // Notlar sadece son sayfaya eklenecek
            logger.info("Notlar ekleniyor...");
            Row notesRow = sheet.createRow(36);
            Cell notesCell = notesRow.createCell(0);
            notesCell.setCellValue(notes);
            logger.info("Notlar eklendi.");

            // Formüllerin yeniden hesaplanmasını sağla
            workbook.setForceFormulaRecalculation(true);

            workbook.write(out);
            logger.info("Excel dosyası yazıldı.");

            return out;
        }
    }

    private void fillSheetWithVehicleInfo(Sheet sheet, Map<String, Object> vehicleInfo) {
        createCellIfAbsent(sheet, 1, 1).setCellValue(toString(vehicleInfo.get("plaka")));
        createCellIfAbsent(sheet, 1, 3).setCellValue(toString(vehicleInfo.get("adSoyad")));
        createCellIfAbsent(sheet, 2, 1).setCellValue(toString(vehicleInfo.get("markaModel")));
        createCellIfAbsent(sheet, 2, 3).setCellValue(toString(vehicleInfo.get("adres")));
        createCellIfAbsent(sheet, 3, 1).setCellValue(toString(vehicleInfo.get("renk")));
        createCellIfAbsent(sheet, 4, 3).setCellValue(toString(vehicleInfo.get("km")));
        createCellIfAbsent(sheet, 4, 1).setCellValue(toString(vehicleInfo.get("sasi")));
        createCellIfAbsent(sheet, 5, 3).setCellValue(toString(vehicleInfo.get("telNo")));
        createCellIfAbsent(sheet, 5, 1).setCellValue(toString(vehicleInfo.get("girisTarihi")));
    }

    private Cell createCellIfAbsent(Sheet sheet, int rowIndex, int colIndex) {
        Row row = sheet.getRow(rowIndex);
        if (row == null) {
            row = sheet.createRow(rowIndex);
        }
        Cell cell = row.getCell(colIndex);
        if (cell == null) {
            cell = row.createCell(colIndex);
        }
        return cell;
    }

    private Sheet copySheet(Workbook workbook, Sheet originalSheet, String newSheetName) {
        Sheet newSheet = workbook.createSheet(newSheetName);
        copySheetContent(workbook, originalSheet, newSheet);
        return newSheet;
    }

    private void copySheetContent(Workbook workbook, Sheet originalSheet, Sheet newSheet) {
        for (int i = 0; i <= originalSheet.getLastRowNum(); i++) {
            Row oldRow = originalSheet.getRow(i);
            Row newRow = newSheet.createRow(i);
            if (oldRow != null) {
                newRow.setHeight(oldRow.getHeight());
                for (int j = 0; j < oldRow.getLastCellNum(); j++) {
                    Cell oldCell = oldRow.getCell(j);
                    Cell newCell = newRow.createCell(j);
                    if (oldCell != null) {
                        newCell.setCellStyle(oldCell.getCellStyle());
                        switch (oldCell.getCellType()) {
                            case STRING:
                                newCell.setCellValue(oldCell.getStringCellValue());
                                break;
                            case NUMERIC:
                                newCell.setCellValue(oldCell.getNumericCellValue());
                                break;
                            case BOOLEAN:
                                newCell.setCellValue(oldCell.getBooleanCellValue());
                                break;
                            case FORMULA:
                                newCell.setCellFormula(oldCell.getCellFormula());
                                break;
                            default:
                                break;
                        }
                    }
                }
            }
        }

        for (int i = 0; i < originalSheet.getNumMergedRegions(); i++) {
            newSheet.addMergedRegion(originalSheet.getMergedRegion(i));
        }

        for (int i = 0; i < originalSheet.getRow(0).getLastCellNum(); i++) {
            newSheet.setColumnWidth(i, originalSheet.getColumnWidth(i));
        }
    }

    private void writeTotalToSheet(Sheet sheet, int rowCount, CellStyle currencyCellStyle, int sheetCount) {
        int startRow = 8;
        int endRow = startRow + rowCount - 1;
        String totalFormula = String.format("SUM(D%d:D%d)", startRow + 1, endRow + 1);
        if (sheetCount > 0) {
            totalFormula = String.format("SUM(Sayfa%d!D34, D%d:D%d)", sheetCount, startRow + 1, endRow + 1);
        }
        Row totalRow = createCellIfAbsent(sheet, 33, 3).getRow();
        Cell totalCell = totalRow.getCell(3);
        if (totalCell == null) {
            totalCell = totalRow.createCell(3);
        }
        totalCell.setCellFormula(totalFormula);
        totalCell.setCellStyle(currencyCellStyle);
    }

    private String toString(Object obj) {
        return obj == null ? "" : obj.toString();
    }

    private double toDouble(Object obj) {
        if (obj == null) {
            return 0.0;
        }
        if (obj instanceof Number) {
            return ((Number) obj).doubleValue();
        }
        try {
            return Double.parseDouble(obj.toString());
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }
}
