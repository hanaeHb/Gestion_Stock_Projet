package com.example.usersservice.repository;

import com.example.usersservice.entities.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserRepository extends JpaRepository<Users, Integer> {

    Users findByUserId(Integer userId);
    List<Users> findByDisponibleTrue();
    boolean existsByUserId(Integer userId);
}
