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
import { uploadImageToSupabase } from '../utils/supabase/uploadImageToSupabase';
import { scaleByHeightMobile } from '../utils/resizeFuncs';

function CompleteJobModalContent({ closeModal, completeFunc }) {
  const {
    themeController,
    languageController,
    user,
    // subscriptionPlans,
    // subscription,
  } = useComponentContext();
  const { width, height, isLandscape, sidebarWidth } = useWindowInfo();
  const { t } = useTranslation();
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
        : scaleByHeightMobile(20, height),
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
        : scaleByHeightMobile(5, height),
      saveBtnWidth: isWebLandscape
        ? scaleByHeight(380, height)
        : scaleByHeightMobile(120, height),
      saveBtnHeight: isWebLandscape
        ? scaleByHeight(62, height)
        : scaleByHeightMobile(40, height),
      saveBtnFont: isWebLandscape
        ? scaleByHeight(20, height)
        : scaleByHeightMobile(14, height),
      padding: isWebLandscape
        ? scaleByHeight(4, height)
        : scaleByHeightMobile(8, height),
      descriptionHeight: isWebLandscape
        ? scaleByHeight(120, height)
        : scaleByHeightMobile(120, height),
      inputContainerPaddingHorizontal: isWebLandscape
        ? scaleByHeight(16, height)
        : scaleByHeightMobile(8, height),
      inputContainerPaddingVertical: isWebLandscape
        ? scaleByHeight(10, height)
        : scaleByHeightMobile(6, height),
      font: isWebLandscape
        ? scaleByHeight(12, height)
        : scaleByHeightMobile(12, height),
      inputFont: isWebLandscape
        ? scaleByHeight(16, height)
        : scaleByHeightMobile(14, height),
      photosLabelSize: isWebLandscape
        ? scaleByHeight(18, height)
        : scaleByHeightMobile(16, height),
      photosLabelMarginBottom: isWebLandscape
        ? scaleByHeight(14, height)
        : scaleByHeightMobile(6, height),
      thumb: isWebLandscape
        ? scaleByHeight(128, height)
        : scaleByHeightMobile(80, height),
      imageSize: isWebLandscape
        ? scaleByHeight(32, height)
        : scaleByHeightMobile(30, height),
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
      titleMarginBottom: isWebLandscape
        ? scaleByHeight(8, height)
        : scaleByHeightMobile(8, height),
      subtitleMarginBottom: isWebLandscape
        ? scaleByHeight(24, height)
        : scaleByHeightMobile(16, height),
      fieldMarginBottom: isWebLandscape
        ? scaleByHeight(16, height)
        : scaleByHeightMobile(8, height),
    }),
    [isWebLandscape, height]
  );

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        modalHeader: {
          flexDirection: isRTL ? 'row-reverse' : 'row',
          paddingHorizontal: sizes.modalHeaderPadding,
          paddingVertical: sizes.modalHeaderPaddingTop,
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
          backgroundColor: themeController.current?.formInputBackground,
          paddingVertical: sizes.inputContainerPaddingVertical,
          paddingHorizontal: sizes.inputContainerPaddingHorizontal,
          borderRadius: sizes.borderRadius,
          marginBottom: sizes.fieldMarginBottom * 2,
          height: sizes.descriptionHeight,
        },
        descriptionLabel: {
          color: themeController.current?.unactiveTextColor,
          fontSize: sizes.font,
        },
        descriptionInput: {
          fontWeight: '500',
          padding: 0,
          paddingVertical: sizes.padding,
          color: themeController.current?.textColor,
          fontSize: sizes.inputFont,
          borderRadius: sizes.borderRadius,
          backgroundColor: 'transparent',
          textAlign: isRTL ? 'right' : 'left',
        },
        completeButton: {
          backgroundColor: themeController.current?.buttonColorPrimaryDefault,
          borderRadius: sizes.borderRadius,
          paddingVertical: isWebLandscape ? sizes.padding * 1.2 : null,
          width: isWebLandscape ? sizes.saveBtnWidth : null,
          height: isWebLandscape ? sizes.saveBtnHeight : null,
          alignItems: 'center',
          justifyContent: 'center',
        },
        completeButtonText: {
          color: 'white',
          textAlign: 'center',
          fontSize: isWebLandscape ? sizes.saveBtnFont : null,
        },
      }),
    [isRTL, sizes, themeController, isWebLandscape]
  );

  const handleImageAdd = async (uris) => {
    try {
      const uploadedUrls = await Promise.all(
        uris.map(async (uri) => {
          // если хочешь лимит размера для локальных файлов:
          // if (uri.startsWith('file://')) await checkFileSize(uri, 5);

          const res = await uploadImageToSupabase(uri, user.current.id, {
            bucket: 'jobs',
            isAvatar: false,
          });
          return res?.publicUrl || null;
        })
      );

      setImages((prev) => [...prev, ...uploadedUrls.filter(Boolean)]);
    } catch (e) {
      console.error('Ошибка загрузки изображений:', e);
    }
  };

  // Функция удаления картинки по индексу
  const removeImage = (indexToRemove) => {
    setImages((prevImages) =>
      prevImages.filter((_, index) => index !== indexToRemove)
    );
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

        <ScrollView contentContainerStyle={{}}>
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
                  contentContainerStyle={[
                    styles.imageScrollContainer,
                    isRTL && { flexDirection: 'row-reverse' },
                  ]}
                >
                  {images.map((uri, index) => (
                    <View key={index} style={dynamicStyles.imageWrapper}>
                      <Image source={{ uri }} style={dynamicStyles.image} />
                      <TouchableOpacity
                        style={dynamicStyles.removeIconContainer}
                        onPress={() => removeImage(index)}
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
              <TextInput
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
                console.log('completed');
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
