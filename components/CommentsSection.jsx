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
} from 'react-native';
import { useComponentContext } from '../context/globalAppContext';
import { useTranslation } from 'react-i18next';
import { icons } from '../constants/icons';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { useWindowInfo } from '../context/windowContext';
import CustomTextInput from './ui/CustomTextInput';

export default function CommentsSection({
  jobId,
  userId,
  allowAdd = false,
  allowAddOnly = false,
  onRated,
}) {
  const { width, height } = useWindowInfo();
  const { themeController, providersController, languageController } =
    useComponentContext();
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;

  const [comments, setComments] = useState([]);
  const [addModal, setAddModal] = useState(false);
  const [newText, setNewText] = useState('');
  const [rating, setRating] = useState(0); // 1-5
  const [hoverRating, setHoverRating] = useState(0); // 1-5 for hover/pressIn effect

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
      modalIconsGap: scale(10, height),
      modalTextareaPadding: scale(12, height),
      starIcon: scale(17, height),
      starsGap: scale(2, height),
    };
  }, [isWebLandscape, height]);

  // загрузка комментариев
  useEffect(() => {
    if (userId) {
      providersController.getCommentsReceived(userId).then(setComments);
    }
  }, [userId]);

  const averageRating = useMemo(() => {
    if (comments.length === 0) return 0;
    const totalRating = comments.reduce((acc, c) => acc + c.rating, 0);
    const avg = totalRating / comments.length;
    return Math.round(avg * 10) / 10;
  }, [comments]);

  const handleAdd = async () => {
    if (!newText.trim() || rating === 0) return;

    const res = await providersController.setComment(userId, {
      text: newText.trim(),
      rating: rating, // send 1-5 rating
      jobId,
    });
    if (res) {
      setComments((prev) => [res, ...prev]);
      setNewText('');
      setRating(0);
      setAddModal(false);
      onRated?.();
    }
  };

  const renderStars = (currentRating, starSize = sizes.starIcon) => {
    const stars = [];
    const roundedRating = Math.round(currentRating * 2) / 2; // Округляем до ближайших 0.5
    const fullStars = Math.floor(roundedRating);
    const halfStar = roundedRating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Image
          key={`full_${i}`}
          source={icons.star}
          style={{
            width: starSize,
            height: starSize,
            tintColor: themeController?.current.activeStarColor,
          }}
        />
      );
    }

    if (halfStar) {
      stars.push(
        <Image
          key="half"
          source={icons.halfStar}
          style={{
            width: starSize,
            height: starSize,
          }}
        />
      );
    }

    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Image
          key={`empty_${i}`}
          source={icons.star}
          style={{
            width: starSize,
            height: starSize,
            tintColor: themeController?.current.inactiveStarColor,
          }}
        />
      );
    }
    return stars;
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: sizes.iconMargin, gap: sizes.starsGap }}>
                    {renderStars(averageRating)}
                  </View>
                  <Text
                    style={{
                      fontSize: sizes.font,
                      fontFamily: 'Rubik-SemiBold',
                      color: themeController.current?.textColor,
                    }}
                  >
                    {averageRating.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </Text>
                </>
              )}
            </View>
          </View>


          <ScrollView
            style={{ maxHeight: sizes.scrollHeight }}
            contentContainerStyle={{
              paddingVertical: sizes.commentsPaddingVertical,
            }}
          >
            {comments.map((c, i) => (
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
                  <View style={{ flexDirection: 'row', gap: sizes.starsGap, alignItems: 'center' }}>
                    {renderStars(c.rating)}
                  </View>
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
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  onPressIn={() => setHoverRating(star)}
                  onPressOut={() => setHoverRating(0)}
                  // onMouseEnter and onMouseLeave are for web
                  onMouseEnter={() => Platform.OS === 'web' && setHoverRating(star)}
                  onMouseLeave={() => Platform.OS === 'web' && setHoverRating(0)}
                >
                  <Image
                    source={icons.star}
                    style={{
                      width: sizes.icon * 1.5,
                      height: sizes.icon * 1.5,
                      tintColor:
                        (hoverRating > 0 && star <= hoverRating) || (hoverRating === 0 && star <= rating)
                          ? themeController?.current.activeStarColor
                          : themeController?.current.inactiveStarColor,
                    }}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <CustomTextInput
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
                  padding: sizes.modalTextareaPadding,
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
