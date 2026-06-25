package com.watchguard.sharedexpenses.repository;

import com.watchguard.sharedexpenses.model.Group;
import com.watchguard.sharedexpenses.model.Reimbursement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Collection;
import java.util.List;

@Repository
public interface ReimbursementRepository extends JpaRepository<Reimbursement, Long> {
    List<Reimbursement> findByGroupIdOrderByDateDesc(Long groupId);
    List<Reimbursement> findByGroupInOrderByDateDesc(Collection<Group> groups);
}
