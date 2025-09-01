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

export default function CommentsSection({ userId, allowAdd }) {
  const { height, isLandscape } = useWindowInfo();
  const { themeController, providersController } = useComponentContext();
  const { t } = useTranslation();

  const [comments, setComments] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // all | positive | negative
  const [addModal, setAddModal] = useState(false);
  const [newText, setNewText] = useState('');
  const [newStatus, setNewStatus] = useState('positive'); // positive | negative

  const isWebLandscape = Platform.OS === 'web' && isLandscape;
  const sizes = {
    font: isWebLandscape ? height * 0.016 : RFValue(12),
    small: isWebLandscape ? height * 0.014 : RFValue(10),
    icon: isWebLandscape ? height * 0.03 : RFValue(18),
    scrollHeight: isWebLandscape ? height * 0.25 : height * 0.35,
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
    const res = await providersController.setComment(userId, {
      text: newText.trim(),
      status: newStatus,
    });
    if (res) {
      setComments((prev) => [res, ...prev]);
      setNewText('');
      setNewStatus('positive');
      setAddModal(false);
    }
  };

  return (
    <View style={{ marginTop: RFValue(12) }}>
      {/* Заголовок */}
      <View
        style={[
          styles.headerRow,
          { borderBottomColor: themeController.current?.breakLineColor },
        ]}
      >
        <Text
          style={{
            fontSize: sizes.font,
            fontWeight: '600',
            color: themeController.current?.textColor,
          }}
        >
          {t('comments.title')} ({comments.length})
        </Text>
        <View style={styles.ratioRow}>
          <Image
            source={ratio >= 50 ? icons.thumbUp : icons.thumbDown}
            style={{
              width: sizes.icon,
              height: sizes.icon,
              tintColor: ratio >= 50 ? 'green' : 'red',
              marginRight: RFValue(4),
            }}
          />
          <Text
            style={{
              fontSize: sizes.small,
              color: themeController.current?.textColor,
            }}
          >
            {ratio}%
          </Text>
        </View>
      </View>

      {/* Вкладки */}
      <View style={styles.tabsRow}>
        {['all', 'positive', 'negative'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tabBtn,
              {
                borderBottomColor:
                  activeTab === tab
                    ? themeController.current?.primaryColor
                    : 'transparent',
              },
            ]}
          >
            <Text
              style={{
                fontSize: sizes.small,
                fontWeight: activeTab === tab ? '700' : '400',
                color: themeController.current?.textColor,
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
        contentContainerStyle={{ paddingVertical: RFValue(6) }}
      >
        {filtered.map((c, i) => (
          <View
            key={i}
            style={[
              styles.commentCard,
              { backgroundColor: themeController.current?.formInputBackground },
            ]}
          >
            <View style={styles.commentHeader}>
              <Image
                source={c.status === 'positive' ? icons.thumbUp : icons.thumbDown}
                style={{
                  width: sizes.icon,
                  height: sizes.icon,
                  tintColor: c.status === 'positive' ? 'green' : 'red',
                }}
              />
              <Text
                style={{
                  fontSize: sizes.small,
                  marginLeft: RFValue(6),
                  color: themeController.current?.textColor,
                }}
              >
                {new Date(c.created_at).toLocaleDateString('ru-RU')}
              </Text>
            </View>
            <Text
              style={{
                fontSize: sizes.small,
                marginTop: RFValue(4),
                color: themeController.current?.textColor,
              }}
            >
              {c.text}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Кнопка добавления */}
      {allowAdd && (
        <TouchableOpacity
          style={[
            styles.addBtn,
            { backgroundColor: themeController.current?.buttonColorPrimaryDefault },
          ]}
          onPress={() => setAddModal(true)}
        >
          <Text
            style={{
              fontSize: sizes.small,
              color: themeController.current?.buttonTextColorPrimary,
              fontWeight: '600',
            }}
          >
            {t('comments.add')}
          </Text>
        </TouchableOpacity>
      )}

      {/* Модальное окно добавления */}
      <Modal visible={addModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: themeController.current?.backgroundColor },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={{ fontSize: sizes.font, fontWeight: '600' }}>
                {t('comments.add')}
              </Text>
              <TouchableOpacity onPress={() => setAddModal(false)}>
                <Image
                  source={icons.cancel}
                  style={{
                    width: sizes.icon,
                    height: sizes.icon,
                    tintColor: '#888',
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
                { color: themeController.current?.textColor },
              ]}
            />
            <View style={styles.statusRow}>
              <TouchableOpacity onPress={() => setNewStatus('positive')}>
                <Image
                  source={icons.thumbUp}
                  style={{
                    width: sizes.icon,
                    height: sizes.icon,
                    tintColor: newStatus === 'positive' ? 'green' : '#888',
                    marginRight: RFValue(12),
                  }}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setNewStatus('negative')}>
                <Image
                  source={icons.thumbDown}
                  style={{
                    width: sizes.icon,
                    height: sizes.icon,
                    tintColor: newStatus === 'negative' ? 'red' : '#888',
                  }}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[
                styles.addBtn,
                { backgroundColor: themeController.current?.buttonColorPrimaryDefault },
              ]}
              onPress={handleAdd}
            >
              <Text
                style={{
                  fontSize: sizes.small,
                  color: themeController.current?.buttonTextColorPrimary,
                  fontWeight: '600',
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
    paddingBottom: RFValue(6),
    borderBottomWidth: 1,
  },
  ratioRow: { flexDirection: 'row', alignItems: 'center' },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: RFValue(6),
  },
  tabBtn: { borderBottomWidth: 2, paddingBottom: RFValue(4) },
  commentCard: {
    borderRadius: RFValue(6),
    padding: RFValue(8),
    marginBottom: RFValue(8),
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center' },
  addBtn: {
    padding: RFValue(10),
    marginTop: RFValue(8),
    borderRadius: RFValue(6),
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalCard: {
    width: '85%',
    borderRadius: RFValue(8),
    padding: RFValue(12),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RFValue(8),
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: RFValue(6),
    padding: RFValue(8),
    minHeight: RFValue(60),
    marginBottom: RFValue(10),
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: RFValue(10),
  },
});
