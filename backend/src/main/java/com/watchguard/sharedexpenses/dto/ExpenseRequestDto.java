package com.watchguard.sharedexpenses.dto;

import com.watchguard.sharedexpenses.model.SplitType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class ExpenseRequestDto {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private BigDecimal amount;

    @NotNull(message = "Date is required")
    private LocalDate date;

    @NotBlank(message = "Category is required")
    private String category;

    @NotNull(message = "Payer ID is required")
    private Long paidById;

    @NotNull(message = "Split type is required")
    private SplitType splitType;

    private String receiptUrl;

    @NotNull(message = "Splits must be provided")
    private List<SplitRequestDto> splits;
}
