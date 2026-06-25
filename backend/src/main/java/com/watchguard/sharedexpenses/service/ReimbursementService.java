package com.watchguard.sharedexpenses.service;

import com.watchguard.sharedexpenses.model.*;
import com.watchguard.sharedexpenses.repository.GroupRepository;
import com.watchguard.sharedexpenses.repository.ReimbursementRepository;
import com.watchguard.sharedexpenses.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class ReimbursementService {

    @Autowired
    private ReimbursementRepository reimbursementRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public Reimbursement recordReimbursement(Long groupId, Long fromUserId, Long toUserId, BigDecimal amount, LocalDate date, User creator) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        if (!group.getMembers().contains(creator)) {
            throw new SecurityException("You are not a member of this group");
        }

        User fromUser = userRepository.findById(fromUserId)
                .orElseThrow(() -> new IllegalArgumentException("Debtor user not found"));

        User toUser = userRepository.findById(toUserId)
                .orElseThrow(() -> new IllegalArgumentException("Creditor user not found"));

        if (!group.getMembers().contains(fromUser) || !group.getMembers().contains(toUser)) {
            throw new IllegalArgumentException("Both users must be group members");
        }

        Reimbursement reimbursement = Reimbursement.builder()
                .group(group)
                .fromUser(fromUser)
                .toUser(toUser)
                .amount(amount)
                .date(date)
                .settled(true) // Immediately settled when recorded
                .build();

        Reimbursement saved = reimbursementRepository.save(reimbursement);

        // Notify recipient
        String message = String.format("%s paid you %.2f MAD in group '%s'", 
                fromUser.getFullName(), amount, group.getName());
        notificationService.createNotification(toUser, message, NotificationType.REPAYMENT_ADDED);

        // Notify other group members of settlement
        String broadcastMsg = String.format("%s recorded a payment of %.2f MAD to %s in '%s'", 
                fromUser.getFullName(), amount, toUser.getFullName(), group.getName());
        for (User member : group.getMembers()) {
            if (!member.getId().equals(fromUserId) && !member.getId().equals(toUserId)) {
                notificationService.createNotification(member, broadcastMsg, NotificationType.SETTLEMENT_CONFIRMATION);
            }
        }

        return saved;
    }

    public List<Reimbursement> getGroupReimbursements(Long groupId, User user) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        if (!group.getMembers().contains(user)) {
            throw new SecurityException("You do not have access to this group");
        }

        return reimbursementRepository.findByGroupIdOrderByDateDesc(groupId);
    }
}
