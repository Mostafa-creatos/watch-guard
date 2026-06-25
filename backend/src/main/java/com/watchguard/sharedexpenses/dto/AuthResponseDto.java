package com.watchguard.sharedexpenses.dto;

import com.watchguard.sharedexpenses.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponseDto {
    private String token;
    private User user;
}
