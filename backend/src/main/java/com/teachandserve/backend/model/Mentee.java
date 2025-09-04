package com.teachandserve.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data                      
@NoArgsConstructor          
@AllArgsConstructor         
public class Mentee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private String dateOfBirth;
    private String bio;
}