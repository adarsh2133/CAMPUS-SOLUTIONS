# Software Requirements Specification (DBMS Module – STUNET)

## 1. Introduction

### 1.1 Purpose
This document specifies the database requirements for the **Student Collaboration & Skill Growth Platform (STUNET)**. The DBMS module is responsible for secure storage, retrieval, and management of user data, authentication information, skills, and collaboration records.

### 1.2 Scope
The DBMS supports:

- User registration and authentication  
- Email verification via OTP  
- Password reset functionality  
- User profile management  
- Skill and collaboration data storage  
- Secure and scalable data handling  

The system uses **MongoDB (NoSQL)** as the primary database.

### 1.3 Definitions

- **DBMS**: Database Management System  
- **OTP**: One-Time Password  
- **User Document**: MongoDB record representing a user  
- **Index**: MongoDB structure for fast lookup  

---

## 2. Overall Description

### 2.1 Product Perspective
The DBMS is part of the STUNET backend built with **Flask + PyMongo**. It manages persistent storage and interacts with authentication and profile services.

### 2.2 Product Functions (DBMS)

The database shall:

- Store user credentials securely  
- Maintain verification status  
- Support fast login queries  
- Prevent duplicate registrations  
- Store profile metadata  
- Support password recovery  

### 2.3 User Classes

| User Type | Description |
|----------|------------|
| Student | Registers, logs in, manages profile |
| Admin (future) | Monitors and manages users |

### 2.4 Operating Environment

- MongoDB Server  
- Flask Backend  
- REST API communication  
- Cloud or local deployment  
- Modern web browsers  

---

## 3. Functional Requirements (DBMS)

### FR-DB-1: User Registration Storage
The system shall store user details in MongoDB after successful OTP verification.

**Data stored:**

- username (_id)  
- hashed password  
- name  
- email  
- phone number  
- college  
- year  
- major  
- verification status  
- created timestamp  

### FR-DB-2: Email Uniqueness Enforcement
The system shall prevent duplicate email registrations using a unique index.

### FR-DB-3: Secure Password Storage
The system shall store passwords using **PBKDF2 hashing**.

### FR-DB-4: User Authentication
The system shall retrieve user records during login and verify credentials securely.

### FR-DB-5: OTP Verification Support
The system shall temporarily store OTP verification data and validate it before user creation.

### FR-DB-6: Password Reset Support
The system shall allow updating user passwords after successful OTP verification.

### FR-DB-7: User Profile Retrieval
The system shall provide APIs to fetch user profile information by username.

---

## 4. Non-Functional Requirements (DBMS)

### NFR-DB-1: Performance

- Login query response ≤ **200 ms**  
- User lookup shall be indexed  
- Email search shall be indexed  

### NFR-DB-2: Scalability

The database shall support at least:

- 100,000 users  
- Horizontal scaling via MongoDB  

### NFR-DB-3: Security

The system shall:

- Hash passwords  
- Validate email format  
- Use secure OTP mechanism  
- Prevent brute-force attempts (future)  
- Use environment variables for secrets  

### NFR-DB-4: Availability

The database shall maintain ≥ **99% availability**.

### NFR-DB-5: Data Integrity

The system shall:

- Enforce unique emails  
- Validate required fields  
- Maintain consistent user records  

---

## 5. Data Requirements

### 5.1 Primary Collection: `users` (currently `test`)

**Schema (MongoDB Document):**

```json
{
  "_id": "username",
  "password": "hashed_password",
  "name": "string",
  "email": "string",
  "phoneNumber": "string",
  "college": "string",
  "year": "string",
  "major": "string",
  "is_verified": true,
  "failed_attempts": 0,
  "created_at": "datetime"
}
```

### 5.2 Index Requirements

The system shall create:

- Unique index on email  
- Index on created_at  
- Primary index on _id (automatic)  

### 5.3 Temporary Data Storage

The system temporarily stores:

- pending_users (registration OTP)  
- forgot_password_requests (reset OTP)  

⚠️ Note: Future versions shall move this to MongoDB for scalability.

---

## 6. System Architecture (DBMS View)

The database layer shall:

- Use PyMongo for connectivity  
- Use environment-based configuration  
- Support modular service integration  
- Enable future microservice migration  

---

## 7. Future Enhancements

The DBMS may later support:

- Team matching collections  
- Skills graph storage  
- Chat message collections  
- JWT session storage  
- Redis caching for OTP  
- Rate limiting logs  

---

## 8. Conclusion

The DBMS for STUNET is designed to provide secure, scalable, and efficient data management using MongoDB. It supports authentication workflows, profile management, and future collaboration features while maintaining strong security and performance guarantees.
