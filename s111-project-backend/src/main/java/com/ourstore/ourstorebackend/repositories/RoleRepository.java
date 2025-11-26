package com.ourstore.ourstorebackend.repositories;

import com.ourstore.ourstorebackend.entities.Role;
import com.ourstore.ourstorebackend.entities.Role.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(RoleName name);
}
