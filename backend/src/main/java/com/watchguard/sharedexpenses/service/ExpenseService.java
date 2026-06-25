package com.watchguard.sharedexpenses.service;

import com.watchguard.sharedexpenses.dto.ExpenseRequestDto;
import com.watchguard.sharedexpenses.dto.SplitRequestDto;
import com.watchguard.sharedexpenses.model.*;
import com.watchguard.sharedexpenses.repository.ExpenseRepository;
import com.watchguard.sharedexpenses.repository.GroupRepository;
import com.watchguard.sharedexpenses.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
public class ExpenseService {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public Expense addExpense(Long groupId, ExpenseRequestDto dto, User creator) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        if (!group.getMembers().contains(creator)) {
            throw new SecurityException("You are not a member of this group");
        }

        User paidBy = userRepository.findById(dto.getPaidById())
                .orElseThrow(() -> new IllegalArgumentException("Payer not found"));

        if (!group.getMembers().contains(paidBy)) {
            throw new IllegalArgumentException("Payer is not a member of this group");
        }

        Expense expense = Expense.builder()
                .group(group)
                .paidBy(paidBy)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .amount(dto.getAmount())
                .date(dto.getDate())
                .category(dto.getCategory())
                .splitType(dto.getSplitType())
                .receiptUrl(dto.getReceiptUrl())
                .build();

        List<ExpenseSplit> splits = calculateSplits(expense, dto.getSplits());
        expense.setSplits(splits);

        Expense savedExpense = expenseRepository.save(expense);

        // Notify other group members
        String message = String.format("New expense '%s' of %.2f MAD added by %s", 
                expense.getTitle(), expense.getAmount(), paidBy.getFullName());
        
        for (User member : group.getMembers()) {
            if (!member.getId().equals(paidBy.getId())) {
                notificationService.createNotification(member, message, NotificationType.EXPENSE_ADDED);
            }
        }

        return savedExpense;
    }

    @Transactional
    public void deleteExpense(Long expenseId, User user) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("Expense not found"));

        if (!expense.getGroup().getMembers().contains(user)) {
            throw new SecurityException("You do not have access to this expense");
        }

        expenseRepository.delete(expense);
    }

    public List<Expense> getGroupExpenses(Long groupId, User user) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        if (!group.getMembers().contains(user)) {
            throw new SecurityException("You do not have access to this group");
        }

        return expenseRepository.findByGroupIdOrderByDateDesc(groupId);
    }

    private List<ExpenseSplit> calculateSplits(Expense expense, List<SplitRequestDto> splitRequests) {
        if (splitRequests.isEmpty()) {
            throw new IllegalArgumentException("Splits list cannot be empty");
        }

        List<ExpenseSplit> splits = new ArrayList<>();
        BigDecimal totalAmount = expense.getAmount();
        SplitType type = expense.getSplitType();

        int n = splitRequests.size();

        if (type == SplitType.EQUAL) {
            BigDecimal equalShare = totalAmount.divide(BigDecimal.valueOf(n), 2, RoundingMode.HALF_UP);
            BigDecimal runningSum = BigDecimal.ZERO;

            for (int i = 0; i < n; i++) {
                SplitRequestDto req = splitRequests.get(i);
                User user = userRepository.findById(req.getUserId())
                        .orElseThrow(() -> new IllegalArgumentException("User in split not found"));

                BigDecimal share = equalShare;
                // Adjust the last split to avoid rounding errors (e.g. 10/3 => 3.33, 3.33, 3.34)
                if (i == n - 1) {
                    share = totalAmount.subtract(runningSum);
                } else {
                    runningSum = runningSum.add(equalShare);
                }

                splits.add(ExpenseSplit.builder()
                        .expense(expense)
                        .user(user)
                        .amount(share)
                        .build());
            }
        } 
        else if (type == SplitType.EXACT) {
            BigDecimal runningSum = BigDecimal.ZERO;

            for (int i = 0; i < n; i++) {
                SplitRequestDto req = splitRequests.get(i);
                if (req.getAmount() == null || req.getAmount().compareTo(BigDecimal.ZERO) < 0) {
                    throw new IllegalArgumentException("Exact amount must be non-negative");
                }

                User user = userRepository.findById(req.getUserId())
                        .orElseThrow(() -> new IllegalArgumentException("User in split not found"));

                runningSum = runningSum.add(req.getAmount());

                splits.add(ExpenseSplit.builder()
                        .expense(expense)
                        .user(user)
                        .amount(req.getAmount())
                        .build());
            }

            // Verify total equals the sum of individual exact splits
            if (runningSum.setScale(2, RoundingMode.HALF_UP).compareTo(totalAmount.setScale(2, RoundingMode.HALF_UP)) != 0) {
                throw new IllegalArgumentException("Sum of splits (" + runningSum + ") must equal total expense amount (" + totalAmount + ")");
            }
        } 
        else if (type == SplitType.PERCENTAGE) {
            BigDecimal percentSum = BigDecimal.ZERO;
            BigDecimal runningSum = BigDecimal.ZERO;

            for (int i = 0; i < n; i++) {
                SplitRequestDto req = splitRequests.get(i);
                if (req.getPercentage() == null || req.getPercentage().compareTo(BigDecimal.ZERO) < 0) {
                    throw new IllegalArgumentException("Percentage must be non-negative");
                }

                User user = userRepository.findById(req.getUserId())
                        .orElseThrow(() -> new IllegalArgumentException("User in split not found"));

                percentSum = percentSum.add(req.getPercentage());

                BigDecimal share;
                if (i == n - 1) {
                    share = totalAmount.subtract(runningSum);
                } else {
                    share = totalAmount.multiply(req.getPercentage())
                            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                    runningSum = runningSum.add(share);
                }

                splits.add(ExpenseSplit.builder()
                        .expense(expense)
                        .user(user)
                        .amount(share)
                        .percentage(req.getPercentage())
                        .build());
            }

            // Verify percentages sum to 100%
            if (percentSum.setScale(2, RoundingMode.HALF_UP).compareTo(BigDecimal.valueOf(100).setScale(2, RoundingMode.HALF_UP)) != 0) {
                throw new IllegalArgumentException("Sum of percentages must equal 100% (was: " + percentSum + ")");
            }
        }

        return splits;
    }
}
