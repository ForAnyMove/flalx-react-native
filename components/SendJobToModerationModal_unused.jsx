import {
    Image,
    Modal,
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
    Platform
} from 'react-native';
import { icons } from '../constants/icons';
import { useComponentContext } from '../context/globalAppContext';
import { useLocalization } from '../src/services/useLocalization';
import { useTranslation } from 'react-i18next';
import { useWindowInfo } from '../context/windowContext';
import { useMemo, useState } from 'react';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { formatCurrency } from '../utils/currency_formatter';

export const SendJobToModerationModal = ({
    visible,
    setVisible,
    onPurchase,
    setPlansModalVisible
}) => {
    const { jobsController, subscription, languageController, themeController } = useComponentContext();
    const { tField } = useLocalization(languageController.current);
    const { t } = useTranslation();
    const isRTL = languageController.isRTL;
    const { height, isLandscape } = useWindowInfo();
    const isWebLandscape = Platform.OS === 'web' && isLandscape;

    const [jobType, setJobType] = useState('normal');

    const selectedOption =
        jobsController.products.find((o) => o.type === jobType) ||
        jobsController.products[0];

    const sizes = useMemo(() => {
        const webLandscapeScale = (size) => scaleByHeight(size, height);
        const mobileScale = (size) => scaleByHeightMobile(size, height);

        return {
            padding: isWebLandscape ? webLandscapeScale(4) : mobileScale(8),
            margin: isWebLandscape ? webLandscapeScale(18) : mobileScale(10),
            borderRadius: isWebLandscape ? webLandscapeScale(8) : mobileScale(8),
            modalPadding: isWebLandscape ? webLandscapeScale(45) : mobileScale(12),
            modalRadius: isWebLandscape ? webLandscapeScale(8) : mobileScale(5),
            modalCrossTopRightPos: isWebLandscape
                ? webLandscapeScale(7)
                : mobileScale(10),
            modalTitle: isWebLandscape ? webLandscapeScale(24) : mobileScale(16),
            modalTitleMarginBottom: isWebLandscape
                ? webLandscapeScale(22)
                : mobileScale(10),
            modalSub: isWebLandscape ? webLandscapeScale(20) : mobileScale(12),
            chipFont: isWebLandscape ? webLandscapeScale(14) : mobileScale(12),
            chipHeight: isWebLandscape ? webLandscapeScale(34) : mobileScale(30),
            chipPadH: isWebLandscape ? webLandscapeScale(11) : mobileScale(12),
            chipGap: isWebLandscape ? webLandscapeScale(8) : mobileScale(8),
            chipMarginBottom: isWebLandscape
                ? webLandscapeScale(40 / 3)
                : mobileScale(12 / 3),
            modalCardW: isWebLandscape ? webLandscapeScale(450) : '88%',
            btnH: isWebLandscape ? webLandscapeScale(62) : mobileScale(42),
            btnW: isWebLandscape ? webLandscapeScale(300) : '100%',
            iconSize: isWebLandscape ? webLandscapeScale(24) : mobileScale(20),
        };
    }, [isWebLandscape, height]);

    return <Modal visible={visible} animationType='fade' transparent>
        {/* кликабельная подложка с отступом под сайдбар на web-landscape */}
        <View
            style={[
                styles.backdrop,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
        >
            <TouchableOpacity
                activeOpacity={1}
                onPress={() => setVisible(false)}
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
            >
                <View
                    style={[
                        styles.centerArea,
                        // { width: isWebLandscape ? width - sidebarWidth : '100%' },
                        { width: '100%' },
                    ]}
                >
                    {/* сама карточка; клики внутри НЕ закрывают */}
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                        style={[
                            styles.modalCard,
                            {
                                backgroundColor: themeController.current?.backgroundColor,
                                borderRadius: sizes.modalRadius,
                                padding: sizes.modalPadding,
                                width: sizes.modalCardW,
                                position: 'relative',
                                alignItems: 'center',
                            },
                        ]}
                    >
                        <TouchableOpacity
                            onPress={() => setVisible(false)}
                            style={{
                                position: 'absolute',
                                top: sizes.modalCrossTopRightPos,
                                right: sizes.modalCrossTopRightPos,
                            }}
                        >
                            <Image
                                source={icons.cross}
                                style={{
                                    width: sizes.iconSize,
                                    height: sizes.iconSize,
                                    tintColor: themeController.current?.textColor,
                                }}
                                resizeMode='contain'
                            />
                        </TouchableOpacity>
                        {/* заголовок */}
                        <Text
                            style={{
                                fontSize: sizes.modalTitle,
                                fontFamily: 'Rubik-Bold',
                                color: themeController.current?.textColor,
                                textAlign: 'center',
                                marginBottom: sizes.modalTitleMarginBottom,
                            }}
                        >
                            {t('newJob.statusModal.title', {
                                defaultValue: 'Choose the post type to publish',
                            })}
                        </Text>

                        {/* плашки статусов */}
                        <View
                            style={{
                                flexDirection: isRTL ? 'row-reverse' : 'row',
                                flexWrap: 'wrap',
                                gap: sizes.chipGap,
                                marginBottom: sizes.chipMarginBottom,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {jobsController.products.map((opt) => {
                                const productType = opt.type;
                                const productName = tField(opt, 'name');
                                const active = jobType === productType;

                                return (
                                    <TouchableOpacity
                                        key={productType}
                                        onPress={() => setJobType(productType)}
                                        style={[
                                            styles.chip,
                                            {
                                                height: sizes.chipHeight,
                                                paddingHorizontal: sizes.chipPadH,
                                                borderRadius: sizes.modalRadius / 2,
                                                borderWidth: 1,
                                                borderColor: active
                                                    ? themeController.current
                                                        ?.buttonColorPrimaryDefault
                                                    : themeController.current
                                                        ?.formInputPlaceholderColor,
                                                backgroundColor: active
                                                    ? themeController.current
                                                        ?.buttonColorPrimaryDefault
                                                    : 'transparent',
                                                flexDirection: isRTL ? 'row-reverse' : 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={{
                                                fontSize: sizes.chipFont,
                                                color: active
                                                    ? themeController.current?.buttonTextColorPrimary
                                                    : themeController.current
                                                        ?.formInputPlaceholderColor,
                                            }}
                                        >
                                            {productName}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <View
                            style={{
                                flexDirection: isRTL ? 'row-reverse' : 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: sizes.chipMarginBottom,
                                gap: sizes.margin / 4,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: sizes.modalSub,
                                    color: themeController.current?.buttonColorPrimaryDefault,
                                }}
                            >
                                {t('', {
                                    defaultValue: '{{price}}',
                                    price:
                                        subscription.current != null &&
                                            selectedOption.type == 'normal'
                                            ? t('newJob.statusModal.free', {
                                                defaultValue: 'Free',
                                            })
                                            : `${formatCurrency(selectedOption.price, selectedOption.currency)}`,
                                })}
                            </Text>
                            {(subscription.current == null &&
                                selectedOption.type == 'normal') &&
                                <Text
                                    style={{
                                        fontSize: sizes.modalSub,
                                        color: themeController.current?.formInputLabelColor,
                                        marginLeft: isRTL ? 0 : sizes.margin / 4,
                                        marginRight: isRTL ? sizes.margin / 4 : 0,
                                    }}
                                >
                                    {t('common.or', { defaultValue: 'or' })}
                                </Text>
                            }
                            {(subscription.current == null &&
                                selectedOption.type == 'normal') &&
                                <Text
                                    style={{
                                        fontSize: sizes.modalSub,
                                        color: themeController.current?.buttonColorSecondaryDefault,
                                        marginLeft: isRTL ? 0 : sizes.margin / 4,
                                        marginRight: isRTL ? sizes.margin / 4 : 0,
                                    }}
                                >
                                    1
                                </Text>
                            }
                            {(subscription.current == null &&
                                selectedOption.type == 'normal') &&
                                <Image
                                    source={icons.coupon}
                                    style={{
                                        width: sizes.iconSize,
                                        height: sizes.iconSize,
                                        tintColor:
                                            themeController.current
                                                ?.buttonColorSecondaryDefault,
                                    }}
                                />
                            }
                        </View>

                        {(subscription.current == null ||
                            selectedOption.type != 'normal') && (
                                <Text
                                    style={{
                                        fontSize: sizes.chipFont,
                                        color: themeController.current?.formInputLabelColor,
                                        marginBottom: sizes.chipMarginBottom,
                                        textAlign: 'center',
                                    }}
                                >
                                    {t('newJob.statusModal.payAfterModerationNotice', {
                                        defaultValue:
                                            'You must pay for publishing this type of ad after moderation.',
                                    })}
                                </Text>
                            )}

                        {/* кнопка подтверждения с ценой */}
                        <TouchableOpacity
                            onPress={() => {
                                onPurchase(jobType);
                                setVisible(false);
                            }}
                            style={{
                                height: sizes.btnH,
                                width: sizes.btnW,
                                borderRadius: sizes.modalRadius,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 1,
                                borderColor:
                                    themeController.current?.buttonColorPrimaryDefault,
                                marginBottom: sizes.borderRadius * 2,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: sizes.modalSub,
                                    color: themeController.current?.buttonColorPrimaryDefault,
                                }}
                            >
                                {t('newJob.statusModal.buttons.sendToModeration', {
                                    defaultValue: 'Send to moderation',
                                })}
                            </Text>
                        </TouchableOpacity>

                        {/* кнопка тарифов */}
                        {subscription.current == null &&
                            selectedOption?.type == 'normal' && (
                                <TouchableOpacity
                                    onPress={() => {
                                        setPlansModalVisible(true);
                                        setVisible(false);
                                    }}
                                    style={{
                                        height: sizes.btnH,
                                        width: sizes.btnW,
                                        borderRadius: sizes.modalRadius,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor:
                                            themeController.current?.buttonColorPrimaryDefault,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: sizes.modalSub,
                                            color:
                                                themeController.current?.buttonTextColorPrimary,
                                        }}
                                    >
                                        {t('newJob.statusModal.buttons.viewPlans', {
                                            defaultValue: 'See pricing plans',
                                        })}
                                    </Text>
                                </TouchableOpacity>
                            )}
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </View>
    </Modal>
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    logo: {
        fontFamily: 'Rubik-Bold',
    },
    inputBlock: {
        ...Platform.select({
            web: {
                zIndex: 1,
            },
        }),
    },
    imageInputBlock: {
        ...Platform.select({
            web: {
                zIndex: 1,
            },
        }),
    },
    label: {
        // fontWeight: 'bold',
        // marginBottom: RFValue(4),
    },
    input: {
        width: '100%',
        fontFamily: 'Rubik-Medium',
    },
    autocompleteContainer: {
        position: 'relative',
    },
    suggestionBox: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 999,
        borderRadius: 6,
        overflow: 'hidden',
        ...Platform.select({
            web: {
                zIndex: 9999,
                position: 'absolute', // На всякий случай переопредели
                overflow: 'auto',
            },
        }),
    },
    suggestionItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    addImageButton: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    imageScrollContainer: {
        flexDirection: 'row',
    },
    imageThumbnail: {},
    imageWrapper: {
        position: 'relative',
    },
    removeIcon: {
        position: 'absolute',
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    bottomButtonWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
    },
    createButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    errorOutline: {
        shadowColor: 'red',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 4,
    },
    errorBorder: { borderColor: 'red', borderWidth: 1 },
    gridContainer: {
        width: '100%',
        display: 'grid',
    },
    gridHalf: {
        width: '100%',
    },
    gridFull: {
        width: '100%',
    },
    backdrop: {
        flex: 1,
        alignItems: 'stretch',
        justifyContent: 'center',
    },
    centerArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
    },
    modalCard: {
        // цвета/радиусы/паддинги задаём из sizes в JSX
        shadowColor: '#000',
        shadowOpacity: 0.15,
        elevation: 8,
    },
    chip: {
        // базовые параметры, динамика — в JSX
        boxSizing: 'border-box',
    },
});
