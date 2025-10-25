# تعليمات نشر نظام إبراهيم للمحاسبة على Cloudflare

## المتطلبات المسبقة

1. حساب Cloudflare نشط
2. Wrangler CLI مثبت عالمياً
3. Node.js 18+ مثبت

## خطوات النشر

### 1. تثبيت Wrangler CLI
```bash
npm install -g wrangler
```

### 2. تسجيل الدخول إلى Cloudflare
```bash
wrangler login
```

### 3. بناء المشروع
```bash
npm install
cd client
npm install
cd ..
npm run build
```

### 4. نشر المشروع
```bash
wrangler deploy --env production
```

## إعدادات البيئة

تم إعداد متغيرات البيئة التالية في `wrangler.toml`:

- `VITE_SUPABASE_URL`: رابط قاعدة البيانات
- `VITE_SUPABASE_ANON_KEY`: مفتاح Supabase
- `VITE_APP_TITLE`: عنوان التطبيق
- `VITE_APP_LOGO`: مسار الشعار
- `VITE_WHATSAPP_NUMBER`: رقم الواتساب للدعم
- `VITE_SUPPORT_EMAIL`: البريد الإلكتروني للدعم
- `VITE_TRIAL_DAYS`: أيام التجربة المجانية
- `VITE_SUBSCRIPTION_PLANS`: خطط الاشتراك
- `VITE_SUPPORTED_CURRENCIES`: العملات المدعومة

## بنية المشروع

```
├── client/          # تطبيق React Frontend
│   ├── src/         # ملفات المصدر
│   ├── dist/        # ملفات البناء (يتم إنشاؤها)
│   └── package.json
├── server/          # خادم Backend
├── shared/          # ملفات مشتركة
├── drizzle/         # قاعدة البيانات
├── wrangler.toml    # إعدادات Cloudflare
└── package.json     # إعدادات المشروع الرئيسي
```

## أوامر مفيدة

### التطوير المحلي
```bash
npm run dev
```

### معاينة البناء
```bash
npm run preview
```

### فحص النشر
```bash
wrangler tail
```

### عرض معلومات النشر
```bash
wrangler whoami
```

## استكشاف الأخطاء

### مشاكل البناء
- تأكد من تثبيت جميع التبعيات
- تحقق من إصدار Node.js (18+)
- امسح مجلد `node_modules` وأعد التثبيت

### مشاكل النشر
- تأكد من تسجيل الدخول في Cloudflare
- تحقق من صحة `wrangler.toml`
- تأكد من وجود مجلد `client/dist`

## الدعم

للحصول على الدعم، تواصل معنا عبر:
- الواتساب: +963994054027
- البريد الإلكتروني: systemibrahem@gmail.com
