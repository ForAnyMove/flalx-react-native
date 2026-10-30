import { Text, TouchableOpacity, StyleSheet } from "react-native";
import { useComponentContext } from "../../context/globalAppContext";
import { useWindowInfo } from "../../context/windowContext";
import { scaleByHeightMobile } from "../../utils/resizeFuncs";

export default function StyledButton({
  text,
  children,
  mode = 'primary',
  style = {},
  textStyle = {},
  onPress,
  ...restProps
} = {}) {
  const { activeThemeStyles } = useComponentContext();
  const { height } = useWindowInfo();
  const padV = scaleByHeightMobile(6, height);
  const content = text ?? children;

  function ColorizeByMode() {
    switch (mode) {
      case 'primary':
        return {
          container: {
            backgroundColor: activeThemeStyles?.buttonColorPrimaryDefault,
          },
          text: {
            color: activeThemeStyles?.buttonTextColorPrimary,
          },
        };
      case 'primary-reverse':
        return {
          container: {
            backgroundColor: activeThemeStyles?.buttonTextColorPrimary,
            borderColor: activeThemeStyles?.buttonColorPrimaryDefault,
            borderWidth: 1,
          },
          text: {
            color: activeThemeStyles?.buttonColorPrimaryDefault,
          },
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: activeThemeStyles?.buttonColorSecondaryDefault,
          },
          text: {
            color: activeThemeStyles?.buttonTextColorSecondary,
          },
        };
      case 'secondary-reverse':
        return {
          container: {
            backgroundColor: activeThemeStyles?.buttonTextColorSecondary,
            borderColor: activeThemeStyles?.buttonColorSecondaryDefault,
            borderWidth: 1,
          },
          text: {
            color: activeThemeStyles?.buttonColorSecondaryDefault,
          },
        };
      default:
        return {
          container: {
            backgroundColor: activeThemeStyles?.buttonColorPrimaryDefault,
          },
          text: {
            color: activeThemeStyles?.buttonTextColorPrimary,
          },
        };
    }
  }

  const colors = ColorizeByMode();
  const flatStyle = StyleSheet.flatten([style, colors.container]) || {};
  const { height: styleHeight, ...restStyle } = flatStyle;
  const computedContainerStyle = styleHeight != null
    ? [restStyle, { minHeight: styleHeight, paddingVertical: padV, justifyContent: 'center', alignItems: 'center' }]
    : flatStyle;

  return (
    <TouchableOpacity
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={typeof content === 'string' ? content : undefined}
      style={computedContainerStyle}
      {...restProps}
    >
      <Text style={[textStyle, colors.text]} maxFontSizeMultiplier={1.4}>{content}</Text>
    </TouchableOpacity>
  );
}