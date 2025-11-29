# 📧 Email Kurulum Rehberi - Detaylı Adımlar

## 🎯 Gmail Kullanarak Email Gönderme

### ADIM 1: Google Hesabınızda 2 Adımlı Doğrulamayı Açın

1. **Google Hesabınıza giriş yapın**
   - https://myaccount.google.com adresine gidin
   - Gmail hesabınızla giriş yapın

2. **Güvenlik sayfasına gidin**
   - Sol menüden **"Güvenlik"** (Security) seçeneğine tıklayın
   - Veya direkt: https://myaccount.google.com/security

3. **2 Adımlı Doğrulamayı açın**
   - **"Google'a giriş yapma"** (Signing in to Google) bölümünde
   - **"2 Adımlı Doğrulama"** (2-Step Verification) seçeneğini bulun
   - Eğer kapalıysa, **"Aç"** (Turn on) butonuna tıklayın
   - Telefon numaranızı doğrulayın (SMS veya telefon araması ile)
   - ✅ **ÖNEMLİ:** 2 Adımlı Doğrulama açık olmadan App Password oluşturamazsınız!

---

### ADIM 2: App Password (Uygulama Şifresi) Oluşturun

1. **App Passwords sayfasına gidin**
   - Direkt link: https://myaccount.google.com/apppasswords
   - Veya: Güvenlik sayfası → "2 Adımlı Doğrulama" → "Uygulama şifreleri" (App passwords)

2. **Yeni App Password oluşturun**
   - **"Uygulama seç"** (Select app) dropdown'ından → **"Mail"** seçin
   - **"Cihaz seç"** (Select device) dropdown'ından → **"Diğer (Özel ad)"** (Other (Custom name)) seçin
   - Açılan kutucuğa **"BBSM Garage"** yazın
   - **"Oluştur"** (Generate) butonuna tıklayın

3. **Oluşturulan şifreyi kopyalayın**
   - 16 haneli bir şifre göreceksiniz (örnek: `abcd efgh ijkl mnop`)
   - **Bu şifreyi kopyalayın** (boşluklar olmadan: `abcdefghijklmnop`)
   - ⚠️ **DİKKAT:** Bu şifreyi sadece bir kez görebilirsiniz! Kopyaladığınızdan emin olun.

---

### ADIM 3: .env Dosyasını Düzenleyin

1. **Backend klasörüne gidin**
   ```bash
   cd bbsm-garage-back
   ```

2. **.env dosyasını açın**
   - `.env` dosyasını bir metin editörü ile açın
   - Eğer yoksa, oluşturun

3. **Email ayarlarını ekleyin/düzenleyin**

   ```env
   # Email Ayarları (SMTP)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=ornek@gmail.com
   SMTP_PASS=abcdefghijklmnop
   SMTP_FROM=BBSM Garage <ornek@gmail.com>

   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   ```

   **Açıklamalar:**
   - `SMTP_USER`: Gmail adresiniz (örnek: `ahmet@gmail.com`)
   - `SMTP_PASS`: ADIM 2'de kopyaladığınız 16 haneli App Password (boşluk olmadan)
   - `SMTP_FROM`: Gönderen adı (kendi email'inizi yazın)
   - `FRONTEND_URL`: 
     - **Geliştirme için:** `http://localhost:3000`
     - **Production için:** `https://yourdomain.com`

---

## 📋 Örnek .env Dosyası

```env
# Database Ayarları
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-db-password
DB_DATABASE=bbsm_garage
DB_SSL=false

# JWT Secret
JWT_SECRET=your-jwt-secret-key

# Email Ayarları (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=ahmet@gmail.com
SMTP_PASS=abcdefghijklmnop
SMTP_FROM=BBSM Garage <ahmet@gmail.com>

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

---

## 🧪 Test Etme

1. **Backend'i yeniden başlatın**
   ```bash
   cd bbsm-garage-back
   npm run start:dev
   ```

2. **Yeni bir kullanıcı kaydedin**
   - Frontend'te kayıt sayfasına gidin
   - Email adresi ile kayıt olun
   - Kayıt başarılı mesajını görmelisiniz

3. **Email'inizi kontrol edin**
   - Gmail'inize gidin
   - Gelen kutusunda "BBSM Garage - Email Doğrulama" başlıklı bir email görmelisiniz
   - Email'deki "Email'i Doğrula" butonuna tıklayın

4. **Doğrulama sayfasını kontrol edin**
   - Email'deki linke tıkladığınızda `/verify-email` sayfasına yönlendirilmelisiniz
   - "Email Doğrulandı!" mesajını görmelisiniz

---

## ❌ Sorun Giderme

### Email gelmiyor?

1. **Spam klasörünü kontrol edin**
   - Gmail'in spam klasörüne bakın

2. **App Password doğru mu?**
   - `.env` dosyasındaki `SMTP_PASS` değerinin boşluk içermediğinden emin olun
   - 16 haneli olmalı (örnek: `abcdefghijklmnop`)

3. **2 Adımlı Doğrulama açık mı?**
   - https://myaccount.google.com/security adresinden kontrol edin
   - "2 Adımlı Doğrulama" açık olmalı

4. **Backend loglarını kontrol edin**
   - Backend terminalinde hata mesajı var mı bakın
   - Email gönderme hatası varsa göreceksiniz

### "Email gönderilemedi" hatası?

1. **SMTP ayarlarını kontrol edin**
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` doğru mu?
   - `.env` dosyasında tırnak işareti (`"`) kullanmayın!

2. **Gmail hesabınızın güvenliği**
   - Google hesabınızın güvenliği tehlikede görünüyor olabilir
   - https://myaccount.google.com/security adresinden kontrol edin

3. **Firewall/Antivirus**
   - Firewall veya antivirus programı SMTP bağlantısını engelliyor olabilir

---

## 🌐 Production Ortamı İçin

Production'da (canlı sunucuda) şunları değiştirin:

```env
# Frontend URL - Gerçek domain'iniz
FRONTEND_URL=https://yourdomain.com

# SMTP ayarları aynı kalabilir (Gmail kullanıyorsanız)
# Veya kendi SMTP sunucunuzu kullanabilirsiniz
```

---

## 📞 Alternatif Email Servisleri

### Outlook/Hotmail:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### Yahoo:
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

### Custom SMTP (SendGrid, Mailgun vb.):
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

---

## ✅ Kontrol Listesi

- [ ] Google hesabında 2 Adımlı Doğrulama açık
- [ ] App Password oluşturuldu ve kopyalandı
- [ ] `.env` dosyasına email ayarları eklendi
- [ ] `SMTP_PASS` değeri boşluk içermiyor
- [ ] `FRONTEND_URL` doğru (localhost veya production domain)
- [ ] Backend yeniden başlatıldı
- [ ] Test email'i gönderildi ve kontrol edildi

---

**Sorun yaşarsanız backend loglarını kontrol edin ve hata mesajını paylaşın!**

