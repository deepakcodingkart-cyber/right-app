import React, { useState, useCallback, useMemo } from 'react';
import {  useLoaderData } from '@remix-run/react';

// --- Placeholder Components ---
const Text = ({ children, variant, as, fontWeight, color }) => {
  const baseStyle = { fontSize: '14px', lineHeight: '20px' };
  if (fontWeight === 'semibold') baseStyle.fontWeight = '600';
  if (color === 'subdued') baseStyle.color = '#6b7280';
  if (variant === 'headingMd') baseStyle.fontSize = '18px';
  const Element = as || 'span';
  return <Element style={baseStyle}>{children}</Element>;
};

const Stack = ({ children, distribution, alignment, spacing }) => (
  <div style={{
    display: 'flex',
    alignItems: alignment === 'center' ? 'center' : 'flex-start',
    justifyContent: distribution === 'equalSpacing' ? 'space-between' : 'flex-start',
    gap: spacing === 'loose' ? '12px' : (spacing === 'tight' ? '4px' : '8px'),
  }}>{children}</div>
);

const SearchMinor = () => (
  <svg viewBox="0 0 20 20" className="w-5 h-5 text-gray-500" fill="currentColor" style={{ width: '20px', height: '20px', color: '#6b7280' }}>
    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.093l3.376 3.377a.75.75 0 01-1.06 1.06l-3.377-3.376A7 7 0 012 9z" clipRule="evenodd" />
  </svg>
);

const Page = ({ title, children }) => (
  <div style={{ padding: '24px', backgroundColor: '#f4f6f8' }}>
    <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px' }}>{title}</h1>
    {children}
  </div>
);

const Layout = ({ children }) => <div style={{ maxWidth: '700px', margin: '0 auto' }}>{children}</div>;
Layout.Section = ({ children }) => <div>{children}</div>;

const LegacyCard = ({ title, children }) => (
  <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
    <div style={{ padding: '16px', borderBottom: '1px solid #e1e3e5' }}>
      <Text variant="headingMd" as="h2" fontWeight="semibold">{title}</Text>
    </div>
    {children}
  </div>
);
LegacyCard.Section = ({ children }) => <div style={{ padding: '16px' }}>{children}</div>;

const Checkbox = ({ checked, indeterminate, label, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={onChange}>
    <input
      type="checkbox"
      checked={checked}
      ref={el => el && (el.indeterminate = indeterminate)}
      readOnly
      style={{ marginRight: '8px', minWidth: '16px', minHeight: '16px' }}
    />
    {label}
  </div>
);

const Thumbnail = ({ source, alt }) => (
  <img
    src={source}
    alt={alt}
    style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }}
  />
);

const Modal = ({ open, onClose, title, large, primaryAction, secondaryActions, children }) => {
  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        width: large ? '80%' : '50%',
        maxWidth: '900px',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e1e3e5' }}>
          <Text variant="headingMd" as="h3">{title}</Text>
        </div>
        {children}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e1e3e5',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
        }}>
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
};
Modal.Section = ({ children }) => <div style={{ flexGrow: 1 }}>{children}</div>;

const Button = ({ children, primary, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: '8px 16px',
      borderRadius: '4px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      backgroundColor: primary ? '#0070c0' : '#ffffff',
      color: primary ? '#ffffff' : '#333333',
      border: primary ? 'none' : '1px solid #ccc',
      opacity: disabled ? 0.6 : 1,
      minWidth: '80px',
      fontWeight: '600',
    }}
  >
    {children}
  </button>
);

// --- Product Components ---
function VariantRow({ variant, isSelected, onToggle }) {
  return (
    <div
      style={{
        padding: '8px 20px 8px 50px',
        borderBottom: '1px solid #e1e3e5',
        backgroundColor: '#f9fafb',
        cursor: 'pointer',
      }}
      onClick={() => onToggle(variant.id)}
    >
      <Stack distribution="equalSpacing" alignment="center">
        <Stack alignment="center" spacing="loose">
          <Checkbox 
            checked={isSelected} 
            label={<Text>{variant.title}</Text>} 
            onChange={() => onToggle(variant.id)} 
          />
        </Stack>
        <Text>{variant.available}</Text>
        <Text fontWeight="semibold">{variant.price}</Text>
      </Stack>
    </div>
  );
}

function ProductItem({ product, selectedItems, onToggleProduct, onToggleVariant }) {
  const variantIds = useMemo(() => product.variants.map(v => v.id), [product.variants]);
  const allVariantsSelected = variantIds.every(id => selectedItems.has(id));
  const isIndeterminate = !allVariantsSelected && variantIds.some(id => selectedItems.has(id));

  const handleProductToggle = useCallback(() => {
    onToggleProduct(product.id, variantIds, allVariantsSelected);
  }, [product.id, variantIds, allVariantsSelected, onToggleProduct]);

  return (
    <div style={{ borderBottom: '1px solid #e1e3e5' }}>
      <div style={{ padding: '12px 20px', cursor: 'pointer' }} onClick={handleProductToggle}>
        <Stack distribution="equalSpacing" alignment="center">
          <Stack alignment="center" spacing="loose">
            <Checkbox
              checked={allVariantsSelected}
              indeterminate={isIndeterminate}
              label={
                <Stack alignment="center" spacing="tight">
                  <Thumbnail source={product.image} alt={product.title} />
                  <Text fontWeight="semibold">{product.title}</Text>
                </Stack>
              }
              onChange={handleProductToggle}
            />
          </Stack>
          <Text></Text>
          <Text></Text>
        </Stack>
      </div>
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

// --- Main Component ---
export async function loader() {
  // This will be called on the server
  try {
    const response = await fetch('https://align-livecam-picnic-underground.trycloudflare.com/api/products');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading products:', error);
    return [];
  }
}

export default function DiscountProductSelector() {
  const { products: initialProducts = [] } = useLoaderData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productData, setProductData] = useState(initialProducts);
  const [searchText, setSearchText] = useState('');
  const [selectedVariantIds, setSelectedVariantIds] = useState(new Set());
  const [tempSelectedIds, setTempSelectedIds] = useState(new Set());

  const handleOpenModal = useCallback(async () => {
    setIsModalOpen(true);
    setTempSelectedIds(new Set(selectedVariantIds));
    // If you need to refetch products when modal opens, do it here
  }, [selectedVariantIds]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setTempSelectedIds(new Set(selectedVariantIds));
  }, [selectedVariantIds]);

  const handleConfirmSelection = useCallback(() => {
    setSelectedVariantIds(tempSelectedIds);
    setIsModalOpen(false);
  }, [tempSelectedIds]);

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

  const handleToggleProduct = useCallback((productId, variantIds, allSelected) => {
    setTempSelectedIds(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        variantIds.forEach(id => newSet.delete(id));
      } else {
        variantIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  }, []);

  const selectedCount = tempSelectedIds.size;
  const selectedDisplayContent = useMemo(() => {
    if (selectedCount === 0) return '';

    // Get the first selected item's title for display
    const firstSelectedId = Array.from(tempSelectedIds)[0];
    const allVariants = productData.flatMap(p => 
      p.variants.map(v => ({ ...v, productName: p.title }))
    );
    const firstSelectedItem = allVariants.find(v => v.id === firstSelectedId);

    if (selectedCount === 1 && firstSelectedItem) {
      return `${firstSelectedItem.productName} (${firstSelectedItem.title})`;
    }

    return `${selectedCount} items selected`;
  }, [tempSelectedIds, productData, selectedCount]);

  return (
    <Page title="Create Discount">
      <Layout>
        <Layout.Section>
          <LegacyCard title="Products to apply discount to">
            <LegacyCard.Section>
              <Text variant="headingMd" as="h3">Products</Text>
              <Stack spacing="extraTight" alignment="center">
                <div style={{ flexGrow: 1 }}>
                  <input
                    type="text"
                    placeholder="Search products"
                    value={selectedDisplayContent}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 40px',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                      background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.093l3.376 3.377a.75.75 0 01-1.06 1.06l-3.377-3.376A7 7 0 012 9z' clip-rule='evenodd'/%3E%3C/svg%3E") no-repeat 10px center`
                    }}
                  />
                </div>
                <Button onClick={handleOpenModal} primary>
                  Browse
                </Button>
              </Stack>
              {selectedCount > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <Text variant="bodySm" color="subdued">
                    Discount will apply to {selectedCount} specific product variant{selectedCount !== 1 ? 's' : ''}.
                  </Text>
                </div>
              )}
            </LegacyCard.Section>
          </LegacyCard>
        </Layout.Section>
      </Layout>

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
        <Modal.Section>
          <div style={{ padding: '0 20px 20px 20px' }}>
            <input
              type="text"
              placeholder="Search products..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 40px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.093l3.376 3.377a.75.75 0 01-1.06 1.06l-3.377-3.376A7 7 0 012 9z' clip-rule='evenodd'/%3E%3C/svg%3E") no-repeat 10px center`
              }}
            />
          </div>
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 100px 100px',
              padding: '12px 20px',
              backgroundColor: '#f9fafb',
              borderBottom: '2px solid #e1e3e5',
              fontWeight: 'bold',
              position: 'sticky',
              top: 0,
              zIndex: 1
            }}>
              <Text fontWeight="semibold">Product</Text>
              <Text fontWeight="semibold">Available</Text>
              <Text fontWeight="semibold">Price</Text>
            </div>
            <div>
              {productData
                .filter(p => p.title.toLowerCase().includes(searchText.toLowerCase()))
                .map(product => (
                  <ProductItem
                    key={product.id}
                    product={product}
                    selectedItems={tempSelectedIds}
                    onToggleProduct={handleToggleProduct}
                    onToggleVariant={handleToggleVariant}
                  />
                ))}
              {productData.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <Text color="subdued">No products found.</Text>
                </div>
              )}
            </div>
          </div>
        </Modal.Section>
      </Modal>
    </Page>
  );
}