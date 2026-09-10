# Valera Jets — GitHub Pages + Supabase

Bu sürümde uçuş teklif formu Supabase veritabanına kayıt oluşturur.

## 1. Supabase projesi oluştur

Supabase Dashboard'da yeni bir proje oluşturun.

## 2. Veritabanını kur

Supabase > SQL Editor > New query açın.
`supabase-setup.sql` dosyasının tamamını yapıştırıp **Run** deyin.

Bu işlem `public.flight_requests` tablosunu oluşturur ve RLS güvenliğini açar.
Ziyaretçi yalnızca yeni kayıt ekleyebilir; publishable key ile mevcut talepleri okuyamaz, değiştiremez veya silemez.

## 3. Siteyi Supabase'e bağla

Supabase Dashboard > **Connect** bölümünden:

- Project URL
- Publishable Key (`sb_publishable_...`)

değerlerini alın.

`supabase-config.js` dosyasındaki iki placeholder'ı değiştirin:

```js
window.VALERA_SUPABASE = {
  url: 'https://PROJECT_REF.supabase.co',
  publishableKey: 'sb_publishable_...'
};
```

**Secret key / service_role key kullanmayın.** Bu anahtarlar browser koduna konmamalıdır.

## 4. GitHub'a yükle

Repo root'unda şu dosyalar bulunmalı:

- index.html
- styles.css
- script.js
- supabase-config.js
- CNAME
- robots.txt
- sitemap.xml

`supabase-setup.sql` dosyasını repoda tutabilirsiniz; site tarafından çalıştırılmaz.

Commit/push sonrası GitHub Pages yeni sürümü deploy edecektir.

## 5. Test et

valerajets.com üzerinden test talebi gönderin.
Supabase Dashboard > Table Editor > `flight_requests` tablosunda yeni satır görünmelidir.

## Güvenlik notu

Publishable Key browser'da görünmesi için tasarlanmıştır; asıl veri güvenliği RLS ve Postgres grants ile sağlanır. Bu kurulumda anonim ziyaretçilere SELECT / UPDATE / DELETE izni verilmez.

Daha güçlü spam koruması gerekiyorsa sonraki aşamada Cloudflare Turnstile + Supabase Edge Function eklenebilir.
