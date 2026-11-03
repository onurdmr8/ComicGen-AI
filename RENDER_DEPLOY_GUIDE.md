# 🚀 Render Deployment Guide (ComicGen-AI)

ComicGen-AI projesi **Render (render.com)** üzerinde tek tıkla veya manuel olarak sorunsuz çalışacak şekilde optimize edildi.

---

## 🛠️ Yapılan Optimizasyonlar
1. **Dinamik Port Desteği (`process.env.PORT`):** Render'ın dinamik olarak atadığı portları (örn. 10000) otomatik algılar, `0.0.0.0` hostu üzerinde dinler.
2. **Üretim Modu (Production Bundle):** Frontend (`dist/`) ve backend (`dist/server.cjs`) tek bir Express web servisi altında birleştirildi. Vite geliştirici bağımlılıkları üretim çalışma zamanından arındırıldı.
3. **Sağlık Kontrolü (Healthcheck):** Render için `/api/health` uç noktası yapılandırıldı.
4. **Render Blueprint (`render.yaml`):** GitHub deposunu bağladığınızda Render tüm ayarları otomatik okur.
5. **Node Sürüm Güvencesi (`engines`):** Modern Node.js (>=20.0.0) sürümü kilitlendi.
6. **Alternatif Docker Desteği (`Dockerfile`):** Konteyner ile dağıtmak isteyenler için multi-stage Dockerfile hazırlandı.

---

## ⚡ Yöntem 1: Render Blueprint ile Otomatik Kurulum (Önerilen - En Kolay)

1. Projeyi **GitHub / GitLab** deponuza gönderin (Push edin):
   ```bash
   git add .
   git commit -m "Render deployment configuration"
   git push origin main
   ```
2. [Render Dashboard](https://dashboard.render.com)'a gidin.
3. **"New +"** butonuna basıp **"Blueprint"** seçeneğini tıklayın.
4. GitHub deponuzu seçin.
5. Render projedeki `render.yaml` dosyasını otomatik olarak algılar ve şu ayarları otomatik yapar:
   - **Service Name:** `comicgen-ai`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
6. **"Apply"** butonuna tıklayın. 1-2 dakika içinde uygulamanız `https://comicgen-ai-xxxx.onrender.com` adresinde yayına girecektir!

---

## 🖱️ Yöntem 2: Manuel Web Service Olarak Kurulum

Eğer Blueprint kullanmadan doğrudan Web Service oluşturmak isterseniz:

1. [Render Dashboard](https://dashboard.render.com)'da **"New +" -> "Web Service"** seçin.
2. GitHub deponuzu bağlayın.
3. Aşağıdaki ayarları girin:
   - **Name:** `comicgen-ai`
   - **Region:** Frankfurt (veya size en yakın bölge)
   - **Branch:** `main` (veya kullandığınız dal)
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
4. **Environment Variables (Ortam Değişkenleri)** bölümüne şunları ekleyin:
   - `NODE_ENV` = `production`
   - `GEMINI_API_KEY` = (Google AI Studio anahtarınız - İsteğe Bağlı, kullanıcılar arayüzden de girebilir veya Pollinations %100 ücretsiz mod kullanılabilir)
5. **Advanced -> Health Check Path:**
   - `/api/health`
6. **"Create Web Service"** butonuna tıklayın.

---

## 🐳 Yöntem 3: Docker ile Kurulum (Opsiyonel)

Render üzerinde Docker seçeneğiyle dağıtmak isterseniz:
1. Render'da **"New +" -> "Web Service"** seçin.
2. Deponuzu seçtikten sonra Runtime olarak **"Docker"** seçeneğini seçin.
3. Projedeki hazır `Dockerfile` otomatik olarak kullanılacaktır.
4. **"Create Web Service"** deyin.

---

## 🔑 Ortam Değişkenleri (Environment Variables)

| Değişken | Açıklama | Zorunlu mu? |
|---|---|---|
| `PORT` | Render tarafından otomatik atanır | Hayır (Otomatik) |
| `NODE_ENV` | `production` olarak ayarlanır | Hayır (Otomatik) |
| `GEMINI_API_KEY` | Sunucu taraflı varsayılan Gemini API anahtarı | Opsiyonel (Kullanıcılar arayüzden girebilir veya Pollinations ücretsiz kullanılabilir) |
| `TOGETHER_API_KEY` | Together AI API anahtarı | Opsiyonel |
| `FAL_API_KEY` | fal.ai API anahtarı | Opsiyonel |
| `POLLINATIONS_API_KEY`| Pollinations özel API anahtarı | Opsiyonel |

---

## 💡 Render Ücretsiz Plan İpuçları
* **Cold Start (Uyku Modu):** Render ücretsiz katmanında uygulama 15 dakika istek almadığında uyku moduna geçer. Yeni bir istek geldiğinde açılması yaklaşık 30-40 saniye sürer. Açıldıktan sonra tam hızında çalışır.
* Sağlık kontrolü `/api/health` uç noktası Render'ın uygulamanın hazır olduğunu hemen anlamasını sağlar.
