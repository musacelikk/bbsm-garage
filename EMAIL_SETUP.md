# Email Doğrulama Sistemi Kurulumu

## ✅ Yapılanlar

1. ✅ Backend email servisi oluşturuldu
2. ✅ AuthEntity'ye email doğrulama kolonları eklendi
3. ✅ Email gönderme ve doğrulama endpoint'leri eklendi
4. ✅ Frontend email doğrulama sayfası oluşturuldu
5. ✅ Kayıt sayfası güncellendi

## 🔧 SİZİN YAPMANIZ GEREKENLER

### 1. Backend `.env` Dosyasına SMTP Ayarlarını Ekleyin

`bbsm-garage-back/.env` dosyasına aşağıdaki satırları ekleyin:

```env
# Email Ayarları (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=BBSM Garage <your-email@gmail.com>

# Frontend URL (Email linklerinde kullanılacak)
FRONTEND_URL=http://localhost:3000
```

### 2. Gmail Kullanıyorsanız

1. Google Hesabınıza giriş yapın
2. [Google Account Security](https://myaccount.google.com/security) sayfasına gidin
3. "2-Step Verification" (İki Adımlı Doğrulama) açık olmalı
4. [App Passwords](https://myaccount.google.com/apppasswords) sayfasına gidin
5. "Select app" → "Mail" seçin
6. "Select device" → "Other (Custom name)" seçin ve "BBSM Garage" yazın
7. "Generate" butonuna tıklayın
8. Oluşturulan 16 haneli şifreyi kopyalayın
9. Bu şifreyi `.env` dosyasındaki `SMTP_PASS` değerine yapıştırın

### 3. Diğer Email Servisleri İçin

#### Outlook/Hotmail:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

#### Yahoo:
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
```

#### Custom SMTP:
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASS=your-password
```

### 4. Production Ortamı İçin

Production'da `FRONTEND_URL` değerini gerçek domain'inizle değiştirin:

```env
FRONTEND_URL=https://yourdomain.com
```

## 📝 Notlar

- TypeORM `synchronize: true` olduğu için veritabanı otomatik güncellenecek
- Email gönderme hatası kaydı engellemez (kullanıcı kaydolur ama email gönderilemezse uyarı verilir)
- Email doğrulama zorunlu değil (şimdilik), kullanıcılar doğrulamadan da giriş yapabilir
- Email doğrulama token'ı 24 saat geçerlidir

## 🧪 Test Etme

1. Backend'i yeniden başlatın
2. Yeni bir kullanıcı kaydedin (email adresi ile)
3. Email'inizi kontrol edin
4. Email'deki linke tıklayın
5. Doğrulama sayfasında başarı mesajını görmelisiniz

