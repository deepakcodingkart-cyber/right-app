import { Webhook } from "svix";

// Helper function to create a modern JSON Response
function createJsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status: status,
        headers: {
            "Content-Type": "application/json",
        },
    });
}

// 1. Setup (assuming WEBHOOK_SECRET is defined in .env)
const WEBHOOK_SECRET = process.env.APPSTLE_WEBHOOK_SECRET;
if (!WEBHOOK_SECRET) {
    throw new Error("APPSTLE_WEBHOOK_SECRET must be set for webhook verification.");
}
const wh = new Webhook(WEBHOOK_SECRET);

/**
 * The default Action handler for the Remix route.
 */
export async function action({ request }) {
    console.log("Webhook endpoint hit - working!");

    if (request.method !== "POST") {
        return createJsonResponse({ message: "Method Not Allowed" }, 405);
    }

    // CRITICAL: Read the raw body text first for Svix verification
    const bodyText = await request.text();

    // CORRECTED: Read the specific header names from your log (webhook-id, etc.)
    const svixId = request.headers.get("webhook-id");
    const svixTimestamp = request.headers.get("webhook-timestamp");
    const svixSignature = request.headers.get("webhook-signature");

    // Log the corrected headers to confirm they are found
    console.log("svixId is ", svixId); // Should now show a value
    console.log("svixTimestamp is ", svixTimestamp); // Should now show a value
    console.log("svixSignature is ", svixSignature); // Should now show a value

    if (!svixId || !svixTimestamp || !svixSignature) {
        console.error("❌ Svix Headers Missing. Check Appstle/Svix configuration.");
        return createJsonResponse({ message: "Unauthorized: Missing Svix headers" }, 401);
    }

    // 2. Security Check (Verification)
    let payload;
    try {
        // bodyText (raw string) is passed here for verification
        payload = wh.verify(bodyText, {
            "webhook-id": svixId, // Use correct header name here too
            "webhook-timestamp": svixTimestamp, // Use correct header name here too
            "webhook-signature": svixSignature, // Use correct header name here too
        });
    } catch (err) {
        console.error("❌ Svix Webhook signature verification failed:", err);
        // This is where you would return 401 if the SECRET KEY is wrong
        return createJsonResponse({ message: "Unauthorized: Invalid signature" }, 401);
    }

    // 3. Process the Verified Payload
    try {
        const eventType = payload.type;
        const appstleData = payload.data;
        console.log("appstleData is ", appstleData);
        // const lineItems = appstleData.lines.nodes;
        // console.log("lineItems is ", lineItems);
        console.log("eventType is ", eventType);

        // --- CONSOLE LOGIC FOR 'subscription.created' ---
        if (eventType === "subscription.created") {
            // Note: The Appstle payload uses 'id' for the contract, not 'subscription_id'.
            // The plan/billing details are nested deeper in the lines/policies.
            const subscriptionId = appstleData.id;
            const customerEmail = appstleData.customer.email;
            const customerShopifyId = appstleData.customer.id;
            const planName = appstleData.lines.nodes[0].sellingPlanName; // Get plan name from line item
            const billingInterval = appstleData.billingPolicy.interval;
            const billingFrequency = appstleData.billingPolicy.intervalCount;

            console.log(`
====================================================================
✅ SUBSCRIPTION CREATED (Appstle Webhook)
====================================================================
[Appstle ID]:       ${subscriptionId}
[Customer Email]:   ${customerEmail}
[Shopify Customer]: ${customerShopifyId}

[Plan Name]:        ${planName}
[Billing Cycle]:    Bill every ${billingFrequency} ${billingInterval}(s)
====================================================================
            `);
        }
        // --- 2. BILLING SUCCESS (Delivery Cycle for Prepaid Plan) ---
        else if (eventType === "subscription.billing-success") {
            console.log("subscription.billing-success", appstleData);
            // Yeh event tab fire hota hai jab payment ya cycle successfully complete ho jata hai.

            const subscriptionId = appstleData.id;
            // const customerEmail = appstleData.customer.email;

            console.log(`
====================================================================
✅ BILLING SUCCESS (Next Delivery Cycle Triggered) 🚀
====================================================================
[Subscription ID]:  ${subscriptionId}

[ACTION]:           Payment/Cycle was successful. **NEW DELIVERY ORDER IS CREATED.**
====================================================================
    `);

        }
        // --- 3. BILLING FAILURE (Delivery Cycle for Prepaid Plan) ---
        else if (eventType === "subscription.billing-failure") {
            console.log("subscription.billing-failure", appstleData);
            // Yeh event tab fire hota hai jab payment ya cycle successfully complete ho jata hai.
            const subscriptionId = appstleData.id;
            // const customerEmail = appstleData.customer.email;
            const planName = appstleData.lines.nodes[0].sellingPlanName; // Get plan name from line item
            const billingInterval = appstleData.billingPolicy.interval;
            const billingFrequency = appstleData.billingPolicy.intervalCount;

            console.log(`
====================================================================
✅ BILLING FAILURE (Next Delivery Cycle Triggered) 🚀
====================================================================
[Subscription ID]:  ${subscriptionId}
[Plan Name]:        ${planName}
[Billing Cycle]:    Bill every ${billingFrequency} ${billingInterval}(s)
[ACTION]:           Payment/Cycle was failed. **NEW DELIVERY ORDER IS CREATED.**
====================================================================
    `);

        }
        else {
            console.log(`✅ Webhook received: ${eventType}`);
        }

        // Return a 200 OK response
        return createJsonResponse({ message: "Webhook received and processed" }, 200);

    } catch (error) {
        console.error("Error processing payload:", error);
        return createJsonResponse({ message: "Internal Server Error" }, 500);
    }
}