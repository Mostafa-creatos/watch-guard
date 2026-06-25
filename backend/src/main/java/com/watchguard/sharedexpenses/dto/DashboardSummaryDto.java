package com.watchguard.sharedexpenses.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryDto {
    private BigDecimal totalExpenses;
    private BigDecimal youPaid;
    private BigDecimal youOwe;
    private BigDecimal youAreOwed;
    private List<DebtDto> simplifiedDebts;
    private Map<Long, BigDecimal> memberBalances;
}
