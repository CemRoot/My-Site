# 🚀 Setup Instructions

## 📧 EmailJS Configuration (Contact Form)

### 1. Create EmailJS Account
1. Go to [EmailJS Dashboard](https://dashboard.emailjs.com/)
2. Sign up for a free account (100 emails/month free)

### 2. Create Email Service
1. Click "Add New Service"
2. Choose your email provider (Gmail recommended)
3. Follow the connection instructions
4. Copy the **Service ID**

### 3. Create Email Template
1. Go to "Email Templates"
2. Click "Create New Template"
3. Use this template structure:

```
Subject: New Contact Form Message from {{from_name}}

Hello {{to_name}},

You have received a new message from your portfolio website:

Name: {{from_name}}
Email: {{from_email}}

Message:
{{message}}

---
Sent from your portfolio contact form
Reply to: {{reply_to}}
```

4. Save and copy the **Template ID**

### 4. Get Public Key
1. Go to "Account" > "General"
2. Copy your **Public Key**

### 5. Add to Environment Variables
Update `.env` file:

```env
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

### 6. Add to Vercel
```bash
vercel env add VITE_EMAILJS_SERVICE_ID
vercel env add VITE_EMAILJS_TEMPLATE_ID
vercel env add VITE_EMAILJS_PUBLIC_KEY
```

Or via Vercel Dashboard:
1. Go to Project Settings > Environment Variables
2. Add each variable
3. Redeploy

---

## 🤖 Groq AI Configuration (Chat Widget)

### 1. Get Free Groq API Key
1. Go to [Groq Console](https://console.groq.com/)
2. Sign up (completely free!)
3. Go to "API Keys"
4. Create new API key
5. Copy the key

### 2. Add to Environment Variables

**For Local Development:**
Update `.env`:
```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**For Vercel Production:**
```bash
vercel env add GROQ_API_KEY production
```

Or via Dashboard:
1. Vercel Dashboard > Settings > Environment Variables
2. Add `GROQ_API_KEY`
3. Select "Production" environment
4. Redeploy

---

## 🔧 Testing Locally

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Test contact form and AI chat
```

---

## 🌐 Deploy to Production

```bash
# Build
npm run build

# Deploy to Vercel
vercel --prod
```

---

## ✅ Verification

### Contact Form:
1. Fill out the form on https://cemkoyluoglu.codes/#contact
2. Check your email (cemkoyluoglu@icloud.com)
3. Should receive notification within seconds

### AI Chat:
1. Click chat widget on https://cemkoyluoglu.codes
2. Ask: "What is Cem's experience with AI?"
3. Should get intelligent response about your background

---

## 🆘 Troubleshooting

### Contact Form Not Working:
- Check EmailJS dashboard for errors
- Verify all 3 environment variables are set
- Check browser console for errors
- Make sure template variables match exactly

### AI Chat Not Working:
- Verify GROQ_API_KEY is set in Vercel
- Check Vercel function logs
- Groq has generous free tier (no billing needed)

### Environment Variables Not Loading:
- Variables must start with `VITE_` for client-side (EmailJS)
- After adding env vars in Vercel, must redeploy
- Local `.env` changes require restart (`npm run dev`)

---

## 📊 Limits

### EmailJS (Free Tier):
- 200 emails/month
- Perfect for portfolio sites

### Groq AI (Free Tier):
- Generous limits
- Fast LLaMA 3.1 model
- No credit card required

---

## 🎯 Next Steps

1. ✅ Get EmailJS credentials
2. ✅ Get Groq API key
3. ✅ Add to `.env` file
4. ✅ Add to Vercel environment variables
5. ✅ Deploy and test!

Happy coding! 🚀

