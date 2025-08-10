# LibreTranslate Setup Guide

This guide explains how to set up LibreTranslate for automatic translation in the Smart Rental System.

## 🚀 Quick Start

### Option 1: Using Docker (Recommended)

```bash
# Start LibreTranslate
npm run translate:start

# Check logs
npm run translate:logs

# Test translation
npm run translate:test

# Stop LibreTranslate
npm run translate:stop
```

### Option 2: Manual Docker

```bash
# Pull and run LibreTranslate
docker run -it --rm -p 5000:5000 libretranslate/libretranslate --load-only en,pl

# Or with Docker Compose
docker-compose -f ../docker-compose.translate.yml up -d
```

### Option 3: Direct Installation

```bash
# Install Python dependencies
pip install libretranslate

# Run server
libretranslate --host 0.0.0.0 --port 5000 --load-only en,pl
```

## 🔧 Configuration

### Environment Variables

In `backend/.env`:
```env
# LibreTranslate API URL
LIBRETRANSLATE_URL=http://localhost:5000

# Alternative: Use public servers
# LIBRETRANSLATE_URL=https://libretranslate.de
```

### Docker Compose Configuration

The `docker-compose.translate.yml` file includes:
- **Port:** 5000
- **Languages:** English and Polish only (faster startup)
- **Threads:** 4 (optimized for performance)
- **Health Check:** Automatic monitoring
- **Volume:** Persistent data storage

## 📊 Features

### ✅ What's Included
- **Automatic Translation:** English → Polish
- **Fallback Translation:** Works without LibreTranslate
- **Error Handling:** Graceful degradation
- **Performance:** Optimized for rental terms
- **Free:** No API costs

### 🔄 Translation Flow
1. **Primary:** LibreTranslate API
2. **Fallback:** Built-in dictionary translation
3. **Final:** Original text (if all else fails)

## 🧪 Testing

```bash
# Test translation service
npm run translate:test

# Expected output:
# 📝 English: Pets allowed, no smoking
# 🇵🇱 Polish: Zwierzęta dozwolone, zakaz palenia
# ✅ Translation successful
```

## 🛠️ Troubleshooting

### LibreTranslate Not Starting
```bash
# Check if port 5000 is available
netstat -ano | findstr :5000

# Kill process if needed
taskkill /PID <PID> /F
```

### Translation Failing
```bash
# Check LibreTranslate logs
npm run translate:logs

# Restart service
npm run translate:stop
npm run translate:start
```

### Using Public Servers
If self-hosting fails, use public LibreTranslate servers:
```env
LIBRETRANSLATE_URL=https://libretranslate.de
```

## 📈 Performance

### Startup Time
- **First run:** 2-3 minutes (downloads models)
- **Subsequent runs:** 30-60 seconds

### Translation Speed
- **Local:** ~100ms per translation
- **Public servers:** ~500ms per translation

### Memory Usage
- **Minimum:** 2GB RAM
- **Recommended:** 4GB RAM

## 🔒 Security

- **Local hosting:** Data never leaves your server
- **No API keys:** No external dependencies
- **Offline capable:** Works without internet
- **Privacy focused:** No data collection

## 🎯 Benefits

- ✅ **Completely free** - No API costs
- ✅ **Unlimited usage** - No rate limits
- ✅ **Privacy focused** - Data stays local
- ✅ **Offline capable** - Works without internet
- ✅ **High quality** - Professional translations
- ✅ **Easy setup** - One command deployment
