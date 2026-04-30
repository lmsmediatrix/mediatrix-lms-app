'use client';

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type MoveDownProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    path1: {
      initial: { y: 0 },
      animate: {
        y: [0, 1.2, 0],
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
    },
    path2: {
      initial: { y: 0 },
      animate: {
        y: [0, 1.2, 0],
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
    },
  } satisfies Record<string, Variants>,
} as const;

const IconComponent = React.forwardRef<SVGSVGElement, MoveDownProps>(
  ({ size, ...props }, ref) => {
    const { controls } = useAnimateIconContext();
    const variants = getVariants(animations);

    return (
      <motion.svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <motion.path
          d="M12 5v13"
          variants={variants.path1}
          initial="initial"
          animate={controls}
        />
        <motion.path
          d="m7 13 5 5 5-5"
          variants={variants.path2}
          initial="initial"
          animate={controls}
        />
      </motion.svg>
    );
  },
);

IconComponent.displayName = 'MoveDownIconComponent';

function MoveDown(props: MoveDownProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  MoveDown,
  MoveDown as MoveDownIcon,
  type MoveDownProps,
  type MoveDownProps as MoveDownIconProps,
};

