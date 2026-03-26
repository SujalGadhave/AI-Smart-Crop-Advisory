package com.krishimitra.backend.auth;

public class AuthResponse {
    private String token;
    private String name;
    private String email;
    private String city;

    public AuthResponse(String token, String name, String email, String city) {
        this.token = token;
        this.name = name;
        this.email = email;
        this.city = city;
    }

    public String getToken() {
        return token;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getCity() {
        return city;
    }
}
