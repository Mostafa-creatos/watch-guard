package com.watchguard.sharedexpenses.controller;

import com.watchguard.sharedexpenses.model.User;
import com.watchguard.sharedexpenses.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    private User getAuthenticatedUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.getUserByUsername(username);
    }

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser() {
        return ResponseEntity.ok(getAuthenticatedUser());
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> body) {
        String fullName = body.get("fullName");
        if (fullName == null || fullName.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Full name is required");
        }
        
        User user = getAuthenticatedUser();
        User updated = userService.updateProfile(user, fullName);
        return ResponseEntity.ok(updated);
    }
}
