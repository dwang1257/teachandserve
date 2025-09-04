# Database Security Configuration

## Overview
This document outlines the security measures implemented for the TeachAndServe PostgreSQL database.

## Database Details
- **Database Name**: `teachandserve_secure`
- **Application User**: `teachandserve_app`
- **Connection Limit**: 50 concurrent connections
- **Encoding**: UTF-8
- **Security Extensions**: pgcrypto

## Security Features Implemented

### 1. Dedicated Application User
- Created `teachandserve_app` user with minimal required privileges
- Encrypted password with strong complexity
- No superuser or administrative privileges

### 2. Database-Level Security
- Row-level security enabled
- Connection limits enforced
- SSL connections required in production
- Audit logging table created for user actions

### 3. Permission Model
```sql
-- Application user permissions:
- CONNECT on database
- USAGE on public schema
- CREATE on public schema (for Hibernate DDL)
- USAGE, SELECT on sequences (for auto-increment)

-- Additional roles created:
- teachandserve_readonly: Read-only access for reporting
- teachandserve_backup: Backup operations only
```

### 4. Audit Logging
- All user actions logged to `user_audit_log` table
- Includes: user_id, action, details (JSON), IP address, user agent, timestamp
- Indexed for performance

### 5. Connection Security
- Connection pooling with HikariCP
- Connection timeouts configured
- Maximum pool size limits

## Configuration Files

### Development (`application.properties`)
- Uses PostgreSQL with secure credentials
- DDL auto-update enabled for development
- SQL logging enabled for debugging

### Production (`application-prod.properties`)
- SSL required for connections
- DDL validation only (no auto-updates)
- Minimal logging for security
- Environment variable support for secrets

## Security Best Practices Implemented

1. **Principle of Least Privilege**: Application user has only necessary permissions
2. **Defense in Depth**: Multiple security layers (connection, database, application)
3. **Audit Trail**: Complete logging of database operations
4. **Secure Communication**: SSL/TLS encryption for data in transit
5. **Access Control**: Role-based permissions with read-only and backup roles
6. **Resource Limits**: Connection and query limits to prevent abuse

## Environment Variables (Production)
```bash
DB_HOST=your-database-host
DB_PORT=5432
DB_NAME=teachandserve_secure
DB_USERNAME=teachandserve_app
DB_PASSWORD=TeachServe_2025_SecureDB!@#$
JWT_SECRET=your-jwt-secret-key
```

## Monitoring and Maintenance

### Regular Tasks
1. Monitor connection pool usage
2. Review audit logs for suspicious activity
3. Update passwords regularly
4. Monitor database performance
5. Regular security assessments

### Log Locations
- Database logs: PostgreSQL log directory
- Application logs: Spring Boot logs
- Audit logs: `user_audit_log` table

## Backup and Recovery
- Use `teachandserve_backup` role for backup operations
- Regular automated backups recommended
- Test restore procedures regularly

## Compliance Considerations
- GDPR: User data encryption and audit trails
- SOC 2: Access controls and monitoring
- HIPAA: If handling sensitive health data (not applicable for basic mentorship)

## Troubleshooting

### Common Issues
1. **Connection refused**: Check PostgreSQL service and firewall
2. **Permission denied**: Verify user permissions with `\du` in psql
3. **SSL errors**: Check SSL configuration in connection string

### Verification Commands
```sql
-- Check user permissions
SELECT * FROM information_schema.role_table_grants WHERE grantee = 'teachandserve_app';

-- Check audit log
SELECT * FROM user_audit_log ORDER BY timestamp DESC LIMIT 10;

-- Monitor connections
SELECT * FROM pg_stat_activity WHERE datname = 'teachandserve_secure';
```

## Security Updates
- Keep PostgreSQL updated to latest stable version
- Review and update security configurations quarterly
- Monitor security advisories for dependencies