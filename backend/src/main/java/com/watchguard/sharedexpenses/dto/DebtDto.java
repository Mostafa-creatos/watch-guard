package com.watchguard.sharedexpenses.dto;

import com.watchguard.sharedexpenses.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DebtDto {
    private User debtor;
    private User creditor;
    private BigDecimal amount;
}
