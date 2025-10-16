// @ts-nocheck
import React from 'react';
import Button from './Button';

function Modal({ open, onClose, title, large, primaryAction, secondaryActions, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div
        className={`bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] ${large ? 'w-[90%] max-w-5xl' : 'w-full max-w-xl'}`}
        onClick={e => e.stopPropagation()}
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

export default Modal;