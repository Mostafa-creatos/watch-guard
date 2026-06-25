package com.watchguard.sharedexpenses.service;

import com.watchguard.sharedexpenses.model.Group;
import com.watchguard.sharedexpenses.model.NotificationType;
import com.watchguard.sharedexpenses.model.User;
import com.watchguard.sharedexpenses.repository.GroupRepository;
import com.watchguard.sharedexpenses.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

@Service
public class GroupService {

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public Group createGroup(String name, String description, User creator) {
        String inviteCode = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Group group = Group.builder()
                .name(name)
                .description(description)
                .inviteCode(inviteCode)
                .createdBy(creator)
                .build();
        
        group.getMembers().add(creator);
        return groupRepository.save(group);
    }

    public List<Group> getUserGroups(User user) {
        return groupRepository.findByMembersContaining(user);
    }

    public Group getGroupById(Long groupId, User user) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));
        
        if (!group.getMembers().contains(user)) {
            throw new SecurityException("You are not a member of this group");
        }
        return group;
    }

    @Transactional
    public Group joinGroupByCode(String inviteCode, User user) {
        Group group = groupRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new IllegalArgumentException("Invalid invite code"));

        if (group.getMembers().contains(user)) {
            return group; // Already a member
        }

        // Notify other members
        String message = String.format("%s joined the group '%s'", user.getFullName(), group.getName());
        for (User member : group.getMembers()) {
            notificationService.createNotification(member, message, NotificationType.SETTLEMENT_CONFIRMATION);
        }

        group.getMembers().add(user);
        return groupRepository.save(group);
    }

    @Transactional
    public Group addMember(Long groupId, String emailOrUsername, User adminUser) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        if (!group.getMembers().contains(adminUser)) {
            throw new SecurityException("You do not have permission to invite members");
        }

        User newUser = userRepository.findByEmail(emailOrUsername)
                .orElseGet(() -> userRepository.findByUsername(emailOrUsername)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email or username: " + emailOrUsername)));

        if (group.getMembers().contains(newUser)) {
            throw new IllegalArgumentException("User is already a member of this group");
        }

        // Notify other members
        String message = String.format("%s added %s to '%s'", adminUser.getFullName(), newUser.getFullName(), group.getName());
        for (User member : group.getMembers()) {
            notificationService.createNotification(member, message, NotificationType.SETTLEMENT_CONFIRMATION);
        }

        // Notify new member
        notificationService.createNotification(newUser, 
                String.format("You were added to '%s' by %s", group.getName(), adminUser.getFullName()), 
                NotificationType.SETTLEMENT_CONFIRMATION);

        group.getMembers().add(newUser);
        return groupRepository.save(group);
    }
}
