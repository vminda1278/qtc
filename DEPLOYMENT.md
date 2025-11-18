# QwikTax Backend Deployment Instructions

## 🔐 Required Environment Variables

Before deploying, you MUST set these environment variables:

```bash
export GOOGLE_CLIENT_SECRET=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
export JWT_SECRET=this-is-my-vikas-stage-secret
```

## 🚀 Deployment Commands

### Deploy to vikas (development):
```bash
cd /Users/vikasminda/code/qtc
export GOOGLE_CLIENT_SECRET=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
export JWT_SECRET=this-is-my-vikas-stage-secret
serverless deploy --stage vikas
```

### Deploy to production:
```bash
cd /Users/vikasminda/code/qtc
export GOOGLE_CLIENT_SECRET_PROD=<your-prod-secret>
export JWT_SECRET=<strong-random-production-secret>
serverless deploy --stage prod
```

## 📝 Important Notes

1. **Never commit secrets to git** - They are now only in environment variables
2. **Keep .env file secure** - It's in .gitignore
3. **Use different secrets per stage** - Dev and prod should have different credentials

## 🔑 Where to Store Secrets Locally

Add to your `~/.zshrc` or `~/.bash_profile`:

```bash
# QwikTax Secrets
export GOOGLE_CLIENT_SECRET=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
export JWT_SECRET=this-is-my-vikas-stage-secret
```

Then reload:
```bash
source ~/.zshrc
```

## ⚠️ Security Best Practices

### For Production:
1. Use AWS Secrets Manager for GOOGLE_CLIENT_SECRET
2. Use strong random JWT_SECRET (64+ characters)
3. Rotate secrets regularly
4. Never share secrets via chat/email

### Generate Strong JWT Secret:
```bash
openssl rand -base64 48
```
