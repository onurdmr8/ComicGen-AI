# 🎨 ComicGen-AI — Yapay Zeka Çizgi Roman & Grafik Roman Üreticisi

ComicGen-AI; tutarlı karakterler, dinamik mekanlar, çoklu kamera açıları ve Türkçe hikaye anlatımı ile profesyonel çizgi roman sayfaları üreten yapay zeka destekli bir grafik roman stüdyosudur.

---

## 🚀 Hızlı Başlangıç (Lokal Çalıştırma)

Projeyi GitHub'dan indirip çalıştırmak için sisteminizde **Node.js (v20+)** ve **Git** kurulu olmalıdır.

### 1. Repoyu Klonlayın
```bash
git clone https://github.com/onurdmr8/ComicGen-AI.git
cd ComicGen-AI
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Ortam Değişkenini Ayarlayın (İsteğe Bağlı)
Kök dizinde `.env` dosyası oluşturup Gemini API anahtarınızı ekleyin:
```env
GEMINI_API_KEY=senin_gemini_api_anahtarin
PORT=3000
```
*(Not: API anahtarını uygulama açıldıktan sonra sağ üstteki **"API Anahtarı"** menüsünden de girebilirsiniz.)*

### 4. Uygulamayı Başlatın

**Geliştirici Modu (Hot-reload ile):**
```bash
npm run dev
```

**Prodüksiyon Modu:**
```bash
npm run build
npm start
```

Tarayıcınızdan **`http://localhost:3000`** adresine gidin.

---

## ☁️ Bulutta Doğrudan GitHub Üzerinden Canlıya Alma (Deploy)

Bilgisayarınızda dosya barındırmadan uygulamayı internette çalıştırmak için ücretsiz bulut platformlarını kullanabilirsiniz:

### Render.com veya Railway.app ile:
1. [Render](https://render.com) veya [Railway](https://railway.app)'e ücretsiz üye olun.
2. **New Web Service** seçeneğine tıklayıp GitHub hesabınızdan **`ComicGen-AI`** reposunu bağlayın.
3. Ayarları şu şekilde girin:
   * **Build Command:** `npm run build`
   * **Start Command:** `npm start`
   * **Node Version:** `20` veya üzeri
4. **Environment Variables** (Ortam Değişkenleri) kısmına:
   * `GEMINI_API_KEY`: *(Google AI Studio'dan aldığınız API anahtarı)*
   * `PORT`: `3000`
5. **Deploy** butonuna tıklayın. 1-2 dakika içinde size özel bir `https://comicgen-ai.onrender.com` bağlantısı hazır olacaktır.

---

## ✨ Temel Özellikler
* **Karakter Kılavuzu & Kıyafet Kilidi:** Karakterlerin saç, yüz ve kayıtlı kıyafetleri (`attire`) her panelde %100 tutarlı kalır. Model sheet veya boş stüdyo fonu oluşmaz.
* **Akıllı Mekan Tespiti:** Yazdığınız hikayedeki mekanlar (kafe, bar, sokak, teras vb.) otomatik algılanarak sahneye işlenir.
* **1. Sayfa Hikaye Dağılımı:** Giriş metniniz 4 panelin sahne aksiyonuna ve Türkçe diyaloglarına birebir dağıtılır.
* **Yedekli Çizim Motoru:** FLUX (Pollinations) veya Gemini Flash Image motorları ile kesintisiz yüksek çözünürlüklü çizim desteği.
