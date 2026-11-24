package com.orderaudit.invoice.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.orderaudit.common.exception.ResourceNotFoundException;
import com.orderaudit.invoice.entity.GstType;
import com.orderaudit.invoice.entity.Invoice;
import com.orderaudit.invoice.entity.InvoiceItem;
import com.orderaudit.invoice.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;

@Service
@RequiredArgsConstructor
public class InvoicePdfService {
    private final InvoiceRepository invoiceRepository;

    public byte[] generatePdf(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId));

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.DARK_GRAY);
            Font subHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.BLACK);
            Font regularFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.BLACK);

            // Header: Company Details
            Paragraph companyTitle = new Paragraph(invoice.getCompanyName() != null ? invoice.getCompanyName() : "Manufacturing Company", headerFont);
            companyTitle.setAlignment(Element.ALIGN_CENTER);
            document.add(companyTitle);

            Paragraph companyDetails = new Paragraph(
                    (invoice.getCompanyAddress() != null ? invoice.getCompanyAddress() : "") +
                            "\nState: " + invoice.getCompanyState() + " (" + invoice.getCompanyStateCode() + ") | GSTIN: " + invoice.getCompanyGstin(),
                    regularFont
            );
            companyDetails.setAlignment(Element.ALIGN_CENTER);
            document.add(companyDetails);

            document.add(new Paragraph(" "));

            Paragraph taxInvoiceTitle = new Paragraph("TAX INVOICE", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Color.BLUE));
            taxInvoiceTitle.setAlignment(Element.ALIGN_CENTER);
            document.add(taxInvoiceTitle);

            document.add(new Paragraph(" "));

            // Two-column table: Invoice info on Left, Customer info on Right
            PdfPTable metaTable = new PdfPTable(2);
            metaTable.setWidthPercentage(100);

            PdfPCell cellLeft = new PdfPCell();
            cellLeft.setBorder(Rectangle.NO_BORDER);
            cellLeft.addElement(new Paragraph("Invoice No: " + invoice.getInvoiceNumber(), boldFont));
            cellLeft.addElement(new Paragraph("Invoice Date: " + invoice.getInvoiceDate(), regularFont));
            cellLeft.addElement(new Paragraph("Financial Year: " + invoice.getFinancialYear(), regularFont));
            cellLeft.addElement(new Paragraph("GST Type: " + invoice.getGstType(), regularFont));
            metaTable.addCell(cellLeft);

            PdfPCell cellRight = new PdfPCell();
            cellRight.setBorder(Rectangle.NO_BORDER);
            cellRight.addElement(new Paragraph("Billed To (Customer):", boldFont));
            cellRight.addElement(new Paragraph(invoice.getCustomerName(), boldFont));
            cellRight.addElement(new Paragraph(invoice.getCustomerAddress() != null ? invoice.getCustomerAddress() : "", regularFont));
            cellRight.addElement(new Paragraph("State: " + invoice.getCustomerState() + " (" + invoice.getCustomerStateCode() + ")", regularFont));
            cellRight.addElement(new Paragraph("GSTIN: " + (invoice.getCustomerGstin() != null ? invoice.getCustomerGstin() : "Unregistered"), regularFont));
            metaTable.addCell(cellRight);

            document.add(metaTable);
            document.add(new Paragraph(" "));

            // Items Table
            boolean isIntra = invoice.getGstType() == GstType.INTRA_STATE;
            int numCols = isIntra ? 8 : 7;
            PdfPTable table = new PdfPTable(numCols);
            table.setWidthPercentage(100);

            // Header row
            String[] headers = isIntra ?
                    new String[]{"#", "Product", "HSN", "Qty", "Rate", "Taxable", "CGST", "SGST"} :
                    new String[]{"#", "Product", "HSN", "Qty", "Rate", "Taxable", "IGST"};

            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, boldFont));
                cell.setBackgroundColor(new Color(230, 235, 245));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(5);
                table.addCell(cell);
            }

            int index = 1;
            for (InvoiceItem item : invoice.getItems()) {
                table.addCell(new Phrase(String.valueOf(index++), regularFont));
                table.addCell(new Phrase(item.getProduct().getName(), regularFont));
                table.addCell(new Phrase(item.getHsnCode(), regularFont));
                table.addCell(new Phrase(item.getQuantity().toString(), regularFont));
                table.addCell(new Phrase("₹" + item.getUnitPrice(), regularFont));
                table.addCell(new Phrase("₹" + item.getTaxableValue(), regularFont));
                if (isIntra) {
                    table.addCell(new Phrase("₹" + item.getCgstAmount(), regularFont));
                    table.addCell(new Phrase("₹" + item.getSgstAmount(), regularFont));
                } else {
                    table.addCell(new Phrase("₹" + item.getIgstAmount(), regularFont));
                }
            }

            document.add(table);
            document.add(new Paragraph(" "));

            // Totals Table
            PdfPTable totalsTable = new PdfPTable(2);
            totalsTable.setWidthPercentage(40);
            totalsTable.setHorizontalAlignment(Element.ALIGN_RIGHT);

            totalsTable.addCell(new Phrase("Subtotal:", boldFont));
            totalsTable.addCell(new Phrase("₹" + invoice.getSubtotal(), regularFont));

            if (isIntra) {
                totalsTable.addCell(new Phrase("CGST (" + invoice.getCgstRate() + "%):", boldFont));
                totalsTable.addCell(new Phrase("₹" + invoice.getCgstAmount(), regularFont));

                totalsTable.addCell(new Phrase("SGST (" + invoice.getSgstRate() + "%):", boldFont));
                totalsTable.addCell(new Phrase("₹" + invoice.getSgstAmount(), regularFont));
            } else {
                totalsTable.addCell(new Phrase("IGST (" + invoice.getIgstRate() + "%):", boldFont));
                totalsTable.addCell(new Phrase("₹" + invoice.getIgstAmount(), regularFont));
            }

            totalsTable.addCell(new Phrase("Total Tax:", boldFont));
            totalsTable.addCell(new Phrase("₹" + invoice.getTotalTax(), regularFont));

            PdfPCell grandTitle = new PdfPCell(new Phrase("Total Amount:", boldFont));
            grandTitle.setBackgroundColor(new Color(230, 240, 255));
            PdfPCell grandValue = new PdfPCell(new Phrase("₹" + invoice.getTotalAmount(), boldFont));
            grandValue.setBackgroundColor(new Color(230, 240, 255));

            totalsTable.addCell(grandTitle);
            totalsTable.addCell(grandValue);

            document.add(totalsTable);

            document.close();
        } catch (DocumentException e) {
            throw new RuntimeException("Error generating invoice PDF", e);
        }

        return out.toByteArray();
    }
}
