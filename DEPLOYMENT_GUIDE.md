# دليل النشر | Deployment Guide

## نظرة عامة

هذا الدليل يوضح كيفية نشر نظام إبراهيم للمحاسبة على مختلف المنصات السحابية.

## متطلبات ما قبل النشر

### 1. إعداد متغيرات البيئة
تأكد من وجود ملف `.env` في مجلد `client/`:

```env
VITE_SUPABASE_URL=https://imuequpezaixljuxljdn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltdWVxdXBlemFpeGxqdXhsamRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExOTI5MDEsImV4cCI6MjA3Njc2ODkwMX0.uuVPRX9J_QBzZmjWwv6uGaDAc1YRd7LjBTK0NVfRsHo
VITE_APP_TITLE=Ibrahim Accounting System
VITE_APP_LOGO=/logo.png
```

### 2. اختبار البناء محلياً
```bash
npm run build:production
```

## النشر على Netlify

### الطريقة الأولى: ربط GitHub

1. **إنشاء حساب Netlify**
   - اذهب إلى [netlify.com](https://netlify.com)
   - سجل دخولك أو أنشئ حساب جديد

2. **ربط المستودع**
   - اضغط على "New site from Git"
   - اختر "GitHub" كمصدر
   - اختر مستودع `systemibrahem-glitch/30`

3. **إعدادات البناء**
   ```
   Base directory: (اتركه فارغاً)
   Build command: npm run build:production
   Publish directory: client/dist
   ```

4. **متغيرات البيئة**
   - اذهب إلى Site settings > Environment variables
   - أضف المتغيرات التالية:
     ```
     VITE_SUPABASE_URL = https://imuequpezaixljuxljdn.supabase.co
     VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltdWVxdXBlemFpeGxqdXhsamRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExOTI5MDEsImV4cCI6MjA3Njc2ODkwMX0.uuVPRX9J_QBzZmjWwv6uGaDAc1YRd7LjBTK0NVfRsHo
     VITE_APP_TITLE = Ibrahim Accounting System
     VITE_APP_LOGO = /logo.png
     ```

5. **النشر**
   - اضغط على "Deploy site"
   - انتظر حتى يكتمل البناء

### الطريقة الثانية: السحب والإفلات

1. **بناء المشروع محلياً**
   ```bash
   npm run build:production
   ```

2. **رفع مجلد dist**
   - اذهب إلى [netlify.com/drop](https://netlify.com/drop)
   - اسحب مجلد `client/dist` إلى المنطقة المخصصة

## النشر على Cloudflare Pages

### الطريقة الأولى: ربط GitHub

1. **إنشاء حساب Cloudflare**
   - اذهب إلى [dash.cloudflare.com](https://dash.cloudflare.com)
   - سجل دخولك أو أنشئ حساب جديد

2. **إنشاء مشروع جديد**
   - اذهب إلى Pages
   - اضغط على "Create a project"
   - اختر "Connect to Git"

3. **ربط المستودع**
   - اختر مستودع `systemibrahem-glitch/30`
   - اختر الفرع الرئيسي

4. **إعدادات البناء**
   ```
   Framework preset: Vite
   Build command: npm run build:production
   Build output directory: client/dist
   Root directory: (اتركه فارغاً)
   ```

5. **متغيرات البيئة**
   - أضف المتغيرات التالية:
     ```
     VITE_SUPABASE_URL = https://imuequpezaixljuxljdn.supabase.co
     VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltdWVxdXBlemFpeGxqdXhsamRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExOTI5MDEsImV4cCI6MjA3Njc2ODkwMX0.uuVPRX9J_QBzZmjWwv6uGaDAc1YRd7LjBTK0NVfRsHo
     VITE_APP_TITLE = Ibrahim Accounting System
     VITE_APP_LOGO = /logo.png
     ```

6. **النشر**
   - اضغط على "Save and Deploy"
   - انتظر حتى يكتمل البناء

### الطريقة الثانية: Wrangler CLI

1. **تثبيت Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **تسجيل الدخول**
   ```bash
   wrangler login
   ```

3. **النشر**
   ```bash
   npm run deploy:cloudflare
   ```

## النشر على Vercel

### الطريقة الأولى: ربط GitHub

1. **إنشاء حساب Vercel**
   - اذهب إلى [vercel.com](https://vercel.com)
   - سجل دخولك أو أنشئ حساب جديد

2. **استيراد المشروع**
   - اضغط على "New Project"
   - اختر مستودع `systemibrahem-glitch/30`

3. **إعدادات البناء**
   ```
   Framework Preset: Vite
   Root Directory: (اتركه فارغاً)
   Build Command: npm run build:production
   Output Directory: client/dist
   ```

4. **متغيرات البيئة**
   - أضف المتغيرات التالية:
     ```
     VITE_SUPABASE_URL = https://imuequpezaixljuxljdn.supabase.co
     VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltdWVxdXBlemFpeGxqdXhsamRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExOTI5MDEsImV4cCI6MjA3Njc2ODkwMX0.uuVPRX9J_QBzZmjWwv6uGaDAc1YRd7LjBTK0NVfRsHo
     VITE_APP_TITLE = Ibrahim Accounting System
     VITE_APP_LOGO = /logo.png
     ```

5. **النشر**
   - اضغط على "Deploy"
   - انتظر حتى يكتمل البناء

## النشر على GitHub Pages

### الطريقة الأولى: GitHub Actions

1. **إنشاء ملف Workflow**
   - أنشئ مجلد `.github/workflows` في جذر المشروع
   - أنشئ ملف `deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm run install-all
      
    - name: Build
      run: npm run build:production
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        VITE_APP_TITLE: Ibrahim Accounting System
        VITE_APP_LOGO: /logo.png
        
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./client/dist
```

2. **إعداد Secrets**
   - اذهب إلى Settings > Secrets and variables > Actions
   - أضف المتغيرات التالية:
     ```
     VITE_SUPABASE_URL
     VITE_SUPABASE_ANON_KEY
     ```

3. **تفعيل GitHub Pages**
   - اذهب إلى Settings > Pages
   - اختر Source: GitHub Actions

## استكشاف الأخطاء

### مشاكل شائعة وحلولها

#### 1. خطأ في البناء
```bash
Error: Could not read package.json
```
**الحل**: تأكد من وجود ملف `package.json` في المجلد الرئيسي

#### 2. خطأ في متغيرات البيئة
```bash
Error: Environment variable not found
```
**الحل**: تأكد من إضافة جميع متغيرات البيئة المطلوبة

#### 3. خطأ في المسارات
```bash
Error: Cannot find module
```
**الحل**: تأكد من صحة مسارات الاستيراد

#### 4. خطأ في التبعيات
```bash
Error: ERESOLVE unable to resolve dependency tree
```
**الحل**: استخدم `npm install --legacy-peer-deps`

### اختبار النشر

#### 1. اختبار محلي
```bash
npm run build:production
npm run start
```

#### 2. اختبار الإنتاج
- افتح الموقع المنشور
- تأكد من عمل جميع الوظائف
- اختبر الاستجابة على أجهزة مختلفة

## الصيانة والتحديثات

### التحديثات التلقائية
- Netlify: تحديث تلقائي عند الدفع إلى GitHub
- Cloudflare: تحديث تلقائي عند الدفع إلى GitHub
- Vercel: تحديث تلقائي عند الدفع إلى GitHub

### النسخ الاحتياطي
- تأكد من وجود نسخة احتياطية من الكود على GitHub
- احتفظ بنسخة احتياطية من قاعدة البيانات
- وثق جميع التغييرات

### المراقبة
- راقب أداء الموقع
- تتبع الأخطاء
- راقب استخدام الموارد

## الدعم

إذا واجهت أي مشاكل في النشر، يرجى التواصل معنا:

- **البريد الإلكتروني**: systemibrahem@gmail.com
- **الهاتف**: +963 994 054 027
- **WhatsApp**: [اضغط هنا للتواصل](https://wa.me/963994054027)

---

**نظام إبراهيم للمحاسبة** - دليل النشر الشامل 🚀