import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useComponentContext } from '../context/globalAppContext';
import JobModalWrapper from './JobModalWrapper';
import { useWindowInfo } from '../context/windowContext';
import { icons } from '../constants/icons';
import { scaleByHeight } from '../utils/resizeFuncs';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

const SUBSCRIPTIONS_TEMPLATE = {
  default: {
    name: 'subscriptions.subscription.default.name',
    price: 10,
    description: 'subscriptions.subscription.default.description',
  },
  top: {
    name: 'subscriptions.subscription.top.name',
    price: 25,
    description: 'subscriptions.subscription.top.description',
  },
  plus: {
    name: 'subscriptions.subscription.plus.name',
    price: 50,
    description: 'subscriptions.subscription.plus.description',
  },
  forPro: {
    name: 'subscriptions.subscription.forPro.name',
    price: 100,
    description: 'subscriptions.subscription.forPro.description',
  },
};

function SubscriptionsModalContent({ closeModal }) {
  const { themeController, languageController } = useComponentContext();
  const { width, height, isLandscape, sidebarWidth } = useWindowInfo();
  const { t } = useTranslation();
  const isRTL = languageController?.isRTL;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const [subscriptions, setSubscriptions] = useState(SUBSCRIPTIONS_TEMPLATE);

  const sizes = {
    headerHeight: isWebLandscape ? scaleByHeight(50, height) : RFPercentage(7),
    headerMargin: isWebLandscape ? scaleByHeight(30, height) : RFValue(0),
    icon: isWebLandscape ? scaleByHeight(24, height) : RFValue(24),
    logoFont: isWebLandscape ? scaleByHeight(24, height) : RFValue(20),
    modalHeaderPadding: isWebLandscape ? scaleByHeight(7, height) : RFValue(10),
    modalHeaderPaddingTop: isWebLandscape
      ? scaleByHeight(32, height)
      : RFValue(15),
    containerPaddingHorizontal: isWebLandscape
      ? scaleByHeight(23, height)
      : RFValue(15),
    subscriptionsGap: isWebLandscape ? scaleByHeight(23, height) : RFValue(15),
    subscriptionMarginBottom: isWebLandscape
      ? scaleByHeight(23, height)
      : RFValue(15),
    borderRadius: isWebLandscape ? 8 : RFValue(5),
    subscriptionWidth: isWebLandscape
      ? scaleByHeight(419, height)
      : RFValue(300),
    subscriptionHeight: isWebLandscape
      ? scaleByHeight(220, height)
      : RFValue(150),
    subscriptionPadding: isWebLandscape
      ? scaleByHeight(14, height)
      : RFValue(15),
    subscriptionTitleFont: isWebLandscape
      ? scaleByHeight(18, height)
      : RFValue(18),
    subscriptionsTitleMargin: isWebLandscape
      ? scaleByHeight(15, height)
      : RFValue(15),
    subscriptionsDescriptionFont: isWebLandscape
      ? scaleByHeight(16, height)
      : RFValue(16),
    priceMarginBottom: isWebLandscape ? scaleByHeight(23, height) : RFValue(15),
    subscriptionButtonFont: isWebLandscape
      ? scaleByHeight(20, height)
      : RFValue(16),
    subscriptionsContainerWidth: isWebLandscape
      ? scaleByHeight(900, height)
      : '100%',
    btnWidth: isWebLandscape ? scaleByHeight(387, height) : RFValue(150),
    btnHeight: isWebLandscape ? scaleByHeight(52, height) : RFValue(40),
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => {
        closeModal(false);
      }}
      style={{
        flex: 1,
      }}
    >
      <TouchableOpacity
        activeOpacity={1}
        style={{
          height: height,
          width: width - (isLandscape ? sidebarWidth : 0),
          backgroundColor: themeController.current?.backgroundColor,
          alignSelf: isRTL ? 'flex-start' : 'flex-end',
          paddingHorizontal: sizes.containerPaddingHorizontal,
        }}
        onPress={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Header */}
        <View
          style={[
            styles.modalHeader,
            {
              flexDirection: isRTL ? 'row-reverse' : 'row',
              paddingHorizontal: sizes.modalHeaderPadding,
              paddingVertical: sizes.modalHeaderPaddingTop,
              backgroundColor: themeController.current?.backgroundColor,
              borderBottomColor:
                themeController.current?.profileDefaultBackground,
              height: sizes.headerHeight,
              marginVertical: sizes.headerMargin,
              borderBottomWidth: 2,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              closeModal(false);
            }}
          >
            <Image
              source={isRTL ? icons.forward : icons.back}
              style={{
                width: sizes.icon,
                height: sizes.icon,
                tintColor: themeController.current?.textColor,
              }}
            />
          </TouchableOpacity>
          <Text
            style={[
              styles.modalTitle,
              {
                fontSize: sizes.logoFont,
                color: themeController.current?.primaryColor,
              },
            ]}
          >
            FLALX
          </Text>
        </View>

        <ScrollView contentContainerStyle={{}}>
          <View
            style={{
              gap: sizes.subscriptionsGap,
              width: sizes.subscriptionsContainerWidth,
              flexWrap: 'wrap',
              flexDirection: 'row',
              alignSelf: isRTL ? 'flex-end' : 'flex-start',
            }}
          >
            {Object.keys(subscriptions).map((key) => (
              <View
                key={key}
                style={[
                  {
                    borderRadius: sizes.borderRadius,
                    width: sizes.subscriptionWidth,
                    height: sizes.subscriptionHeight,
                    padding: sizes.subscriptionPadding,
                    marginBottom: sizes.subscriptionMarginBottom,
                    backgroundColor:
                      themeController.current?.formInputBackground,
                    boxSizing: 'border-box',
                    alignItems: isRTL ? 'flex-end' : 'flex-start',
                  },
                  key === 'forPro' && {
                    borderColor:
                      themeController.current?.buttonColorSecondaryDefault,
                    borderWidth: 2,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: sizes.subscriptionTitleFont,
                    marginBottom: sizes.subscriptionsTitleMargin,
                    color: themeController.current?.textColor,
                    fontFamily: 'Rubik-Bold',
                  }}
                >
                  {t(subscriptions[key].name)}
                </Text>
                <Text
                  style={{
                    fontSize: sizes.subscriptionsDescriptionFont,
                    marginBottom: sizes.subscriptionsTitleMargin,
                    color: themeController.current?.unactiveTextColor,
                  }}
                >
                  {t(subscriptions[key].description)}
                </Text>
                <Text
                  style={{
                    fontSize: sizes.subscriptionsDescriptionFont,
                    fontFamily: 'Rubik-Bold',
                    color: themeController.current?.textColor,
                    marginBottom: sizes.priceMarginBottom,
                  }}
                >
                  {subscriptions[key].price}$/{t('subscriptions.month')}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    // Handle subscription selection
                  }}
                  style={{
                    backgroundColor:
                      key === 'forPro'
                        ? themeController.current?.buttonColorSecondaryDefault
                        : themeController.current?.buttonColorPrimaryDefault,
                    alignSelf: 'center',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: sizes.borderRadius,
                    width: sizes.btnWidth,
                    height: sizes.btnHeight,
                  }}
                >
                  <Text
                    style={{
                      fontSize: sizes.subscriptionButtonFont,
                      color:
                        key === 'forPro'
                          ? themeController.current?.buttonTextColorSecondary
                          : themeController.current?.buttonTextColorPrimary,
                      textAlign: 'center',
                      textAlignVertical: 'center',
                    }}
                  >
                    {t('subscriptions.choose')}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function SubscriptionsModal({ visible, main, closeModal }) {
  const { isWebLandscape } = useComponentContext();
  return (
    <>
      {isWebLandscape ? (
        <JobModalWrapper visible={visible} main={main}>
          <SubscriptionsModalContent closeModal={closeModal} />
        </JobModalWrapper>
      ) : (
        <Modal visible={visible} animationType='slide' transparent>
          <SubscriptionsModalContent closeModal={closeModal} />
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: RFValue(10),
    borderBottomWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontWeight: 'bold',
    color: '#0A62EA',
    fontFamily: 'Rubik-Bold',
  },
});
