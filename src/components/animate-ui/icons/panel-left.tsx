'use client';

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type PanelLeftProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    path1: {},
    path2: {
      initial: {
        x: 0,
      },
      animate: {
        x: [-1, 0, -1],
        transition: {
          duration: 0.35,
          ease: 'easeInOut',
        },
      },
    },
    path3: {
      initial: {
        x: 0,
      },
      animate: {
        x: [-1, 0, -1],
        transition: {
          duration: 0.35,
          ease: 'easeInOut',
        },
      },
    },
    path4: {
      initial: {
        x: 0,
      },
      animate: {
        x: [-0.5, 0, -0.5],
        transition: {
          duration: 0.35,
          ease: 'easeInOut',
        },
      },
    },
  } satisfies Record<string, Variants>,
} as const;

const IconComponent = React.forwardRef<SVGSVGElement, PanelLeftProps>(
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
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <motion.path
          d="M3 5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2z"
          variants={variants.path1}
          initial="initial"
          animate={controls}
        />
        <motion.path
          d="M9 3v18"
          variants={variants.path2}
          initial="initial"
          animate={controls}
        />
        <motion.path
          d="M5 9h2"
          variants={variants.path3}
          initial="initial"
          animate={controls}
        />
        <motion.path
          d="M5 15h2"
          variants={variants.path4}
          initial="initial"
          animate={controls}
        />
      </motion.svg>
    );
  },
);

IconComponent.displayName = 'PanelLeftIconComponent';

function PanelLeft(props: PanelLeftProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  PanelLeft,
  PanelLeft as PanelLeftIcon,
  type PanelLeftProps,
  type PanelLeftProps as PanelLeftIconProps,
};
