import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, Pressable, Animated, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { useComponentContext } from '../../../context/globalAppContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
    const { languageController } = useComponentContext();
    const isRTL = languageController?.isRTL;

    const typeConfig = getTypeConfig(type);
    const markdownStyle = {
        body: { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' },
        paragraph: { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' },
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
            style={[
                {
                    backgroundColor: button.backgroundColor || '#E5E7EB',
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderRadius: 8,
                    marginLeft: !isRTL && index > 0 ? 10 : 0,
                    marginRight: isRTL && index > 0 ? 10 : 0,
                    minWidth: 80,
                    alignItems: 'center',
                }
            ]}
            onPress={() => {
                if (button.onPress) button.onPress();
                if (onClose) onClose();
            }}
        >
            <Text style={{
                color: button.textColor || '#374151',
                fontWeight: '400',
                fontSize: 16,
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
                        paddingTop: 100,
                        paddingHorizontal: 20,
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
                />
                <Animated.View
                    style={[
                        {
                            backgroundColor: '#FFFFFF',
                            borderRadius: 16,
                            maxWidth: 550,
                            minWidth: 400,
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
                            minHeight: 120,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Ionicons
                            name={typeConfig.icon}
                            size={32}
                            color={typeConfig.color}
                        />
                    </View>

                    {/* Content side */}
                    <View
                        style={{
                            flex: 1,
                            padding: 20,
                            justifyContent: 'center',
                        }}
                    >
                        {/* Сообщение */}
                        <View style={{ marginBottom: buttons.length > 0 ? 20 : 0 }}>
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
                        paddingTop: 80,
                        paddingHorizontal: 20,
                    },
                    { opacity: fadeAnim }
                ]}
            >
                <Pressable
                    style={{ flex: 1, width: '100%', alignItems: 'center' }}
                    onPress={handleBackdropPress}
                >
                    <Animated.View
                        style={[
                            {
                                backgroundColor: '#FFFFFF',
                                borderRadius: 16,
                                marginHorizontal: 20,
                                maxWidth: Platform.OS === 'web' ? 550 : Math.min(screenWidth - 40, 400),
                                minWidth: Platform.OS === 'web' ? 400 : 280,
                                alignSelf: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.25,
                                shadowRadius: 8,
                                elevation: 999,
                                flexDirection: isRTL ? 'row-reverse' : 'row',
                                overflow: 'hidden',
                                elevation: 999,
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
                                minHeight: 120,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <Ionicons
                                name={typeConfig.icon}
                                size={32}
                                color={typeConfig.color}
                            />
                        </View>

                        {/* Content side */}
                        <View
                            style={{
                                flex: 1,
                                padding: 20,
                                justifyContent: 'center',
                            }}
                        >
                            {/* Сообщение */}
                            <View style={{ marginBottom: buttons.length > 0 ? 20 : 0 }}>
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