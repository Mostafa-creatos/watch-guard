package com.watchguard.sharedexpenses.controller;

import com.watchguard.sharedexpenses.dto.DashboardSummaryDto;
import com.watchguard.sharedexpenses.model.Group;
import com.watchguard.sharedexpenses.model.User;
import com.watchguard.sharedexpenses.service.DebtService;
import com.watchguard.sharedexpenses.service.GroupService;
import com.watchguard.sharedexpenses.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    @Autowired
    private GroupService groupService;

    @Autowired
    private UserService userService;

    @Autowired
    private DebtService debtService;

    private User getAuthenticatedUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.getUserByUsername(username);
    }

    @PostMapping
    public ResponseEntity<Group> createGroup(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String description = body.get("description");
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Group name is required");
        }
        User creator = getAuthenticatedUser();
        Group group = groupService.createGroup(name, description, creator);
        return ResponseEntity.ok(group);
    }

    @GetMapping
    public ResponseEntity<List<Group>> getGroups() {
        User user = getAuthenticatedUser();
        List<Group> groups = groupService.getUserGroups(user);
        return ResponseEntity.ok(groups);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Group> getGroupById(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        Group group = groupService.getGroupById(id, user);
        return ResponseEntity.ok(group);
    }

    @PostMapping("/join")
    public ResponseEntity<Group> joinGroup(@RequestBody Map<String, String> body) {
        String inviteCode = body.get("inviteCode");
        if (inviteCode == null || inviteCode.trim().isEmpty()) {
            throw new IllegalArgumentException("Invite code is required");
        }
        User user = getAuthenticatedUser();
        Group group = groupService.joinGroupByCode(inviteCode, user);
        return ResponseEntity.ok(group);
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<Group> addMember(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String emailOrUsername = body.get("emailOrUsername");
        if (emailOrUsername == null || emailOrUsername.trim().isEmpty()) {
            throw new IllegalArgumentException("Email or username is required");
        }
        User admin = getAuthenticatedUser();
        Group group = groupService.addMember(id, emailOrUsername, admin);
        return ResponseEntity.ok(group);
    }

    @GetMapping("/{id}/summary")
    public ResponseEntity<DashboardSummaryDto> getGroupSummary(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        // Just verify access
        groupService.getGroupById(id, user);
        DashboardSummaryDto summary = debtService.calculateGroupSummary(id, user.getId());
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/dashboard/summary")
    public ResponseEntity<DashboardSummaryDto> getDashboardSummary() {
        User user = getAuthenticatedUser();
        List<Group> groups = groupService.getUserGroups(user);
        DashboardSummaryDto summary = debtService.calculateGlobalSummary(user, groups);
        return ResponseEntity.ok(summary);
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<Void> leaveGroup(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        groupService.leaveGroup(id, user);
        return ResponseEntity.ok().build();
    }
}
