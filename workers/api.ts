/**
 * Sommer's Proposal System - Cloudflare Worker API
 * Serverless API for email, webhooks, and integrations
 */

export interface Env {
  // Secrets
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RESEND_API_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_PHONE_NUMBER: string;
  OPENWEATHERMAP_API_KEY: string;
  
  // Bindings
  PROPOSALS_BUCKET: R2Bucket;
}

// ============================================================================
// CORS HEADERS
// ============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // ================================================================
      // EMAIL ENDPOINTS
      // ================================================================

      if (path === '/api/email/send-proposal' && request.method === 'POST') {
        return await handleSendProposal(request, env);
      }

      if (path === '/api/email/send-followup' && request.method === 'POST') {
        return await handleSendFollowup(request, env);
      }

      if (path === '/api/email/send-reminder' && request.method === 'POST') {
        return await handleSendReminder(request, env);
      }

      // ================================================================
      // SMS ENDPOINTS
      // ================================================================

      if (path === '/api/sms/send' && request.method === 'POST') {
        return await handleSendSMS(request, env);
      }

      // ================================================================
      // STRIPE WEBHOOKS
      // ================================================================

      if (path === '/api/webhooks/stripe' && request.method === 'POST') {
        return await handleStripeWebhook(request, env);
      }

      // ================================================================
      // WEATHER API
      // ================================================================

      if (path.startsWith('/api/weather') && request.method === 'GET') {
        return await handleWeatherRequest(request, env);
      }

      // ================================================================
      // PDF GENERATION
      // ================================================================

      if (path === '/api/pdf/generate' && request.method === 'POST') {
        return await handlePDFGeneration(request, env);
      }

      // ================================================================
      // FILE UPLOAD
      // ================================================================

      if (path === '/api/upload' && request.method === 'POST') {
        return await handleFileUpload(request, env);
      }

      // ================================================================
      // 404
      // ================================================================

      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  },
};

// ============================================================================
// EMAIL HANDLERS
// ============================================================================

async function handleSendProposal(request: Request, env: Env): Promise<Response> {
  const { to, proposalId, proposalNumber, clientName, total, viewUrl } = await request.json();

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: "Sommer's Sealcoating <proposals@sommersealcoating.com>",
      to: [to],
      subject: `Your Proposal ${proposalNumber} is Ready`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #C41E3A; padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; }
            .content { padding: 30px; background: #f9f9f9; }
            .cta { text-align: center; padding: 20px; }
            .button { display: inline-block; background: #C41E3A; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Sommer's Sealcoating</h1>
            </div>
            <div class="content">
              <h2>Hello ${clientName},</h2>
              <p>Your proposal <strong>${proposalNumber}</strong> is ready for review.</p>
              <p>Total: <strong>$${total.toLocaleString()}</strong></p>
              <div class="cta">
                <a href="${viewUrl}" class="button">View Proposal</a>
              </div>
              <p>This proposal is valid for 30 days. If you have any questions, please don't hesitate to reach out.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Sommer's Sealcoating. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }),
  });

  const result = await response.json();

  return new Response(JSON.stringify(result), {
    status: response.ok ? 200 : 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleSendFollowup(request: Request, env: Env): Promise<Response> {
  const { to, clientName, proposalNumber, daysSinceSent, viewUrl } = await request.json();

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: "Sommer's Sealcoating <proposals@sommersealcoating.com>",
      to: [to],
      subject: `Following up on Proposal ${proposalNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${clientName},</h2>
          <p>We wanted to follow up on your proposal ${proposalNumber} that we sent ${daysSinceSent} days ago.</p>
          <p>If you have any questions or would like to discuss the proposal, please don't hesitate to reach out.</p>
          <p style="text-align: center; padding: 20px;">
            <a href="${viewUrl}" style="background: #C41E3A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View Proposal
            </a>
          </p>
          <p>Best regards,<br>Sommer's Sealcoating Team</p>
        </div>
      `,
    }),
  });

  return new Response(JSON.stringify(await response.json()), {
    status: response.ok ? 200 : 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleSendReminder(request: Request, env: Env): Promise<Response> {
  const { to, clientName, proposalNumber, expiresIn, viewUrl } = await request.json();

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: "Sommer's Sealcoating <proposals@sommersealcoating.com>",
      to: [to],
      subject: `Reminder: Proposal ${proposalNumber} Expires Soon`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${clientName},</h2>
          <p>This is a friendly reminder that your proposal ${proposalNumber} will expire in <strong>${expiresIn} days</strong>.</p>
          <p>Don't miss out on this offer!</p>
          <p style="text-align: center; padding: 20px;">
            <a href="${viewUrl}" style="background: #C41E3A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View & Accept Proposal
            </a>
          </p>
          <p>Best regards,<br>Sommer's Sealcoating Team</p>
        </div>
      `,
    }),
  });

  return new Response(JSON.stringify(await response.json()), {
    status: response.ok ? 200 : 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============================================================================
// SMS HANDLER
// ============================================================================

async function handleSendSMS(request: Request, env: Env): Promise<Response> {
  const { to, message } = await request.json();

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: env.TWILIO_PHONE_NUMBER,
        Body: message,
      }),
    }
  );

  return new Response(JSON.stringify(await response.json()), {
    status: response.ok ? 200 : 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============================================================================
// STRIPE WEBHOOK HANDLER
// ============================================================================

async function handleStripeWebhook(request: Request, env: Env): Promise<Response> {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  // Verify webhook signature (simplified - use Stripe SDK in production)
  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing signature' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const event = JSON.parse(body);

  switch (event.type) {
    case 'payment_intent.succeeded':
      // Handle successful payment
      console.log('Payment succeeded:', event.data.object.id);
      // Update proposal status in Supabase
      break;

    case 'payment_intent.payment_failed':
      // Handle failed payment
      console.log('Payment failed:', event.data.object.id);
      break;

    default:
      console.log('Unhandled event type:', event.type);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============================================================================
// WEATHER HANDLER
// ============================================================================

async function handleWeatherRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');

  if (!lat || !lon) {
    return new Response(JSON.stringify({ error: 'Missing lat/lon' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${env.OPENWEATHERMAP_API_KEY}`
  );

  const data = await response.json();

  // Transform data for sealcoating work suitability
  const forecast = data.list.map((item: any) => ({
    date: item.dt_txt,
    temp: item.main.temp,
    humidity: item.main.humidity,
    precipitation: item.pop * 100,
    conditions: item.weather[0].main,
    workSuitable: 
      item.main.temp >= 50 && 
      item.main.temp <= 90 && 
      item.main.humidity < 85 && 
      item.pop < 0.3,
  }));

  return new Response(JSON.stringify({ forecast }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============================================================================
// PDF GENERATION HANDLER
// ============================================================================

async function handlePDFGeneration(request: Request, env: Env): Promise<Response> {
  // This would use a PDF generation service like PDFShift or Puppeteer
  // For now, return a placeholder
  return new Response(JSON.stringify({ message: 'PDF generation not implemented' }), {
    status: 501,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============================================================================
// FILE UPLOAD HANDLER
// ============================================================================

async function handleFileUpload(request: Request, env: Env): Promise<Response> {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return new Response(JSON.stringify({ error: 'No file provided' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Generate unique filename
  const ext = file.name.split('.').pop();
  const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
  const path = `uploads/${filename}`;

  // Upload to R2
  await env.PROPOSALS_BUCKET.put(path, file.stream(), {
    httpMetadata: {
      contentType: file.type,
    },
  });

  // Return public URL (configure R2 public access)
  const publicUrl = `https://images.sommersealcoating.com/${path}`;

  return new Response(JSON.stringify({ url: publicUrl, filename }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
