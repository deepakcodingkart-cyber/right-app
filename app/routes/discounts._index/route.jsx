import React, { useState, useCallback, useMemo } from 'react';
import {  useLoaderData } from '@remix-run/react';

function transformShopifyProducts(shopifyData) {
  console.log(1213543,shopifyData)
  // Extract the products array from the data object
  const products = shopifyData?.products || shopifyData || [];
  
  if (!Array.isArray(products)) {
    console.error('Expected an array of products, but got:', typeof products, products);
    return [];
  }

  return products.map((product, index) => {
    // Generate a simple product ID
    const productId = product.id && product.id.includes('/Product/') 
      ? `p${product.id.split('/').pop()}` 
      : `p${index + 1}`;

    // Transform variants - handle cases where variants might be empty or undefined
    const transformedVariants = Array.isArray(product.variants) 
      ? product.variants.map((variant, variantIndex) => {
          const variantId = variant.id && variant.id.includes('/ProductVariant/')
            ? `v${variant.id.split('/').pop()}`
            : `v${(index + 1) * 100 + variantIndex + 1}`;

          // Generate variant title
          let variantTitle = variant.title || 'Default';
          
          // Calculate availability - using random values as fallback since we don't see the actual variant structure
          const available = variant.availableForSale !== false 
            ? (variant.quantityAvailable || Math.floor(Math.random() * 50) + 5)
            : 0;

          // Format price
          let price = '$0.00';
          if (variant.price) {
            if (typeof variant.price === 'string') {
              price = `$${parseFloat(variant.price).toFixed(2)}`;
            } else if (variant.price.amount) {
              price = `$${parseFloat(variant.price.amount).toFixed(2)}`;
            }
          } else {
            // Fallback price if not available in variant data
            price = `$${(Math.random() * 100 + 10).toFixed(2)}`;
          }

          return {
            id: variantId,
            title: variantTitle,
            available: available,
            price: price
          };
        })
      : [
          // Fallback variant if no variants are provided
          {
            id: `v${(index + 1) * 100 + 1}`,
            title: 'Default',
            available: Math.floor(Math.random() * 50) + 5,
            price: `$${(Math.random() * 100 + 10).toFixed(2)}`
          }
        ];

    return {
      id: productId,
      title: product.title || `Product ${index + 1}`,
      image: product.image || 'https://placehold.co/32x32/CCCCCC/ffffff?text=No+Image',
      variants: transformedVariants
    };
  });
}

// Usage examples:
// Option 1: If you have the full data object
// const transformedData = transformShopifyProducts(yourData);

// Option 2: If you want to extract products first
// const transformedData = transformShopifyProducts(yourData.products);

// Option 3: Safe extraction
// const productsArray = yourData?.products || [];
// const transformedData = transformShopifyProducts(productsArray);

// Usage example:
// const transformedData = transformShopifyProducts(yourShopifyData.products);

// --- Mock Data ---
const MOCK_PRODUCTS = [
  {
    id: 'p1',
    title: "Vintage Denim Jacket",
    image: "https://placehold.co/32x32/2563eb/ffffff?text=J",
    variants: [
      { id: 'v101', title: "Small / Blue", available: 15, price: "$59.99" },
      { id: 'v102', title: "Medium / Blue", available: 22, price: "$59.99" },
      { id: 'v103', title: "Large / Blue", available: 8, price: "$64.99" },
    ],
  },
  {
    id: 'p2',
    title: "Graphic Cotton Tee",
    image: "https://placehold.co/32x32/ef4444/ffffff?text=T",
    variants: [
      { id: 'v201', title: "White / S", available: 45, price: "$24.99" },
      { id: 'v202', title: "Black / M", available: 30, price: "$24.99" },
    ],
  },
  {
    id: 'p3',
    title: "Leather Messenger Bag",
    image: "https://placehold.co/32x32/10b981/ffffff?text=B",
    variants: [
      { id: 'v301', title: "Brown", available: 10, price: "$129.00" },
      { id: 'v302', title: "Black", available: 5, price: "$129.00" },
    ],
  },
];

// --- Standalone Component Replacements ---

// Custom styled Button component
const Button = ({ children, primary, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      px-4 py-2 rounded-lg font-semibold transition-colors duration-200 shadow-sm
      ${primary
        ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
      }
    `}
  >
    {children}
  </button>
);

// Custom Checkbox component with indeterminate support
const Checkbox = React.forwardRef(({ checked, indeterminate, label, onChange }, ref) => (
  <label className="flex items-center cursor-pointer space-x-2 p-1 rounded-md hover:bg-gray-50" onClick={onChange}>
    <input
      type="checkbox"
      checked={checked}
      ref={el => el && (el.indeterminate = indeterminate)}
      readOnly
      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
    />
    <span className="text-sm font-medium text-gray-900">{label}</span>
  </label>
));

// Simple Thumbnail component
const Thumbnail = ({ source, alt }) => (
  <img
    src={source}
    alt={alt}
    className="w-8 h-8 rounded-md object-cover border border-gray-200"
  />
);

// Product Variant Row in the Modal
function VariantRow({ variant, isSelected, onToggle }) {
  return (
    <div
      className="p-3 pl-12 border-b border-gray-100 bg-gray-50 hover:bg-gray-100 cursor-pointer"
      onClick={() => onToggle(variant.id)}
    >
      <div className="flex justify-between items-center text-sm">
        <Checkbox
          checked={isSelected}
          label={<span>{variant.title}</span>}
          onChange={() => onToggle(variant.id)}
        />
        <span className="text-gray-600 w-24 text-right">{variant.available}</span>
        <span className="font-semibold w-24 text-right">{variant.price}</span>
      </div>
    </div>
  );
}

// Full Product Item with All Variants
function ProductItem({ product, selectedItems, onToggleProduct, onToggleVariant }) {
  const variantIds = useMemo(() => product.variants.map(v => v.id), [product.variants]);
  
  // Check selection status based on temporary set
  const allVariantsSelected = variantIds.every(id => selectedItems.has(id));
  const isIndeterminate = !allVariantsSelected && variantIds.some(id => selectedItems.has(id));

  const handleProductToggle = useCallback(() => {
    // Determine if we should select all or deselect all
    onToggleProduct(variantIds, allVariantsSelected);
  }, [variantIds, allVariantsSelected, onToggleProduct]);

  return (
    <div className="border-b border-gray-200">
      {/* Product Header Row */}
      <div className="p-3 pl-5 bg-white hover:bg-gray-50 cursor-pointer" onClick={handleProductToggle}>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3 w-full">
            <Checkbox
              checked={allVariantsSelected}
              indeterminate={isIndeterminate}
              label={
                <div className="flex items-center space-x-2">
                  <Thumbnail source={product.image} alt={product.title} />
                  <span className="font-semibold text-gray-800">{product.title}</span>
                </div>
              }
              onChange={handleProductToggle}
            />
          </div>
          {/* Empty columns for alignment with variant data columns */}
          <div className="w-24"></div>
          <div className="w-24"></div>
        </div>
      </div>
      
      {/* Variant Rows */}
      {product.variants.map(variant => (
        <VariantRow
          key={variant.id}
          variant={variant}
          isSelected={selectedItems.has(variant.id)}
          onToggle={onToggleVariant}
        />
      ))}
    </div>
  );
}

export async function loader() {
  // This will be called on the server
  try {
    const response = await fetch('https://chair-basically-locally-notification.trycloudflare.com/api/products');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading products:', error);
    return [];
  }
}

// Custom Modal Component
function Modal({ open, onClose, title, large, primaryAction, secondaryActions, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div
        className={`bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] ${large ? 'w-[90%] max-w-5xl' : 'w-full max-w-xl'}`}
        onClick={e => e.stopPropagation()} // Prevent closing on content click
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-grow overflow-y-auto">
          {children}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
          {secondaryActions?.map((action, index) => (
            <Button key={index} onClick={action.onAction} disabled={action.disabled}>
              {action.content}
            </Button>
          ))}
          {primaryAction && (
            <Button primary onClick={primaryAction.onAction} disabled={primaryAction.disabled}>
              {primaryAction.content}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
Modal.Section = ({ children }) => <div className="p-5">{children}</div>;

// NEW: Component for displaying a single selected variant in the summary list
function SelectedVariantRow({ variant, onRemove }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center space-x-3 w-3/4">
                <Thumbnail source={variant.productImage} alt={variant.productTitle} />
                <div>
                    <p className="text-sm font-medium text-gray-800">{variant.productTitle}</p>
                    <p className="text-xs text-gray-500">{variant.title}</p>
                    <p className="text-sm font-semibold text-blue-600 mt-1">{variant.price}</p>
                </div>
            </div>
            <button 
                onClick={() => onRemove(variant.id)}
                className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition duration-150"
                title="Remove variant"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>
    );
}

export default function DiscountProductSelector() {
  const { products: initialProducts = [] } = useLoaderData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productData, setProductData] = useState(initialProducts);
  const [searchText, setSearchText] = useState('');
  
  // This holds the CONFIRMED (saved) selection of variant IDs
  const [confirmedVariantIds, setConfirmedVariantIds] = useState(new Set());
  
  // This holds the TEMPORARY (in-modal) selection of variant IDs
  const [tempSelectedIds, setTempSelectedIds] = useState(new Set());

  // --- Modal Handlers ---
  
  // Open the modal and initialize temporary selection from confirmed selection
  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
    setTempSelectedIds(new Set(confirmedVariantIds));
  }, [confirmedVariantIds]);

  // Close the modal and discard temporary changes
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Confirm selection: update confirmed state with temporary state
  const handleConfirmSelection = useCallback(() => {
    setConfirmedVariantIds(tempSelectedIds);
    setIsModalOpen(false);
  }, [tempSelectedIds]);

  // Toggle single variant in the temporary set
  const handleToggleVariant = useCallback((variantId) => {
    setTempSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(variantId)) {
        newSet.delete(variantId);
      } else {
        newSet.add(variantId);
      }
      return newSet;
    });
  }, []);

  // Toggle all variants for a product in the temporary set
  const handleToggleProduct = useCallback((variantIds, allSelected) => {
    setTempSelectedIds(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        // Deselect all
        variantIds.forEach(id => newSet.delete(id));
      } else {
        // Select all
        variantIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  }, []);

  // NEW: Handler to remove a variant from the confirmed list
  const handleRemoveVariant = useCallback((variantId) => {
    setConfirmedVariantIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(variantId);
        return newSet;
    });
  }, []);
  
  // --- Display Logic for Confirmed Selection ---
  
  const confirmedCount = confirmedVariantIds.size;
  
  // Memoized content for the main input field display
  const confirmedDisplayContent = useMemo(() => {
    if (confirmedCount === 0) return '';

    const firstSelectedId = Array.from(confirmedVariantIds)[0];
    const allVariants = productData.flatMap(p => 
      p.variants.map(v => ({ ...v, productName: p.title }))
    );
    const firstSelectedItem = allVariants.find(v => v.id === firstSelectedId);

    if (confirmedCount === 1 && firstSelectedItem) {
      return `${firstSelectedItem.productName} (${firstSelectedItem.title})`;
    }

    return `${confirmedCount} items selected`;
  }, [confirmedVariantIds, productData, confirmedCount]);

  // NEW: Memoized data for the display list (confirmed items)
  const confirmedVariantsData = useMemo(() => {
    // 1. Flatten all variants from all products into a single map for quick lookup
    const variantMap = new Map();
    productData.forEach(p => {
        p.variants.forEach(v => {
            variantMap.set(v.id, {
                ...v,
                productTitle: p.title,
                productImage: p.image,
            });
        });
    });

    // 2. Filter and map only the confirmed selected variants
    return Array.from(confirmedVariantIds)
        .map(id => variantMap.get(id))
        .filter(variant => variant);
  }, [confirmedVariantIds, productData]);
  
  // Filtered products for the modal
  const filteredProducts = useMemo(() => {
    return productData.filter(p => 
      p.title.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [productData, searchText]);


  return (
    <div className="p-6 bg-gray-100 min-h-screen font-sans">
      <script src="https://cdn.tailwindcss.com"></script>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Create Discount</h1>
      
      <div className="max-w-3xl mx-auto">
        
        {/* Main Card Section */}
        <div className="bg-white rounded-xl shadow-lg mb-6 border border-gray-200">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Products to apply discount to</h2>
          </div>
          <div className="p-5">
            <h3 className="text-lg font-medium mb-3">Products</h3>
            
            {/* Browse Section */}
            <div className="flex items-center space-x-3">
              <div className="relative flex-grow">
                <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.093l3.376 3.377a.75.75 0 01-1.06 1.06l-3.377-3.376A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
                <input
                  type="text"
                  placeholder="Select products and variants"
                  value={confirmedDisplayContent} 
                  readOnly
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                />
              </div>
              <Button onClick={handleOpenModal} primary>
                Browse
              </Button>
            </div>
            
            {/* Summary Count and Separator */}
            {confirmedCount > 0 && (
              <div className="mt-3 pb-3 border-b border-gray-200">
                <p className="text-sm text-gray-500">
                  Discount will apply to <span className="font-semibold">{confirmedCount}</span> specific product variant{confirmedCount !== 1 ? 's' : ''}.
                </p>
              </div>
            )}
            
            {/* NEW: Selected Products List Display */}
            {confirmedCount > 0 && (
                <div className="mt-4 max-h-72 overflow-y-auto border border-gray-200 rounded-lg bg-white p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Selected Variants ({confirmedCount})</h4>
                    <div className="divide-y divide-gray-100">
                        {confirmedVariantsData.map(variant => (
                            <SelectedVariantRow 
                                key={variant.id} 
                                variant={variant} 
                                onRemove={handleRemoveVariant} 
                            />
                        ))}
                    </div>
                </div>
            )}
            
          </div>
        </div>
        
      </div>

      {/* Product Selection Modal (Unchanged) */}
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        title="Select products and variants"
        large
        primaryAction={{
          content: `Add ${tempSelectedIds.size} item${tempSelectedIds.size !== 1 ? 's' : ''}`, 
          onAction: handleConfirmSelection,
          disabled: tempSelectedIds.size === 0,
        }}
        secondaryActions={[{
          content: 'Cancel',
          onAction: handleCloseModal,
        }]}
      >
        <div className="p-5 border-b border-gray-200">
            <div className="relative">
                <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.093l3.376 3.377a.75.75 0 01-1.06 1.06l-3.377-3.376A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                />
            </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {/* Table Header */}
          <div className="sticky top-0 bg-gray-100 border-b-2 border-gray-300 shadow-sm z-10">
            <div className="grid grid-cols-[1fr_100px_100px] p-3 pl-5 text-sm font-bold text-gray-600">
              <span>Product</span>
              <span className="text-right">Available</span>
              <span className="text-right">Price</span>
            </div>
          </div>

          {/* Product List */}
          <div className="divide-y divide-gray-200">
            {filteredProducts.map(product => (
              <ProductItem
                key={product.id}
                product={product}
                selectedItems={tempSelectedIds}
                onToggleProduct={handleToggleProduct}
                onToggleVariant={handleToggleVariant}
              />
            ))}
            
            {filteredProducts.length === 0 && (
              <div className="p-5 text-center">
                <p className="text-gray-500">No products match your search term.</p>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
