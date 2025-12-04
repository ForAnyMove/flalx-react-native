import { useEffect, useMemo, useState } from 'react';
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
  useWindowDimensions,
} from 'react-native';
import { useComponentContext } from '../context/globalAppContext';
import { useTranslation } from 'react-i18next';
import { icons } from '../constants/icons';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';

export default function CommentsSection({
  jobId,
  userId,
  allowAdd = false,
  allowAddOnly = false,
}) {
  const { width, height } = useWindowDimensions();
  const { themeController, providersController, languageController } =
    useComponentContext();
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;

  const [comments, setComments] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // all | positive | negative
  const [addModal, setAddModal] = useState(false);
  const [newText, setNewText] = useState('');
  const [rating, setRating] = useState(1); // 1 - positive, -1 - negative

  const isWebLandscape = Platform.OS === 'web' && width > height;

  const sizes = useMemo(() => {
    const scale = isWebLandscape ? scaleByHeight : scaleByHeightMobile;
    return {
      font: scale(18, height),
      small: scale(14, height),
      icon: scale(24, height),
      scrollHeight: isWebLandscape ? scaleByHeight(464, height) : height * 0.35,
      containerWidth: isWebLandscape ? scaleByHeight(508, height) : '100%',
      containerPaddingBottom: scale(9, height),
      iconMargin: scale(8, height),
      commentsPaddingVertical: scale(16, height),
      borderRadius: scale(8, height),
      commentPaddingVertical: scale(8, height),
      commentPaddingHorizontal: scale(16, height),
      commentTextMarginTop: scale(4, height),
      btnWidth: isWebLandscape ? scaleByHeight(330, height) : '100%',
      btnHeight: scale(62, height),
      btnTextSize: scale(20, height),
      btnMarginVertical: scale(8, height),
      modalWidth: isWebLandscape ? scaleByHeight(405, height) : '90%',
      modalHeight: isWebLandscape ? scaleByHeight(450, height) : '90%',
      modalPadding: scale(32, height),
      modalCrossTop: scale(8, height),
      modalCrossRight: scale(8, height),
      modalTextfieldHeight: scale(144, height),
      modalTextfieldWidth: isWebLandscape
        ? scaleByHeight(330, height)
        : '100%',
      modalIconPadding: scale(16, height),
      modalIconsGap: scale(35, height),
    };
  }, [isWebLandscape, height]);

  // загрузка комментариев
  useEffect(() => {
    if (userId) {
      providersController.getCommentsReceived(userId).then(setComments);
    }
  }, [userId]);

  const positiveCount = comments.filter((c) => c.rating > 0).length;
  const negativeCount = comments.filter((c) => c.rating < 0).length;

  const ratio = comments.length
    ? Math.round((positiveCount / comments.length) * 100)
    : 0;

  const filtered = comments.filter((c) => {
    if (activeTab === 'positive') return c.rating > 0;
    if (activeTab === 'negative') return c.rating < 0;
    return true;
  });

  const handleAdd = async () => {
    if (!newText.trim()) return;
    console.log('comment - ', rating, newText.trim());

    const res = await providersController.setComment(userId, {
      text: newText.trim(),
      rating,
      jobId
    });
    if (res) {
      setComments((prev) => [res, ...prev]);
      setNewText('');
      setRating(1);
      setAddModal(false);
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
                    `(${comments.filter((c) => tab === 'positive' ? c.rating > 0 : c.rating < 0).length})`}
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
                      c.rating > 0 ? icons.thumbUp : icons.thumbDown
                    }
                    style={{
                      width: sizes.icon,
                      height: sizes.icon,
                      tintColor:
                        rating > 0
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
                onPress={() => setRating(1)}
                style={{
                  borderRadius: sizes.icon + sizes.modalIconPadding,
                  borderWidth: 1,
                  borderColor: rating > 0
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
                    tintColor: rating > 0
                      ? themeController?.current.primaryColor
                      : themeController?.current.unactiveTextColor,
                  }}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setRating(-1)}
                style={{
                  borderRadius: sizes.icon + sizes.modalIconPadding,
                  borderWidth: 1,
                  borderColor: rating < 0
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
                    tintColor: rating < 0
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
    borderBottomWidth: 2,
  },
  tabBtn: {},
  commentCard: {},
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addBtn: {
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
    justifyContent: 'space-between',
    position: 'relative',
    boxSizing: 'border-box',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
