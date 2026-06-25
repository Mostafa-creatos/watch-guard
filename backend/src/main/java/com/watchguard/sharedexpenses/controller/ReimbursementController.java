package com.watchguard.sharedexpenses.controller;

import com.watchguard.sharedexpenses.dto.ReimbursementRequestDto;
import com.watchguard.sharedexpenses.model.Reimbursement;
import com.watchguard.sharedexpenses.model.User;
import com.watchguard.sharedexpenses.service.ReimbursementService;
import com.watchguard.sharedexpenses.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class ReimbursementController {

    @Autowired
    private ReimbursementService reimbursementService;

    @Autowired
    private UserService userService;

    private User getAuthenticatedUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.getUserByUsername(username);
    }

    @PostMapping("/groups/{groupId}/reimbursements")
    public ResponseEntity<Reimbursement> recordReimbursement(
            @PathVariable Long groupId,
            @Valid @RequestBody ReimbursementRequestDto dto) {
        User creator = getAuthenticatedUser();
        Reimbursement reimbursement = reimbursementService.recordReimbursement(
                groupId, dto.getFromUserId(), dto.getToUserId(), dto.getAmount(), dto.getDate(), creator);
        return ResponseEntity.ok(reimbursement);
    }

    @GetMapping("/groups/{groupId}/reimbursements")
    public ResponseEntity<List<Reimbursement>> getGroupReimbursements(@PathVariable Long groupId) {
        User user = getAuthenticatedUser();
        List<Reimbursement> reimbursements = reimbursementService.getGroupReimbursements(groupId, user);
        return ResponseEntity.ok(reimbursements);
    }
}
