# 🛡️ Security Guidelines for PoEP

## 🚨 Critical Security Rules

### 1. **NEVER Commit Secrets**
- ✅ **DO**: Use environment variables for all sensitive data
- ❌ **DON'T**: Commit private keys, API keys, or secrets to git
- ✅ **DO**: Use `.env` files (already in `.gitignore`)
- ❌ **DON'T**: Hard-code credentials in source code

### 2. **Private Key Management**
```bash
# ✅ GOOD: Environment variable
PRIVATE_KEY="${YOUR_SECURE_PRIVATE_KEY}"

# ❌ BAD: Hard-coded in source
const privateKey = "0x1234567890abcdef..."; // NEVER DO THIS
```

### 3. **Environment Files**
- **Development**: Use `.env.local` (ignored by git)
- **Production**: Use secrets management (Vercel, AWS, etc.)
- **Never**: Commit any `.env*` files with real credentials

## 🔐 Secrets Management

### Development
```bash
# Copy example and fill with your values
cp .env.example .env.local

# Add your credentials (this file is git-ignored)
echo "PRIVATE_KEY=0x..." >> .env.local
```

### Production Deployment
Use platform-specific secrets management:

#### Vercel
```bash
vercel env add PRIVATE_KEY
vercel env add NEXT_PUBLIC_POEP_CONTRACT_ADDRESS
```

#### AWS
```bash
aws secretsmanager create-secret --name "poep/private-key" --secret-string "0x..."
```

#### Docker
```bash
docker run -e PRIVATE_KEY="${PRIVATE_KEY}" your-app
```

## 🚦 Git Security

### Pre-commit Hook
A pre-commit hook is configured to scan for secrets:
```bash
# The hook will block commits containing:
- Private keys (64-character hex strings)
- API keys and tokens
- Passwords and secrets
- Dangerous filenames (.env, private-key, etc.)
```

### Bypass Warning
```bash
# Only use in emergencies - NOT RECOMMENDED
git commit --no-verify
```

## 🔑 Private Key Security

### Generation
```bash
# Generate new secure private key
node -e "console.log(require('ethers').Wallet.createRandom().privateKey)"
```

### Storage Best Practices
1. **Hardware Wallets**: For high-value operations
2. **Environment Variables**: For development
3. **Secrets Managers**: For production
4. **Key Rotation**: Change keys regularly
5. **Access Control**: Limit who has access

### What NOT to do
- ❌ Store in source code
- ❌ Share via chat/email
- ❌ Write in documentation
- ❌ Use weak/predictable keys
- ❌ Reuse across environments

## 🏗️ Contract Security

### Ownership Management
```solidity
// Ensure proper ownership transfer
function transferOwnership(address newOwner) public onlyOwner {
    require(newOwner != address(0), "Invalid address");
    _transferOwnership(newOwner);
}
```

### Emergency Procedures
If private key is compromised:
1. **Immediately** generate new private key
2. **Transfer** any remaining funds to secure address
3. **Deploy** new contracts with secure ownership
4. **Update** all environment configurations
5. **Rotate** all API keys and secrets

## 🚀 Deployment Security

### Pre-deployment Checklist
- [ ] All secrets are in environment variables
- [ ] No hard-coded credentials in code
- [ ] Private keys are secure and funded
- [ ] Contract ownership is verified
- [ ] API keys are valid and rotated

### Post-deployment
- [ ] Verify contract ownership
- [ ] Test all functionality
- [ ] Monitor for unusual activity
- [ ] Set up alerts for contract interactions

## 📋 Security Audit Checklist

### Code Review
- [ ] No secrets in source code
- [ ] All `.env*` files in `.gitignore`
- [ ] Pre-commit hooks configured
- [ ] Proper error handling (don't leak sensitive info)

### Infrastructure
- [ ] Secrets stored securely
- [ ] Access controls in place
- [ ] Monitoring and alerting configured
- [ ] Backup and recovery procedures documented

### Operational
- [ ] Key rotation schedule defined
- [ ] Incident response plan ready
- [ ] Team trained on security practices
- [ ] Regular security audits scheduled

## 🚨 Incident Response

### If Credentials are Compromised
1. **STOP** - Don't panic, but act quickly
2. **SECURE** - Generate new credentials immediately
3. **TRANSFER** - Move funds to secure addresses
4. **ROTATE** - Change all related API keys
5. **DEPLOY** - Deploy new contracts if needed
6. **DOCUMENT** - Record incident for learning

### Emergency Contacts
- Development Team: [Your contact info]
- Security Team: [Security contact]
- Infrastructure: [Infra contact]

## 📚 Additional Resources

- [OWASP Secrets Management](https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_cryptographic_keys)
- [Git Security Best Practices](https://git-scm.com/book/en/v2/Git-Tools-Signing-Your-Work)
- [Ethereum Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

---

**Remember: Security is everyone's responsibility!** 🛡️

If you discover a security vulnerability, please report it immediately to the development team.