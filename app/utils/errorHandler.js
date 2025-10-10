// app/utils/errorHandler.js

export class AppError extends Error {
  constructor(message, { layer = "GENERAL", context = {}, originalError = null } = {}) {
    super(message);
    this.name = "AppError";
    this.layer = layer;        // SERVICE, CONTROLLER, WEBHOOK
    this.context = context;    // orderId, variantId, payload etc.
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }
}

export const handleError = async (error) => {
  if (error instanceof AppError) {
    console.error(`\n🔥 [${error.layer} ERROR] at ${error.timestamp}`);
    console.error("Message:", error.message);
    console.error("Context:", JSON.stringify(error.context, null, 2));
    if (error.originalError) {
      console.error("Original error:", error.originalError.stack || error.originalError);
    }
  } else {
    console.error("\n🔥 [UNCAUGHT ERROR]");
    console.error(error.stack || error);
  }
};

