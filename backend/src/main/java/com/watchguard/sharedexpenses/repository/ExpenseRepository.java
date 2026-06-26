package com.watchguard.sharedexpenses.repository;

import com.watchguard.sharedexpenses.model.Expense;
import com.watchguard.sharedexpenses.model.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Collection;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByGroupIdOrderByDateDesc(Long groupId);
    List<Expense> findByGroupIdInOrderByDateDesc(Collection<Long> groupIds);
}
