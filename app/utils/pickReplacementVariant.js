export function pickReplacementVariant(subscriptionLineItems, products) {
  try {
    if (!subscriptionLineItems?.length || !products?.length) {
      console.warn("⚠️ Missing subscription items or products");
      return null;
    }

    const firstItem = subscriptionLineItems[0];
    let extractedSize = null;
    let extractedTaste = null;

    // Extract size and taste from variant options
    if (firstItem.variant_options?.length) {
      firstItem.variant_options.forEach(opt => {
        const lower = opt.toLowerCase();
        if (/\d+\s?(g|gram|kg|ml)/.test(lower)) {
          extractedSize = lower;
        }
        if (/light|medium|dark/.test(lower)) {
          extractedTaste = lower;
        }
      });
    } 
    // Extract from variant title if options not available
    else if (firstItem.variant_title) {
      const lowerTitle = firstItem.variant_title.toLowerCase();
      
      const sizeMatch = lowerTitle.match(/(\d+\s?(g|gram|kg|ml))/);
      if (sizeMatch) {
        extractedSize = sizeMatch[0];
      }
      
      const tasteMatch = lowerTitle.match(/(light|medium|dark)\s*roast/);
      if (tasteMatch) {
        extractedTaste = tasteMatch[0];
      }
    }

    console.log(`🔍 Looking for variant with size: ${extractedSize}, taste: ${extractedTaste}`);

    // Find matching variant
    let replacementVariant = null;
    outer: for (const product of products) {
      if (!product.variants?.nodes) continue;

      for (const variant of product.variants.nodes) {
        // Build options map
        const opts = (variant.selectedOptions || []).reduce((acc, o) => {
          acc[o.name.toLowerCase().trim()] = o.value.toLowerCase().trim();
          return acc;
        }, {});

        // Skip subscription variants
        const isSubscription =
          (variant.title || "").toLowerCase().includes("subscription") ||
          (product.title || "").toLowerCase().includes("subscription");
        
        if (isSubscription) continue;

        // Check for size and taste match
        const sizeMatch = 
          (opts.size || "").includes(extractedSize) || 
          (variant.title || "").toLowerCase().includes(extractedSize);
        
        const tasteMatch = 
          (opts.taste || "").includes(extractedTaste) || 
          (variant.title || "").toLowerCase().includes(extractedTaste);

        if (sizeMatch && tasteMatch) {
          replacementVariant = variant;
          console.log(`✅ Found matching variant: ${variant.id}`);
          break outer;
        }
      }
    }

    if (!replacementVariant) {
      console.warn("⚠️ No matching replacement variant found");
    }

    return replacementVariant;

  } catch (error) {
    console.error("❌ Error in pickReplacementVariant:", error.message);
    return null;
  }
}