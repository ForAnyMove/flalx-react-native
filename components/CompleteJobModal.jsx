import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useComponentContext } from '../context/globalAppContext';
import JobModalWrapper from './JobModalWrapper';
import { useWindowInfo } from '../context/windowContext';
import { icons } from '../constants/icons';
import { scaleByHeight } from '../utils/resizeFuncs';
import { useTranslation } from 'react-i18next';
import {
  createSubscription,
  downgradeSubscription,
  payForPlanUpgrade,
  upgradeSubscription,
} from '../src/api/subscriptions';
import { useWebView } from '../context/webViewContext';
import { useNotification } from '../src/render';
import { useMemo, useState } from 'react';
import ImagePickerModal from './ui/ImagePickerModal';
import ConfirmModal from './ui/ConfirmModal';
import { uploadImageAsset } from '../src/files/uploadFile';
import { scaleByHeightMobile } from '../utils/resizeFuncs';
import { logError } from '../utils/log_util';
import CustomTextInput from './ui/CustomTextInput';

function CompleteJobModalContent({ closeModal, completeFunc }) {
  const {
    themeController,
    languageController,
    user,
    setAppLoading,
    // subscriptionPlans,
    // subscription,
  } = useComponentContext();
  const { width, height, isLandscape, effectiveSidebarWidth } = useWindowInfo();
  const { t } = useTranslation();
  const { showError } = useNotification();
  const isRTL = languageController?.isRTL;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);

  const [imageModalVisible, setImageModalVisible] = useState(false);

  const sizes = useMemo(
    () => ({
      headerHeight: isWebLandscape
        ? scaleByHeight(50, height)
        : scaleByHeightMobile(50, height),
      headerMargin: isWebLandscape
        ? scaleByHeight(30, height)
        : scaleByHeightMobile(0, height),
      icon: isWebLandscape
        ? scaleByHeight(24, height)
        : scaleByHeightMobile(24, height),
      logoFont: isWebLandscape
        ? scaleByHeight(24, height)
        : scaleByHeightMobile(18, height),
      modalHeaderPadding: isWebLandscape
        ? scaleByHeight(7, height)
        : scaleByHeightMobile(10, height),
      modalHeaderPaddingTop: isWebLandscape
        ? scaleByHeight(32, height)
        : scaleByHeightMobile(15, height),
      containerPaddingHorizontal: isWebLandscape
        ? scaleByHeight(23, height)
        : scaleByHeightMobile(15, height),
      borderRadius: isWebLandscape
        ? scaleByHeight(8, height)
        : scaleByHeightMobile(8, height),
      saveBtnWidth: isWebLandscape
        ? scaleByHeight(380, height)
        : '100%',
      saveBtnHeight: isWebLandscape
        ? scaleByHeight(62, height)
        : scaleByHeightMobile(62, height),
      saveBtnFont: isWebLandscape
        ? scaleByHeight(20, height)
        : scaleByHeightMobile(20, height),
      padding: isWebLandscape
        ? scaleByHeight(4, height)
        : scaleByHeightMobile(8, height),
      descriptionHeight: isWebLandscape ? scaleByHeight(120, height) : scaleByHeightMobile(70, height),
      inputContainerPaddingHorizontal: isWebLandscape
        ? scaleByHeight(16, height)
        : scaleByHeightMobile(16, height),
      inputContainerPaddingVertical: isWebLandscape
        ? scaleByHeight(10, height)
        : scaleByHeightMobile(10, height),
      font: isWebLandscape
        ? scaleByHeight(12, height)
        : scaleByHeightMobile(12, height),
      inputFont: isWebLandscape
        ? scaleByHeight(16, height)
        : scaleByHeightMobile(16, height),
      photosLabelSize: isWebLandscape
        ? scaleByHeight(18, height)
        : scaleByHeightMobile(18, height),
      photosLabelMarginBottom: isWebLandscape ? scaleByHeight(14, height) : scaleByHeightMobile(16, height),
      thumb: isWebLandscape
        ? scaleByHeight(128, height)
        : scaleByHeightMobile(128, height),
      imageSize: isWebLandscape
        ? scaleByHeight(32, height)
        : height * 0.03,
      margin: isWebLandscape
        ? scaleByHeight(18, height)
        : scaleByHeightMobile(10, height),
      removeIconSize: isWebLandscape
        ? scaleByHeight(20, height)
        : scaleByHeightMobile(20, height),
      removeIconPosition: isWebLandscape
        ? scaleByHeight(3, height)
        : scaleByHeightMobile(4, height),
      crossIconSize: isWebLandscape
        ? scaleByHeight(16, height)
        : scaleByHeightMobile(16, height),
      titleMarginTop: isWebLandscape ? 0 : scaleByHeightMobile(16, height),
      titleMarginBottom: isWebLandscape ? scaleByHeight(8, height) : scaleByHeightMobile(8, height),
      subtitleMarginBottom: isWebLandscape ? scaleByHeight(24, height) : scaleByHeightMobile(16, height),
      labelMarginBottom: isWebLandscape ? scaleByHeight(4, height) : scaleByHeightMobile(4, height),
      fieldMarginBottom: isWebLandscape ? scaleByHeight(16, height) : scaleByHeightMobile(16, height),
    }),
    [isWebLandscape, height]
  );

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        modalHeader: {
          flexDirection: isRTL ? 'row-reverse' : 'row',
          paddingHorizontal: sizes.modalHeaderPadding,
          paddingVertical: Platform.OS === 'android' ? 0 : sizes.modalHeaderPaddingTop,
          backgroundColor: themeController.current?.backgroundColor,
          borderBottomColor: themeController.current?.profileDefaultBackground,
          height: sizes.headerHeight,
          marginVertical: sizes.headerMargin,
          borderBottomWidth: 2,
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        modalTitle: {
          fontWeight: 'bold',
          color: themeController.current?.primaryColor,
          fontFamily: 'Rubik-Bold',
          fontSize: sizes.logoFont,
        },
        backButtonImage: {
          width: sizes.icon,
          height: sizes.icon,
          tintColor: themeController.current?.textColor,
        },
        titleText: {
          textAlign: 'center',
          marginTop: sizes.titleMarginTop,
          fontSize: sizes.photosLabelSize,
          color: themeController?.current.textColor,
          marginBottom: sizes.titleMarginBottom,
        },
        subtitleText: {
          textAlign: 'center',
          fontSize: sizes.inputFont,
          color: themeController?.current.unactiveTextColor,
          marginBottom: sizes.subtitleMarginBottom,
        },
        uploadLabel: {
          fontSize: sizes.photosLabelSize,
          marginBottom: sizes.photosLabelMarginBottom,
          color: themeController.current?.textColor,
        },
        addImageButton: {
          backgroundColor: themeController.current?.profileDefaultBackground,
          width: sizes.thumb,
          height: sizes.thumb,
          borderRadius: sizes.borderRadius,
          marginRight: isRTL ? 0 : sizes.margin / 2,
          marginLeft: isRTL ? sizes.margin / 2 : 0,
          justifyContent: 'center',
          alignItems: 'center',
        },
        plusIcon: {
          width: sizes.imageSize,
          height: sizes.imageSize,
          tintColor: themeController.current?.primaryColor,
        },
        imageWrapper: {
          backgroundColor: themeController.current?.formInputBackground,
          marginRight: isRTL ? 0 : sizes.margin / 2,
          marginLeft: isRTL ? sizes.margin / 2 : 0,
          position: 'relative',
        },
        image: {
          width: sizes.thumb,
          height: sizes.thumb,
          borderRadius: sizes.borderRadius,
        },
        removeIconContainer: {
          position: 'absolute',
          borderRadius: sizes.removeIconSize,
          top: sizes.removeIconPosition,
          right: sizes.removeIconPosition,
          width: sizes.removeIconSize,
          height: sizes.removeIconSize,
          backgroundColor: 'rgba(255,255,255,0.7)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10,
        },
        crossIcon: {
          width: sizes.crossIconSize,
          height: sizes.crossIconSize,
          tintColor: themeController.current?.textColor,
        },
        descriptionInputContainer: {
          width: isWebLandscape ? undefined : '100%',
          backgroundColor: themeController.current?.formInputBackground,
          paddingVertical: sizes.inputContainerPaddingVertical,
          paddingHorizontal: sizes.inputContainerPaddingHorizontal,
          borderRadius: sizes.borderRadius,
          marginBottom: sizes.fieldMarginBottom,
          ...(Platform.OS === 'android' && !isWebLandscape ? { justifyContent: 'center' } : {}),
        },
        descriptionLabel: {
          color: themeController.current?.unactiveTextColor,
          fontSize: sizes.font,
          marginBottom: Platform.OS === 'android' && !isWebLandscape ? 0 : sizes.labelMarginBottom,
        },
        descriptionInput: {
          width: isWebLandscape ? undefined : '100%',
          fontWeight: '500',
          padding: 0,
          margin: Platform.OS === 'android' ? 0 : undefined,
          color: themeController.current?.textColor,
          fontSize: sizes.inputFont,
          borderRadius: sizes.borderRadius,
          backgroundColor: 'transparent',
          textAlign: isRTL ? 'right' : 'left',
          height: isWebLandscape ? height * 0.12 : sizes.descriptionHeight,
        },
        completeButton: {
          backgroundColor: themeController.current?.buttonColorPrimaryDefault,
          borderRadius: sizes.borderRadius,
          paddingVertical: isWebLandscape ? sizes.padding * 1.2 : null,
          width: sizes.saveBtnWidth,
          height: sizes.saveBtnHeight,
          alignItems: 'center',
          justifyContent: 'center',
        },
        completeButtonText: {
          color: 'white',
          textAlign: 'center',
          fontSize: sizes.saveBtnFont,
        },
      }),
    [isRTL, sizes, themeController, isWebLandscape]
  );

  const handleImageAdd = async (uris) => {
    setAppLoading(true);
    try {
      const uploadedUrls = await Promise.all(
        uris.map(async (uri) => {
          // Р ВµРЎРѓР В»Р С‘ РЎвЂ¦Р С•РЎвЂЎР ВµРЎв‚¬РЎРЉ Р В»Р С‘Р СР С‘РЎвЂљ РЎР‚Р В°Р В·Р СР ВµРЎР‚Р В° Р Т‘Р В»РЎРЏ Р В»Р С•Р С”Р В°Р В»РЎРЉР Р…РЎвЂ№РЎвЂ¦ РЎвЂћР В°Р в„–Р В»Р С•Р Р†:
          // if (uri.startsWith('file://')) await checkFileSize(uri, 5);

          const res = await uploadImageAsset(uri, { purpose: 'attachment', fileName: 'job' });
          return res?.url || null;
        })
      );

      setImages((prev) => [...prev, ...uploadedUrls.filter(Boolean)]);
    } catch (e) {
      logError('Р С›РЎв‚¬Р С‘Р В±Р С”Р В° Р В·Р В°Р С–РЎР‚РЎС“Р В·Р С”Р С‘ Р С‘Р В·Р С•Р В±РЎР‚Р В°Р В¶Р ВµР Р…Р С‘Р в„–:', e);
      showError(e?.message || t('errors.unexpected_error'));
    } finally {
      setAppLoading(false);
    }
  };

  // Р В¤РЎС“Р Р…Р С”РЎвЂ Р С‘РЎРЏ РЎС“Р Т‘Р В°Р В»Р ВµР Р…Р С‘РЎРЏ Р С”Р В°РЎР‚РЎвЂљР С‘Р Р…Р С”Р С‘ Р С—Р С• Р С‘Р Р…Р Т‘Р ВµР С”РЎРѓРЎС“
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState(null);
  const removeImage = (indexToRemove) => {
    setImages((prevImages) =>
      prevImages.filter((_, index) => index !== indexToRemove)
    );
  };
  const confirmRemoveImage = () => {
    if (pendingRemoveIndex !== null) removeImage(pendingRemoveIndex);
    setPendingRemoveIndex(null);
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
          width: width - (isLandscape ? effectiveSidebarWidth : 0),
          backgroundColor: themeController.current?.backgroundColor,
          alignSelf: isRTL ? 'flex-start' : 'flex-end',
          paddingHorizontal: sizes.containerPaddingHorizontal,
        }}
        onPress={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Header */}
        <View style={dynamicStyles.modalHeader}>
          <TouchableOpacity
            onPress={() => {
              closeModal(false);
            }}
          >
            <Image
              source={isRTL ? icons.forward : icons.back}
              style={dynamicStyles.backButtonImage}
            />
          </TouchableOpacity>
          <Text style={dynamicStyles.modalTitle}>FLALX</Text>
        </View>

        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
          <View
            style={{
              alignSelf: 'center',
            }}
          >
            <Text style={dynamicStyles.titleText}>
              {t('showJob.completeModal.title')}
            </Text>
            <Text style={dynamicStyles.subtitleText}>
              {t('showJob.completeModal.sub_title')}
            </Text>
          </View>
          <View
            style={{
              alignSelf: isRTL ? 'flex-end' : 'flex-start',
              width: isWebLandscape ? undefined : '100%',
            }}
          >
            <View
              style={[
                styles.gridFull,
                {
                  zIndex: 5,
                  marginBottom: sizes.fieldMarginBottom,
                },
              ]}
            >
              <Text
                style={[
                  dynamicStyles.uploadLabel,
                  isRTL && { textAlign: 'right' },
                ]}
              >
                {t('newJob.uploadingPhotos', {
                  defaultValue: 'Uploading photos',
                })}
              </Text>

              <View
                style={[
                  styles.imageRow,
                  isRTL && { flexDirection: 'row-reverse' },
                ]}
              >
                <TouchableOpacity
                  onPress={() => setImageModalVisible(true)}
                  style={dynamicStyles.addImageButton}
                >
                  <Image
                    source={icons.plus}
                    style={dynamicStyles.plusIcon}
                    resizeMode='contain'
                  />
                </TouchableOpacity>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.imageScrollContainer}
                >
                  {(isRTL ? images.map((uri, i) => ({ uri, i })).reverse() : images.map((uri, i) => ({ uri, i }))).map(({ uri, i: index }) => (
                    <View key={index} style={dynamicStyles.imageWrapper}>
                      <Image source={{ uri }} style={dynamicStyles.image} />
                      <TouchableOpacity
                        style={dynamicStyles.removeIconContainer}
                        onPress={() => setPendingRemoveIndex(index)}
                      >
                        <Image
                          source={icons.cross}
                          style={dynamicStyles.crossIcon}
                          resizeMode='contain'
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
            <View style={[styles.inputBlock, dynamicStyles.descriptionInputContainer]}>
              <Text
                style={[
                  dynamicStyles.descriptionLabel,
                  isRTL && { textAlign: 'right' },
                ]}
              >
                {t('newJob.description', {
                  defaultValue: 'Description',
                })}
              </Text>
              <CustomTextInput
                value={description}
                onChangeText={setDescription}
                placeholder={t('newJob.typePlaceholder', {
                  defaultValue: 'Type...',
                })}
                placeholderTextColor={
                  themeController.current?.formInputLabelColor
                }
                style={dynamicStyles.descriptionInput}
                multiline
              />
            </View>
            <TouchableOpacity
              key='completeBtn'
              style={[styles.createButton, dynamicStyles.completeButton]}
              onPress={() => {
                completeFunc({
                  description: description,
                  images: images,
                });
              }}
            >
              <Text style={dynamicStyles.completeButtonText}>
                {t('showJob.buttons.complete', {
                  defaultValue: 'Complete',
                })}
              </Text>
            </TouchableOpacity>
            <ImagePickerModal
              visible={imageModalVisible}
              onClose={() => setImageModalVisible(false)}
              onAdd={handleImageAdd}
              limitType='jobImages'
              multiple
            />
            <ConfirmModal
              visible={pendingRemoveIndex !== null}
              title={t('common.confirm_remove_image')}
              onCancel={() => setPendingRemoveIndex(null)}
              onConfirm={confirmRemoveImage}
              confirmText={t('common.remove')}
              destructive
            />
          </View>
        </ScrollView>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function CompleteJobModal({
  visible,
  main,
  closeModal,
  completeFunc,
}) {
  const { isWebLandscape } = useComponentContext();
  return (
    <>
      {isWebLandscape ? (
        <JobModalWrapper visible={visible} main={main}>
          <CompleteJobModalContent
            closeModal={closeModal}
            completeFunc={completeFunc}
          />
        </JobModalWrapper>
      ) : (
        <Modal visible={visible} animationType='slide' transparent>
          <CompleteJobModalContent
            closeModal={closeModal}
            completeFunc={completeFunc}
          />
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  modalHeader: {
    // flexDirection: 'row',
    // alignItems: 'center',
    // padding: RFValue(10),
    // borderBottomWidth: 1,
    // borderColor: '#ccc',
    // justifyContent: 'space-between',
  },
  modalTitle: {
    // fontWeight: 'bold',
    // color: '#0A62EA',
    // fontFamily: 'Rubik-Bold',
  },
  createButton: {
    // paddingVertical: RFValue(12),
    // borderRadius: RFValue(5),
    // marginBottom: RFValue(10),
    // alignItems: 'center',
    // justifyContent: 'center',
  },
  inputBlock: {
    ...Platform.select({
      web: {
        zIndex: 1,
      },
    }),
  },
  addImageButton: {
    // justifyContent: 'center',
    // alignItems: 'center',
  },
  imageScrollContainer: {
    flexDirection: 'row',
  },
  imageWrapper: {
    // position: 'relative',
  },
  removeIcon: {
    // position: 'absolute',
    // backgroundColor: 'rgba(255,255,255,0.7)',
    // justifyContent: 'center',
    // alignItems: 'center',
    // zIndex: 10,
  },
});










