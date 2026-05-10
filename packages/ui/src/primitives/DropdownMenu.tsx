'use client';

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode,
} from 'react';
import { cn } from '../utils/cn';

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;

export const DropdownMenuContent = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(function DropdownMenuContent(
  { className, sideOffset = 8, align = 'end', ...rest },
  ref,
) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        className={cn(
          'z-50 min-w-[12rem] overflow-hidden rounded-xl border border-outline bg-surface-container-high p-1 shadow-lg',
          'data-[state=open]:animate-fade-in',
          'focus-visible:outline-none',
          className,
        )}
        {...rest}
      />
    </DropdownMenuPrimitive.Portal>
  );
});

export interface DropdownMenuItemProps
  extends ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
  /** Optional leading icon node. */
  icon?: ReactNode;
  /** Optional trailing meta (shortcut hint, badge). */
  meta?: ReactNode;
  variant?: 'default' | 'danger';
}

export const DropdownMenuItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Item>,
  DropdownMenuItemProps
>(function DropdownMenuItem(
  { className, icon, meta, variant = 'default', children, ...rest },
  ref,
) {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none transition-colors',
        variant === 'danger'
          ? 'text-danger-600 data-[highlighted]:bg-danger-50 data-[highlighted]:text-danger-700'
          : 'text-neutral-700 data-[highlighted]:bg-surface-container data-[highlighted]:text-neutral-900',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...rest}
    >
      {icon ? <span className="text-neutral-500">{icon}</span> : null}
      <span className="flex-1 truncate">{children}</span>
      {meta ? <span className="text-xs text-neutral-400">{meta}</span> : null}
    </DropdownMenuPrimitive.Item>
  );
});

export function DropdownMenuLabel({
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>) {
  return (
    <DropdownMenuPrimitive.Label
      className={cn(
        'px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400',
        className,
      )}
      {...rest}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn('-mx-1 my-1 h-px bg-outline-variant', className)}
      {...rest}
    />
  );
}
