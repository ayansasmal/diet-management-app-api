# Postman Collections & Newman CLI Guide

A comprehensive guide for creating, organizing, and automating API tests using Postman collections and Newman CLI runner.

## Table of Contents

1. [Creating Postman Collections](#creating-postman-collections)
2. [Collection Structure Best Practices](#collection-structure-best-practices)
3. [Variables and Environments](#variables-and-environments)
4. [Writing Test Scripts](#writing-test-scripts)
5. [Pre-request Scripts](#pre-request-scripts)
6. [Newman CLI Execution](#newman-cli-execution)
7. [Test Examples Reference](#test-examples-reference)
8. [CI/CD Integration](#cicd-integration)

---

## Creating Postman Collections

### Collection Schema

Postman collections use the **v2.1.0 schema**. A collection JSON file has this structure:

```json
{
  "info": {
    "name": "API Collection Name",
    "description": "Description of what this API does",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [],
  "item": []
}
```

### Creating Collections Efficiently

#### 1. Use Postman App (Recommended for Initial Creation)

1. Open Postman Desktop or Web
2. Click **New** → **Collection**
3. Add requests by clicking **Add Request**
4. Organize into folders
5. Export as **Collection v2.1**

#### 2. Manual JSON Creation

For programmatic generation or precise control:

```json
{
  "info": {
    "name": "CSIRO Low-Carb Diet API",
    "description": "API for the CSIRO Low-Carb Diet application",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    }
  ],
  "item": [
    {
      "name": "Folder Name",
      "item": [
        {
          "name": "Request Name",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/api/endpoint",
              "host": ["{{baseUrl}}"],
              "path": ["api", "endpoint"]
            }
          },
          "response": []
        }
      ]
    }
  ]
}
```

#### 3. Import from OpenAPI/Swagger

If you have OpenAPI spec (like our NestJS Swagger):

1. In Postman: **Import** → **Link** or **File**
2. Paste `http://localhost:3000/api/openapi.json`
3. Postman generates requests automatically

---

## Collection Structure Best Practices

### Folder Organization

Organize requests by **feature** or **resource**:

```
📁 Collection
├── 📁 Health Check
│   ├── GET /api/health
│   ├── GET /api/health/live
│   └── GET /api/health/ready
├── 📁 Authentication
│   ├── POST /api/auth/google
│   └── GET /api/auth/me
├── 📁 User Profile
│   ├── POST /api/users/profile
│   ├── GET /api/users/profile
│   └── PATCH /api/users/profile
├── 📁 Calculator
│   └── GET /api/calculator/metrics
└── 📁 Tracking
    ├── 📁 Weight
    │   ├── POST /api/tracking/weight
    │   ├── GET /api/tracking/weight
    │   ├── GET /api/tracking/weight/today
    │   ├── GET /api/tracking/weight/:date
    │   └── DELETE /api/tracking/weight/:date
    └── 📁 Glucose
        ├── POST /api/tracking/glucose
        ├── GET /api/tracking/glucose
        ├── GET /api/tracking/glucose/today
        ├── GET /api/tracking/glucose/:date
        └── DELETE /api/tracking/glucose/:id
```

### Request Naming Convention

Use clear, action-based names:
- ✅ `Register New User`
- ✅ `Login with Credentials`
- ✅ `Get User Profile`
- ❌ `POST auth register`
- ❌ `test1`

### Execution Order

Place requests in dependency order:
1. Health checks first (verify API is running)
2. Authentication (get tokens)
3. Setup data (create profile)
4. Feature tests (tracking)
5. Cleanup (optional)

---

## Variables and Environments

### Collection Variables

Define at collection level for values shared across all requests:

```json
{
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000",
      "description": "Base URL for API"
    },
    {
      "key": "accessToken",
      "value": "",
      "description": "JWT token from login"
    },
    {
      "key": "testEmail",
      "value": "test@example.com"
    },
    {
      "key": "testPassword",
      "value": "TestPass123!"
    }
  ]
}
```

### Using Variables

Reference in URLs, headers, or body:

```
URL: {{baseUrl}}/api/auth/login
Header: Authorization: Bearer {{accessToken}}
Body: { "email": "{{testEmail}}" }
```

### Dynamic Variables

Postman provides built-in dynamic variables:

| Variable | Description | Example Output |
|----------|-------------|----------------|
| `{{$guid}}` | UUID v4 | `550e8400-e29b-41d4-a716-446655440000` |
| `{{$randomInt}}` | Random integer | `42` |
| `{{$timestamp}}` | Current Unix timestamp | `1705622400` |
| `{{$isoTimestamp}}` | ISO 8601 timestamp | `2024-01-19T00:00:00.000Z` |
| `{{$randomEmail}}` | Random email | `john.doe@example.com` |

### Setting Variables Dynamically

In test scripts, save response data for later requests:

```javascript
// After successful login, save the token
const jsonData = pm.response.json();
pm.collectionVariables.set("accessToken", jsonData.data.accessToken);
pm.collectionVariables.set("userId", jsonData.data.user.id);
```

---

## Writing Test Scripts

### Test Script Location

Tests go in the **Tests** tab of a request. They run **after** the response is received.

### Basic Syntax

Use `pm.test()` with ChaiJS BDD assertions:

```javascript
pm.test("Test name", function() {
    // assertions here
});
```

### The `pm` Object

Key properties of the Postman sandbox:

```javascript
pm.response           // Response object
pm.response.code      // Status code (number)
pm.response.status    // Status text ("OK")
pm.response.json()    // Parse JSON body
pm.response.text()    // Raw body text
pm.response.headers   // Response headers
pm.cookies            // Response cookies
pm.collectionVariables  // Collection variables
pm.environment        // Environment variables
pm.expect()           // ChaiJS expect
```

### Assertion Styles

#### ChaiJS BDD (Recommended)

```javascript
pm.test("Response has correct structure", function() {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success', true);
    pm.expect(jsonData.data).to.be.an('object');
});
```

#### Legacy Style (Still Works)

```javascript
pm.test("Status is 200", function() {
    pm.response.to.have.status(200);
});
```

---

## Pre-request Scripts

### Purpose

Pre-request scripts run **before** a request is sent. Use for:
- Setting dynamic variables
- Generating timestamps
- Computing signatures
- Conditional logic

### Location

In the **Pre-request Script** tab of a request or folder.

### Common Patterns

#### Set Today's Date

```javascript
const today = new Date().toISOString().split('T')[0];
pm.collectionVariables.set("today", today);
```

#### Generate Random Email

```javascript
const randomEmail = `test_${Date.now()}@example.com`;
pm.collectionVariables.set("testEmail", randomEmail);
```

#### Skip Request Conditionally

```javascript
if (!pm.collectionVariables.get("accessToken")) {
    throw new Error("Must run login first");
}
```

#### Compute HMAC Signature

```javascript
const crypto = require('crypto-js');
const timestamp = Date.now().toString();
const signature = crypto.HmacSHA256(timestamp, pm.collectionVariables.get("apiSecret"));
pm.collectionVariables.set("signature", signature.toString());
pm.collectionVariables.set("timestamp", timestamp);
```

---

## Newman CLI Execution

### Installation

```bash
# Global installation
npm install -g newman

# Project dependency
npm install --save-dev newman
```

### Basic Usage

```bash
# Run a collection
newman run collection.json

# With environment
newman run collection.json -e environment.json

# Specify iterations
newman run collection.json -n 5
```

### Common Options

| Option | Description |
|--------|-------------|
| `-e, --environment <file>` | Environment file |
| `-g, --globals <file>` | Globals file |
| `-n, --iteration-count <n>` | Number of iterations |
| `-d, --iteration-data <file>` | CSV/JSON data file |
| `--delay-request <ms>` | Delay between requests |
| `--timeout <ms>` | Request timeout |
| `--timeout-request <ms>` | Per-request timeout |
| `--bail` | Stop on first failure |
| `-k, --insecure` | Disable SSL verification |
| `--color off` | Disable colored output |

### Reporters

Newman supports multiple output formats:

```bash
# CLI reporter (default)
newman run collection.json

# Multiple reporters
newman run collection.json -r cli,json,junit

# HTML reporter (install separately)
npm install -g newman-reporter-htmlextra
newman run collection.json -r htmlextra

# JSON output
newman run collection.json -r json --reporter-json-export results.json

# JUnit for CI/CD
newman run collection.json -r junit --reporter-junit-export results.xml
```

### NPM Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test:api": "newman run postman/csiro-diet-api.postman_collection.json",
    "test:api:report": "newman run postman/csiro-diet-api.postman_collection.json -r cli,json --reporter-json-export test-results.json"
  }
}
```

### Exit Codes

Newman returns meaningful exit codes:

| Code | Meaning |
|------|---------|
| 0 | All tests passed |
| 1 | Test failures or errors |

---

## Test Examples Reference

### Testing Status Codes

```javascript
// Exact status code
pm.test("Status is 200", function() {
    pm.response.to.have.status(200);
});

// Status code in range
pm.test("Success status", function() {
    pm.expect(pm.response.code).to.be.oneOf([200, 201]);
});

// Status family
pm.test("2xx status", function() {
    pm.expect(pm.response.code).to.be.within(200, 299);
});

// With status text
pm.test("Created response", function() {
    pm.response.to.have.status(201);
    pm.expect(pm.response.status).to.equal("Created");
});
```

### Testing Response Body

```javascript
const jsonData = pm.response.json();

// Check property exists
pm.test("Has success property", function() {
    pm.expect(jsonData).to.have.property('success');
});

// Check property value
pm.test("Success is true", function() {
    pm.expect(jsonData.success).to.equal(true);
});

// Check nested property
pm.test("Has user data", function() {
    pm.expect(jsonData.data).to.have.property('user');
    pm.expect(jsonData.data.user).to.have.property('id');
});

// Check array
pm.test("Returns array of items", function() {
    pm.expect(jsonData.data.logs).to.be.an('array');
    pm.expect(jsonData.data.logs).to.have.lengthOf.at.least(1);
});

// Check array contents
pm.test("Each log has required fields", function() {
    jsonData.data.logs.forEach(function(log) {
        pm.expect(log).to.have.all.keys('id', 'logDate', 'weightKg');
    });
});
```

### Testing Field Types

```javascript
const jsonData = pm.response.json();

// String
pm.test("Email is string", function() {
    pm.expect(jsonData.data.email).to.be.a('string');
});

// Number
pm.test("BMI is number", function() {
    pm.expect(jsonData.data.bmi).to.be.a('number');
});

// Boolean
pm.test("hasProfile is boolean", function() {
    pm.expect(jsonData.data.hasProfile).to.be.a('boolean');
});

// Object
pm.test("User is object", function() {
    pm.expect(jsonData.data.user).to.be.an('object');
});

// Array
pm.test("Logs is array", function() {
    pm.expect(jsonData.data.logs).to.be.an('array');
});

// Not null/undefined
pm.test("ID exists", function() {
    pm.expect(jsonData.data.id).to.exist;
    pm.expect(jsonData.data.id).to.not.be.null;
});
```

### Testing Field Values

```javascript
const jsonData = pm.response.json();

// Exact match
pm.test("Token type is Bearer", function() {
    pm.expect(jsonData.data.tokenType).to.equal('Bearer');
});

// Contains substring
pm.test("Email contains @", function() {
    pm.expect(jsonData.data.email).to.include('@');
});

// Matches regex
pm.test("ID is CUID format", function() {
    pm.expect(jsonData.data.id).to.match(/^c[a-z0-9]{24}$/);
});

// Number comparisons
pm.test("BMI in healthy range", function() {
    pm.expect(jsonData.data.bmi).to.be.at.least(18.5);
    pm.expect(jsonData.data.bmi).to.be.at.most(40);
});

// Date validation
pm.test("Created date is valid ISO", function() {
    const date = new Date(jsonData.data.createdAt);
    pm.expect(date.toString()).to.not.equal('Invalid Date');
});
```

### Testing Headers

```javascript
// Check header exists
pm.test("Has Content-Type header", function() {
    pm.response.to.have.header('Content-Type');
});

// Check header value
pm.test("Content-Type is JSON", function() {
    pm.expect(pm.response.headers.get('Content-Type')).to.include('application/json');
});

// Check multiple headers
pm.test("Security headers present", function() {
    pm.response.to.have.header('X-Content-Type-Options');
    pm.response.to.have.header('X-Frame-Options');
});

// CORS headers
pm.test("CORS headers set", function() {
    pm.response.to.have.header('Access-Control-Allow-Origin');
});
```

### Testing Cookies

```javascript
// Check cookie exists
pm.test("Session cookie set", function() {
    pm.expect(pm.cookies.has('session')).to.be.true;
});

// Check cookie value
pm.test("Session cookie has value", function() {
    const sessionCookie = pm.cookies.get('session');
    pm.expect(sessionCookie).to.exist;
    pm.expect(sessionCookie).to.not.be.empty;
});

// Check cookie properties (in response headers)
pm.test("Cookie has HttpOnly flag", function() {
    const setCookie = pm.response.headers.get('Set-Cookie');
    pm.expect(setCookie).to.include('HttpOnly');
});

// Check Secure flag
pm.test("Cookie is secure", function() {
    const setCookie = pm.response.headers.get('Set-Cookie');
    pm.expect(setCookie).to.include('Secure');
});
```

### Testing Response Time

```javascript
// Under threshold
pm.test("Response time < 500ms", function() {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

// Reasonable range
pm.test("Response time acceptable", function() {
    pm.expect(pm.response.responseTime).to.be.within(0, 2000);
});
```

### Testing Error Responses

```javascript
// Check error structure
pm.test("Error response has correct format", function() {
    const jsonData = pm.response.json();
    pm.expect(jsonData.success).to.equal(false);
    pm.expect(jsonData.error).to.be.an('object');
    pm.expect(jsonData.error).to.have.property('message');
});

// Check specific error
pm.test("Returns validation error", function() {
    const jsonData = pm.response.json();
    pm.expect(pm.response.code).to.equal(400);
    pm.expect(jsonData.error.code).to.equal('VALIDATION_ERROR');
});

// Check error message content
pm.test("Error mentions required field", function() {
    const jsonData = pm.response.json();
    pm.expect(jsonData.error.message.toLowerCase()).to.include('email');
});
```

### Saving Values for Later Requests

```javascript
// Save token after login
pm.test("Save access token", function() {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data.accessToken).to.exist;
    pm.collectionVariables.set("accessToken", jsonData.data.accessToken);
});

// Save ID for cleanup
pm.test("Save created ID", function() {
    const jsonData = pm.response.json();
    pm.collectionVariables.set("createdId", jsonData.data.id);
});

// Save multiple values
pm.test("Save user data", function() {
    const jsonData = pm.response.json();
    const user = jsonData.data.user;
    pm.collectionVariables.set("userId", user.id);
    pm.collectionVariables.set("userEmail", user.email);
});
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Start server
        run: npm run start &
        env:
          DATABASE_URL: file:./test.db
          JWT_SECRET: test-secret

      - name: Wait for server
        run: npx wait-on http://localhost:3000/api/health

      - name: Run API tests
        run: npx newman run postman/csiro-diet-api.postman_collection.json -r cli,junit --reporter-junit-export results.xml

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: results.xml
```

### Docker Example

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
RUN npm install -g newman

COPY . .

CMD ["newman", "run", "postman/collection.json", "-r", "cli,json"]
```

---

## Real Examples from This Project

### Our Collection Structure

```
postman/csiro-diet-api.postman_collection.json
├── Health Check (3 requests)
│   ├── GET /api/health
│   ├── GET /api/health/live
│   └── GET /api/health/ready
├── Authentication (2 requests)
│   ├── POST /api/auth/google
│   └── GET /api/auth/me
├── User Profile (3 requests)
│   ├── POST /api/users/profile
│   ├── GET /api/users/profile
│   └── PATCH /api/users/profile
├── Calculator (1 request)
│   └── GET /api/calculator/metrics
├── Weight Tracking (5 requests)
│   ├── POST /api/tracking/weight (logDate optional, defaults to today)
│   ├── GET /api/tracking/weight
│   ├── GET /api/tracking/weight/today
│   ├── GET /api/tracking/weight/:date
│   └── DELETE /api/tracking/weight/:date
├── Glucose Tracking (5 requests)
│   ├── POST /api/tracking/glucose (logDate/readingTime optional)
│   ├── GET /api/tracking/glucose
│   ├── GET /api/tracking/glucose/today
│   ├── GET /api/tracking/glucose/:date
│   └── DELETE /api/tracking/glucose/:id
└── Error Cases (6 requests)
```

### Running Our Tests

```bash
# Run all tests
npm run test:api

# Or directly with Newman
npx newman run postman/csiro-diet-api.postman_collection.json

# With detailed output
npx newman run postman/csiro-diet-api.postman_collection.json -r cli --reporter-cli-show-timestamps
```

### Sample Test Output

```
→ Register New User
  POST http://localhost:3000/api/auth/register [201 Created, 524B, 156ms]
  ✓ Status is 201 Created
  ✓ Has success true
  ✓ Has access token
  ✓ Has user object
  ✓ User has email

┌─────────────────────────┬──────────────────┬──────────────────┐
│                         │         executed │           failed │
├─────────────────────────┼──────────────────┼──────────────────┤
│              iterations │                1 │                0 │
├─────────────────────────┼──────────────────┼──────────────────┤
│                requests │               25 │                0 │
├─────────────────────────┼──────────────────┼──────────────────┤
│            test-scripts │               47 │                0 │
├─────────────────────────┼──────────────────┼──────────────────┤
│      prerequest-scripts │               29 │                0 │
├─────────────────────────┼──────────────────┼──────────────────┤
│              assertions │               54 │                0 │
├─────────────────────────┼──────────────────┼──────────────────┤
│ total run duration: 2.1s
└─────────────────────────┴──────────────────┴──────────────────┘
```

---

## References

- [Postman Learning Center](https://learning.postman.com/docs/introduction/overview/)
- [Postman Test Scripts](https://learning.postman.com/docs/tests-and-scripts/write-scripts/test-scripts/)
- [pm.* API Reference](https://learning.postman.com/docs/tests-and-scripts/write-scripts/postman-sandbox-api-reference/)
- [ChaiJS BDD Assertions](https://www.chaijs.com/api/bdd/)
- [Newman CLI Documentation](https://learning.postman.com/docs/collections/using-newman-cli/command-line-integration-with-newman/)
- [Newman Reporters](https://learning.postman.com/docs/collections/using-newman-cli/newman-built-in-reporters/)
- [Collection Format Schema](https://schema.postman.com/collection/json/v2.1.0/draft-07/collection.json)

---

*Last Updated: January 22, 2026*
*For: CSIRO Low-Carb Diet App - MVP-0*
*Changes: Added /today endpoints, calculator endpoint, updated authentication to Google OAuth*
