import React from 'react';
import { Text, Platform } from 'react-native';

/**
 * Universal accessible heading component compliant with Israeli Standard ת"י 5568-1 (Clause 2.4.10)
 * and WCAG 2.0 Level AA.
 *
 * Provides:
 * - `accessibilityRole="header"` (for native iOS/Android TalkBack and VoiceOver navigation)
 * - `aria-level={level}` and `role="heading"` (for React Native Web, outputting semantic H1–H6 equivalents)
 * - `accessibilityLevel={level}`
 *
 * @param {{
 *   level?: 1 | 2 | 3 | 4 | 5 | 6,
 *   children: React.ReactNode,
 *   style?: any,
 *   [key: string]: any
 * }} props
 */
export const AppHeading = ({ level = 1, style, children, ...props }) => {
  const safeLevel = Math.min(Math.max(Number(level) || 1, 1), 6);

  return (
    <Text
      {...props}
      accessibilityRole="header"
      accessibilityLevel={safeLevel}
      role="heading"
      aria-level={safeLevel}
      style={style}
    >
      {children}
    </Text>
  );
};

export default AppHeading;
