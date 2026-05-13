import React, { forwardRef } from 'react';
import { cn } from '../../utils/helpers';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', padding = 'md', className, ...props }, ref) => {
    const variants = {
      default: 'bg-white border border-gray-100',
      outlined: 'bg-transparent border-2 border-gray-200',
      elevated: 'bg-white shadow-lg',
    };

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={cn('rounded-2xl transition-shadow duration-200', variants[variant], paddings[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4';
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, as: Component = 'h3', className, ...props }, ref) => (
    <Component ref={ref} className={cn('text-xl font-semibold text-gray-900', className)} {...props}>
      {children}
    </Component>
  )
);

CardTitle.displayName = 'CardTitle';

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn('text-gray-600', className)} {...props}>
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn('mt-4 pt-4 border-t border-gray-100', className)} {...props}>
      {children}
    </div>
  )
);

CardFooter.displayName = 'CardFooter';
