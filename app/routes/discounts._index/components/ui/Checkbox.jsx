// @ts-nocheck
import React from 'react';

const Checkbox = React.forwardRef(({ checked, indeterminate, label, onChange }, ref) => (
  <label className="flex items-center cursor-pointer space-x-2 p-1 rounded-md hover:bg-gray-50" onClick={onChange}>
    <input
      type="checkbox"
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = !!indeterminate;
        if (typeof ref === 'function') ref(el);
        else if (ref && typeof ref === 'object') {
          // @ts-ignore
          ref.current = el;
        }
      }}
      readOnly
      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
    />
    <span className="text-sm font-medium text-gray-900">{label}</span>
  </label>
));

export default Checkbox;