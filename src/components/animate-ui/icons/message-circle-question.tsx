'use client';

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type MessageCircleQuestionProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    path1: {
      initial: {
        scale: 1,
      },
      animate: {
        scale: [1, 1.04, 1],
        transition: {
          duration: 0.3,
          ease: 'easeInOut',
        },
      },
    },
    path2: {
      initial: {
        y: 0,
      },
      animate: {
        y: [0, -0.8, 0],
        transition: {
          duration: 0.3,
          ease: 'easeInOut',
        },
      },
    },
    path3: {
      initial: {
        opacity: 1,
      },
      animate: {
        opacity: [1, 0.55, 1],
        transition: {
          duration: 0.3,
          ease: 'easeInOut',
        },
      },
    },
  } satisfies Record<string, Variants>,
} as const;

const IconComponent = React.forwardRef<SVGSVGElement, MessageCircleQuestionProps>(
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
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <motion.path
          d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"
          variants={variants.path1}
          initial="initial"
          animate={controls}
        />
        <motion.path
          d="M9.09 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3"
          variants={variants.path2}
          initial="initial"
          animate={controls}
        />
        <motion.path
          d="M12 17h.01"
          variants={variants.path3}
          initial="initial"
          animate={controls}
        />
      </motion.svg>
    );
  },
);

IconComponent.displayName = 'MessageCircleQuestionIconComponent';

function MessageCircleQuestion(props: MessageCircleQuestionProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  MessageCircleQuestion,
  MessageCircleQuestion as MessageCircleQuestionIcon,
  type MessageCircleQuestionProps,
  type MessageCircleQuestionProps as MessageCircleQuestionIconProps,
};
