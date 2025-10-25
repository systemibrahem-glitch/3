# 🚀 دليل البدء السريع - نظام إبراهيم للمحاسبة

## ⚡ البدء في 5 دقائق

### 1️⃣ فك الضغط

```bash
tar -xzf ibrahim-accounting-complete.tar.gz
cd ibrahim-accounting
```

### 2️⃣ تثبيت المكتبات

```bash
pnpm install
# أو
npm install
```

### 3️⃣ إعداد Supabase

1. أنشئ حساب على [Supabase](https://supabase.com)
2. أنشئ مشروع جديد
3. نفذ محتوى `database_schema.sql` في SQL Editor
4. احفظ Project URL و anon key

### 4️⃣ إعداد المتغيرات البيئية

أنشئ ملف `client/.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5️⃣ تشغيل المشروع

```bash
pnpm dev
```

افتح المتصفح على: `http://localhost:3000`

---

## 📦 محتويات المشروع

```
ibrahim-accounting/
├── client/                 # تطبيق React
│   ├── src/
│   │   ├── pages/         # صفحات التطبيق
│   │   ├── components/    # المكونات
│   │   ├── contexts/      # Context API
│   │   ├── lib/          # المكتبات والأدوات
│   │   └── const.ts      # الثوابت
│   └── public/           # الملفات الثابتة
├── database_schema.sql   # قاعدة البيانات
├── README.md            # الوثائق الكاملة
├── DEPLOYMENT_GUIDE.md  # دليل النشر
└── netlify.toml        # إعدادات Netlify
```

---

## 🎯 الأقسام الرئيسية

- ✅ **لوحة التحكم**: إحصائيات شاملة
- ✅ **الواردات**: فواتير المشتريات
- ✅ **الصادرات**: فواتير المبيعات
- ✅ **المستودع**: إدارة المخزون
- ✅ **الموظفين**: سجلات الموظفين
- ✅ **الرواتب**: إدارة الرواتب
- ✅ **التقارير**: تقارير مالية
- ✅ **المستخدمين**: إدارة المستخدمين
- ✅ **الإعدادات**: إعدادات النظام

---

## 🔑 إنشاء أول مستخدم

### SQL سريع:

```sql
-- 1. إنشاء متجر
INSERT INTO stores (name, owner_name, email, subscription_plan, subscription_start_date, subscription_end_date, is_active)
VALUES ('متجري', 'اسمك', 'email@example.com', 'trial', CURRENT_DATE, CURRENT_DATE + 30, true)
RETURNING id;

-- 2. إنشاء مستخدم (استبدل STORE_ID و PASSWORD_HASH)
INSERT INTO users (store_id, username, password_hash, full_name, role, is_active)
VALUES ('STORE_ID', 'admin', 'PASSWORD_HASH', 'المدير', 'owner', true);
```

**لتشفير كلمة المرور:**
- استخدم [bcrypt-generator.com](https://bcrypt-generator.com/)
- أو استخدم Node.js: `bcrypt.hashSync('password', 10)`

---

## 🚀 النشر على Netlify

### طريقة سريعة:

1. ارفع المشروع على GitHub
2. اذهب إلى [Netlify](https://netlify.com)
3. اضغط "New site from Git"
4. اختر المستودع
5. Build settings:
   - Build command: `cd client && pnpm install && pnpm build`
   - Publish directory: `client/dist`
6. أضف المتغيرات البيئية
7. Deploy!

---

## 📚 الوثائق الكاملة

- **README.md**: دليل شامل للمشروع
- **DEPLOYMENT_GUIDE.md**: دليل النشر المفصل خطوة بخطوة

---

## 💡 نصائح

- استخدم **pnpm** للأداء الأفضل
- فعّل **Row Level Security** في Supabase
- احفظ نسخة احتياطية من قاعدة البيانات
- استخدم **HTTPS** دائماً في الإنتاج

---

## 🆘 الدعم

- **البريد**: systemibrahem@gmail.com
- **واتساب**: +963994054027

---

**بالتوفيق! 🎉**

