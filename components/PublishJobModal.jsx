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
import { useMemo } from 'react';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { formatCurrency } from '../utils/currency_formatter';
import { RTLView } from './common/RTLView';

export const PublishJobModal = ({
    visible,
    setVisible,
    jobType,
    onPublish,
    onSubscriptionPlans
}) => {
    const { jobsController, subscription, languageController, themeController, couponsManagerController } = useComponentContext();
    const { tField } = useLocalization(languageController.current);
    const { t } = useTranslation();
    const isRTL = languageController.isRTL;
    const { height, isLandscape } = useWindowInfo();
    const isWebLandscape = Platform.OS === 'web' && isLandscape;

    const jobProduct = useMemo(() => {
        return jobsController.products.find((p => p.type === jobType));
    }, [jobType, jobsController]);

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
                            {subscription.current == null &&
                                jobType == 'normal' ? t('publishJobModal.title_normal_type', {
                                    defaultValue: 'You must pay to publish this ad or get a subscription',
                                }) : t('publishJobModal.title', {
                                    defaultValue: 'You must pay to publish this ad',
                                })}
                        </Text>

                        <RTLView isRTL={isRTL} gap={10}>
                            <Text
                                style={{
                                    fontSize: sizes.chipFont,
                                    color: themeController.current?.formInputLabelColor,
                                    marginBottom: sizes.chipMarginBottom,
                                    textAlign: 'center',
                                }}
                            >
                                {t('publishJobModal.sub_title', {
                                    defaultValue:
                                        'Type of ad',
                                })}
                            </Text>
                            <Text
                                style={{
                                    fontSize: sizes.chipFont,
                                    color: themeController.current?.formInputLabelColor,
                                    marginBottom: sizes.chipMarginBottom,
                                    textAlign: 'center',
                                }}
                            >
                                -
                            </Text>
                            <Text
                                style={{
                                    fontSize: sizes.chipFont,
                                    color: themeController.current?.formInputLabelColor,
                                    marginBottom: sizes.chipMarginBottom,
                                    textAlign: 'center',
                                }}
                            >
                                {tField(jobProduct, 'name')}
                            </Text>
                        </RTLView>

                        {/* кнопка подтверждения с ценой */}
                        <TouchableOpacity
                            onPress={() => {
                                onPublish({ useCoupons: false });
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
                                {t('publishJobModal.buttons.confirmWithPrice', {
                                    defaultValue: 'Send to moderation',
                                    price: formatCurrency(jobProduct.price, jobProduct.currency)
                                })}
                            </Text>
                        </TouchableOpacity>

                        {subscription.current == null &&
                            jobType == 'normal' && (
                                <TouchableOpacity
                                    style={[
                                        styles.modalBtn,
                                        {
                                            backgroundColor:
                                                themeController.current?.buttonTextColorSecondary,
                                            borderColor:
                                                themeController.current?.buttonColorSecondaryDefault,
                                            height: sizes.btnH,
                                            width: sizes.btnW,
                                            borderRadius: sizes.modalRadius,
                                            borderWidth: 1,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            flexDirection: isRTL ? 'row-reverse' : 'row',
                                            marginBottom: sizes.borderRadius * 2,
                                        },
                                    ]}
                                    onPress={() => {
                                        onPublish({ useCoupons: true });
                                    }}
                                >
                                    <Text
                                        style={[
                                            {
                                                color: themeController.current?.buttonColorSecondaryDefault,
                                                fontSize: sizes.modalSub,
                                            },
                                        ]}
                                    >
                                        {t('publishJobModal.buttons.publishForCoupons', {
                                            defaultValue: 'Publish for {{count}} ',
                                            count: 1,
                                        })}
                                    </Text>
                                    <Image
                                        source={icons.coupon}
                                        style={{
                                            width: sizes.iconSize,
                                            height: sizes.iconSize,
                                            tintColor: themeController.current?.buttonColorSecondaryDefault,
                                        }}
                                    />
                                    <Text
                                        style={[
                                            {
                                                color: themeController.current?.buttonColorSecondaryDefault,
                                                fontSize: sizes.modalSub,
                                            },
                                        ]}
                                    >
                                        {` (${couponsManagerController.balance || 0})`}
                                    </Text>
                                </TouchableOpacity>
                            )}

                        {/* кнопка тарифов */}
                        {subscription.current == null &&
                            jobType == 'normal' && (
                                <TouchableOpacity
                                    onPress={() => {
                                        onSubscriptionPlans(true);
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
