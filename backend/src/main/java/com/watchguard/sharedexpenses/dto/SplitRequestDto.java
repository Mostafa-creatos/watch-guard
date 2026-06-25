package com.watchguard.sharedexpenses.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class SplitRequestDto {
    private Long userId;
    private BigDecimal amount;
    private BigDecimal percentage;
}
