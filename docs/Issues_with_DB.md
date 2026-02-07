# Issues Identified with DB

This document outlines key issues discovered after deployment, their root causes, evidence, resolution steps, and preventive measures to ensure stable operation in the future. It covers database connectivity, missing tables, seed data issues, and best practices for Prisma migrations and AWS RDS configurations.

---

## 1. DB Connection Failure

### Overview

The EC2 instance was able to connect to the PostgreSQL database directly using a simple Node.js script, but the NestJS application, which uses Prisma as the ORM, was unable to establish a connection. This discrepancy highlighted a configuration or environment-specific issue affecting Prisma's connection handling in production.

### Root Cause

The issue was traced to SSL verification failure. AWS RDS Postgres instances enforce SSL connections by default. Without proper SSL configuration or CA certificates, Prisma connections from NestJS fail, even though simple `pg` scripts may succeed if SSL validation is bypassed.

### Evidence

Tested with the following Node.js script on the EC2 instance:

```javascript
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
  host:
    process.env.DB_HOST ||
    'diet-app-db.cf60q04uu402.ap-southeast-2.rds.amazonaws.com',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  database: process.env.DB_NAME || 'diet_management',
  user: process.env.DB_USER || 'dietapp',
  password: process.env.DB_PASSWORD || 'XXXXXXX',
  ssl: {
    rejectUnauthorized: false, // For testing; production requires the CA bundle
    // ca: fs.readFileSync(path.resolve(__dirname, 'certs/global-bundle.pem')).toString(),
  },
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to Postgres!');

    const versionRes = await client.query('SELECT version()');
    console.log('Postgres version:', versionRes.rows[0].version);

    const res = await client.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_type='BASE TABLE'
      ORDER BY table_schema, table_name;
    `);
    console.table(res.rows);
  } catch (err) {
    console.error('Database error:', err);
  } finally {
    await client.end();
    console.log('Disconnected.');
  }
}

main().catch(console.error);
```

**Output:** The script successfully connected to the database and listed all tables in all schemas, confirming network access and credentials were correct.

In `src/database/prisma.service.ts`, the Prisma adapter was updated to:

```javascript
const connectionString = process.env.DATABASE_URL;
const adapter = new adapter_pg_1.PrismaPg({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
super({ adapter, log: ['query', 'info', 'warn', 'error'] });
```

**Result:** NestJS application could connect to the database, but proper SSL verification was still necessary for production environments.

### Resolution

- AWS RDS requires SSL connections for secure communication.
- Download the RDS root CA bundle (`global-bundle.pem`) from: [AWS RDS SSL Certificates](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL.html)
- Update Prisma adapter to use SSL with the CA:

```javascript
ssl: {
  rejectUnauthorized: true,
  ca: fs.readFileSync('./certs/global-bundle.pem').toString(),
}
```

### Next Steps / Preventive Measures

- Ensure the CA bundle is included in production `.env` and adapter configuration.
- Verify connections after deployment using scripts that list tables and query DB version.
- Regularly update the CA bundle if AWS rotates certificates.

---

## 2. Unable to Find Tables

### Overview

Upon logging into the application, tables such as `users` were missing. `_prisma_migrations` exists in the database, but application tables were absent, even after executing `npx prisma migrate deploy`.

### Root Cause

- Initial migrations did not create application tables.
- This can occur when `prisma migrate dev` is not run locally to generate full migration SQL, or if `db push` was skipped during initial setup.
- Migration files existed but were not applied correctly in production.

### Evidence

Using the Node.js script above, querying `information_schema.tables` returned only `_prisma_migrations`, confirming that application tables were missing.

### Resolution

- Execute the following in the Docker container to synchronize the database schema:

```bash
npx prisma db push
```

- Verified tables were successfully created using the same Node.js script.

### Next Steps / Preventive Measures

- For a fresh database, generate an initial migration capturing all models:

```bash
npx prisma migrate dev --name init
```

- Commit migration folders to source control.
- Deploy to production using:

```bash
npx prisma migrate deploy
```

- Future changes must follow the workflow: update `schema.prisma` → generate migration → commit → deploy.
- Use `db push` only for emergency fixes in production; otherwise rely on migrations for schema changes.

---

## 3. No Seed Data

### Overview

Seed data is missing because:

- `prisma/seed.ts` is Docker ignored.
- Seed data was never inserted into the AWS RDS instance.

**Impact:** Without seed data, no users exist in the system. Role-based access (e.g., admin permissions) cannot be verified, and it is impossible to test functionality tied to specific user roles.

### Root Cause

- Seed script excluded from Docker builds.
- Seed data was not applied during deployment.

### Resolution

- Ensure `prisma/seed.ts` is included in Docker builds.
- Run seeds on the database:

```bash
npx prisma db seed
```

### Next Steps / Preventive Measures

- Maintain seed scripts for production deployment.
- Ensure scripts are idempotent to prevent duplicates.
- Automate seed execution immediately after migrations during deployment.

---

## 4. Best Practices Summary

1. **Database SSL:**
   - Always use AWS RDS CA bundle for production connections.
   - Test SSL connections after deployment.

2. **Prisma Migrations:**
   - Generate initial migration locally (`migrate dev`).
   - Commit migration folders to source control.
   - Deploy using `migrate deploy`.
   - Future schema changes → generate new migration → deploy.

3. **Emergency Fixes:**
   - `db push` can sync schema in emergency scenarios but should not replace migrations in production.

4. **Seed Data:**
   - Include seed scripts and ensure idempotency.
   - Run seeds after migrations to ensure users and roles exist.

5. **Verification Scripts:**
   - Maintain Node.js scripts for verifying DB connectivity, table existence, and schema consistency post-deployment.
