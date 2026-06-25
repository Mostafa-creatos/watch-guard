package com.watchguard.sharedexpenses.repository;

import com.watchguard.sharedexpenses.model.Group;
import com.watchguard.sharedexpenses.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {
    Optional<Group> findByInviteCode(String inviteCode);
    List<Group> findByMembersContaining(User user);
}
