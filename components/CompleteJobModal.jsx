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
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { useTranslation } from 'react-i18next';
import {
  createSubscription,
  downgradeSubscription,
  payForPlanUpgrade,
  upgradeSubscription,
} from '../src/api/subscriptions';
import { useWebView } from '../context/webViewContext';
import { useNotification } from '../src/render';
import { useState } from 'react';
import ImagePickerModal from './ui/ImagePickerModal';

function CompleteJobModalContent({ closeModal, completeFunc }) {
  const {
    themeController,
    languageController,
    subscriptionPlans,
    subscription,
  } = useComponentContext();
  const { width, height, isLandscape, sidebarWidth } = useWindowInfo();
  const { t } = useTranslation();
  const isRTL = languageController?.isRTL;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);

  const [imageModalVisible, setImageModalVisible] = useState(false);

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
    borderRadius: isWebLandscape ? scaleByHeight(8, height) : RFValue(5),
    saveBtnWidth: isWebLandscape ? scaleByHeight(380, height) : RFValue(120),
    saveBtnHeight: isWebLandscape ? scaleByHeight(62, height) : RFValue(40),
    saveBtnFont: isWebLandscape ? scaleByHeight(20, height) : RFValue(14),
    padding: isWebLandscape ? scaleByHeight(4, height) : RFValue(8),
    descriptionHeight: isWebLandscape
      ? scaleByHeight(120, height)
      : RFValue(40),
    inputContainerPaddingHorizontal: isWebLandscape
      ? scaleByHeight(16, height)
      : RFValue(8),
    inputContainerPaddingVertical: isWebLandscape
      ? scaleByHeight(10, height)
      : RFValue(6),
    font: isWebLandscape ? scaleByHeight(12, height) : RFValue(12),
    inputFont: isWebLandscape ? scaleByHeight(16, height) : RFValue(10),
    padding: isWebLandscape ? scaleByHeight(4, height) : RFValue(8),
    photosLabelSize: isWebLandscape ? scaleByHeight(18, height) : RFValue(12),
    photosLabelMarginBottom: isWebLandscape
      ? scaleByHeight(14, height)
      : RFValue(6),
    thumb: isWebLandscape ? scaleByHeight(128, height) : RFValue(80),
    imageSize: isWebLandscape ? scaleByHeight(32, height) : RFPercentage(3),
    margin: isWebLandscape ? scaleByHeight(18, height) : RFValue(10),
    removeIconSize: isWebLandscape ? scaleByHeight(20, height) : RFValue(20),
    removeIconPosition: isWebLandscape ? scaleByHeight(3, height) : RFValue(4),
    crossIconSize: isWebLandscape ? scaleByHeight(16, height) : RFValue(20),
    titleMarginBottom: isWebLandscape ? scaleByHeight(8, height) : RFValue(8),
    subtitleMarginBottom: isWebLandscape ? scaleByHeight(24, height) : RFValue(16),
    fieldMarginBottom: isWebLandscape ? scaleByHeight(16, height) : RFValue(8),
  };

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

  const bg = themeController.current?.formInputBackground;

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
              alignSelf: 'center',
            }}
          >
            <Text
              style={{
                textAlign: 'center',
                fontSize: sizes.photosLabelSize,
                color: themeController?.current.textColor,
                marginBottom: sizes.titleMarginBottom,
              }}
            >
              {t('showJob.completeModal.title')}
            </Text>
            <Text
              style={{
                textAlign: 'center',
                fontSize: sizes.inputFont,
                color: themeController?.current.unactiveTextColor,
                marginBottom: sizes.subtitleMarginBottom,
              }}
            >
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
                  // marginBottom: sizes.margin,
                  zIndex: 5,
                  marginBottom: sizes.fieldMarginBottom,
                },
              ]}
            >
              <Text
                style={[
                  isRTL && { textAlign: 'right' },
                  {
                    fontSize: sizes.photosLabelSize,
                    marginBottom: sizes.photosLabelMarginBottom,
                    color: themeController.current?.textColor,
                  },
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
                  style={[
                    styles.addImageButton,
                    {
                      backgroundColor:
                        themeController.current?.profileDefaultBackground,
                      width: sizes.thumb,
                      height: sizes.thumb,
                      borderRadius: sizes.borderRadius,
                      marginRight: isRTL ? 0 : sizes.margin / 2,
                      marginLeft: isRTL ? sizes.margin / 2 : 0,
                    },
                  ]}
                >
                  <Image
                    source={icons.plus}
                    style={{
                      width: sizes.imageSize,
                      height: sizes.imageSize,
                      tintColor: themeController.current?.primaryColor,
                    }}
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
                    <View
                      key={index}
                      style={[
                        styles.imageWrapper,
                        {
                          backgroundColor:
                            themeController.current?.formInputBackground,
                          marginRight: isRTL ? 0 : sizes.margin / 2,
                          marginLeft: isRTL ? sizes.margin / 2 : 0,
                        },
                      ]}
                    >
                      <Image
                        source={{ uri }}
                        style={{
                          width: sizes.thumb,
                          height: sizes.thumb,
                          borderRadius: sizes.borderRadius,
                        }}
                      />
                      <TouchableOpacity
                        style={[
                          styles.removeIcon,
                          {
                            borderRadius: sizes.removeIconSize,
                            top: sizes.removeIconPosition,
                            right: sizes.removeIconPosition,
                            width: sizes.removeIconSize,
                            height: sizes.removeIconSize,
                          },
                        ]}
                        onPress={() => removeImage(index)}
                      >
                        <Image
                          source={icons.cross}
                          style={{
                            width: sizes.crossIconSize,
                            height: sizes.crossIconSize,
                            tintColor: themeController.current?.textColor,
                          }}
                          resizeMode='contain'
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
            <View
              style={[
                styles.inputBlock,
                { backgroundColor: bg },
                {
                  paddingVertical: sizes.inputContainerPaddingVertical,
                  paddingHorizontal: sizes.inputContainerPaddingHorizontal,
                  borderRadius: sizes.borderRadius,
                  marginBottom: sizes.fieldMarginBottom * 2,
                  height: sizes.descriptionHeight,
                },
              ]}
            >
              <Text
                style={[
                  {
                    color: themeController.current?.unactiveTextColor,
                  },
                  isRTL && { textAlign: 'right' },
                  { fontSize: sizes.font },
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
                style={{
                  fontWeight: '500',
                  padding: 0,
                  paddingVertical: sizes.padding,
                  color: themeController.current?.textColor,
                  fontSize: sizes.inputFont,
                  borderRadius: sizes.borderRadius,
                  backgroundColor: 'transparent',
                  textAlign: isRTL ? 'right' : 'left',
                }}
                multiline
              />
            </View>
            <TouchableOpacity
              key='completeBtn'
              style={[
                styles.createButton,
                {
                  backgroundColor:
                    themeController.current?.buttonColorPrimaryDefault,
                  borderRadius: sizes.borderRadius,
                  ...(isWebLandscape && {
                    paddingVertical: sizes.padding * 1.2,
                  }),
                },
                isWebLandscape && {
                  width: sizes.saveBtnWidth,
                  height: sizes.saveBtnHeight,
                },
              ]}
              onPress={() => {
                completeFunc({
                  description: description,
                  images: images,
                });
                console.log('completed');
              }}
            >
              <Text
                style={{
                  color: 'white',
                  textAlign: 'center',
                  ...(isWebLandscape && { fontSize: sizes.saveBtnFont }),
                }}
              >
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
  createButton: {
    // paddingVertical: RFValue(12),
    borderRadius: RFValue(5),
    // marginBottom: RFValue(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBlock: {
    ...Platform.select({
      web: {
        zIndex: 1,
      },
    }),
  },
  addImageButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageScrollContainer: {
    flexDirection: 'row',
  },
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
});
