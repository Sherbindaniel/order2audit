package com.orderaudit.reporting.controller;

import com.orderaudit.common.dto.ApiResponse;
import com.orderaudit.reporting.dto.*;
import com.orderaudit.reporting.service.ExportService;
import com.orderaudit.reporting.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {
    private final ReportService reportService;
    private final ExportService exportService;

    @GetMapping("/sales-register")
    public ResponseEntity<ApiResponse<List<SalesRegisterEntryDto>>> getSalesRegister(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getSalesRegister(from, to)));
    }

    @GetMapping("/customer-sales")
    public ResponseEntity<ApiResponse<List<CustomerSalesDto>>> getCustomerSales(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getCustomerWiseSales(from, to)));
    }

    @GetMapping("/product-sales")
    public ResponseEntity<ApiResponse<List<ProductSalesDto>>> getProductSales(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getProductWiseSales(from, to)));
    }

    @GetMapping("/gst-summary")
    public ResponseEntity<ApiResponse<GstSummaryDto>> getGstSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getGstSummary(from, to)));
    }

    @GetMapping("/purchases")
    public ResponseEntity<ApiResponse<List<PurchaseRegisterEntryDto>>> getPurchaseRegister(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getPurchaseRegister(from, to)));
    }

    @GetMapping("/stock-summary")
    public ResponseEntity<ApiResponse<List<StockSummaryDto>>> getStockSummary() {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getStockSummary()));
    }

    @GetMapping("/production")
    public ResponseEntity<ApiResponse<List<ProductionReportEntryDto>>> getProductionReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getProductionReport(from, to)));
    }

    @GetMapping("/consumption-variance")
    public ResponseEntity<ApiResponse<List<ConsumptionVarianceEntryDto>>> getConsumptionVariance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getConsumptionVarianceReport(from, to)));
    }

    @GetMapping("/payments")
    public ResponseEntity<ApiResponse<List<PaymentCollectionDto>>> getPaymentCollection(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getPaymentCollectionReport(from, to)));
    }

    @GetMapping("/export/{reportType}")
    public ResponseEntity<byte[]> exportReport(
            @PathVariable String reportType,
            @RequestParam(defaultValue = "csv") String format,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        String[] headers;
        List<String[]> rows = new ArrayList<>();

        if ("sales-register".equalsIgnoreCase(reportType)) {
            headers = new String[]{"Invoice No", "Date", "Customer", "GSTIN", "Type", "Taxable (₹)", "CGST (₹)", "SGST (₹)", "IGST (₹)", "Total (₹)"};
            for (SalesRegisterEntryDto e : reportService.getSalesRegister(from, to)) {
                rows.add(new String[]{e.getInvoiceNumber(), e.getInvoiceDate().toString(), e.getCustomerName(), e.getCustomerGstin(), e.getGstType().toString(), e.getTaxableValue().toString(), e.getCgstAmount().toString(), e.getSgstAmount().toString(), e.getIgstAmount().toString(), e.getTotalAmount().toString()});
            }
        } else {
            headers = new String[]{"Item", "Code", "Type", "Unit", "Opening", "Receipts", "Issues", "Closing"};
            for (StockSummaryDto s : reportService.getStockSummary()) {
                rows.add(new String[]{s.getItemName(), s.getCode(), s.getItemType().toString(), s.getUnit().toString(), s.getOpeningBalance().toString(), s.getTotalReceipts().toString(), s.getTotalIssues().toString(), s.getClosingBalance().toString()});
            }
        }

        byte[] fileBytes;
        String contentType;
        String filename = reportType + "." + ("excel".equalsIgnoreCase(format) ? "xlsx" : "csv");

        if ("excel".equalsIgnoreCase(format)) {
            fileBytes = exportService.exportToExcel(rows, headers, reportType);
            contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        } else {
            fileBytes = exportService.exportToCsv(rows, headers);
            contentType = "text/csv";
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType(contentType))
                .body(fileBytes);
    }
}
