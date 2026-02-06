# Enterprise Backend Architecture Guide

## Overview
This document describes the production-grade Node.js + Express backend architecture following SOLID principles and clean architecture patterns used at scale by Netflix, Stripe, and Uber.

---

## Architecture Layers

### 1. **Configuration Layer** (`src/config/`)
**Responsibility**: Initialize and manage external dependencies

**Files**:
- `database.js` - MySQL pool with connection pooling
- `redis.js` - Redis client with retry logic
- `env.js` - Environment validation (fail-fast)
- `logger.js` - Centralized logging
- `constants.js` - Application constants

**Key Principle**: All configuration happens at startup. Missing or invalid env vars cause the app to fail immediately.

**Example**:
```javascript
// config/env.js
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'JWT_SECRET', 'NODE_ENV'];
const missing = requiredEnvVars.filter(v => !process.env[v]);
if (missing.length) {
  throw new Error(`Missing env vars: ${missing.join(', ')}`);
}
```

---

### 2. **Core Layer** (`src/core/`)
**Responsibility**: Fundamental abstractions for error handling, responses, and utilities

#### A. Error Handling (`core/errors/`)

**ApiError.js** - Custom error class:
- Standardized error structure
- HTTP status codes
- Error codes for frontend
- Stack traces in dev mode

**Benefits**:
- Consistent error responses across API
- Easy error categorization
- Centralized error handling

#### B. API Response (`core/response/`)

**ApiResponse.js** - Standardized response wrapper:
- Success responses: `{ success: true, data, message }`
- Error responses: `{ success: false, error, message, code }`
- HTTP status codes
- Metadata (pagination, timestamps)

#### C. Async Handler (`core/decorators/`)

**asyncHandler.js** - Wraps async route handlers:
- Catches errors automatically
- No need for try-catch in every route
- Consistent error handling

---

### 3. **Middleware Layer** (`src/middleware/`)
**Responsibility**: Cross-cutting concerns

**Files**:
- `auth.middleware.js` - JWT verification + RBAC
- `validation.middleware.js` - Request schema validation
- `errorHandler.middleware.js` - Global error catcher
- `logging.middleware.js` - Request/response logging
- `rateLimit.middleware.js` - DDoS protection
- `compression.middleware.js` - Response compression

**Key**: Middleware executes in order → Errors caught at the end

---

### 4. **Modules Layer** (`src/modules/{feature}/`)
**Responsibility**: Feature implementation following clean architecture

**Module Structure**:
```
modules/patient/
├── patient.routes.js       → Endpoint definitions
├── patient.controller.js    → HTTP handlers (req/res)
├── patient.service.js       → Business logic
├── patient.repository.js    → Database access
├── patient.model.js         → Entity definition
├── patient.validation.js    → Input validation (Joi schemas)
├── patient.dto.js          → Data transformation objects
└── patient.types.js        → JSDoc type definitions
```

**Dependency Flow** (Unidirectional ↓):
```
Route → Controller → Service → Repository → Database
         ↑           ↑          ↑
      Validation  Business   Data
```

**Why This Works**:
- Each layer has single responsibility
- Easy to test (mock dependencies)
- Easy to modify (changes isolated)
- Database-agnostic (swap MySQL for PostgreSQL)

---

### 5. **Shared Layer** (`src/shared/`)
**Responsibility**: Reusable utilities and abstractions

**Subdirectories**:
- `utils/` - Helper functions (pagination, encryption, date)
- `decorators/` - Function decorators (@cache, @retry, @transaction)
- `enums/` - Constants (roles, status, error codes)

**Key Decorators**:
- `@cache(ttl)` - Cache method results
- `@retry(attempts)` - Retry failed operations
- `@transaction` - Automatic rollback on error

---

### 6. **Background Jobs** (`src/jobs/`)
**Responsibility**: Async task processing (non-blocking)

**Uses**: Bull queue + Redis

**Examples**:
- Email notifications
- Data exports (Excel, PDF)
- Database backups
- Report generation
- Image processing

**Pattern**:
```
Router → Controller → Service → Queue Job
                        ↓
                     Returns immediately
                        ↓
Job Processor (async)
```

---

### 7. **Monitoring** (`src/monitoring/`)
**Responsibility**: Observability and debugging

**Files**:
- `logger.js` - Winston/Pino (structured logging)
- `metrics.js` - Prometheus metrics
- `healthcheck.js` - Service health endpoint
- `sentry.js` - Error tracking

---

## SOLID Principles Applied

### **S - Single Responsibility**
- Patient.Service: Patient business logic only
- Patient.Repository: Database queries only
- Patient.Controller: HTTP handling only

### **O - Open/Closed**
- Easy to add new modules without modifying existing ones
- Extend functionality via decorators (@cache, @retry)

### **L - Liskov Substitution**
- Repositories implement IRepository interface
- Can swap implementations (MySQL → PostgreSQL)

### **I - Interface Segregation**
- DTOs separate data transformation
- Services expose only needed methods

### **D - Dependency Inversion**
- DI Container injects dependencies
- Services receive injected repositories
- No hardcoded `new` statements

---

## Data Flow Example: Create Patient

```
HTTP Request
   ↓
POST /api/patients
   ↓
patient.routes.js (define route)
   ↓
auth.middleware (verify JWT)
   ↓
validation.middleware (validate input against schema)
   ↓
patient.controller.createPatient(req, res)
   ↓
patient.service.createPatient(data)
   ↓
patient.repository.create(data)
   ↓
patient.repository → MySQL: INSERT INTO patients
   ↓
Return created patient
   ↓
controller transforms with DTO
   ↓
ApiResponse.success({ patient })
   ↓
HTTP 201 {success: true, data: {patient}}
```

**If error at any step**:
- Error caught by errorHandler.middleware
- Logged with context
- User receives standardized error response

---

## Before vs. After

### ❌ BEFORE (Current State)

```javascript
// controllers/patientController.js - 600+ lines, does everything
async function createPatient(req, res) {
  try {
    const db = getDb();
    const { name, email, phone } = req.body;
    
    // Validation here
    if (!name) return res.status(400).json({ error: 'Name required' });
    
    // Business logic here
    const existingPatient = await db.execute(
      'SELECT id FROM patients WHERE email = ?', [email]
    );
    if (existingPatient.length > 0) {
      return res.status(409).json({ error: 'Patient exists' });
    }
    
    // Data access here
    const [result] = await db.execute(
      'INSERT INTO patients (name, email, phone) VALUES (?, ?, ?)',
      [name, email, phone]
    );
    
    // Cache update here
    clearCache('patients');
    
    // Response here
    res.json({ success: true, data: { id: result.insertId, name, email, phone } });
  } catch (error) {
    console.error('Error:', error); // Ad-hoc error handling
    res.status(500).json({ error: 'Server error' });
  }
}
```

**Problems**:
- 🔴 500+ line files
- 🔴 Mixed concerns
- 🔴 Hard to test
- 🔴 Validation scattered
- 🔴 Error handling inconsistent
- 🔴 Database logic in controller

---

### ✅ AFTER (Enterprise Architecture)

#### **Route** (`modules/patient/patient.routes.js`)
```javascript
const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../../middleware/auth.middleware');
const { validateInput } = require('../../middleware/validation.middleware');
const { PatientController } = require('./patient.controller');
const { createPatientSchema } = require('./patient.validation');

router.post(
  '/',
  authMiddleware,
  validateInput(createPatientSchema, 'body'),
  PatientController.createPatient
);

module.exports = router;
```

#### **Validation** (`modules/patient/patient.validation.js`)
```javascript
const Joi = require('joi');

const createPatientSchema = Joi.object({
  name: Joi.string().required().trim(),
  email: Joi.string().email().required().lowercase(),
  phone: Joi.string().pattern(/^\d{10}$/).required(),
  blood_group: Joi.string().valid('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'),
  date_of_birth: Joi.date().iso(),
});

module.exports = { createPatientSchema };
```

#### **Controller** (`modules/patient/patient.controller.js`)
```javascript
const { asyncHandler } = require('../../core/decorators/asyncHandler');
const { ApiResponse } = require('../../core/response/ApiResponse');
const { PatientService } = require('./patient.service');

class PatientController {
  static createPatient = asyncHandler(async (req, res) => {
    const patientData = req.body;
    const createdPatient = await PatientService.createPatient(patientData);
    
    return res.status(201).json(
      ApiResponse.success(createdPatient, 'Patient created successfully')
    );
  });

  static getPatient = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const patient = await PatientService.getPatient(id);
    
    return res.json(
      ApiResponse.success(patient)
    );
  });
}

module.exports = { PatientController };
```

#### **Service** (`modules/patient/patient.service.js`)
```javascript
const { PatientRepository } = require('./patient.repository');
const { ApiError } = require('../../core/errors/ApiError');
const { PatientDTO } = require('./patient.dto');

class PatientService {
  static async createPatient(patientData) {
    // Check for duplicates
    const existing = await PatientRepository.findByEmail(patientData.email);
    if (existing) {
      throw new ApiError(409, 'Patient with this email already exists', 'DUPLICATE_EMAIL');
    }

    // Business logic: Generate patient ID
    const patientId = await PatientService.generatePatientId();
    
    const patient = await PatientRepository.create({
      ...patientData,
      patient_id: patientId,
      created_at: new Date()
    });

    // Transform for response
    return PatientDTO.toResponse(patient);
  }

  static async getPatient(id) {
    const patient = await PatientRepository.findById(id);
    if (!patient) {
      throw new ApiError(404, 'Patient not found', 'PATIENT_NOT_FOUND');
    }
    return PatientDTO.toResponse(patient);
  }

  static async generatePatientId() {
    const count = await PatientRepository.count();
    return `PAT-${Date.now()}-${count + 1}`;
  }
}

module.exports = { PatientService };
```

#### **Repository** (`modules/patient/patient.repository.js`)
```javascript
const { getDatabase } = require('../../config/database');
const { PatientModel } = require('./patient.model');

class PatientRepository {
  static async create(data) {
    const db = getDatabase();
    
    const query = `
      INSERT INTO patients (patient_id, name, email, phone, blood_group, date_of_birth, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      data.patient_id,
      data.name,
      data.email,
      data.phone,
      data.blood_group || null,
      data.date_of_birth || null,
      data.created_at
    ];

    const [result] = await db.execute(query, params);
    
    return {
      id: result.insertId,
      ...data
    };
  }

  static async findById(id) {
    const db = getDatabase();
    const [rows] = await db.execute(
      'SELECT * FROM patients WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return rows[0] || null;
  }

  static async findByEmail(email) {
    const db = getDatabase();
    const [rows] = await db.execute(
      'SELECT * FROM patients WHERE email = ? AND deleted_at IS NULL',
      [email]
    );
    return rows[0] || null;
  }

  static async count() {
    const db = getDatabase();
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM patients');
    return rows[0].count;
  }

  static async update(id, data) {
    const db = getDatabase();
    const allowedFields = ['name', 'email', 'phone', 'blood_group', 'date_of_birth', 'updated_at'];
    
    const updates = Object.keys(data)
      .filter(key => allowedFields.includes(key))
      .map(key => `${key} = ?`);

    if (updates.length === 0) return null;

    const values = Object.keys(data)
      .filter(key => allowedFields.includes(key))
      .map(key => data[key]);

    values.push(id);

    await db.execute(
      `UPDATE patients SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
      values
    );

    return this.findById(id);
  }

  static async delete(id) {
    const db = getDatabase();
    await db.execute(
      'UPDATE patients SET deleted_at = NOW() WHERE id = ?',
      [id]
    );
  }

  static async list(filter = {}) {
    const db = getDatabase();
    
    let query = 'SELECT * FROM patients WHERE deleted_at IS NULL';
    const params = [];

    if (filter.search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const searchTerm = `%${filter.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filter.blood_group) {
      query += ' AND blood_group = ?';
      params.push(filter.blood_group);
    }

    if (filter.doctor_id) {
      query += ' AND primary_doctor_id = ?';
      params.push(filter.doctor_id);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(filter.limit || 10, filter.offset || 0);

    const [patients] = await db.execute(query, params);
    return patients;
  }
}

module.exports = { PatientRepository };
```

#### **DTO** (`modules/patient/patient.dto.js`)
```javascript
/**
 * Data Transfer Objects - Transform entity to response format
 * Ensures sensitive data is never leaked
 */
class PatientDTO {
  static toResponse(patient) {
    return {
      id: patient.id,
      patient_id: patient.patient_id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      blood_group: patient.blood_group,
      date_of_birth: patient.date_of_birth,
      created_at: patient.created_at,
      // Never return sensitive fields
      // password, internal_notes, etc.
    };
  }

  static toListResponse(patients) {
    return patients.map(p => this.toResponse(p));
  }

  static toDatabase(patient) {
    // Transform request to DB format if needed
    return {
      ...patient,
      updated_at: new Date()
    };
  }
}

module.exports = { PatientDTO };
```

#### **Model** (`modules/patient/patient.model.js`)
```javascript
/**
 * Patient Entity Definition
 * Documents the structure and validates data shape
 */
class PatientModel {
  constructor(data) {
    this.id = data.id;
    this.patient_id = data.patient_id; // Unique identifier for frontend
    this.name = data.name;
    this.email = data.email;
    this.phone = data.phone;
    this.blood_group = data.blood_group;
    this.date_of_birth = data.date_of_birth;
    this.primary_doctor_id = data.primary_doctor_id;
    this.clinic_id = data.clinic_id;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.deleted_at = data.deleted_at;
  }

  isValid() {
    return this.name && this.email && this.phone;
  }

  isDeleted() {
    return !!this.deleted_at;
  }
}

module.exports = { PatientModel };
```

---

## Comparison

| Aspect | Before | After |
|--------|--------|-------|
| **Controller Size** | 600+ lines | 20-40 lines |
| **Testability** | Hard (mixed concerns) | Easy (unit test each layer) |
| **Reusability** | Low | High (services used by multiple controllers) |
| **Error Handling** | Inconsistent | Centralized + typed |
| **Database Queries** | In controller | Repository layer only |
| **Validation** | Ad-hoc in controller | Centralized schema |
| **Data Transformation** | In controller | DTO layer |
| **Add New Feature** | 15-20 files modified | 1 new module (7 files) |
| **Debugging** | Difficult (logic everywhere) | Easy (trace through layers) |

---

## Performance Optimizations

### 1. Database
```javascript
// Batch queries
const [patients] = await db.query(`
  SELECT p.*, 
         (SELECT COUNT(*) FROM appointments WHERE patient_id = p.id) as appointment_count,
         (SELECT COUNT(*) FROM prescriptions WHERE patient_id = p.id) as prescription_count
  FROM patients p
  WHERE p.id = ?
`, [id]);

// Use indexes
CREATE INDEX idx_email ON patients(email);
CREATE INDEX idx_patient_id ON patients(patient_id);
CREATE INDEX idx_doctor_id ON patients(primary_doctor_id);

// Connection pooling (already in config)
// Use LIMIT to prevent scanning entire tables
```

### 2. Caching
```javascript
// Decorator approach
class PatientService {
  @cache({ ttl: 3600 })
  static async getPatient(id) {
    // Automatically cached for 1 hour
  }
}

// Or manual
const cached = await redis.get(`patient:${id}`);
if (cached) return JSON.parse(cached);

const patient = await PatientRepository.findById(id);
await redis.setex(`patient:${id}`, 3600, JSON.stringify(patient));
return patient;
```

### 3. Pagination
```javascript
// Efficient pagination
const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100
const offset = (parseInt(req.query.page) || 0) * limit;

// Get total for frontend
const total = await PatientRepository.count(filter);

return ApiResponse.success({
  patients,
  pagination: {
    page: Math.floor(offset / limit),
    limit,
    total,
    pages: Math.ceil(total / limit)
  }
});
```

### 4. Query Optimization
```javascript
// Bad: N+1 queries
patients.forEach(p => {
  p.doctor = getDoctorSync(p.doctor_id); // ❌ Runs for each patient
});

// Good: Single batched query
const patientIds = patients.map(p => p.id);
const appointments = await db.query(
  `SELECT * FROM appointments WHERE patient_id IN (?)`,
  [patientIds]
);
// Join in application layer
```

---

## Testing Example

```javascript
// tests/unit/patient.service.test.js
const { PatientService } = require('../../modules/patient/patient.service');
const { PatientRepository } = require('../../modules/patient/patient.repository');

jest.mock('../../modules/patient/patient.repository');

describe('PatientService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPatient', () => {
    it('should create patient successfully', async () => {
      const patientData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890'
      };

      PatientRepository.findByEmail.mockResolvedValue(null);
      PatientRepository.create.mockResolvedValue({
        id: 1,
        ...patientData,
        patient_id: 'PAT-123-1'
      });

      const result = await PatientService.createPatient(patientData);

      expect(PatientRepository.findByEmail).toHaveBeenCalledWith(patientData.email);
      expect(PatientRepository.create).toHaveBeenCalled();
      expect(result.id).toBe(1);
    });

    it('should throw error if patient exists', async () => {
      PatientRepository.findByEmail.mockResolvedValue({ id: 1 });

      await expect(
        PatientService.createPatient({ email: 'john@example.com' })
      ).rejects.toThrow('Patient with this email already exists');
    });
  });
});
```

---

## Deployment Considerations

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
EXPOSE 3000
CMD ["node", "src/server.js"]
```

### Environment Variables
```bash
NODE_ENV=production
DB_HOST=mysql.internal
DB_USER=app_user
DB_PASSWORD=secure_password
JWT_SECRET=very_long_random_secret
REDIS_HOST=redis.internal
LOG_LEVEL=info
```

### Health Checks
```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    database: db.isConnected ? 'connected' : 'disconnected',
    redis: redis?.isConnected ? 'connected' : 'disconnected'
  });
});
```

---

## Summary

This architecture provides:

✅ **Scalability** - Handle 1000s of concurrent requests
✅ **Maintainability** - Clear folder structure, easy to onboard
✅ **Testability** - Unit test each layer independently
✅ **Performance** - Optimized queries, caching, connection pooling
✅ **Security** - JWT + RBAC, input validation, error handling
✅ **Observability** - Logging, metrics, health checks
✅ **Enterprise-Ready** - Used by Netflix, Stripe, Uber
