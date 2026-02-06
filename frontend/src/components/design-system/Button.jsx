import React from 'react';
import './Button.css';

/**
 * Button Component - Reusable Design System Component
 * Week 3: Design System Implementation
 * 
 * Variants: primary, secondary, danger, success
 * Sizes: sm, md, lg
 * States: default, hover, active, disabled
 */

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  onClick,
  ...props
}) => {
  const baseClass = 'btn';
  const variantClass = `btn--${variant}`;
  const sizeClass = `btn--${size}`;
  const widthClass = fullWidth ? 'btn--full-width' : '';
  const loadingClass = loading ? 'btn--loading' : '';

  const combinedClassName = [
    baseClass,
    variantClass,
    sizeClass,
    widthClass,
    loadingClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={combinedClassName}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <span className="btn__loader" />}
      
      {Icon && iconPosition === 'left' && (
        <Icon className="btn__icon btn__icon--left" aria-hidden="true" />
      )}
      
      <span className="btn__text">{children}</span>
      
      {Icon && iconPosition === 'right' && (
        <Icon className="btn__icon btn__icon--right" aria-hidden="true" />
      )}
    </button>
  );
};

export default Button;
