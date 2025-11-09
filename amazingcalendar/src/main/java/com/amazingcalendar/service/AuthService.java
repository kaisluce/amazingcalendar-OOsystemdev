package com.amazingcalendar.service;

import com.amazingcalendar.model.User;
import com.amazingcalendar.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;

    @Autowired
    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User register(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }
        return userRepository.save(user);
    }

    public boolean login(String email, String password) {
        return userRepository.findByEmail(email)
                .map(user -> user.getPassword().equals(password))
                .orElse(false);
    }
}
