# تعليمات نشر نظام إبراهيم للمحاسبة على Netlify

## المتطلبات المسبقة

1. حساب Netlify نشط
2. Node.js 18+ مثبت
3. Git repository على GitHub

## خطوات النشر على Netlify

### 1. ربط المستودع مع Netlify

1. اذهب إلى [Netlify Dashboard](https://app.netlify.com/)
2. اضغط على "New site from Git"
3. اختر GitHub وربط المستودع `systemibrahem-glitch/30`

### 2. إعدادات البناء

**Build command:**
```
npm install && cd client && npm install && cd .. && npm run build
```

**Publish directory:**
```
client/dist
```

**Base directory:**
```
/
```

### 3. متغيرات البيئة

أضف هذه المتغيرات في Netlify Dashboard > Site settings > Environment variables:

```
VITE_SUPABASE_URL = https://imuequpezaixljuxljdn.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltdWVxdXBlemFpeGxqdXhsamRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExOTI5MDEsImV4cCI6MjA3Njc2ODkwMX0.uuVPRX9J_QBzZmjWwv6uGaDAc1YRd7LjBTK0NVfRsHo
VITE_APP_TITLE = نظام إبراهيم للمحاسبة
VITE_APP_LOGO = /logo.png
VITE_WHATSAPP_NUMBER = +963994054027
VITE_SUPPORT_EMAIL = systemibrahem@gmail.com
VITE_TRIAL_DAYS = 30
VITE_SUBSCRIPTION_PLANS = {"monthly":{"name":"شهري","duration":30,"price":5},"6months":{"name":"6 أشهر","duration":180,"price":30},"yearly":{"name":"سنوي","duration":365,"price":40}}
VITE_SUPPORTED_CURRENCIES = ["TRY","SYP","USD"]
VITE_ENABLE_ANALYTICS = false
VITE_ENABLE_ERROR_REPORTING = false
```

### 4. إعدادات إضافية

**Node.js version:**
```
18
```

**NPM flags:**
```
--production=false
```

## الملفات المهمة

- `netlify.toml`: إعدادات Netlify الرئيسية
- `client/public/_redirects`: ملف التوجيه للـ SPA
- `package.json`: أوامر البناء والنشر
- `client/vite.config.ts`: إعدادات Vite للنشر

## أوامر التطوير المحلي

### تشغيل التطوير
```bash
npm run dev
```

### بناء المشروع
```bash
npm run build
```

### معاينة البناء
```bash
npm run preview
```

### تشغيل Netlify محلياً
```bash
npx netlify dev
```

## استكشاف الأخطاء

### مشاكل البناء
- تأكد من إصدار Node.js 18+
- تحقق من صحة متغيرات البيئة
- امسح `node_modules` وأعد التثبيت

### مشاكل التوجيه
- تأكد من وجود ملف `_redirects` في `client/public/`
- تحقق من إعدادات `netlify.toml`

### مشاكل البيئة
- تأكد من إضافة جميع متغيرات البيئة في Netlify
- تحقق من صحة قيم المتغيرات

## الميزات المضافة

✅ **إعدادات الأمان**: Headers للأمان والحماية
✅ **تحسين الأداء**: Cache headers للملفات الثابتة
✅ **التوجيه**: دعم SPA routing
✅ **متغيرات البيئة**: جميع الإعدادات المطلوبة
✅ **أوامر البناء**: محسنة لـ Netlify

## الدعم

للحصول على الدعم، تواصل معنا عبر:
- الواتساب: +963994054027
- البريد الإلكتروني: systemibrahem@gmail.com

---

**ملاحظة**: هذا المشروع محسن خصيصاً للعمل على Netlify مع جميع الإعدادات المطلوبة للعمل بشكل مثالي! 🚀
