// frontend/src/components/ResponsiveForm.js
import React from 'react';
import { cn } from '../lib/utils';

export function ResponsiveFormRow({ children, className = '' }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
      {children}
    </div>
  );
}

export function ResponsiveFormGrid({ children, columns = 2, className = '' }) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn("grid gap-4", gridClasses[columns] || gridClasses[2], className)}>
      {children}
    </div>
  );
}

export function MobileFormStack({ children, className = '' }) {
  return (
    <div className={cn("flex flex-col space-y-4 md:space-y-0 md:flex-row md:gap-4", className)}>
      {children}
    </div>
  );
}

export function FormSection({ title, description, children, className = '' }) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="border-b-2 border-amber-200 pb-3">
          {title && (
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export function FormField({ label, error, required, children, className = '' }) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
}

export default { ResponsiveFormRow, ResponsiveFormGrid, MobileFormStack, FormSection, FormField };