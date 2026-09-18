# Gürbüz Teknik — Dijital Satış Sitesi (v2, sadeleştirilmiş kapsam)

**Tarih:** 2026-09-18
**Durum:** Onaylandı, uygulama planına geçiliyor.

## Kapsam

Bu spec yalnızca **statik pazarlama sitesi + SEO + reklam analitiği**ni
kapsar. Aşağıdakiler bilinçli olarak kapsam dışıdır (kullanıcı kararı,
2026-09-18):

- Backend / API sunucusu
- CRM veritabanı (yerine: manuel Google E-Tablolar)
- AI satış asistanı
- WhatsApp Business Platform / API entegrasyonu
- Domain + Cloudflare Tunnel (backend olmadığı için gerekmiyor)

Bu kalemler ileride ayrı, kendi spec'leriyle ele alınabilir; bu doküman
onları içermez.

## Repo ve Yayın Adresi (2026-09-18'de değişti)

Orijinal analiz `gurbuztesisat/gurbuztesisat.github.io` reposuna göre
yapıldı, ancak o repo `gurbuztesisat` adlı ayrı bir GitHub hesabına ait
ve `atakanunver` hesabının push yetkisi yok. Kullanıcı kararıyla proje
**`atakanunver/tesisat-site`** reposuna taşındı — bu, kalıcı yeni adres
olacak (public yapıldı, GitHub Pages buradan açılacak).

Sonuç: site adresi artık `https://atakanunver.github.io/tesisat-site/`
olacak (bir "project page", `atakanunver.github.io` kök domaini değil).
Bu, 11ty'de bir `pathPrefix` (`/tesisat-site/`) gerektirir — bkz. plan
dosyasındaki Task 2/8 güncellemeleri. **Açık öneri:** local bir
tesisatçı işletmesi için özel bir alan adı (örn. `gurbuzteknik.com`),
hem güven/SEO hem de URL sadeliği açısından bu subpath adresinden çok
daha iyi olur; alınırsa `pathPrefix` tek satırla `/` yapılır ve bir
`CNAME` dosyası eklenir. Şimdilik bloklayıcı değil, mevcut adresle
devam ediliyor.

## Mevcut Durum

Eski site: `gurbuztesisat/gurbuztesisat.github.io` (GitHub Pages,
legacy build, artık bu projenin hedefi değil — sadece referans).
Tek dosya `index.html`, gömülü CSS/JS, build aracı yok. JSON-LD
`Plumber` tipinde, sadece Kurşunlu/Çankırı `areaServed`, kampanya/fiyat
bilgisi yok, sahte statik "AI Asistan" kutusu var. Yeni repo
(`atakanunver/tesisat-site`) da benzer şekilde boş bir placeholder
(`README.en.md/zh.md`, minimal `index.html`) ile başlıyor — sıfırdan
inşa ediliyor.

## Mimari

```
[Google/Instagram/Facebook Ads] --utm_*--> [Statik Site (11ty, GitHub Pages)]
                                              ├─ GA4 + Meta Pixel (custom events)
                                              └─ WhatsApp CTA (wa.me, kaynağa göre
                                                 dinamik ön-dolu mesaj, client-side JS)
                                                      │
                                                      ▼
                                          WhatsApp (0534 682 55 60)
                                                      │ (personel, manuel)
                                                      ▼
                                          Google E-Tablolar (lead kaydı)
```

Sunucu yok, veritabanı yok. Tüm dinamik davranış (UTM okuma, WhatsApp
mesaj metni seçimi) tarayıcıda çalışan küçük, bağımsız bir JS
dosyasıyla yapılır.

## Teknoloji Seçimi

- **Eleventy (11ty) + Nunjucks** — statik site üretici. Sıfıra yakın
  JS, GitHub Pages'e doğrudan uyumlu çıktı, ilçe sayfaları için
  data-driven template desteği.
- **`config/business.yaml`** — tek doğru veri kaynağı (firma bilgisi,
  kampanya fiyatları, çalışma saati, garanti). 11ty build sırasında
  `_data/business.js` üzerinden okunup şablonlara enjekte edilir.
  Web sitesi bu değerleri **build-time**'da alır (runtime'da ayrı bir
  API çağrısı yok, çünkü backend yok).
- **GA4 + Meta Pixel** — reklam platformlarının kendi optimizasyonu
  için gereken sinyal; ek entegrasyon gerektirmez, `gtag`/`fbq` ile
  client-side kurulur.

## Klasör Yapısı

```
tesisat-site/
├── site/
│   ├── _data/business.js
│   ├── _includes/ (layout, partials: header, footer, whatsapp-cta, faq)
│   ├── assets/ (css, img — webp/avif, lazy loading)
│   ├── hizmet-bolgeleri/ (gerçek ilçeler: cankiri-kombi-bakimi.njk vb.)
│   ├── kampanya/index.njk
│   └── index.njk
├── config/business.yaml
├── .eleventy.js
└── docs/DECISIONS.md
```

`server/`, `.env`, veritabanı — bu spec kapsamında yok.

## WhatsApp CTA Davranışı

Sayfa yüklenince URL'deki `utm_source` okunur (yoksa "direct/organic"
varsayılır). Buton `href`'i şu şablona göre kurulur:

```
https://wa.me/905346825560?text=<kaynağa göre şablon mesaj>
```

Şablonlar `config/business.yaml`'da tutulur (Google/Instagram/Facebook/
varsayılan), böylece metin değiştiğinde kod dokunulmadan güncellenir.
Mesaj **düz sipariş/bilgi talebi** metnidir — form yok, ek alan yok.

## SEO

- JSON-LD güncellenir: `Service` + `LocalBusiness`, gerçek
  `areaServed` (Çankırı + Kastamonu, gerçekten hizmet verilen
  ilçelerle sınırlı), kampanya bilgisi.
- `FAQPage`, `BreadcrumbList` eklenir.
- İlçe sayfaları yalnızca gerçekten hizmet verilen ilçeler için,
  her biri özgün içerikle (spam sayfa üretimi yok).

## Analytics / Reklam Dönüşümü

Event taxonomy (orijinal rapordaki 13. madde ile aynı):
`page_view, campaign_view, whatsapp_click, phone_click, service_view,
package_view, faq_open, lead_start, lead_complete,
appointment_request`.

Bu event'ler GA4'e custom event olarak, Meta Pixel'e ilgili standart/
custom event olarak gönderilir. Ayrı bir backend/veritabanı olmadığı
için bu veri **sadece GA4/Meta panelinde** yaşar — CRM/ciro ile
çapraz analiz manuel olarak (Google E-Tablolar + GA4 ekran görüntüsü/
export) yapılır.

## Lead Takibi — Google E-Tablolar (manuel)

Otomatik entegrasyon yok. Sütun başlıkları CRM alan listesiyle
birebir: ad, telefon, il, ilçe, mahalle, adres, kombi markası, petek
sayısı, hizmet, kaynak, kampanya, durum (NEW…FOLLOW_UP enum'u),
randevu tarihi, not, oluşturulma tarihi. Personel WhatsApp
görüşmesinden sonra elle doldurur.

*Not:* Otomatik tıklama loglama (Google Apps Script ile) teknik
olarak mümkün ama bu spec'te bilinçli olarak dışarıda bırakıldı
(kullanıcı: "api ve backend talebi yok"). İleride istenirse ayrı bir
küçük eklenti olarak değerlendirilebilir.

## İçerik Kuralları

Sahte yorum/puan/sertifika yok, doğrulanmamış rakam ("X yıllık
deneyim" vb.) yok, garanti kapsamı hukuki olarak abartılı ifade
edilmeden aktarılır.

## Uygulama Planı (yüksek seviye)

1. **Faz 1:** 11ty kurulumu, `business.yaml`, ana sayfa (hero +
   kampanya + hizmetler + neden biz + nasıl çalışır + hizmet bölgeleri
   + SSS + güven/yetki belgesi + WhatsApp CTA + footer), kaynağa göre
   WhatsApp mesajı, düzeltilmiş JSON-LD, sahte AI kutusunun
   kaldırılması, gerçek ilçe sayfaları, GitHub Pages'e deploy.
2. **Faz 2:** GA4 + Meta Pixel kurulumu, event taxonomy'nin siteye
   eklenmesi, Google E-Tablolar şablonunun hazırlanması.

Detaylı adım adım uygulama planı `writing-plans` süreciyle ayrıca
çıkarılacak.
