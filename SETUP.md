# Setup Guide - RazorAgent FX

This guide will help you set up and run RazorAgent FX for development, testing, and production deployment.

## Prerequisites

- Node.js 18+ and npm
- Git
- Razorpay Test Account (free)

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url> razoragent-fx
cd razoragent-fx
npm install
```

### 2. Environment Configuration

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Razorpay Test Credentials (Required for real payments)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id

# OpenAI API Key (Optional - deterministic fallback available)
OPENAI_API_KEY=sk-your-openai-key

# Razorpay Webhook Secret (Optional - for production)
RAZORPAY_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 3. Run Development Server

```bash
npm run dev
```

Access the application at http://localhost:3000

## Getting Credentials

### Razorpay Test Credentials

1. Sign up at [https://razorpay.com](https://razorpay.com)
2. Go to [https://dashboard.razorpay.com/apikeys](https://dashboard.razorpay.com/apikeys)
3. Generate Test Mode keys
4. Copy Key ID and Key Secret to your `.env.local`

### OpenAI API Key (Optional)

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add to `.env.local` (or leave empty for deterministic mode)

### Razorpay Webhook Secret (Optional)

1. Go to [https://dashboard.razorpay.com/settings/webhooks](https://dashboard.razorpay.com/settings/webhooks)
2. Add new webhook with your deployed URL
3. Copy the webhook secret to `.env.local`

## Development vs Production

### Development Mode

- Uses Test Mode Razorpay keys
- Deterministic AI routing (no OpenAI required)
- Mock webhook handling
- In-memory database

### Production Mode

- Uses Live Mode Razorpay keys
- OpenAI integration for enhanced routing
- Real webhook processing
- Persistent database (Postgres/Supabase)

## Testing the Application

### 1. Test AI Routing

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1250,
    "sourceCurrency": "USD",
    "targetCurrency": "INR",
    "cardCountry": "US",
    "issuingBank": "Chase",
    "cardNetwork": "Visa"
  }'
```

### 2. Test Razorpay Order Creation

```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1250,
    "currency": "USD",
    "cardCountry": "US",
    "cardNetwork": "Visa"
  }'
```

### 3. Test Invoice Processing

```bash
curl -X POST http://localhost:3000/api/compliance \
  -F "text=Invoice # INV-001
  Bill To: Test Company
  Amount: $1250 USD
  Date: 2024-08-23"
```

## Webhook Setup for Local Development

### Using ngrok

1. Install ngrok:
   ```bash
   winget install Ngrok.Ngrok
   ```

2. Authenticate:
   ```bash
   ngrok config add-authtoken YOUR_TOKEN
   ```

3. Start tunnel:
   ```bash
   ngrok http 3000
   ```

4. Use the ngrok URL in Razorpay webhook settings:
   ```
   https://your-ngrok-url.ngrok-free.app/api/webhooks/razorpay
   ```

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Manual Deployment

```bash
npm run build
npm start
```

## Troubleshooting

### Razorpay Integration Issues

- Ensure you're using Test Mode keys for development
- Check that your Razorpay account is active
- Verify webhook URL is accessible from internet

### Build Errors

```bash
rm -rf .next node_modules
npm install
npm run build
```

### Environment Variables Not Loading

- Ensure `.env.local` is in project root
- Restart development server after changing variables
- Check for typos in variable names

## Security Notes

- **Never commit** `.env.local` to git
- Use different keys for development and production
- Rotate API keys regularly
- Enable webhook signature verification in production

## Support

For issues related to:
- **Razorpay API**: [Razorpay Support](https://razorpay.com/docs/)
- **OpenAI API**: [OpenAI Documentation](https://platform.openai.com/docs)
- **Project Issues**: Open an issue in the GitHub repository
