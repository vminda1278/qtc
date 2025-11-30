# Production Error Fixes - November 30, 2025

## 🐛 Issues Identified

### Issue #1: 404 Error - `/v1/admin/getPublishedSiteSettings`
**Error Message:**
```
Failed to load resource: the server responded with a status of 404 ()
api.qwiktax.in/v1/admin/getPublishedSiteSettings:1
```

**Root Cause:**
- Frontend calls: `/v1/admin/getPublishedSiteSettings`
- Backend endpoint: `/v1/admin/getLiveSiteSettings`
- **Endpoint name mismatch!**

### Issue #2: 500 Error - S3 Upload Failed
**Error Message:**
```
Failed to load resource: the server responded with a status of 500 ()
[Upload API] Error uploading image: Error: Failed to upload file to S3
api.qwiktax.in/v1/upload/image:1
```

**Root Cause:**
- `serverless.yml` sets environment variable: `S3_ASSETS_BUCKET`
- `s3.js` looks for: `S3_BUCKET_NAME`
- **Environment variable name mismatch!**

---

## ✅ Fixes Applied

### Fix #1: Added Endpoint Alias

**File:** `/qtc/controller/admin-controller.js`

**Change:**
```javascript
// Before
adminRouter.get('/getLiveSiteSettings', getLiveSiteSettings);

// After
adminRouter.get('/getLiveSiteSettings', getLiveSiteSettings);
// Alias for backward compatibility - frontend calls it "getPublishedSiteSettings"
adminRouter.get('/getPublishedSiteSettings', getLiveSiteSettings);
```

**Result:** Both endpoints now work:
- `/v1/admin/getLiveSiteSettings` ✅
- `/v1/admin/getPublishedSiteSettings` ✅

---

### Fix #2: Fixed S3 Environment Variable

**File:** `/qtc/utility/s3.js`

**Change:**
```javascript
// Before
const S3_BUCKET = process.env.S3_BUCKET_NAME || 'qwiktax-assets';

// After
// Support both S3_ASSETS_BUCKET (from serverless.yml) and S3_BUCKET_NAME (fallback)
const S3_BUCKET = process.env.S3_ASSETS_BUCKET || process.env.S3_BUCKET_NAME || 'qwiktax-assets-prod';
```

**Result:** Lambda will now correctly read the S3 bucket name from environment

---

### Fix #3: Enhanced Error Logging

**File:** `/qtc/utility/s3.js`

**Added:**
```javascript
console.log('[S3] Starting upload:', {
    bucket: S3_BUCKET,
    fileName,
    folder,
    mimeType,
    region: process.env.AWS_REGION || 'us-east-1'
});

// ... upload logic ...

console.error('[S3] Upload error:', {
    message: error.message,
    code: error.code,
    bucket: S3_BUCKET,
    region: process.env.AWS_REGION,
    error: error
});
throw new Error(`Failed to upload file to S3: ${error.message}`);
```

**Result:** Better debugging information for S3 upload failures

---

### Fix #4: Added S3 Bucket Policy

**File:** `/qtc/serverless.yml`

**Added:**
```yaml
# S3 Bucket Policy for public read access to assets
S3AssetsBucketPolicy:
  Type: AWS::S3::BucketPolicy
  Properties:
    Bucket:
      Ref: S3AssetsBucket
    PolicyDocument:
      Statement:
        - Sid: PublicReadGetObject
          Effect: Allow
          Principal: '*'
          Action:
            - 's3:GetObject'
          Resource:
            Fn::Join:
              - ''
              - - 'arn:aws:s3:::'
                - Ref: S3AssetsBucket
                - '/*'
```

**Result:** Uploaded files will be publicly readable (required for images, logos, etc.)

---

## 🚀 Deployment Steps

### 1. Deploy Backend to Production

```bash
cd /Users/vikasminda/code/qtc
sls deploy --stage prod
```

This will:
- ✅ Deploy updated Lambda functions with new code
- ✅ Create S3 bucket policy for public read access
- ✅ Update environment variables

### 2. Verify Deployment

After deployment, test both endpoints:

**Test #1: Check Published Settings Endpoint**
```bash
curl -X GET https://api.qwiktax.in/v1/admin/getPublishedSiteSettings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected: `200 OK` response

**Test #2: Test Image Upload**
```bash
curl -X POST https://api.qwiktax.in/v1/upload/image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@test-image.jpg" \
  -F "folder=test"
```

Expected: `200 OK` with image URL in response

---

## 📊 Environment Variables Check

### Current Configuration in `serverless.yml`

```yaml
provider:
  environment:
    # S3 Bucket for assets
    S3_ASSETS_BUCKET:
      Ref: S3AssetsBucket
```

### What Lambda Receives

For `prod` stage:
- `S3_ASSETS_BUCKET` = `qwiktax-assets-prod`
- `AWS_REGION` = `us-east-1`

---

## 🔍 Debugging

### Check Lambda Environment Variables

1. Go to AWS Console → Lambda → qwiktax-prod-api
2. Configuration → Environment variables
3. Verify:
   - `S3_ASSETS_BUCKET` exists
   - `AWS_REGION` = `us-east-1`

### Check CloudWatch Logs

```bash
sls logs -f api --stage prod --tail
```

Look for:
- `[S3] Starting upload:` - Shows bucket name being used
- `[S3] File uploaded successfully:` - Successful uploads
- `[S3] Upload error:` - Detailed error information

### Check S3 Bucket Permissions

1. Go to AWS Console → S3 → qwiktax-assets-prod
2. Permissions → Bucket Policy
3. Verify policy allows public read (`s3:GetObject`)

---

## 📝 Testing Checklist

After deployment, verify:

- [ ] `/v1/admin/getPublishedSiteSettings` returns 200 (not 404)
- [ ] `/v1/admin/getLiveSiteSettings` still works
- [ ] Image upload to `/v1/upload/image` returns 200 (not 500)
- [ ] Uploaded image URL is publicly accessible
- [ ] Multiple images upload to `/v1/upload/images` works
- [ ] CloudWatch logs show `[S3] Starting upload:` with correct bucket name

---

## 🎯 Expected Results

### Before Fixes
```
❌ 404: /v1/admin/getPublishedSiteSettings
❌ 500: /v1/upload/image (Failed to upload file to S3)
```

### After Fixes
```
✅ 200: /v1/admin/getPublishedSiteSettings
✅ 200: /v1/admin/getLiveSiteSettings
✅ 200: /v1/upload/image (with image URL)
✅ 200: /v1/upload/images (with array of URLs)
```

---

## 🔐 Security Notes

### S3 Bucket Policy
- Allows **public read** access to all objects
- **Does NOT** allow public write/delete
- Required for: logos, team member photos, office images
- Safe because uploads are authenticated

### Lambda IAM Permissions
Already configured in `serverless.yml`:
```yaml
- Effect: "Allow" # S3 access for assets (logos, images)
  Action:
    - "s3:PutObject"
    - "s3:GetObject"
    - "s3:DeleteObject"
    - "s3:PutObjectAcl"
  Resource:
    - Fn::Join:
        - ""
        - - "arn:aws:s3:::"
          - Ref: S3AssetsBucket
          - "/*"
```

---

## 🐛 Troubleshooting

### If 404 Still Occurs

**Check routes are registered:**
```javascript
// In /qtc/app.js
app.use('/v1/admin', adminRouter);
```

**Check endpoint exists:**
```bash
curl https://api.qwiktax.in/v1/admin/getPublishedSiteSettings
```

### If 500 Still Occurs

**Check CloudWatch logs:**
```bash
sls logs -f api --stage prod --tail
```

**Look for:**
- `[S3] Starting upload:` with bucket name
- Error message with specific AWS error code

**Common Issues:**
1. **AccessDenied** - Lambda IAM role missing S3 permissions
2. **NoSuchBucket** - Bucket doesn't exist (check CloudFormation)
3. **InvalidAccessKeyId** - AWS credentials issue

### If Images Upload But Are Not Accessible

**Check bucket policy:**
```bash
aws s3api get-bucket-policy --bucket qwiktax-assets-prod
```

**Verify public access settings:**
```bash
aws s3api get-public-access-block --bucket qwiktax-assets-prod
```

Should show:
```json
{
  "BlockPublicAcls": false,
  "IgnorePublicAcls": false,
  "BlockPublicPolicy": false,
  "RestrictPublicBuckets": false
}
```

---

## 📚 Related Files

### Backend Files Modified
- ✅ `/qtc/controller/admin-controller.js` - Added endpoint alias
- ✅ `/qtc/utility/s3.js` - Fixed environment variable, added logging
- ✅ `/qtc/serverless.yml` - Added S3 bucket policy

### Frontend Files (No Changes Needed)
- `/qtui/app/admin/layout.jsx` - Calls getPublishedSiteSettings
- `/qtui/lib/api/upload-api.js` - Calls upload/image

---

## 🎉 Summary

**Root Causes:**
1. Endpoint name mismatch (Published vs Live)
2. Environment variable name mismatch (S3_ASSETS_BUCKET vs S3_BUCKET_NAME)
3. Missing S3 bucket policy for public read

**Fixes Applied:**
1. ✅ Added endpoint alias for backward compatibility
2. ✅ Updated S3 utility to check correct environment variable
3. ✅ Added enhanced error logging for debugging
4. ✅ Added S3 bucket policy for public read access

**Next Step:**
Deploy to production with `sls deploy --stage prod`

---

*Last Updated: November 30, 2025*
*Status: Ready for deployment*
