# WhatsApp API Setup Guide

This guide explains how to obtain the necessary tokens and configure the WhatsApp Business API for this application.

## 1. Create a Meta App

1. Go to [Meta for Developers](https://developers.facebook.com/).
2. Click **My Apps** -> **Create App**.
3. Select **Other** -> **Next**.
4. Select **Business** -> **Next**.
5. Enter an app name and contact email.
6. Click **Create App**.

## 2. Add WhatsApp Product

1. On the App Dashboard, scroll down to find **WhatsApp**.
2. Click **Set up**.
3. Select a Meta Business Account (or create one).

## 3. Get API Token (`WHATSAPP_API_TOKEN`)

1. In the left sidebar, go to **WhatsApp** -> **API Setup**.
2. Look for **Temporary Access Token**.
   - *Note: This token expires in 24 hours. For production, you need a System User Access Token.*
3. Copy this token.
4. Paste it into your `.env.local` file as `WHATSAPP_API_TOKEN`.

## 4. Configure Webhook (`WHATSAPP_VERIFY_TOKEN`)

1. In the left sidebar, go to **WhatsApp** -> **Configuration**.
2. Find the **Webhook** section and click **Edit**.
3. **Callback URL**: Enter your deployed URL + `/api/whatsapp`.
   - Example: `https://your-project.vercel.app/api/whatsapp`
   - *Note: For local development, use a tunneling service like ngrok.*
4. **Verify Token**: Create a secure random string (e.g., `my-secret-token-123`).
   - **IMPORTANT**: This string must match exactly what you put in your `.env.local` file as `WHATSAPP_VERIFY_TOKEN`.
5. Click **Verify and Save**.

## 5. Subscribe to Webhook Fields

1. Once verified, click **Manage** in the Webhook fields section.
2. Subscribe to **messages**.
3. Click **Done**.

## Summary of Environment Variables

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `WHATSAPP_API_TOKEN` | Token to send messages | Meta App Dashboard -> WhatsApp -> API Setup |
| `WHATSAPP_VERIFY_TOKEN` | Token to verify webhook | **You create this.** Must match in .env and Meta Dashboard. |
