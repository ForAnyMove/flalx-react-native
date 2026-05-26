import { View } from "react-native";

export const RTLView = ({ children, isRTL, gap, style, ...props }) => {
    return (
        <View
            style={[
                style,
                { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: gap || 0, flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
            {...props}
        >
            {children}
        </View>
    );
}