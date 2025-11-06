/*
 * SAAS STRIPE WORKER - PACKAGE PURCHASES
 * =====================================
 *
 * Handles SaaS package purchases from the website (payment.html)
 * Uses email as identifier and stores metadata in Stripe for order fulfillment
 */

// ==============================================
// COMMON UTILITIES & SETUP
// ==============================================

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

function validateOrigin(origin, fallbackDomain) {
  if (!origin) {
    return fallbackDomain;
  }
  try {
    const url = new URL(origin);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1" ||
        url.hostname.endsWith(".workers.dev") || url.hostname.includes("inexasli") ||
        url.hostname.includes("github.io")) {
      return origin;
    }
  } catch (e) {
    // Logging removed
  }
  return fallbackDomain;
}
__name(validateOrigin, "validateOrigin");

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
__name(corsHeaders, "corsHeaders");

// ==============================================
// PACKAGE PURCHASE FLOW
// ==============================================

/**
 * Handles package purchases from the website (payment.html)
 * Uses email as identifier and stores full metadata in Stripe
 */
async function handlePackageCheckout(request, env) {
  try {
    const data = await request.json();
    const requestOrigin = request.headers.get("Origin");
    const validatedOrigin = env.DOMAIN_URL;

    // VALIDATE INPUTS - Prevent frontend manipulation
    // This ensures frontend can't send invalid package types, addon IDs, or platform counts
    // All pricing calculations happen server-side using hardcoded values
    const ALLOWED_PACKAGES = ['basic', 'social', 'pro', 'enterprise'];
    const ALLOWED_ADDONS = ['photos-10', 'videos-5', 'platform-extra', 'iterations-extra', 
                           'ai-content-generation', 'hybrid-mode', 'user-content-automation', 
                           'user-automation', 'user-content-only', 'basic-scheduling', 'reduced-frequency'];
    
    // Validate package type
    if (!ALLOWED_PACKAGES.includes(data.packageType)) {
      return new Response(JSON.stringify({ error: "Invalid package type" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders() }
      });
    }
    
    // Validate addons
    if (data.addons && !data.addons.every(addon => ALLOWED_ADDONS.includes(addon))) {
      return new Response(JSON.stringify({ error: "Invalid addon(s) specified" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders() }
      });
    }
    
    // Validate platforms array
    if (data.platforms && (!Array.isArray(data.platforms) || data.platforms.length > 10)) {
      return new Response(JSON.stringify({ error: "Invalid platforms specification" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders() }
      });
    }
    
    // Validate platform count against package limits
    const PLATFORM_LIMITS = { 'basic': 0, 'social': 1, 'pro': 2, 'enterprise': 3 };
    const maxAllowedPlatforms = PLATFORM_LIMITS[data.packageType] || 0;
    if (data.platforms && data.platforms.length > maxAllowedPlatforms + 5) { // Allow some reasonable extra
      return new Response(JSON.stringify({ error: "Too many platforms selected for package" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders() }
      });
    }
    const PACKAGE_DETAILS = {
      'basic': { name: 'Basic SaaS Package', amount: 9900, type: 'monthly' },
      'social': { name: 'Social SaaS Package', amount: 14900, type: 'monthly' },
      'pro': { name: 'Pro SaaS Package', amount: 29900, type: 'monthly' },
      'enterprise': { name: 'Enterprise SaaS Package', amount: 49900, type: 'monthly' }
    };

    // Addon details for dynamic price creation
    const ADDON_DETAILS = {
      'photos-10': { name: 'Extra 10 Photos Addon', amount: 1000, type: 'monthly' },
      'videos-5': { name: 'Extra 5 Videos Addon', amount: 2000, type: 'monthly' },
      'platform-extra': { name: 'Extra Platform Addon', amount: 500, type: 'monthly' },
      'iterations-extra': { name: 'Extra Iterations Addon', amount: 1500, type: 'monthly' },
      'ai-content-generation': { name: 'AI Content Generation Addon', amount: 2500, type: 'monthly' },
      'hybrid-mode': { name: 'Hybrid Content Mode Addon', amount: 3000, type: 'monthly' },
      'user-content-automation': { name: 'User Content Automation Addon', amount: 4000, type: 'monthly' },
      'user-automation': { name: 'User Automation Addon', amount: 4000, type: 'monthly' }
    };

    // Function to get or create price dynamically (updated for type)
    async function getOrCreatePrice(itemKey) {
      try {
        const details = PACKAGE_DETAILS[itemKey] || ADDON_DETAILS[itemKey];
        if (!details) throw new Error(`No details for ${itemKey}`);
        const { name, amount, type = 'monthly' } = details;

        // Check if product exists
        const productsResponse = await fetch('https://api.stripe.com/v1/products?active=true', {
          headers: { 'Authorization': `Bearer ${env.STRIPE_RESTRICTED_KEY}` }
        });
        const products = await productsResponse.json();
        let product = products.data.find(p => p.name === name);

        if (!product) {
          // Create product
          const createProductResponse = await fetch('https://api.stripe.com/v1/products', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${env.STRIPE_RESTRICTED_KEY}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `name=${encodeURIComponent(name)}&type=service`
          });
          product = await createProductResponse.json();
          console.log(`[SaaS Worker] Created product: ${product.id} for ${itemKey}`);
        }

        // Check if price exists
        const pricesResponse = await fetch(`https://api.stripe.com/v1/prices?product=${product.id}&active=true`, {
          headers: { 'Authorization': `Bearer ${env.STRIPE_RESTRICTED_KEY}` }
        });
        const prices = await pricesResponse.json();
        let price;
        if (type === 'monthly') {
          price = prices.data.find(p => p.unit_amount === amount && p.recurring?.interval === 'month');
        } else {
          price = prices.data.find(p => p.unit_amount === amount && !p.recurring);
        }

        if (!price) {
          // Create price
          let body = `product=${product.id}&unit_amount=${amount}&currency=usd`;
          if (type === 'monthly') {
            body += `&recurring[interval]=month`;
          }
          const createPriceResponse = await fetch('https://api.stripe.com/v1/prices', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${env.STRIPE_RESTRICTED_KEY}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body
          });
          price = await createPriceResponse.json();
          console.log(`[SaaS Worker] Created ${type} price: ${price.id} for ${itemKey} at $${amount/100}${type === 'monthly' ? '/month' : ''}`);
        }

        return price.id;
      } catch (error) {
        console.error(`[SaaS Worker] Error creating/getting price for ${itemKey}:`, error);
        throw error;
      }
    }

    // Package Price IDs mapping - now dynamic
    const PACKAGE_PRICES = {
      'basic': {
        monthly: await getOrCreatePrice('basic')
      },
      'social': {
        monthly: await getOrCreatePrice('social')
      },
      'pro': {
        monthly: await getOrCreatePrice('pro')
      },
      'enterprise': {
        monthly: await getOrCreatePrice('enterprise')
      }
    };    const ADDON_PRICES = {
      'photos-10': await getOrCreatePrice('photos-10'),
      'videos-5': await getOrCreatePrice('videos-5'),
      'platform-extra': await getOrCreatePrice('platform-extra'),
      'iterations-extra': await getOrCreatePrice('iterations-extra'),
      'ai-content-generation': await getOrCreatePrice('ai-content-generation'),
      'hybrid-mode': await getOrCreatePrice('hybrid-mode'),
      'user-content-automation': await getOrCreatePrice('user-content-automation'),
      'user-automation': await getOrCreatePrice('user-automation'),
      'user-content-only': 'discount',
      'basic-scheduling': 'discount',
      'reduced-frequency': 'discount'
    };

    // Define included addons for each package type (these should not be charged)
    const INCLUDED_ADDONS = {
      'basic': [],
      'social': ['photos-10', 'videos-5'],
      'pro': ['photos-10', 'videos-5', 'iterations-extra', 'ai-content-generation'],
      'enterprise': ['photos-10', 'videos-5', 'iterations-extra', 'ai-content-generation', 'white-label-chat']
    };

    // Build line items
    const lineItems = [];
    const packagePrices = PACKAGE_PRICES[data.packageType];

    if (packagePrices) {
      if (packagePrices.setup) {
        lineItems.push({ price: packagePrices.setup, quantity: 1 });
      }
      if (packagePrices.monthly) {
        lineItems.push({ price: packagePrices.monthly, quantity: 1 });
      }
    }

    // Process addons
    let totalDiscountAmount = 0;
    const appliedDiscountNames = [];
    const includedAddonsForPackage = INCLUDED_ADDONS[data.packageType] || [];

    if (data.addons && data.addons.length > 0) {
      data.addons.forEach(addonId => {
        const addonPriceId = ADDON_PRICES[addonId];
        if (addonPriceId && addonPriceId !== 'discount') {
          // Only charge for addons that are NOT included in the package
          if (!includedAddonsForPackage.includes(addonId)) {
            lineItems.push({ price: addonPriceId, quantity: 1 });
          }
        } else if (addonPriceId === 'discount') {
          const discountAmounts = {
            'user-content-only': 2000,
            'basic-scheduling': 2500,
            'reduced-frequency': 1500
          };
          const discountAmount = discountAmounts[addonId] || 0;
          totalDiscountAmount += discountAmount;
          appliedDiscountNames.push(addonId);
          console.log(`[SaaS Worker] PACKAGE FLOW: Processing discount addon ${addonId}, amount: $${discountAmount/100}, totalDiscountAmount now: $${totalDiscountAmount/100}`);
        }
      });
    }

    totalDiscountAmount = Math.min(totalDiscountAmount, 5000);

    if (lineItems.length === 0) {
      return new Response(JSON.stringify({ error: "No valid items found" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders() }
      });
    }

    // Create Stripe checkout session
    const stripeUrl = "https://api.stripe.com/v1/checkout/sessions";
    const formData = new URLSearchParams();

    formData.append("payment_method_types[]", "card");

    // Add line items
    lineItems.forEach((item, index) => {
      formData.append(`line_items[${index}][price]`, item.price);
      formData.append(`line_items[${index}][quantity]`, item.quantity.toString());
    });

    // Handle discounts
    if (totalDiscountAmount > 0) {
      console.log(`[SaaS Worker] PACKAGE FLOW: Creating coupon for total discount: $${totalDiscountAmount/100}, applied to: ${appliedDiscountNames.join(', ')}`);
      try {
        const couponName = `Combined Discount $${(totalDiscountAmount / 100).toFixed(2)}`;
        const couponId = `combined_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const couponParams = new URLSearchParams({
          id: couponId,
          amount_off: totalDiscountAmount.toString(),
          currency: "usd",
          duration: "repeating",
          duration_in_months: "120",
          name: couponName,
          'metadata[applied_discounts]': appliedDiscountNames.join(','),
          'metadata[total_discount_amount]': totalDiscountAmount.toString(),
          'metadata[created_for_session]': "true"
        });

        const couponResponse = await fetch("https://api.stripe.com/v1/coupons", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.STRIPE_RESTRICTED_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: couponParams.toString()
        });

        if (couponResponse.ok) {
          const coupon = await couponResponse.json();
          console.log("[SaaS Worker] PACKAGE FLOW: Created dynamic coupon:", coupon.id);
          formData.append('discounts[0][coupon]', coupon.id);
          console.log("[SaaS Worker] PACKAGE FLOW: Attached coupon to checkout session:", coupon.id);
        } else {
          const errorText = await couponResponse.text();
          console.error("[SaaS Worker] PACKAGE FLOW: Coupon creation failed:", couponResponse.status, errorText);
        }
      } catch (error) {
        console.error("[SaaS Worker] PACKAGE FLOW: Error creating coupon:", error);
      }
    }

    // Determine payment mode - all our prices are monthly recurring
    const paymentMode = "subscription";
    formData.append("mode", paymentMode);
    
    // Only allow promotion codes if no discounts are applied (avoids Stripe conflict)
    if (totalDiscountAmount === 0) {
      formData.append("allow_promotion_codes", "true");
    }

    // Package-specific URLs
    const successUrl = `${validatedOrigin}/product/payment/redirectUrl.html?session_id={CHECKOUT_SESSION_ID}`;
    formData.append("success_url", successUrl);
    formData.append("cancel_url", `${validatedOrigin}/product/payment/redirectUrl.html?canceled=true`);

    formData.append("customer_email", data.customerEmail);
    formData.append("billing_address_collection", "required");
    formData.append("client_reference_id", data.customerEmail);

    // PACKAGE FLOW: Session metadata (for logs and debugging)
    formData.append("metadata[customer_email]", data.customerEmail);
    formData.append("metadata[package_type]", data.packageType);
    formData.append("metadata[flow_type]", "service");
    if (data.platforms) {
      formData.append("metadata[platforms]", data.platforms.join(','));
    }
    if (data.addons && data.addons.length > 0) {
      formData.append("metadata[addons]", data.addons.join(','));
    }

    // PACKAGE FLOW: Subscription metadata (for webhook processing)
    if (paymentMode === "subscription") {
      formData.append("subscription_data[metadata][package_type]", data.packageType);
      formData.append("subscription_data[metadata][customer_email]", data.customerEmail);
      formData.append("subscription_data[metadata][flow_type]", "service");
      formData.append("subscription_data[metadata][order_date]", new Date().toISOString());

      if (data.platforms) {
        formData.append("subscription_data[metadata][platforms]", data.platforms.join(','));
      }

      if (data.addons && data.addons.length > 0) {
        formData.append("subscription_data[metadata][addons]", data.addons.join(','));
      }

      // Add customization data to subscription metadata (since we can't use payment_intent_data in subscription mode)
      if (data.customization) {
        Object.entries(data.customization).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            const metadataValue = Array.isArray(value) || typeof value === 'object'
              ? JSON.stringify(value)
              : String(value);
            formData.append(`subscription_data[metadata][customization_${key}]`, metadataValue);
          }
        });
        formData.append("subscription_data[metadata][customization_data]", JSON.stringify(data.customization));
      }
    }

    // PACKAGE FLOW: Customer creation (only for payment mode, not subscription mode)
    if (paymentMode === "payment") {
      formData.append("customer_creation", "always");
    }

    // PACKAGE FLOW: Customization metadata (for order fulfillment)
    if (data.customization) {
      console.log("[SaaS Worker] PACKAGE FLOW: Adding customization metadata");

      // Add to session metadata
      Object.entries(data.customization).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          const metadataValue = Array.isArray(value) || typeof value === 'object'
            ? JSON.stringify(value)
            : String(value);
          formData.append(`metadata[customization_${key}]`, metadataValue);
        }
      });
      formData.append("metadata[customization_data]", JSON.stringify(data.customization));
    }

    // PACKAGE FLOW: Payment Intent metadata (only for payment mode, not subscription mode)
    // This appears in Stripe > Payments when you click on the transaction
    if (paymentMode === "payment") {
      formData.append("payment_intent_data[metadata][customer_email]", data.customerEmail);
      formData.append("payment_intent_data[metadata][package_type]", data.packageType);
      formData.append("payment_intent_data[metadata][flow_type]", "service");
      formData.append("payment_intent_data[metadata][order_date]", new Date().toISOString());

      if (data.platforms) {
        formData.append("payment_intent_data[metadata][platforms]", data.platforms.join(','));
      }

      if (data.addons && data.addons.length > 0) {
        formData.append("payment_intent_data[metadata][addons]", data.addons.join(','));
      }

      // Add full customization data to payment intent for customer service reference
      if (data.customization) {
        console.log("[SaaS Worker] PACKAGE FLOW: Adding customization to payment intent metadata");

        // Add individual customization fields
        Object.entries(data.customization).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            const metadataValue = Array.isArray(value) || typeof value === 'object'
              ? JSON.stringify(value)
              : String(value);
            formData.append(`payment_intent_data[metadata][customization_${key}]`, metadataValue);
          }
        });

        // Add complete customization JSON for full context
        formData.append("payment_intent_data[metadata][customization_data]", JSON.stringify(data.customization));
      }
    }

    const stripeResponse = await fetch(stripeUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.STRIPE_RESTRICTED_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData.toString()
    });

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text();
      console.error("[SaaS Worker] PACKAGE FLOW: Stripe API error:", errorText);
      return new Response(JSON.stringify({ error: "Failed to create checkout session" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() }
      });
    }

    const session = await stripeResponse.json();

    console.log("[SaaS Worker] PACKAGE FLOW: Session created successfully", {
      sessionId: session.id,
      url: session.url
    });

    return new Response(JSON.stringify({
      success: true,
      sessionId: session.id,
      url: session.url
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders() }
    });

  } catch (error) {
    console.error("[SaaS Worker] PACKAGE FLOW: Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() }
    });
  }
}
__name(handlePackageCheckout, "handlePackageCheckout");

// ==============================================
// PRICE MANAGEMENT
// ==============================================

async function handleCreatePrices(request, env) {
  try {
    console.log("[SaaS Worker] Creating new prices for updated package rates and addons");

    // First, try to list existing prices
    let existingPrices = [];
    try {
      const listResponse = await fetch("https://api.stripe.com/v1/prices?limit=100", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${env.STRIPE_RESTRICTED_KEY}`,
        }
      });
      
      if (listResponse.ok) {
        const pricesData = await listResponse.json();
        existingPrices = pricesData.data || [];
        console.log(`[SaaS Worker] Found ${existingPrices.length} existing prices`);
      }
    } catch (error) {
      console.log("[SaaS Worker] Could not list existing prices:", error.message);
    }

    const newPackagePrices = [
      {
        id: "basic_monthly_new",
        nickname: "Basic Chat Monthly - New Rate",
        unit_amount: 9900, // $99.00 in cents
        currency: "cad",
        recurring: { interval: "month" },
        product_data: {
          name: "Basic Chat - Monthly Subscription",
          description: "AI chat widget for websites - Monthly subscription"
        }
      },
      {
        id: "social_monthly_new",
        nickname: "Social Starter Monthly - New Rate",
        unit_amount: 14900, // $149.00 in cents
        currency: "cad",
        recurring: { interval: "month" },
        product_data: {
          name: "Social Starter - Monthly Subscription",
          description: "AI chat + AI-generated social content - Monthly subscription"
        }
      },
      {
        id: "pro_monthly_new",
        nickname: "Professional Monthly - New Rate",
        unit_amount: 29900, // $299.00 in cents
        currency: "cad",
        recurring: { interval: "month" },
        product_data: {
          name: "Professional - Monthly Subscription",
          description: "Advanced AI automation - Monthly subscription"
        }
      },
      {
        id: "enterprise_monthly_new",
        nickname: "Enterprise Monthly - New Rate",
        unit_amount: 49900, // $499.00 in cents
        currency: "cad",
        recurring: { interval: "month" },
        product_data: {
          name: "Enterprise - Monthly Subscription",
          description: "Full enterprise AI automation - Monthly subscription"
        }
      }
    ];

    const newAddonPrices = [
      {
        id: "photos_10_new",
        nickname: "+10 Photo Storage",
        unit_amount: 5000, // $50.00 in cents
        currency: "cad",
        product_data: {
          name: "Extra Photo Storage",
          description: "+10 additional photo storage capacity"
        }
      },
      {
        id: "videos_5_new",
        nickname: "+5 Video Storage",
        unit_amount: 7500, // $75.00 in cents
        currency: "cad",
        product_data: {
          name: "Extra Video Storage",
          description: "+5 additional video storage capacity"
        }
      },
      {
        id: "iterations_extra_new",
        nickname: "+10 Content Refinements",
        unit_amount: 15000, // $150.00 in cents
        currency: "cad",
        product_data: {
          name: "Extra Content Refinements",
          description: "+10 additional content refinement iterations"
        }
      },
      {
        id: "ai_content_generation_new",
        nickname: "AI Content Generation",
        unit_amount: 20000, // $200.00 in cents
        currency: "cad",
        product_data: {
          name: "AI Content Generation",
          description: "Advanced AI content generation capabilities"
        }
      },
      {
        id: "white_label_chat_new",
        nickname: "White-label Chat",
        unit_amount: 15000, // $150.00 in cents
        currency: "cad",
        product_data: {
          name: "White-label Chat",
          description: "Custom branded chat interface"
        }
      }
    ];

    // Try to create a test price for basic package
    let testPriceId = null;
    try {
      // First create a product
      const productResponse = await fetch("https://api.stripe.com/v1/products", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.STRIPE_RESTRICTED_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          name: 'Test Basic Package',
          description: 'Test package for SaaS worker'
        }).toString()
      });

      if (productResponse.ok) {
        const product = await productResponse.json();
        console.log(`[SaaS Worker] Created test product: ${product.id}`);

        // Now create a price for this product
        const priceResponse = await fetch("https://api.stripe.com/v1/prices", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.STRIPE_RESTRICTED_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            unit_amount: "9900",
            currency: "cad",
            product: product.id,
            nickname: "Test Basic Monthly",
            'recurring[interval]': 'month'
          }).toString()
        });

        if (priceResponse.ok) {
          const price = await priceResponse.json();
          testPriceId = price.id;
          console.log(`[SaaS Worker] Created test price: ${testPriceId}`);
        } else {
          console.log(`[SaaS Worker] Price creation failed: ${priceResponse.status}`);
          const errorText = await priceResponse.text();
          console.log(`[SaaS Worker] Price error: ${errorText}`);
        }
      } else {
        console.log(`[SaaS Worker] Product creation failed: ${productResponse.status}`);
        const errorText = await productResponse.text();
        console.log(`[SaaS Worker] Product error: ${errorText}`);
      }
    } catch (error) {
      console.log(`[SaaS Worker] Error creating test price:`, error.message);
    }

    // Create package prices
    for (const priceData of newPackagePrices) {
      try {
        const response = await fetch("https://api.stripe.com/v1/prices", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.STRIPE_RESTRICTED_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            unit_amount: priceData.unit_amount.toString(),
            currency: priceData.currency,
            nickname: priceData.nickname,
            'recurring[interval]': priceData.recurring.interval,
            'product_data[name]': priceData.product_data.name
          }).toString()
        });

        if (!response.ok) {
          const error = await response.text();
          console.error(`[SaaS Worker] Failed to create package price ${priceData.id}:`, error);
          continue;
        }

        const price = await response.json();
        createdPrices.push({
          type: "package",
          package: priceData.id.replace('_monthly_new', ''),
          priceId: price.id,
          amount: priceData.unit_amount / 100,
          nickname: price.nickname
        });

        console.log(`[SaaS Worker] Created package price: ${price.id} for ${priceData.id}`);

      } catch (error) {
        console.error(`[SaaS Worker] Error creating package price ${priceData.id}:`, error);
      }
    }

    // Create addon prices
    for (const addonData of newAddonPrices) {
      try {
        const response = await fetch("https://api.stripe.com/v1/prices", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.STRIPE_RESTRICTED_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            unit_amount: addonData.unit_amount.toString(),
            currency: addonData.currency,
            nickname: addonData.nickname,
            'product_data[name]': addonData.product_data.name
          }).toString()
        });

        if (!response.ok) {
          const error = await response.text();
          console.error(`[SaaS Worker] Failed to create addon price ${addonData.id}:`, error);
          continue;
        }

        const price = await response.json();
        createdAddons.push({
          type: "addon",
          addon: addonData.id.replace('_new', '').replace('_', '-'),
          priceId: price.id,
          amount: addonData.unit_amount / 100,
          nickname: price.nickname
        });

        console.log(`[SaaS Worker] Created addon price: ${price.id} for ${addonData.id}`);

      } catch (error) {
        console.error(`[SaaS Worker] Error creating addon price ${addonData.id}:`, error);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: testPriceId ? `Test price created: ${testPriceId}` : "Could not create test price",
      testPriceId: testPriceId,
      packages: testPriceId ? [{
        type: "package",
        package: "basic",
        priceId: testPriceId,
        amount: 99,
        nickname: "Test Basic Monthly"
      }] : [],
      addons: [],
      allPrices: testPriceId ? [{
        id: testPriceId,
        nickname: "Test Basic Monthly",
        amount: 99,
        currency: "cad"
      }] : [],
      instructions: "Use the testPriceId for testing package checkout"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders() }
    });

  } catch (error) {
    console.error("[SaaS Worker] Error in handleCreatePrices:", error);
    return new Response(JSON.stringify({ error: "Failed to create prices" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() }
    });
  }
}
__name(handleCreatePrices, "handleCreatePrices");

async function sendPackageOrderNotification(orderData, env) {
  try {
    const notification = `
🎉 NEW PACKAGE ORDER RECEIVED!

Customer: ${orderData.customerName} (${orderData.customerEmail})
Package: ${orderData.packageType}
Platforms: ${orderData.platforms?.join(', ') || 'None'}
Add-ons: ${orderData.addons?.length ? orderData.addons.join(', ') : 'None'}
Total: $${orderData.amount}
Payment ID: ${orderData.paymentIntentId}
Session ID: ${orderData.sessionId}

ACTION REQUIRED: Begin customer setup process within 24 hours
    `;

    console.log("[SaaS Worker] PACKAGE FLOW: Team notification:", notification);

    // Here you could add email/Slack notification logic
    // await sendEmailNotification(orderData, env);
    // await sendSlackNotification(notification, env);

  } catch (error) {
    console.error("[SaaS Worker] PACKAGE FLOW: Error sending notification:", error);
  }
}
__name(sendPackageOrderNotification, "sendPackageOrderNotification");

// ==============================================
// CHECK PAYMENT STATUS
// ==============================================

async function handleCheckPayment(sessionId, env) {
  try {
    console.log("[SaaS Worker] CHECK PAYMENT: Verifying session", { sessionId });

    if (!sessionId) {
      return new Response(JSON.stringify({
        success: false,
        paymentStatus: 'failed',
        message: 'No session ID provided'
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders() }
      });
    }

    // Retrieve checkout session from Stripe
    const sessionUrl = `https://api.stripe.com/v1/checkout/sessions/${sessionId}`;
    const sessionResponse = await fetch(sessionUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${env.STRIPE_RESTRICTED_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error("[SaaS Worker] CHECK PAYMENT: Failed to retrieve session:", errorText);
      return new Response(JSON.stringify({
        success: false,
        paymentStatus: 'failed',
        message: 'Unable to verify payment session'
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() }
      });
    }

    const session = await sessionResponse.json();
    console.log("[SaaS Worker] CHECK PAYMENT: Session status", {
      sessionId,
      paymentStatus: session.payment_status,
      mode: session.mode
    });

    // Check payment status
    if (session.payment_status === 'paid') {
      const packageType = session.metadata?.package_type;
      const customerEmail = session.customer_details?.email;

      // SaaS package purchase - return success with package info
      return new Response(JSON.stringify({
        success: true,
        paymentStatus: 'paid',
        packageType,
        customerEmail,
        flow: 'service',
        message: 'Package purchase completed successfully'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        paymentStatus: session.payment_status,
        message: `Payment status: ${session.payment_status}`
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() }
      });
    }

  } catch (error) {
    console.error("[SaaS Worker] CHECK PAYMENT: Error:", error);
    return new Response(JSON.stringify({
      success: false,
      paymentStatus: 'failed',
      message: 'Payment verification error'
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() }
    });
  }
}
__name(handleCheckPayment, "handleCheckPayment");

// ==============================================
// WEBHOOK HANDLERS
// ==============================================

async function handlePackageSale(session, env) {
  try {
    const customerId = session.customer;
    const packageType = session.metadata?.package_type;
    const platforms = session.metadata?.platforms?.split(',') || [];
    const addons = session.metadata?.addons?.split(',').filter(Boolean) || [];
    const customerEmail = session.customer_details?.email;
    const customerName = session.customer_details?.name;
    const amount = session.amount_total / 100; // Convert from cents

    console.log("[SaaS Worker] PACKAGE FLOW: Processing package order", {
      sessionId: session.id,
      customerId,
      packageType,
      platforms,
      addons,
      customerEmail,
      amount
    });

    // Update customer metadata for order fulfillment
    if (customerId) {
      try {
        const customerUrl = `https://api.stripe.com/v1/customers/${customerId}`;
        const updateParams = new URLSearchParams();

        // Add basic order metadata
        updateParams.append('metadata[customer_email]', customerEmail || '');
        updateParams.append('metadata[package_type]', packageType || '');
        updateParams.append('metadata[flow_type]', 'service');
        updateParams.append('metadata[order_date]', new Date().toISOString());
        updateParams.append('metadata[platforms]', platforms.join(','));
        updateParams.append('metadata[addons]', addons.join(','));
        updateParams.append('metadata[total_order_value]', amount.toString());
        updateParams.append('metadata[setup_status]', 'pending');

        // Add customization metadata from session
        if (session.metadata?.customization_data) {
          updateParams.append('metadata[customization_data]', session.metadata.customization_data);
        }

        // Add individual customization fields
        Object.keys(session.metadata || {}).forEach(key => {
          if (key.startsWith('customization_') && key !== 'customization_data') {
            updateParams.append(`metadata[${key}]`, session.metadata[key]);
          }
        });

        const customerResponse = await fetch(customerUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.STRIPE_RESTRICTED_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: updateParams.toString()
        });

        if (customerResponse.ok) {
          console.log("[SaaS Worker] PACKAGE FLOW: Customer metadata updated successfully");
        } else {
          console.error("[SaaS Worker] PACKAGE FLOW: Failed to update customer metadata:", await customerResponse.text());
        }
      } catch (error) {
        console.error("[SaaS Worker] PACKAGE FLOW: Error updating customer metadata:", error);
      }
    }

    // Send notification to team
    await sendPackageOrderNotification({
      sessionId: session.id,
      paymentIntentId: session.payment_intent,
      customerId,
      customerEmail,
      customerName,
      packageType,
      platforms,
      addons,
      amount
    }, env);

    console.log("[SaaS Worker] PACKAGE FLOW: Order processed successfully");

    return {
      success: true,
      type: 'package_sale',
      sessionId: session.id,
      customerId,
      packageType,
      platforms,
      addons,
      amount,
      action: "package_order_created"
    };
  } catch (error) {
    console.error("[SaaS Worker] PACKAGE FLOW: Error processing package order:", error);
    return { success: false, error: error.message };
  }
}
__name(handlePackageSale, "handlePackageSale");

// ==============================================
// FILE UPLOAD HANDLER
// ==============================================

/**
 * Handles file uploads to R2 storage for role documents
 * Processes multipart form data and stores files in R2 bucket
 * Returns JSON with file URLs for integration with Stripe metadata
 */
async function handleFileUpload(request, env) {
  try {
    console.log("[SaaS Worker] FILE UPLOAD: Processing file upload request");

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const formData = await request.formData();
    const brandName = formData.get('brandName') || 'unknown';
    const uploadedFiles = [];

    // Process each file in the form data
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        const fileUrl = await uploadFileToR2(value, env.CLIENT_BUCKET, env, brandName);
        uploadedFiles.push({
          originalName: value.name,
          size: value.size,
          type: value.type,
          url: fileUrl,
          fieldName: key
        });
      }
    }

    console.log(`[SaaS Worker] FILE UPLOAD: Successfully uploaded ${uploadedFiles.length} files`);

    return new Response(JSON.stringify({
      success: true,
      files: uploadedFiles
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('[SaaS Worker] FILE UPLOAD: Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
__name(handleFileUpload, "handleFileUpload");

/**
 * Handles individual file upload to R2 bucket
 * @param {File} file - The file to upload
 * @param {R2Bucket} bucket - The R2 bucket instance
 * @returns {string} The public URL of the uploaded file
 */
async function uploadFileToR2(file, bucket, env, brandName = 'unknown') {
  // Check if R2 bucket is available
  if (!bucket) {
    console.warn("[SaaS Worker] R2 bucket not configured, skipping file upload");
    // Return a placeholder URL for now
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    return `https://placeholder.inexasli.com/${timestamp}-${randomId}.${fileExtension}`;
  }

  // Generate unique filename with client folder prefix
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const fileExtension = file.name.split('.').pop();
  const sanitizedBrand = brandName.replace(/[^a-zA-Z0-9-_]/g, '_'); // Sanitize brand name
  const fileName = `${sanitizedBrand}/docs/${timestamp}_${file.name}`;

  // Upload to R2
  await bucket.put(fileName, file.stream(), {
    httpMetadata: {
      contentType: file.type,
      contentDisposition: `attachment; filename="${file.name}"`,
    },
  });

  // Return the public URL (assuming R2 public bucket or custom domain)
  // For production, this should use a custom domain or R2 public URL
  const publicUrl = `https://${env.R2_PUBLIC_DOMAIN}/${fileName}`;

  return publicUrl;
}
__name(uploadFileToR2, "uploadFileToR2");

// ==============================================
// TEMPLATE DOWNLOAD HANDLER
// ==============================================

/**
 * Handles downloading role templates as ZIP
 * Fetches selected templates from R2 and returns template data as JSON
 */
async function handleDownloadTemplates(request, env) {
  try {
    const url = new URL(request.url);
    const rolesParam = url.searchParams.get('roles');
    
    if (!rolesParam) {
      return new Response(JSON.stringify({ error: "No roles specified" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders() }
      });
    }
    
    const selectedRoles = rolesParam.split(',').map(r => r.trim());
    console.log(`[SaaS Worker] TEMPLATE DOWNLOAD: Downloading templates for roles: ${selectedRoles.join(', ')}`);
    
    // Fetch templates from R2 bucket
    const templates = {};
    const bucket = env.ROLE_DOCS_BUCKET;
    
    if (!bucket) {
      console.error('[SaaS Worker] TEMPLATE DOWNLOAD: ROLE_DOCS_BUCKET not configured');
      return new Response(JSON.stringify({ error: "Template storage not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() }
      });
    }
    
    // Fetch each selected template from R2
    for (const role of selectedRoles) {
      try {
        // Convert role name from customization.html format to knowledge file format
        // e.g., "sales-assistant" -> "sales_assistant_template.txt"
        const fileName = role.replace(/-/g, '_') + '_template.txt';
        const object = await bucket.get(fileName);
        if (object) {
          const content = await object.text();
          templates[role] = content;
          console.log(`[SaaS Worker] TEMPLATE DOWNLOAD: Fetched template for ${role} from ${fileName}`);
        } else {
          console.warn(`[SaaS Worker] TEMPLATE DOWNLOAD: Template not found for ${role} (looked for ${fileName})`);
          // Skip missing templates - don't add to response
        }
      } catch (error) {
        console.error(`[SaaS Worker] TEMPLATE DOWNLOAD: Error fetching template for ${role}:`, error);
        // Continue with other templates
      }
    }
    
    if (Object.keys(templates).length === 0) {
      return new Response(JSON.stringify({ error: "No templates found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders() }
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      templates: templates,
      roles: selectedRoles
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error) {
    console.error('[SaaS Worker] TEMPLATE DOWNLOAD: Error:', error);
    return new Response(JSON.stringify({ error: "Failed to download templates" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() }
    });
  }
}
__name(handleDownloadTemplates, "handleDownloadTemplates");

// ==============================================
// MAIN REQUEST ROUTER
// ==============================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    // Route requests to appropriate handlers
    if (pathname === "/webhook" && request.method === "POST") {
      // Handle SaaS package webhooks
      try {
        const event = await request.json();
        if (event.type === 'checkout.session.completed') {
          const session = event.data.object;
          if (session.metadata?.flow_type === 'service') {
            const result = await handlePackageSale(session, env);
            return new Response(JSON.stringify(result), {
              status: 200,
              headers: { "Content-Type": "application/json", ...corsHeaders() }
            });
          }
        }
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders() }
        });
      } catch (error) {
        console.error("[SaaS Worker] Webhook error:", error);
        return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() }
        });
      }
    }

    if (pathname === "/upload-files" && request.method === "POST") {
      return await handleFileUpload(request, env);
    }
    if (pathname === "/download-templates" && request.method === "GET") {
      return await handleDownloadTemplates(request, env);
    }    if (pathname === "/create-prices" && request.method === "POST") {
      return await handleCreatePrices(request, env);
    }

    if (pathname === "/list-prices" && request.method === "GET") {
      try {
        const response = await fetch("https://api.stripe.com/v1/prices", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${env.STRIPE_RESTRICTED_KEY}`,
          }
        });

        if (!response.ok) {
          return new Response(JSON.stringify({ error: "Failed to list prices" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders() }
          });
        }

        const prices = await response.json();
        return new Response(JSON.stringify({
          success: true,
          prices: prices.data.map(p => ({
            id: p.id,
            nickname: p.nickname,
            amount: p.unit_amount / 100,
            currency: p.currency,
            product: p.product
          }))
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders() }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to list prices" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders() }
        });
      }
    }

    if (pathname === "/package-checkout" && request.method === "POST") {
      return await handlePackageCheckout(request, env);
    }

    if (request.method === "POST") {
      // Check if it's a checkPayment request
      try {
        const requestClone = request.clone();
        const data = await requestClone.json();
        if (data.task === 'checkPayment') {
          return await handleCheckPayment(data.sessionId, env);
        }
      } catch (e) {
        // If JSON parsing fails, continue to default handler
      }
    }

    // Handle other requests
    if (request.method === "GET") {
      return new Response("SaaS Stripe Worker - Package Payments", {
        status: 200,
        headers: { "Content-Type": "text/plain", ...corsHeaders() }
      });
    }

    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders()
    });
  }
};