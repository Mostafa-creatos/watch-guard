package com.watchguard.sharedexpenses.controller;

import com.watchguard.sharedexpenses.dto.ExpenseRequestDto;
import com.watchguard.sharedexpenses.model.Expense;
import com.watchguard.sharedexpenses.model.User;
import com.watchguard.sharedexpenses.service.ExpenseService;
import com.watchguard.sharedexpenses.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class ExpenseController {

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private UserService userService;

    private User getAuthenticatedUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.getUserByUsername(username);
    }

    @PostMapping("/groups/{groupId}/expenses")
    public ResponseEntity<Expense> addExpense(@PathVariable Long groupId, @Valid @RequestBody ExpenseRequestDto dto) {
        User creator = getAuthenticatedUser();
        Expense expense = expenseService.addExpense(groupId, dto, creator);
        return ResponseEntity.ok(expense);
    }

    @GetMapping("/groups/{groupId}/expenses")
    public ResponseEntity<List<Expense>> getGroupExpenses(@PathVariable Long groupId) {
        User user = getAuthenticatedUser();
        List<Expense> expenses = expenseService.getGroupExpenses(groupId, user);
        return ResponseEntity.ok(expenses);
    }

    @DeleteMapping("/expenses/{id}")
    public ResponseEntity<?> deleteExpense(@PathVariable Long id) {
        try {
            User user = getAuthenticatedUser();
            expenseService.deleteExpense(id, user);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/expenses/{id}/confirm")
    public ResponseEntity<Expense> confirmExpense(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        Expense expense = expenseService.confirmExpense(id, user);
        return ResponseEntity.ok(expense);
    }

    @PostMapping("/expenses/{id}/reject")
    public ResponseEntity<?> rejectExpense(@PathVariable Long id) {
        try {
            User user = getAuthenticatedUser();
            expenseService.rejectExpense(id, user);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
