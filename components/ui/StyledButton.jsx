import { Text, TouchableOpacity } from "react-native";

import { useComponentContext } from "../../context/globalAppContext";

export default function StyledButton(text, mode='primary', style={}, textStyle={}) {
  const { activeThemeStyles } = useComponentContext();
  function ColorizeByMode () {
    switch (mode) {
      case 'primary':
        return {
          container: {
            backgroundColor: activeThemeStyles?.buttonColorPrimaryDefault,
          },
          text: {
            color: activeThemeStyles?.buttonTextColorPrimary,
          }
        }
      case 'primary-reverse':
        return {
          container: {
            backgroundColor: activeThemeStyles?.buttonTextColorPrimary,
            borderColor: activeThemeStyles?.buttonColorPrimaryDefault,
            borderWidth: 1,
          },
          text: {
            color: activeThemeStyles?.buttonTextColorPrimary,
          }
        }
      case 'secondary':
        return {
          container: {
            backgroundColor: activeThemeStyles?.buttonColorSecondaryDefault,
          },
          text: {
            color: activeThemeStyles?.buttonTextColorSecondary,
          }
        }
      case 'secondary-reverse':
        return {
          container: {
            backgroundColor: activeThemeStyles?.buttonColorPrimaryDefault,
            borderColor: activeThemeStyles?.buttonColorSecondaryDefault,
            borderWidth: 1,
          },
          text: {
            color: activeThemeStyles?.buttonTextColorPrimary,
          }
        }
    
      default:
        break;
    }
  }
  return (
    <TouchableOpacity style={[style, ColorizeByMode().container]}>
      <Text style={[textStyle, ColorizeByMode().text]}>{text}</Text>
    </TouchableOpacity>
  );
};