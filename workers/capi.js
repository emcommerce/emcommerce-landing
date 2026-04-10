// Cloudflare Worker - CAPI Server-Side Event Forwarding
// Deploy this at: emcommerce.online/api/capi
// Route: Workers Routes -> emcommerce.online/api/*

const META_PIXEL_ID = '2177371456363308';
const META_CAPI_TOKEN = 'EAAQFPP44SBUBREDIZCEDlqpy6OgZCG4gl4iwdyk7ZBeWwfgANvZB7lZCZCmo0dYUAlpY7ZCu7gWyTZAiUFSDqQQFnXb75wl7IBGbIZCOMKV5FYRApDckEkWoXgjJP4tmj7PMRxj8m1qd9V7ZBOuuQXgrrmeYrn8vKdGI6ZAmWm3XPbLlHP9zTeKzduSmdN2JJK82WjuNwZDZD';
const META_CAPI_URL = `https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events`;

// Simple SHA-256 hash for user data anonymization
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': 'https://emcommerce.online',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    const {
      event_name,
      event_id,
      event_source_url,
      user_data = {},
      content_name,
      value,
      currency = 'IDR',
    } = body;

    if (!event_name || !event_id) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Build user_data with hashed client_user_agent
    const builtUserData = {};
    if (user_data.client_user_agent) {
      builtUserData.client_user_agent = user_data.client_user_agent;
    }
    if (user_data.fbc) builtUserData.fbc = user_data.fbc;
    if (user_data.fbp) builtUserData.fbp = user_data.fbp;

    // Get client IP from Cloudflare header
    const clientIp = request.headers.get('CF-Connecting-IP');
    if (clientIp) {
      builtUserData.client_ip_address = clientIp;
    }

    // Build CAPI payload
    const capiPayload = {
      data: [{
        event_name: event_name,
        event_id: event_id,
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: event_source_url || 'https://emcommerce.online',
        action_source: 'website',
        user_data: builtUserData,
        custom_data: {
          content_name: content_name || 'Olshop Hack Premium',
          content_ids: ['olshop-hack-119'],
          currency: currency,
          value: value || 119000,
        }
      }],
      test_event_code: env.TEST_EVENT_CODE || undefined // Remove after testing
    };

    // Remove undefined test_event_code
    if (!capiPayload.test_event_code) {
      delete capiPayload.test_event_code;
    }

    // Forward to Meta CAPI
    const metaResponse = await fetch(`${META_CAPI_URL}?access_token=${META_CAPI_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(capiPayload)
    });

    const metaResult = await metaResponse.json();

    return new Response(JSON.stringify({ success: true, meta: metaResult }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://emcommerce.online',
      }
    });
  }
};
