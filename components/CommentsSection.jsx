import { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Image,
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { useWindowInfo } from '../context/windowContext';
import { useComponentContext } from '../context/globalAppContext';
import { useTranslation } from 'react-i18next';
import { icons } from '../constants/icons';
import { scaleByHeight } from '../utils/resizeFuncs';

export default function CommentsSection({
  userId,
  allowAdd = false,
  allowAddOnly = false,
  markAsRated,
}) {
  const { height, isLandscape } = useWindowInfo();
  const { themeController, providersController, languageController } =
    useComponentContext();
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;

  const [comments, setComments] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // all | positive | negative
  const [addModal, setAddModal] = useState(false);
  const [newText, setNewText] = useState('');
  const [newStatus, setNewStatus] = useState('positive'); // positive | negative

  const isWebLandscape = Platform.OS === 'web' && isLandscape;
  const sizes = {
    font: isWebLandscape ? scaleByHeight(18, height) : RFValue(12),
    small: isWebLandscape ? scaleByHeight(14, height) : RFValue(10),
    icon: isWebLandscape ? scaleByHeight(24, height) : RFValue(18),
    scrollHeight: isWebLandscape ? scaleByHeight(464, height) : height * 0.35,
    containerWidth: isWebLandscape ? scaleByHeight(508, height) : '100%',
    containerPaddingBottom: isWebLandscape
      ? scaleByHeight(9, height)
      : RFValue(6),
    iconMargin: isWebLandscape ? scaleByHeight(8, height) : RFValue(4),
    commentsPaddingVertical: isWebLandscape
      ? scaleByHeight(16, height)
      : RFValue(8),
    borderRadius: isWebLandscape ? scaleByHeight(8, height) : RFValue(6),
    commentPaddingVertical: isWebLandscape
      ? scaleByHeight(8, height)
      : RFValue(4),
    commentPaddingHorizontal: isWebLandscape
      ? scaleByHeight(16, height)
      : RFValue(8),
    commentTextMarginTop: isWebLandscape
      ? scaleByHeight(4, height)
      : RFValue(3),
    btnWidth: isWebLandscape ? scaleByHeight(330, height) : '100%',
    btnHeight: isWebLandscape ? scaleByHeight(62, height) : RFValue(35),
    btnTextSize: isWebLandscape ? scaleByHeight(20, height) : RFValue(18),
    btnMarginVertical: isWebLandscape ? scaleByHeight(8, height) : RFValue(4),
    modalWidth: isWebLandscape ? scaleByHeight(405, height) : '90%',
    modalHeight: isWebLandscape ? scaleByHeight(450, height) : '90%',
    modalPadding: isWebLandscape ? scaleByHeight(32, height) : RFValue(10),
    modalCrossTop: isWebLandscape ? scaleByHeight(8, height) : RFValue(5),
    modalCrossRight: isWebLandscape ? scaleByHeight(8, height) : RFValue(5),
    modalTextfieldHeight: isWebLandscape
      ? scaleByHeight(144, height)
      : RFValue(40),
    modalTextfieldWidth: isWebLandscape ? scaleByHeight(330, height) : '100%',
    modalIconPadding: isWebLandscape ? scaleByHeight(16, height) : RFValue(5),
    modalIconsGap: isWebLandscape ? scaleByHeight(35, height) : RFValue(7),
  };

  // загрузка комментариев
  useEffect(() => {
    if (userId) {
      providersController.getCommentsReceived(userId).then(setComments);
    }
  }, [userId]);

  const positiveCount = comments.filter((c) => c.status === 'positive').length;
  const negativeCount = comments.filter((c) => c.status === 'negative').length;
  const ratio = comments.length
    ? Math.round((positiveCount / comments.length) * 100)
    : 0;

  const filtered = comments.filter((c) => {
    if (activeTab === 'positive') return c.status === 'positive';
    if (activeTab === 'negative') return c.status === 'negative';
    return true;
  });

  const handleAdd = async () => {
    if (!newText.trim()) return;
    console.log('comment - ', newStatus, newText.trim());

    const res = await providersController.setComment(userId, {
      text: newText.trim(),
      // status: newStatus,
      rating: 1,
    });
    if (res) {
      setComments((prev) => [res, ...prev]);
      setNewText('');
      setNewStatus('positive');
      setAddModal(false);
      // markAsRated?.()
      console.log('comment sent');
      
    }
  };

  return (
    <View
      style={[
        isWebLandscape && {
          width: sizes.containerWidth,
          alignSelf: isRTL ? 'flex-end' : 'flex-start',
        },
      ]}
    >
      {!allowAddOnly && (
        <>
          {/* Заголовок */}
          <View
            style={[
              styles.headerRow,
              { paddingBottom: sizes.containerPaddingBottom },
              isRTL && { flexDirection: 'row-reverse' },
            ]}
          >
            <Text
              style={{
                fontSize: sizes.font,
                fontFamily: 'Rubik-SemiBold',
                color: themeController.current?.textColor,
              }}
            >
              {t('comments.title')} ({comments.length})
            </Text>
            <View style={styles.ratioRow}>
              {comments.length > 0 && (
                <>
                  <Image
                    source={ratio >= 50 ? icons.thumbUp : icons.thumbDown}
                    style={{
                      width: sizes.icon,
                      height: sizes.icon,
                      tintColor: ratio >= 50 ? 'green' : 'red',
                      marginRight: sizes.iconMargin,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: sizes.font,
                      fontFamily: 'Rubik-SemiBold',
                      color: themeController.current?.textColor,
                    }}
                  >
                    {ratio}%
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Вкладки */}
          <View
            style={[
              styles.tabsRow,
              { borderBottomColor: themeController.current?.breakLineColor },
            ]}
          >
            {['all', 'positive', 'negative'].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabBtn]}
              >
                <Text
                  style={{
                    fontSize: sizes.small,
                    color:
                      activeTab === tab
                        ? themeController.current?.textColor
                        : themeController.current?.formInputPlaceholderColor,
                  }}
                >
                  {t(`comments.${tab}`)}{' '}
                  {tab !== 'all' &&
                    `(${comments.filter((c) => c.status === tab).length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Список */}
          <ScrollView
            style={{ maxHeight: sizes.scrollHeight }}
            contentContainerStyle={{
              paddingVertical: sizes.commentsPaddingVertical,
            }}
          >
            {filtered.map((c, i) => (
              <View
                key={i}
                style={[
                  styles.commentCard,
                  {
                    backgroundColor:
                      themeController.current?.formInputBackground,
                    borderRadius: sizes.borderRadius,
                    paddingVertical: sizes.commentPaddingVertical,
                    paddingHorizontal: sizes.commentPaddingHorizontal,
                  },
                ]}
              >
                <View
                  style={[
                    styles.commentHeader,
                    isRTL && { flexDirection: 'row-reverse' },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: sizes.small,
                      color: themeController.current?.formInputPlaceholderColor,
                    }}
                  >
                    {new Date(c.created_at).toLocaleDateString('ru-RU')}
                  </Text>
                  <Image
                    source={
                      c.status === 'positive' ? icons.thumbUp : icons.thumbDown
                    }
                    style={{
                      width: sizes.icon,
                      height: sizes.icon,
                      tintColor:
                        newStatus === 'positive'
                          ? themeController?.current.primaryColor
                          : themeController?.current.errorTextColor,
                    }}
                  />
                </View>
                <Text
                  style={{
                    fontSize: sizes.small,
                    marginTop: sizes.commentTextMarginTop,
                    color: themeController.current?.unactiveTextColor,
                  }}
                >
                  {c.text}
                </Text>
              </View>
            ))}
          </ScrollView>
        </>
      )}
      {/* Кнопка добавления */}
      {allowAdd && (
        <TouchableOpacity
          style={[
            styles.addBtn,
            {
              backgroundColor:
                themeController.current?.buttonColorPrimaryDefault,
              width: sizes.btnWidth,
              height: sizes.btnHeight,
              borderRadius: sizes.borderRadius,
              marginVertical: sizes.btnMarginVertical,
            },
          ]}
          onPress={() => setAddModal(true)}
        >
          <Text
            style={{
              fontSize: sizes.btnTextSize,
              color: themeController.current?.buttonTextColorPrimary,
            }}
          >
            {t('comments.add')}
          </Text>
        </TouchableOpacity>
      )}

      {/* Модальное окно добавления */}
      <Modal visible={addModal} animationType='slide' transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: themeController.current?.backgroundColor,
                height: sizes.modalHeight,
                width: sizes.modalWidth,
                borderRadius: sizes.borderRadius,
                padding: sizes.modalPadding,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={{ fontSize: sizes.font }}>{t('comments.add')}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setAddModal(false)}
              style={{
                position: 'absolute',
                top: sizes.modalCrossTop,
                right: sizes.modalCrossRight,
              }}
            >
              <Image
                source={icons.cross}
                style={{
                  width: sizes.icon,
                  height: sizes.icon,
                  tintColor: themeController?.current.textColor,
                }}
              />
            </TouchableOpacity>
            <View style={[styles.statusRow, { gap: sizes.modalIconsGap }]}>
              <TouchableOpacity
                onPress={() => setNewStatus('positive')}
                style={{
                  borderRadius: sizes.icon + sizes.modalIconPadding,
                  borderWidth: 1,
                  borderColor:
                    newStatus === 'positive'
                      ? themeController?.current.primaryColor
                      : themeController?.current.unactiveTextColor,
                  padding: sizes.modalIconPadding,
                }}
              >
                <Image
                  source={icons.thumbUp}
                  style={{
                    width: sizes.icon * 1.5,
                    height: sizes.icon * 1.5,
                    tintColor:
                      newStatus === 'positive'
                        ? themeController?.current.primaryColor
                        : themeController?.current.unactiveTextColor,
                  }}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setNewStatus('negative')}
                style={{
                  borderRadius: sizes.icon + sizes.modalIconPadding,
                  borderWidth: 1,
                  borderColor:
                    newStatus === 'negative'
                      ? themeController?.current.errorTextColor
                      : themeController?.current.unactiveTextColor,
                  padding: sizes.modalIconPadding,
                }}
              >
                <Image
                  source={icons.thumbDown}
                  style={{
                    width: sizes.icon * 1.5,
                    height: sizes.icon * 1.5,
                    tintColor:
                      newStatus === 'negative'
                        ? themeController?.current.errorTextColor
                        : themeController?.current.unactiveTextColor,
                  }}
                />
              </TouchableOpacity>
            </View>
            <TextInput
              value={newText}
              onChangeText={setNewText}
              placeholder={t('comments.placeholder')}
              multiline
              style={[
                styles.input,
                {
                  color: themeController.current?.textColor,
                  borderRadius: sizes.borderRadius,
                  height: sizes.modalTextfieldHeight,
                  width: sizes.modalTextfieldWidth,
                },
              ]}
            />
            <TouchableOpacity
              style={[
                styles.addBtn,
                {
                  backgroundColor:
                    themeController.current?.buttonColorPrimaryDefault,
                  width: sizes.btnWidth,
                  height: sizes.btnHeight,
                  borderRadius: sizes.borderRadius,
                  marginVertical: sizes.btnMarginVertical,
                },
              ]}
              onPress={handleAdd}
            >
              <Text
                style={{
                  fontSize: sizes.btnTextSize,
                  color: themeController.current?.buttonTextColorPrimary,
                }}
              >
                {t('comments.submit')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratioRow: { flexDirection: 'row', alignItems: 'center' },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    // marginVertical: RFValue(6),
    borderBottomWidth: 2,
  },
  tabBtn: {},
  commentCard: {
    // borderRadius: RFValue(6),
    // padding: RFValue(8),
    // marginBottom: RFValue(8),
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addBtn: {
    // padding: RFValue(10),
    // marginTop: RFValue(8),
    // borderRadius: RFValue(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalCard: {
    // width: '85%',
    // borderRadius: RFValue(8),
    // padding: RFValue(12),
    justifyContent: 'space-between',
    position: 'relative',
    boxSizing: 'border-box',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    // marginBottom: RFValue(8),
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    // borderRadius: RFValue(6),
    // padding: RFValue(8),
    // minHeight: RFValue(60),
    // marginBottom: RFValue(10),
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    // marginBottom: RFValue(10),
  },
});
