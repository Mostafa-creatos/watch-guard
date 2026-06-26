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

        boolean autoSettle = creator.getId().equals(toUserId);
        Reimbursement reimbursement = Reimbursement.builder()
                .group(group)
                .fromUser(fromUser)
                .toUser(toUser)
                .amount(amount)
                .date(date)
                .settled(autoSettle)
                .build();

        Reimbursement saved = reimbursementRepository.save(reimbursement);

        if (!autoSettle) {
            // Notify recipient to confirm
            String message = String.format("%s recorded a payment of %.2f MAD to you in group '%s'", 
                    fromUser.getFullName(), amount, group.getName());
            notificationService.createNotification(toUser, message, NotificationType.REPAYMENT_ADDED, saved.getId(), "REIMBURSEMENT");
        } else {
            // Recipient created it, so it's auto-settled. Notify payer.
            String message = String.format("%s confirmed receiving %.2f MAD from you in group '%s'", 
                    toUser.getFullName(), amount, group.getName());
            notificationService.createNotification(fromUser, message, NotificationType.REPAYMENT_ADDED, saved.getId(), "REIMBURSEMENT");

            // Notify other group members of settlement since it is settled
            String broadcastMsg = String.format("%s recorded a payment of %.2f MAD to %s in '%s'", 
                    fromUser.getFullName(), amount, toUser.getFullName(), group.getName());
            for (User member : group.getMembers()) {
                if (!member.getId().equals(fromUserId) && !member.getId().equals(toUserId)) {
                    notificationService.createNotification(member, broadcastMsg, NotificationType.SETTLEMENT_CONFIRMATION, saved.getId(), "REIMBURSEMENT");
                }
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

    @Transactional
    public Reimbursement confirmReimbursement(Long id, User user) {
        Reimbursement reimbursement = reimbursementRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reimbursement not found"));

        // Only the recipient (creditor) should be allowed to confirm receipt of money
        if (!reimbursement.getToUser().getId().equals(user.getId())) {
            throw new SecurityException("Only the recipient can confirm this repayment");
        }

        reimbursement.setSettled(true);
        Reimbursement saved = reimbursementRepository.save(reimbursement);

        // Notify payer
        String msg = String.format("%s confirmed receiving %.2f MAD from you in group '%s'", 
                reimbursement.getToUser().getFullName(), reimbursement.getAmount(), reimbursement.getGroup().getName());
        notificationService.createNotification(reimbursement.getFromUser(), msg, NotificationType.REPAYMENT_ADDED, id, "REIMBURSEMENT");

        // Notify other group members of settlement
        String broadcastMsg = String.format("%s recorded a payment of %.2f MAD to %s in '%s'", 
                reimbursement.getFromUser().getFullName(), reimbursement.getAmount(), reimbursement.getToUser().getFullName(), reimbursement.getGroup().getName());
        for (User member : reimbursement.getGroup().getMembers()) {
            if (!member.getId().equals(reimbursement.getFromUser().getId()) && !member.getId().equals(reimbursement.getToUser().getId())) {
                notificationService.createNotification(member, broadcastMsg, NotificationType.SETTLEMENT_CONFIRMATION, id, "REIMBURSEMENT");
            }
        }

        return saved;
    }

    @Transactional
    public void rejectReimbursement(Long id, User user) {
        Reimbursement reimbursement = reimbursementRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reimbursement not found"));

        // Only the recipient should be allowed to reject the payment claim
        if (!reimbursement.getToUser().getId().equals(user.getId())) {
            throw new SecurityException("Only the recipient can reject this repayment");
        }

        // Notify payer
        String msg = String.format("%s rejected your payment claim of %.2f MAD in group '%s'", 
                reimbursement.getToUser().getFullName(), reimbursement.getAmount(), reimbursement.getGroup().getName());
        notificationService.createNotification(reimbursement.getFromUser(), msg, NotificationType.SETTLEMENT_CONFIRMATION, id, "REIMBURSEMENT");

        reimbursementRepository.delete(reimbursement);
    }
}
