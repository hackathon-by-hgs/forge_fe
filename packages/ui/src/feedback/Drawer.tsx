'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { cn } from '../utils/cn';
import { DialogOverlay, DialogPortal } from './Dialog';

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;

export interface DrawerContentProps
  extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: 'right' | 'left';
  width?: string;
}

export const DrawerContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(function DrawerContent(
  { className, children, side = 'right', width = 'w-[480px]', ...rest },
  ref,
) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed inset-y-0 z-50 flex h-full flex-col border-outline bg-surface-container-high shadow-lg',
          'data-[state=open]:animate-fade-in',
          side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
          width,
          className,
        )}
        {...rest}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});

export function DrawerHeader({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-start justify-between gap-4 border-b border-neutral-100 px-5 py-4',
        className,
      )}
      {...rest}
    />
  );
}

export function DrawerTitle({
  className,
  ...rest
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <DialogPrimitive.Title
      className={cn('text-base font-semibold text-neutral-900', className)}
      {...rest}
    />
  );
}

export function DrawerDescription({
  className,
  ...rest
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-sm text-neutral-500', className)}
      {...rest}
    />
  );
}

export function DrawerBody({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex-1 overflow-y-auto px-5 py-4', className)} {...rest} />
  );
}

export function DrawerFooter({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-end gap-2 border-t border-neutral-100 px-5 py-3',
        className,
      )}
      {...rest}
    />
  );
}
