#  Security Deployment Checklist

Quick reference untuk memastikan sistem BEM aman sebelum deployment.

---

##  PRE-DEPLOYMENT CHECKLIST

###  Environment & Configuration

- [ ] **Set `NODE_ENV=production`**
  ```bash
  NODE_ENV=production
  ```

- [ ] **Generate strong `NEXTAUTH_SECRET`** (min 32 characters random)
  ```bash
  # Generate dengan OpenSSL
  openssl rand -base64 32
  ```
  ```env
  NEXTAUTH_SECRET="your-strong-random-secret-here"
  ```

- [ ] **Database URL dengan SSL mode**
  ```env
  DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
  ```

- [ ] **Configure HTTPS/TLS certificate**
  - Vercel/Netlify: Automatic
  - Custom server: Let's Encrypt atau commercial cert

- [ ] **Review semua environment variables**
  -  No secrets hardcoded in code
  -  All sensitive data in `.env`
  -  `.env` ada di `.gitignore`

###  Security Features

- [ ] **Verify security headers active**
  ```bash
  curl -I https://your-domain.com | grep -E "X-Frame|Content-Security|Strict-Transport"
  ```
  Expected:
  - `X-Frame-Options: DENY`
  - `Content-Security-Policy: ...`
  - `Strict-Transport-Security: max-age=31536000`

- [ ] **Test JWT authentication**
  ```bash
  # Access protected route without JWT
  curl https://your-domain.com/dashboard/admin
  # Should redirect to /login
  ```

- [ ] **Verify API protection**
  ```bash
  curl https://your-domain.com/api/me
  # Should return 401 Unauthorized
  ```

- [ ] **Test rate limiting**
  ```bash
  # Send 11 rapid requests to login
  for i in {1..11}; do curl -X POST https://your-domain.com/api/login/admin \
    -H "Content-Type: application/json" \
    -d '{"username":"test","token":"invalid"}'; done
  # Should get 429 Too Many Requests
  ```

- [ ] **Confirm role cookie is NOT used**
  ```bash
  # Check middleware.ts - should NOT have:
  # role = req.cookies.get("role")?.value
  ```

###  Code Review

- [ ] **No plain passwords in code**
  ```bash
  grep -r "password.*=.*['\"]" --exclude-dir=node_modules
  # Should return nothing sensitive
  ```

- [ ] **No API keys in code**
  ```bash
  grep -r "API_KEY.*=.*['\"]" --exclude-dir=node_modules
  # Should return nothing
  ```

- [ ] **No TODO/FIXME security comments**
  ```bash
  grep -r "TODO.*security\|FIXME.*auth" --exclude-dir=node_modules
  ```

###  Dependencies

- [ ] **Run dependency audit**
  ```bash
  npm audit
  npm audit fix
  ```

- [ ] **Update critical packages**
  ```bash
  npm outdated
  npm update
  ```

- [ ] **Check for known vulnerabilities**
  ```bash
  npx snyk test
  # atau
  npm audit --audit-level=moderate
  ```

###  Testing

- [ ] **Run security test suite**
  ```bash
  node test-security.js
  # All tests should pass
  ```

- [ ] **Manual testing**
  - [ ] Login dengan credentials valid → Success
  - [ ] Login dengan credentials invalid → Failed
  - [ ] Access admin route sebagai mahasiswa → Redirect
  - [ ] Manipulasi cookie role → Tidak berpengaruh
  - [ ] JWT expired → Redirect to login

###  Logging & Monitoring

- [ ] **Setup error logging service**
  - [ ] Sentry / LogRocket / Datadog
  - [ ] Configure error reporting

- [ ] **Enable audit logging**
  ```typescript
  // Verify LogAktivitas table exists
  // Check logger.ts is imported in all critical routes
  ```

- [ ] **Setup alerting**
  - [ ] Alert on multiple failed logins
  - [ ] Alert on rate limit violations
  - [ ] Alert on 500 errors

###  Database

- [ ] **Database backup configured**
  - [ ] Automatic daily backups
  - [ ] Test restore procedure

- [ ] **Database connection pooling**
  ```typescript
  // Check prisma client config
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }
  ```

- [ ] **Database user has minimal privileges**
  -  NOT root/superuser
  -  Only CRUD on specific tables

---

##  DEPLOYMENT STEPS

### 1. Pre-Deployment

```bash
# 1. Run all checks above
# 2. Create production build
npm run build

# 3. Test production build locally
npm run start

# 4. Run security tests
node test-security.js
```

### 2. Deployment

```bash
# Vercel (recommended)
vercel --prod

# atau manual
git push origin main
# (CI/CD akan handle deployment)
```

### 3. Post-Deployment Verification

```bash
# Test endpoints
curl -I https://your-domain.com
curl -I https://your-domain.com/dashboard/admin
curl https://your-domain.com/api/me

# Check security headers
curl -I https://your-domain.com | grep -i "security\|frame\|content-security"

# Test rate limiting
for i in {1..11}; do 
  curl -s -o /dev/null -w "%{http_code}\n" \
    https://your-domain.com/api/login/admin \
    -X POST -H "Content-Type: application/json" \
    -d '{"username":"test","token":"test"}'
done
```

---

##  CRITICAL SECURITY CHECKLIST

**MUST HAVE before going live:**

- [ ] ✅ JWT authentication implemented & tested
- [ ] ✅ Role cookie fallback REMOVED
- [ ] ✅ API routes protected
- [ ] ✅ Security headers configured
- [ ] ✅ HTTPS enabled
- [ ] ✅ Rate limiting active
- [ ] ✅ No secrets in code
- [ ] ✅ Strong NEXTAUTH_SECRET set
- [ ] ✅ Audit logging enabled
- [ ] ✅ Database backups configured

**If ANY of these are NOT checked, DO NOT deploy to production!**

---

##  REGULAR MAINTENANCE (Post-Deployment)

### Weekly
- [ ] Review failed login attempts in audit logs
- [ ] Check error logs for suspicious activity

### Monthly
- [ ] Run `npm audit` dan fix vulnerabilities
- [ ] Review access logs untuk unusual patterns
- [ ] Update dependencies (`npm update`)

### Quarterly
- [ ] Rotate JWT secret (coordinate with team)
- [ ] Review and revoke unused admin tokens
- [ ] Security assessment dengan external tools
- [ ] Review audit logs untuk compliance

### Annually
- [ ] Full security audit
- [ ] Penetration testing (if budget allows)
- [ ] Update security documentation
- [ ] Security training untuk admin team

---

##  INCIDENT RESPONSE

### Jika terjadi security breach:

1. **Immediate Actions** (within 1 hour)
   - [ ] Revoke semua JWT tokens (rotate NEXTAUTH_SECRET)
   - [ ] Revoke semua admin access tokens
   - [ ] Enable maintenance mode
   - [ ] Preserve logs untuk forensics

2. **Investigation** (within 24 hours)
   - [ ] Review audit logs
   - [ ] Identify breach vector
   - [ ] Assess data compromise
   - [ ] Document timeline

3. **Remediation** (within 48 hours)
   - [ ] Fix vulnerability
   - [ ] Deploy hotfix
   - [ ] Test thoroughly
   - [ ] Monitor closely

4. **Communication** (as needed)
   - [ ] Notify affected users
   - [ ] Report to authorities (if required)
   - [ ] Public statement (if needed)

---

##  SECURITY CONTACTS

- **Technical Lead**: [email]
- **Security Officer**: [email]
- **Emergency Contact**: [phone]

---

##  REFERENCE LINKS

- **Security Documentation**: `SECURITY.md`
- **Vulnerability Findings**: `SECURITY-FINDINGS-TA.md`
- **Test Suite**: `test-security.js`
- **OWASP Top 10**: https://owasp.org/Top10/

---

**Last Updated**: 2025-01-XX  
**Maintained by**: Tim Keamanan BEM  
**Version**: 1.0.0

---

##  SIGN-OFF

**Deployment Approval** (harus ditandatangani sebelum production deployment):

```
Developer: _________________ Date: _______
Reviewer:  _________________ Date: _______
Lead:      _________________ Date: _______
```

**All critical checks completed**: [ ] YES [ ] NO

**Ready for production**: [ ] YES [ ] NO

---

**END OF CHECKLIST**