package com.orderaudit.invoice.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "invoice_sequences")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceSequence {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "financial_year", nullable = false, unique = true, length = 10)
    private String financialYear;

    @Column(name = "last_number", nullable = false)
    @Builder.Default
    private int lastNumber = 0;

    @Column(length = 10)
    @Builder.Default
    private String prefix = "INV";
}
