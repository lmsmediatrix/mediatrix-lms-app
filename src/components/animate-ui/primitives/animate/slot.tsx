'use client';

import * as React from 'react';
import { motion, isMotionComponent, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';

type AnyProps = Record<string, unknown>;

type DOMMotionProps = Omit<HTMLMotionProps<keyof HTMLElementTagNameMap>, 'ref'>;

type WithAsChild<Base extends object> =
  | (Base & { asChild: true; children: React.ReactElement })
  | (Base & { asChild?: false | undefined });

type SlotProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children?: any;
} & DOMMotionProps;

function mergeRefs<T>(
  ...refs: (React.Ref<T> | undefined)[]
): React.RefCallback<T> {
  return (node) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') {
        ref(node);
      } else {
        (ref as React.MutableRefObject<T | null>).current = node;
      }
    });
  };
}

function mergeProps(childProps: AnyProps, slotProps: DOMMotionProps): AnyProps {
  const merged: AnyProps = { ...childProps, ...slotProps };

  if (childProps.className || slotProps.className) {
    merged.className = cn(
      childProps.className as string,
      slotProps.className as string,
    );
  }

  if (childProps.style || slotProps.style) {
    merged.style = {
      ...(childProps.style as React.CSSProperties),
      ...(slotProps.style as React.CSSProperties),
    };
  }

  return merged;
}

const Slot = React.forwardRef<HTMLElement, SlotProps>(
  ({ children, ...props }, forwardedRef) => {
    if (!React.isValidElement(children)) return null;

    const childType = children.type as React.ElementType;
    const isAlreadyMotion =
      typeof childType === 'object' &&
      childType !== null &&
      isMotionComponent(childType);

    const Base = isAlreadyMotion ? childType : motion.create(childType);

    const childProps = children.props as AnyProps;
    const childRef = (
      children as React.ReactElement & { ref?: React.Ref<HTMLElement> }
    ).ref;

    const mergedProps = mergeProps(
      childProps,
      props as DOMMotionProps,
    );

    return <Base {...mergedProps} ref={mergeRefs(childRef, forwardedRef)} />;
  },
);

Slot.displayName = 'Slot';

export {
  Slot,
  type SlotProps,
  type WithAsChild,
  type DOMMotionProps,
  type AnyProps,
};
