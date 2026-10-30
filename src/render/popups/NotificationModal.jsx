import React, { useEffect, useRef, useMemo } from 'react';
import { Modal, View, Text, Pressable, Animated, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { useComponentContext } from '../../../context/globalAppContext';
import { useWindowInfo } from '../../../context/windowContext';
import { scaleByHeight, scaleByHeightMobile } from '../../../utils/resizeFuncs';

const getTypeConfig = (type) => {
    switch (type) {
        case 'info':
            return {
                backgroundColor: '#3B82F6',
                icon: 'information-circle',
                color: '#FFFFFF'
            };
        case 'warning':
            return {
                backgroundColor: '#F59E0B',
                icon: 'warning',
                color: '#FFFFFF'
            };
        case 'error':
            return {
                backgroundColor: '#EF4444',
                icon: 'alert-circle',
                color: '#FFFFFF'
            };
        default:
            return {
                backgroundColor: '#6B7280',
                icon: 'information-circle',
                color: '#FFFFFF'
            };
    }
};

export const NotificationModal = ({
    visible,
    type = 'info',
    message,
    buttons = [],
    onClose
}) => {
    const slideAnim = useRef(new Animated.Value(-200)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const { languageController, themeController } = useComponentContext();
    const isRTL = languageController?.isRTL;
    const theme = themeController?.current;
    const windowInfo = useWindowInfo();
    const width = windowInfo?.width ?? Dimensions.get('window').width;
    const height = windowInfo?.height ?? Dimensions.get('window').height;
    const isLandscape = windowInfo?.isLandscape ?? false;
    const isWebLandscape = Platform.OS === 'web' && isLandscape;

    const sizes = useMemo(() => {
        const scale = isWebLandscape
            ? (s) => scaleByHeight(s, height)
            : (s) => scaleByHeightMobile(s, height);
        return {
            paddingTop: scale(80),
            paddingHorizontal: scale(20),
            borderRadius: scale(16),
            cardPadding: scale(20),
            btnPaddingH: scale(20),
            btnPaddingV: scale(12),
            btnRadius: scale(8),
            btnMargin: scale(10),
            btnMinWidth: scale(80),
            btnFontSize: scale(16),
            iconSize: scale(32),
            minCardHeight: scale(120),
            contentMarginBottom: scale(20),
            maxWidth: isWebLandscape ? scale(550) : Math.min(width - scale(40), scale(400)),
            minWidth: isWebLandscape ? scale(400) : scale(280),
        };
    }, [isWebLandscape, width, height]);

    const typeConfig = getTypeConfig(type);
    const markdownStyle = {
        body: { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr', color: theme?.textColor || '#1F2937' },
        paragraph: { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr', color: theme?.textColor || '#1F2937' },
    };

    useEffect(() => {
        if (visible) {
            // Показать модальное окно с анимацией
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 100,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Скрыть модальное окно
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: -200,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const handleBackdropPress = () => {
        if (onClose) onClose();
    };

    const renderButton = (button, index) => (
        <Pressable
            key={index}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={button.title}
            style={[
                {
                    backgroundColor: button.backgroundColor || theme?.buttonColorSecondaryDefault || '#E5E7EB',
                    paddingHorizontal: sizes.btnPaddingH,
                    paddingVertical: sizes.btnPaddingV,
                    borderRadius: sizes.btnRadius,
                    marginLeft: !isRTL && index > 0 ? sizes.btnMargin : 0,
                    marginRight: isRTL && index > 0 ? sizes.btnMargin : 0,
                    minWidth: sizes.btnMinWidth,
                    alignItems: 'center',
                }
            ]}
            onPress={() => {
                if (button.onPress) button.onPress();
                if (onClose) onClose();
            }}
        >
            <Text style={{
                color: button.textColor || theme?.buttonTextColorSecondaryDefault || '#374151',
                fontWeight: '400',
                fontSize: sizes.btnFontSize,
                textAlign: isRTL ? 'right' : 'left',
            }}>
                {button.title}
            </Text>
        </Pressable>
    );

    // Для web используем абсолютное позиционирование вместо Modal
    if (Platform.OS === 'web' && visible) {
        return (
            <Animated.View
                style={[
                    {
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        paddingTop: sizes.paddingTop,
                        paddingHorizontal: sizes.paddingHorizontal,
                        zIndex: 999999,
                    },
                    { opacity: fadeAnim }
                ]}
                onStartShouldSetResponder={() => true}
            >
                <Pressable
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                    }}
                    onPress={handleBackdropPress}
                    accessible={false}
                    importantForAccessibility="no"
                />
                <Animated.View
                    style={[
                        {
                            backgroundColor: theme?.backgroundColor || '#FFFFFF',
                            borderRadius: sizes.borderRadius,
                            maxWidth: sizes.maxWidth,
                            minWidth: sizes.minWidth,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.25,
                            shadowRadius: 8,
                            flexDirection: isRTL ? 'row-reverse' : 'row',
                            overflow: 'hidden',
                            zIndex: 999999,
                        },
                        {
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                    onStartShouldSetResponder={() => true}
                >
                    {/* Icon side (mirrors with flexDirection above) */}
                    <View
                        style={{
                            backgroundColor: typeConfig.backgroundColor,
                            width: '15%',
                            minHeight: sizes.minCardHeight,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Ionicons
                            name={typeConfig.icon}
                            size={sizes.iconSize}
                            color={typeConfig.color}
                        />
                    </View>

                    {/* Content side */}
                    <View
                        style={{
                            flex: 1,
                            padding: sizes.cardPadding,
                            justifyContent: 'center',
                        }}
                    >
                        {/* Сообщение */}
                        <View style={{ marginBottom: buttons.length > 0 ? sizes.contentMarginBottom : 0 }}>
                            <Markdown style={markdownStyle}>
                                {message}
                            </Markdown>
                        </View>

                        {/* Кнопки */}
                        {buttons.length > 0 && (
                            <View
                                style={{
                                    flexDirection: isRTL ? 'row-reverse' : 'row',
                                    justifyContent: isRTL ? 'flex-start' : 'flex-end',
                                    flexWrap: 'wrap',
                                }}
                            >
                                {buttons.map(renderButton)}
                            </View>
                        )}
                    </View>
                </Animated.View>
            </Animated.View>
        );
    }

    // Для мобильных используем Modal
    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={handleBackdropPress}
            presentationStyle="overFullScreen"
            statusBarTranslucent={true}
        >
            <Animated.View
                style={[
                    {
                        flex: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        paddingTop: sizes.paddingTop,
                        paddingHorizontal: sizes.paddingHorizontal,
                    },
                    { opacity: fadeAnim }
                ]}
            >
                <Pressable
                    style={{ flex: 1, width: '100%', alignItems: 'center' }}
                    onPress={handleBackdropPress}
                    accessible={false}
                    importantForAccessibility="no"
                >
                    <Animated.View
                        style={[
                            {
                                backgroundColor: theme?.backgroundColor || '#FFFFFF',
                                borderRadius: sizes.borderRadius,
                                marginHorizontal: sizes.paddingHorizontal,
                                maxWidth: sizes.maxWidth,
                                minWidth: sizes.minWidth,
                                alignSelf: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.25,
                                shadowRadius: 8,
                                elevation: 999,
                                flexDirection: isRTL ? 'row-reverse' : 'row',
                                overflow: 'hidden',
                            },
                            {
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                        onStartShouldSetResponder={() => true}
                    >
                        {/* Icon side (mirrors with flexDirection above) */}
                        <View
                            style={{
                                backgroundColor: typeConfig.backgroundColor,
                                width: '15%',
                                minHeight: sizes.minCardHeight,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <Ionicons
                                name={typeConfig.icon}
                                size={sizes.iconSize}
                                color={typeConfig.color}
                            />
                        </View>

                        {/* Content side */}
                        <View
                            style={{
                                flex: 1,
                                padding: sizes.cardPadding,
                                justifyContent: 'center',
                            }}
                        >
                            {/* Сообщение */}
                            <View style={{ marginBottom: buttons.length > 0 ? sizes.contentMarginBottom : 0 }}>
                                <Markdown style={markdownStyle}>
                                    {message}
                                </Markdown>
                            </View>

                            {/* Кнопки */}
                            {buttons.length > 0 && (
                                <View
                                    style={{
                                        flexDirection: isRTL ? 'row-reverse' : 'row',
                                        justifyContent: isRTL ? 'flex-start' : 'flex-end',
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    {buttons.map(renderButton)}
                                </View>
                            )}
                        </View>
                    </Animated.View>
                </Pressable>
            </Animated.View>
        </Modal>
    );
};