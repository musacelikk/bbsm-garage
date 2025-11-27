package com.example.excelexport;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import java.io.IOException;
import java.util.List;
import java.util.Map;

public class ExcelUtil {

    private static final int ROWS_PER_PAGE = 23;

    public static void fillExcelTemplate(Workbook workbook, Map<String, String> vehicleInfo, List<Map<String, String>> data, String notes) throws IOException {
        int sheetIndex = 0;
        int rowIndex = 9;
        Sheet sheet = workbook.getSheetAt(sheetIndex);

        CellStyle financialCellStyle = workbook.createCellStyle();
        DataFormat format = workbook.createDataFormat();
        financialCellStyle.setDataFormat(format.getFormat("#,##0.00 ₺"));

        fillHeaderAndVehicleInfo(sheet, vehicleInfo);

        for (int i = 0; i < data.size(); i++) {
            if (rowIndex >= ROWS_PER_PAGE + 9) {
                rowIndex = 9;
                sheetIndex++;
                sheet = copySheet(workbook, workbook.getSheetAt(0), "Page " + (sheetIndex + 1));
                fillHeaderAndVehicleInfo(sheet, vehicleInfo);
            }
            Row row = sheet.createRow(rowIndex++);
            Map<String, String> rowData = data.get(i);

            fillCell(row, 0, rowData.get("birimAdedi"));
            fillCell(row, 1, rowData.get("parcaAdi"));
            fillCellNumeric(row, 2, Double.parseDouble(rowData.get("birimFiyati")), financialCellStyle);
            fillCellNumeric(row, 3, Double.parseDouble(rowData.get("toplamFiyat")), financialCellStyle);
        }

        addNotes(sheet, notes);
    }

    private static void fillHeaderAndVehicleInfo(Sheet sheet, Map<String, String> vehicleInfo) {
        fillCell(sheet, 2, 1, vehicleInfo.get("plaka"));
        fillCell(sheet, 2, 3, vehicleInfo.get("adSoyad"));
        fillCell(sheet, 3, 1, vehicleInfo.get("markaModel"));
        fillCell(sheet, 3, 3, vehicleInfo.get("adres") + "\n\n");
        fillCell(sheet, 4, 1, vehicleInfo.get("renk"));
        fillCell(sheet, 5, 3, vehicleInfo.get("km"));
        fillCell(sheet, 5, 1, vehicleInfo.get("sasi"));
        fillCell(sheet, 6, 3, vehicleInfo.get("telNo"));
        fillCell(sheet, 6, 1, vehicleInfo.get("girisTarihi"));

        Row headerRow = sheet.getRow(9);
        if (headerRow == null) {
            headerRow = sheet.createRow(9);
        }
        fillCell(headerRow, 0, "BİRİM ADEDİ");
        fillCell(headerRow, 1, "PARÇA ADI");
        fillCell(headerRow, 2, "BİRİM FİYATI");
        fillCell(headerRow, 3, "TOPLAM FİYAT");
    }

    private static void fillCell(Sheet sheet, int rowIndex, int cellIndex, String value) {
        Row row = sheet.getRow(rowIndex);
        if (row == null) {
            row = sheet.createRow(rowIndex);
        }
        Cell cell = row.getCell(cellIndex);
        if (cell == null) {
            cell = row.createCell(cellIndex);
        }
        cell.setCellValue(value);
    }

    private static void fillCell(Row row, int cellIndex, String value) {
        Cell cell = row.getCell(cellIndex);
        if (cell == null) {
            cell = row.createCell(cellIndex);
        }
        cell.setCellValue(value);
    }

    private static void fillCellNumeric(Row row, int cellIndex, double value, CellStyle style) {
        Cell cell = row.getCell(cellIndex);
        if (cell == null) {
            cell = row.createCell(cellIndex);
        }
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }

    private static Sheet copySheet(Workbook workbook, Sheet originalSheet, String newSheetName) {
        Sheet newSheet = workbook.createSheet(newSheetName);
        copySheetContent(workbook, originalSheet, newSheet);
        return newSheet;
    }

    private static void copySheetContent(Workbook workbook, Sheet originalSheet, Sheet newSheet) {
        for (int i = 0; i <= originalSheet.getLastRowNum(); i++) {
            Row oldRow = originalSheet.getRow(i);
            Row newRow = newSheet.createRow(i);
            if (oldRow != null) {
                newRow.setHeight(oldRow.getHeight());
                for (int j = 0; j < oldRow.getLastCellNum(); j++) {
                    Cell oldCell = oldRow.getCell(j);
                    Cell newCell = newRow.createCell(j);
                    if (oldCell != null) {
                        copyCellStyle(workbook, oldCell, newCell);
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

    private static void copyCellStyle(Workbook workbook, Cell oldCell, Cell newCell) {
        CellStyle newCellStyle = workbook.createCellStyle();
        newCellStyle.cloneStyleFrom(oldCell.getCellStyle());
        newCell.setCellStyle(newCellStyle);
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

    private static void addNotes(Sheet sheet, String notes) {
        int notesRowIndex = sheet.getLastRowNum() + 1;
        Row notesRow = sheet.createRow(notesRowIndex);
        Cell notesCell = notesRow.createCell(0);
        notesCell.setCellValue("NOTLAR");

        notesRow = sheet.createRow(notesRowIndex + 1);
        notesCell = notesRow.createCell(0);
        notesCell.setCellValue(notes);

        sheet.addMergedRegion(new CellRangeAddress(notesRowIndex + 1, notesRowIndex + 1, 0, 3));
    }
}
