package com.watchguard.sharedexpenses.service;

import com.watchguard.sharedexpenses.dto.DashboardSummaryDto;
import com.watchguard.sharedexpenses.dto.DebtDto;
import com.watchguard.sharedexpenses.model.*;
import com.watchguard.sharedexpenses.repository.ExpenseRepository;
import com.watchguard.sharedexpenses.repository.GroupRepository;
import com.watchguard.sharedexpenses.repository.ReimbursementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DebtService {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private ReimbursementRepository reimbursementRepository;

    @Autowired
    private GroupRepository groupRepository;

    /**
     * Calculates user balances and minimizes transactions (simplified debts) for a group.
     */
    public DashboardSummaryDto calculateGroupSummary(Long groupId, Long currentUserId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        List<Expense> expenses = expenseRepository.findByGroupIdOrderByDateDesc(groupId);
        List<Reimbursement> reimbursements = reimbursementRepository.findByGroupIdOrderByDateDesc(groupId);

        return calculateSummary(group.getMembers(), expenses, reimbursements, currentUserId);
    }

    /**
     * Calculates global dashboard summary across all groups for a user.
     */
    public DashboardSummaryDto calculateGlobalSummary(User currentUser, List<Group> userGroups) {
        if (userGroups.isEmpty()) {
            return DashboardSummaryDto.builder()
                    .totalExpenses(BigDecimal.ZERO)
                    .youPaid(BigDecimal.ZERO)
                    .youOwe(BigDecimal.ZERO)
                    .youAreOwed(BigDecimal.ZERO)
                    .simplifiedDebts(new ArrayList<>())
                    .memberBalances(new HashMap<>())
                    .build();
        }

        List<Expense> expenses = expenseRepository.findByGroupInOrderByDateDesc(userGroups);
        List<Reimbursement> reimbursements = reimbursementRepository.findByGroupInOrderByDateDesc(userGroups);

        // Standardize calculation over all unique members across all user's groups
        Set<User> allMembers = userGroups.stream()
                .flatMap(g -> g.getMembers().stream())
                .collect(Collectors.toSet());

        return calculateSummary(allMembers, expenses, reimbursements, currentUser.getId());
    }

    private DashboardSummaryDto calculateSummary(Set<User> members, List<Expense> expenses, List<Reimbursement> reimbursements, Long currentUserId) {
        Map<Long, BigDecimal> netBalances = new HashMap<>();
        members.forEach(member -> netBalances.put(member.getId(), BigDecimal.ZERO));

        BigDecimal totalExpenses = BigDecimal.ZERO;
        BigDecimal youPaid = BigDecimal.ZERO;

        // 1. Process Expenses and Splits
        for (Expense expense : expenses) {
            if (!expense.isConfirmed()) continue;
            totalExpenses = totalExpenses.add(expense.getAmount());
            if (expense.getPaidBy().getId().equals(currentUserId)) {
                youPaid = youPaid.add(expense.getAmount());
            }

            // Creditor gets credited the full amount paid
            Long payerId = expense.getPaidBy().getId();
            if (netBalances.containsKey(payerId)) {
                netBalances.put(payerId, netBalances.get(payerId).add(expense.getAmount()));
            }

            // Debtors get debited their split amount
            for (ExpenseSplit split : expense.getSplits()) {
                Long debtorId = split.getUser().getId();
                if (netBalances.containsKey(debtorId)) {
                    netBalances.put(debtorId, netBalances.get(debtorId).subtract(split.getAmount()));
                }
            }
        }

        // 2. Process Reimbursements/Settlements
        for (Reimbursement r : reimbursements) {
            if (!r.isSettled()) continue;
            Long fromId = r.getFromUser().getId();
            Long toId = r.getToUser().getId();

            // Sender's debt is reduced (credited)
            if (netBalances.containsKey(fromId)) {
                netBalances.put(fromId, netBalances.get(fromId).add(r.getAmount()));
            }
            // Recipient's credit is reduced (debited)
            if (netBalances.containsKey(toId)) {
                netBalances.put(toId, netBalances.get(toId).subtract(r.getAmount()));
            }
        }

        // Round all balances to 2 decimal places
        for (Map.Entry<Long, BigDecimal> entry : netBalances.entrySet()) {
            entry.setValue(entry.getValue().setScale(2, RoundingMode.HALF_UP));
        }

        // Calculate youOwe and youAreOwed
        BigDecimal youOwe = BigDecimal.ZERO;
        BigDecimal youAreOwed = BigDecimal.ZERO;
        BigDecimal myBalance = netBalances.getOrDefault(currentUserId, BigDecimal.ZERO);

        // 3. Minimize debts using a greedy matching algorithm
        List<DebtDto> simplifiedDebts = simplifyDebts(members, netBalances);

        // From simplified debts, extract what current user owes and is owed
        for (DebtDto debt : simplifiedDebts) {
            if (debt.getDebtor().getId().equals(currentUserId)) {
                youOwe = youOwe.add(debt.getAmount());
            } else if (debt.getCreditor().getId().equals(currentUserId)) {
                youAreOwed = youAreOwed.add(debt.getAmount());
            }
        }

        return DashboardSummaryDto.builder()
                .totalExpenses(totalExpenses.setScale(2, RoundingMode.HALF_UP))
                .youPaid(youPaid.setScale(2, RoundingMode.HALF_UP))
                .youOwe(youOwe.setScale(2, RoundingMode.HALF_UP))
                .youAreOwed(youAreOwed.setScale(2, RoundingMode.HALF_UP))
                .simplifiedDebts(simplifiedDebts)
                .memberBalances(netBalances)
                .build();
    }

    private List<DebtDto> simplifyDebts(Set<User> members, Map<Long, BigDecimal> balances) {
        List<DebtDto> result = new ArrayList<>();

        Map<Long, User> userMap = members.stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        // Define class to hold temporary state of balances
        class MemberBalance {
            final User user;
            BigDecimal balance;
            MemberBalance(User user, BigDecimal balance) {
                this.user = user;
                this.balance = balance;
            }
        }

        List<MemberBalance> debtors = new ArrayList<>();
        List<MemberBalance> creditors = new ArrayList<>();

        for (Map.Entry<Long, BigDecimal> entry : balances.entrySet()) {
            User user = userMap.get(entry.getKey());
            if (user == null) continue;
            BigDecimal bal = entry.getValue();

            if (bal.compareTo(new BigDecimal("-0.01")) < 0) {
                debtors.add(new MemberBalance(user, bal));
            } else if (bal.compareTo(new BigDecimal("0.01")) > 0) {
                creditors.add(new MemberBalance(user, bal));
            }
        }

        // Greedy matching
        int dIdx = 0;
        int cIdx = 0;

        while (dIdx < debtors.size() && cIdx < creditors.size()) {
            MemberBalance debtor = debtors.get(dIdx);
            MemberBalance creditor = creditors.get(cIdx);

            BigDecimal debtAmount = debtor.balance.abs();
            BigDecimal creditAmount = creditor.balance;

            BigDecimal settleAmount = debtAmount.min(creditAmount);

            if (settleAmount.compareTo(BigDecimal.ZERO) > 0) {
                result.add(new DebtDto(debtor.user, creditor.user, settleAmount.setScale(2, RoundingMode.HALF_UP)));
            }

            debtor.balance = debtor.balance.add(settleAmount);
            creditor.balance = creditor.balance.subtract(settleAmount);

            if (debtor.balance.abs().compareTo(new BigDecimal("0.01")) < 0) {
                dIdx++;
            }
            if (creditor.balance.abs().compareTo(new BigDecimal("0.01")) < 0) {
                cIdx++;
            }
        }

        return result;
    }
}
