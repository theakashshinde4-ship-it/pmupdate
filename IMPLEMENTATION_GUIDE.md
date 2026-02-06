# IMPLEMENTATION GUIDE: Step-by-Step Refactoring

## 🎯 PHASE-BASED APPROACH

Refactor incrementally, not all at once. This ensures zero downtime and allows rollback if needed.

---

## **PHASE 1: Foundation (Weeks 1-2)**

### Step 1.1: Create Core Error Handling

✅ Already created:
- `backend/src/core/errors/ApiError.js` - Custom error class
- `backend/src/core/response/ApiResponse.js` - Standard responses
- `backend/src/core/decorators/asyncHandler.js` - Error wrapper

**What to do**:
1. Copy these 3 files to your project
2. Test with a simple route:

```javascript
// Test route
const express = require('express');
const app = express();
const { asyncHandler } = require('./core/decorators/asyncHandler');
const ApiResponse = require('./core/response/ApiResponse');
const ApiError = require('./core/errors/ApiError');

app.get('/test', asyncHandler(async (req, res) => {
  throw new ApiError(400, 'Test error', 'TEST_ERROR');
}));

// Error should be caught and formatted
```

---

### Step 1.2: Create Middleware

✅ Already created:
- `backend/src/middleware/errorHandler.middleware.js`
- `backend/src/middleware/validation.middleware.js`

**What to do**:
1. Update `app.js` to use new error handler:

```javascript
// app.js
const errorHandler = require('./middleware/errorHandler.middleware');

// Register LAST
app.use(errorHandler);
```

2. Test error handling works

---

### Step 1.3: Create Shared Utilities

✅ Already created:
- `backend/src/shared/utils/pagination.js`
- `backend/src/shared/enums/roles.enum.js`
- `backend/src/monitoring/logger.js`

**What to do**:
1. Copy to project
2. Update imports in existing code:

```javascript
// OLD
const { parsePagination } = require('../../platform/http/pagination');

// NEW
const { parsePagination } = require('../../shared/utils/pagination');
```

---

## **PHASE 2: Refactor Patient Module (Weeks 3-4)**

This is the blueprint for all other modules.

### Step 2.1: Create Patient Module Structure

Create the directory:
```
backend/src/modules/patient/
├── patient.routes.js
├── patient.controller.js
├── patient.service.js
├── patient.repository.js
├── patient.validation.js
├── patient.dto.js
└── patient.model.js
```

✅ **All files already created**, just need to:
1. Copy them to your project
2. Update imports if your paths differ

### Step 2.2: Update app.js to Register Patient Routes

```javascript
// app.js
const patientRoutes = require('./modules/patient/patient.routes');
app.use('/api/patients', patientRoutes);
```

### Step 2.3: Test Patient Endpoints

```bash
# Test API
curl http://localhost:3000/api/patients
curl -X POST http://localhost:3000/api/patients \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","phone":"1234567890"}'
```

### Step 2.4: Update Tests

Create `backend/tests/unit/patient.service.test.js`:

```javascript
const PatientService = require('../../modules/patient/patient.service');
const PatientRepository = require('../../modules/patient/patient.repository');

jest.mock('../../modules/patient/patient.repository');

describe('PatientService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should create patient', async () => {
    PatientRepository.findByEmail.mockResolvedValue(null);
    PatientRepository.create.mockResolvedValue({ id: 1, name: 'John' });

    const result = await PatientService.createPatient({
      name: 'John',
      email: 'john@test.com',
      phone: '1234567890'
    }, { role: 'doctor', doctor_id: 1 });

    expect(result.id).toBe(1);
  });
});
```

Run tests:
```bash
npm test patient.service
```

---

## **PHASE 3: Refactor Other Modules (Weeks 5-8)**

Now refactor remaining modules using the **Patient module as template**.

### Step 3.1: Doctor Module
```bash
# Copy patient structure
cp -r src/modules/patient src/modules/doctor

# Rename files
mv src/modules/doctor/patient.* src/modules/doctor/doctor.*

# Update file contents (replace "patient" with "doctor", "Patient" with "Doctor")
```

### Step 3.2: Appointment Module
Same process...

### Step 3.3: Prescription Module
Same process...

### Step 3.4: Billing Module
Same process...

---

## **PHASE 4: Cleanup (Week 9)**

### Step 4.1: Remove Old Code
```bash
# After all modules are refactored:
rm src/controllers/*.js  # Old controllers
rm src/services/*.js     # Old services
rm src/routes/*.js       # Old routes (moved to modules)
```

### Step 4.2: Remove Old Imports in app.js
```javascript
// REMOVE THESE
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/users.routes');
// ... 80+ route imports

// KEEP ONLY NEW ONES
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/users.routes');
// ... imported from modules/
```

### Step 4.3: Final Testing
```bash
npm test
npm run lint
npm run build
```

---

## 📋 QUICK CHECKLIST

### Core Layer
- [ ] Copy `core/errors/ApiError.js`
- [ ] Copy `core/response/ApiResponse.js`
- [ ] Copy `core/decorators/asyncHandler.js`
- [ ] Update app.js error handler

### Middleware
- [ ] Copy `middleware/errorHandler.middleware.js`
- [ ] Copy `middleware/validation.middleware.js`
- [ ] Register in app.js

### Shared
- [ ] Copy `shared/utils/pagination.js`
- [ ] Copy `shared/enums/roles.enum.js`
- [ ] Copy `monitoring/logger.js`

### Patient Module (Example)
- [ ] Copy all `modules/patient/*` files
- [ ] Update database queries if schema differs
- [ ] Test all endpoints
- [ ] Write unit tests

### Refactor All Modules
- [ ] Doctor
- [ ] Appointment
- [ ] Prescription
- [ ] Billing
- [ ] Lab
- [ ] Clinic
- [ ] ... etc

### Cleanup
- [ ] Remove old controllers
- [ ] Remove old services  
- [ ] Remove old routes
- [ ] Clean up app.js imports
- [ ] Run full test suite

---

## 🔍 VALIDATION CHECKLIST

After each phase:

```bash
# Check for errors
npm run lint

# Run tests
npm test

# Check imports
grep -r "require.*controllers" src/

# Verify app starts
npm run dev

# Check endpoints work
curl http://localhost:3000/health
```

---

## ⚡ PERFORMANCE BASELINE

Before and after metrics:

```bash
# BEFORE (Current)
- Large file sizes (600+ line controllers)
- Slow test suite (hard to test)
- Memory usage: High (no caching)
- Database queries: Unoptimized

# AFTER (Refactored)
- Small focused files (30-100 lines)
- Fast test suite (unit tests < 1ms)
- Memory usage: Optimized (Redis caching)
- Database queries: Optimized with indexes
```

Measure with:
```bash
# File size
wc -l src/modules/*/hospital.controller.js

# Test speed
npm test -- --timing

# Memory
npm run dev | grep -i memory

# Query time (check logs)
grep "Query time" logs/all.log
```

---

## 🚨 GOTCHAS & COMMON MISTAKES

### ❌ Mistake 1: Mix old and new code
**BAD**:
```javascript
// app.js
const patientRoutes = require('./modules/patient/patient.routes');
const legacyRoutes = require('./routes/legacy');

app.use('/api/patients', patientRoutes);
app.use('/api/legacy', legacyRoutes);
```

**GOOD**: Refactor fully before removing old code

### ❌ Mistake 2: Skip validation
**BAD**:
```javascript
app.post('/patients', PatientController.createPatient);
// No validation!
```

**GOOD**:
```javascript
app.post(
  '/patients',
  validateInput(createPatientSchema, 'body'),
  PatientController.createPatient
);
```

### ❌ Mistake 3: Forget to clear cache
**BAD**:
```javascript
await PatientRepository.create(data);
// Cache not cleared, old data returned
```

**GOOD**:
```javascript
await PatientRepository.create(data);
await redis.del('patients:list');
```

### ❌ Mistake 4: Authorization in controller
**BAD**:
```javascript
static createPatient = asyncHandler(async (req, res) => {
  // Check authorization here (wrong place)
  if (req.user.role !== 'doctor') {
    throw new Error('Unauthorized');
  }
  // ...
});
```

**GOOD**:
```javascript
// Check authorization in ROUTES
router.post(
  '/',
  requireRole(['doctor', 'admin']),  // ✅ Here
  PatientController.createPatient
);

// Service assumes authorized user
static createPatient = asyncHandler(async (req, res) => {
  const patient = await PatientService.createPatient(req.body, req.user);
});
```

---

## 📞 SUPPORT

If you have questions:

1. **Check ARCHITECTURE_GUIDE.md** - Comprehensive overview
2. **Check REFACTORING_SUMMARY.md** - Before/after comparison
3. **Review patient module** - Use as template
4. **Check code comments** - Detailed explanations

---

## 🎓 LEARNING RESOURCES

To understand the architecture better:

- **SOLID Principles**: https://en.wikipedia.org/wiki/SOLID
- **Clean Architecture**: https://blog.cleancoder.com/
- **Design Patterns**: https://refactoring.guru/design-patterns
- **Node.js Best Practices**: https://github.com/goldbergyoni/nodebestpractices

---

**You've got this! Start with Phase 1, and take your time. The refactoring is worth it.**
