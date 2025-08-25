import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { JOB_SUB_TYPES } from '../constants/jobSubTypes';
import { JOB_TYPES } from '../constants/jobTypes';
import { LICENSES } from '../constants/licenses';
import { useComponentContext } from '../context/globalAppContext';
import CustomFlatList from './ui/CustomFlatList';
import DateTimeInput from './ui/DateTimeInput';
import DateTimeInputDouble from './ui/DateTimeInputDouble';
import ImagePickerModal from './ui/ImagePickerModal';
import { icons } from '../constants/icons';
import { uploadImageToSupabase } from '../utils/supabase/uploadImageToSupabase';

const WebAbsoluteWrapper = ({ children, style }) => {
  if (Platform.OS === 'web') {
    return (
      <div
        style={{
          position: 'absolute',
          top: style?.top ?? 0,
          left: style?.left ?? 0,
          right: style?.right ?? 0,
          backgroundColor: style?.backgroundColor ?? 'white',
          border: style?.borderWidth
            ? `${style.borderWidth}px solid ${style.borderColor}`
            : undefined,
          borderRadius: style?.borderRadius ?? 0,
          maxHeight: style?.maxHeight ?? undefined,
          overflow: style?.overflow ?? 'hidden',
          zIndex: 999,
        }}
      >
        {children}
      </div>
    );
  }
  return <ScrollView style={style}>{children}</ScrollView>;
};

const renderAutocomplete = ({
  label,
  value,
  setValue,
  filtered,
  setFiltered,
  options,
  placeholder,
  stateFocusIndex,
  setFocusStates,
  filterOptions,
  focusStates,
  error,
  backgroundColor = '#DFDFFF',
}) => (
  <View style={[styles.inputBlock, { backgroundColor }]}>
    <Text style={styles.label}>{label}</Text>
    <View
      style={[
        styles.autocompleteContainer,
        error && styles.errorOutline,
        Platform.OS === 'web' && {
          display: 'block',
          position: 'relative',
          zIndex: 1,
        },
      ]}
      onFocus={() =>
        setFocusStates((prev) => {
          const newFocusStates = Array(3).fill(false);
          newFocusStates[stateFocusIndex] = true;
          return newFocusStates;
        })
      }
      // onBlur={() =>
      //   setFocusStates((prev) => {
      //     const newFocusStates = Array(3).fill(false);
      //     newFocusStates[stateFocusIndex] = false;
      //     return newFocusStates;
      //   })
      // }
    >
      {/* <-- Web-specific override */}
      <TextInput
        value={options[value]}
        onChangeText={(text) =>
          filterOptions(text, options, setFiltered, setValue)
        }
        placeholder={placeholder}
        placeholderTextColor={error ? '#FF0000' : '#999'}
        style={styles.input}
      />
      {Object.keys(filtered).length > 0 && focusStates[stateFocusIndex] && (
        <WebAbsoluteWrapper style={styles.suggestionBox}>
          {Object.keys(filtered).map((item, index) => (
            <TouchableOpacity
              key={index}
              style={{ zIndex: 999 }}
              onPress={() => {
                setValue(item);
                setFiltered([]);
                setFocusStates((prev) => {
                  const newFocusStates = Array(3).fill(false);
                  newFocusStates[stateFocusIndex] = false;
                  return newFocusStates;
                });
              }}
            >
              <Text style={styles.suggestionItem}>{options[item]}</Text>
            </TouchableOpacity>
          ))}
        </WebAbsoluteWrapper>
      )}
    </View>
  </View>
);


async function editJobById(jobId, updates, session) {
  try {
    const token = session?.token?.access_token;

    const response = await fetch(`${session.serverURL}/jobs/${jobId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Ошибка при обновлении заявки');
    }

    const updatedJob = await response.json();
    return updatedJob;
  } catch (error) {
    console.error('Ошибка обновления job:', error.message);
    throw error;
  }
}

async function createNewJob(jobData, session) {
  try {
    const token = session?.token?.access_token;

    const response = await fetch(`${session.serverURL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // если у тебя авторизация через JWT
      },
      body: JSON.stringify(jobData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Ошибка при создании заявки');
    }

    const createdJob = await response.json();
    return createdJob;
  } catch (error) {
    console.error('Ошибка создания job:', error.message);
    throw error;
  }
}

async function getJobById(jobId, session) {
  const token = session?.token?.access_token;
  const res = await fetch(`${session.serverURL}/jobs/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch job');
  }
  return res.json();
}

export default function NewJobModal({
  activeKey = '',
  closeModal,
  editMode = false,
  currentJobId = null,
  initialJob = null,
}) {
  const {
    themeController, session, user
  } = useComponentContext();

  // const [initialJob, setInitialJob] = useState(initialJob);
  // const [loading, setLoading] = useState(editMode);

  const [filteredTypes, setFilteredTypes] = useState(JOB_TYPES);
  const [filteredSubTypes, setFilteredSubTypes] = useState(JOB_SUB_TYPES);
  const [filteredProfessions, setFilteredProfessions] = useState(LICENSES);
  // локальные стейты не зависят от async-данных при создании
  const [type, setType] = useState(initialJob ? initialJob.type || '' :  activeKey || '');
  const [subType, setSubType] = useState(initialJob?.subType || '');
  const [profession, setProfession] = useState(initialJob?.profession || '');
  const [description, setDescription] = useState(initialJob?.description || '');
  const [price, setPrice] = useState(initialJob?.price || '');
  const [images, setImages] = useState(initialJob?.images || []);     // тут будут уже public URLs
  const [location, setLocation] = useState(initialJob?.location || '');
  const [startDateTime, setStartDateTime] = useState(initialJob?.startDateTime || null);
  const [endDateTime, setEndDateTime] = useState(initialJob?.endDateTime || null);

  const [modalVisible, setModalVisible] = useState(false);
  // Состояния для управления фокусом на полях ввода
  const [focusStates, setFocusStates] = useState([false, false, false]);

  const [fieldErrors, setFieldErrors] = useState({
    type: false,
    subType: false,
    profession: false,
  });
  
  // Функция, которая «засеивает» форму из job
  // const seedFormFromJob = (job) => {
  //   setType(job.type || '');
  //   setSubType(job.subType || '');
  //   setProfession(job.profession || '');
  //   setDescription(job.description || '');
  //   setPrice(job.price || '');
  //   setImages(job.images || []);           // уже URL’ы
  //   setLocation(job.location || '');
  //   setStartDateTime(job.startDateTime || null);
  //   setEndDateTime(job.endDateTime || null);
  // };
  
  // Подгружаем job при редактировании
  // useEffect(() => {
  //   if (!editMode || !currentJobId) return;
  //   let cancelled = false;

  //   (async () => {
  //     try {
  //       setLoading(true);
  //       const job = await getJobById(currentJobId, session);
  //       if (cancelled) return;
  //       setInitialJob(job);
  //       seedFormFromJob(job);
  //     } catch (e) {
  //       console.error('Failed to load job:', e);
  //     } finally {
  //       if (!cancelled) setLoading(false);
  //     }
  //   })();

  //   return () => { cancelled = true; };
  // }, [editMode, currentJobId, session]);

  const handleCreate = () => {
    const newErrors = {
      type: !type,
      subType: !subType,
      profession: !profession,
    };

    setFieldErrors(newErrors);

    const hasErrors = Object.values(newErrors).some((e) => e);

    if (hasErrors) return;

    if (editMode && currentJobId) {
      const jobChanges = {};

      if (type !== initialJob.type) jobChanges.type = type;
      if (subType !== initialJob.subType) jobChanges.subType = subType;
      if (profession !== initialJob.profession)
        jobChanges.profession = profession;
      if (description !== initialJob.description)
        jobChanges.description = description;
      if (price !== initialJob.price) jobChanges.price = price;
      if (location !== initialJob.location) jobChanges.location = location;
      // сравнение дат (если обе существуют и разные)
      if (
        startDateTime &&
        new Date(startDateTime).toISOString() !== initialJob.startDateTime
      ) {
        jobChanges.startDateTime = new Date(startDateTime).toISOString();
      }
      if (
        endDateTime &&
        new Date(endDateTime).toISOString() !== initialJob.endDateTime
      ) {
        jobChanges.endDateTime = new Date(endDateTime).toISOString();
      }
      if (Object.keys(jobChanges).length > 0) {
        editJobById(currentJobId, jobChanges, session);
      }
    } else {
      const newJob = {
        type,
        subType,
        profession,
        description,
        price,
        images,
        location,
        // Преобразуем даты в ISO формат
        startDateTime: startDateTime
          ? new Date(startDateTime).toISOString()
          : null,
        endDateTime: endDateTime ? new Date(endDateTime).toISOString() : null,
        // createdAt: new Date().toISOString(),
        status: 'waiting', // статус задания
        creator: user.current.id,
      };

      createNewJob(newJob, session);
    }
    closeModal();
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

  const filterOptions = (text, options, setter, targetSetter) => {
    targetSetter(text);
    if (text.length === 0) {
      setter([]);
    } else {
      const filtered = Object.fromEntries(
        Object.keys(options)
          .filter((key) =>
            options[key].toLowerCase().includes(text.toLowerCase())
          )
          .map((key) => [key, options[key]])
      );
      setter(filtered);
    }
  };

  const formContent = [
    renderAutocomplete({
      label: 'Type',
      value: type,
      setValue: (text) => {
        setType(text);
        if (fieldErrors.type && text) {
          setFieldErrors((prev) => ({ ...prev, type: false }));
        }
      },
      filtered: filteredTypes,
      setFiltered: setFilteredTypes,
      options: JOB_TYPES,
      placeholder: 'Select or type...',
      stateFocusIndex: 0,
      setFocusStates: setFocusStates,
      filterOptions: filterOptions,
      focusStates: focusStates,
      error: fieldErrors.type,
      backgroundColor: themeController.current?.formInputBackground,
    }),
    renderAutocomplete({
      label: 'Sub type',
      value: subType,
      setValue: (text) => {
        setSubType(text);
        if (fieldErrors.subType && text) {
          setFieldErrors((prev) => ({ ...prev, subType: false }));
        }
      },
      filtered: filteredSubTypes,
      setFiltered: setFilteredSubTypes,
      options: JOB_SUB_TYPES,
      placeholder: 'Select or type...',
      stateFocusIndex: 1,
      setFocusStates: setFocusStates,
      filterOptions: filterOptions,
      focusStates: focusStates,
      error: fieldErrors.subType,
      backgroundColor: themeController.current?.formInputBackground,
    }),
    renderAutocomplete({
      label: 'Profession (optional)',
      value: profession,
      setValue: (text) => {
        setProfession(text);
        if (fieldErrors.profession && text) {
          setFieldErrors((prev) => ({ ...prev, profession: false }));
        }
      },
      filtered: filteredProfessions,
      setFiltered: setFilteredProfessions,
      options: LICENSES,
      placeholder: 'Select...',
      stateFocusIndex: 2,
      setFocusStates: setFocusStates,
      filterOptions: filterOptions,
      focusStates: focusStates,
      error: fieldErrors.profession,
      backgroundColor: themeController.current?.formInputBackground,
    }),
    <View
      style={[
        styles.inputBlock,
        { backgroundColor: themeController.current?.formInputBackground },
      ]}
      key='description'
    >
      <Text style={styles.label}>Description</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder='Type...'
        placeholderTextColor={'#999'}
        style={[styles.input, { height: RFValue(70) }]}
        multiline
      />
    </View>,
    <View
      style={[
        styles.inputBlock,
        { backgroundColor: themeController.current?.formInputBackground },
      ]}
      key='price'
    >
      <Text style={styles.label}>Price</Text>
      <TextInput
        value={price}
        onChangeText={setPrice}
        placeholder='Type...'
        placeholderTextColor={'#999'}
        style={styles.input}
        keyboardType='numeric'
      />
    </View>,
    <View style={styles.imageInputBlock} key='images'>
      <View style={styles.imageRow}>
        {/* Кнопка добавления */}
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.addImageButton}
        >
        <Image
          source={icons.plus}
          style={{
            width: RFPercentage(3), // 14
            height: RFPercentage(3),
            tintColor: themeController.current?.buttonTextColorPrimary,
          }}
          resizeMode='contain'
        />
        </TouchableOpacity>

        {/* Скролл с картинками */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imageScrollContainer}
        >
          {images.map((uri, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.imageThumbnail} />
              <TouchableOpacity
                style={styles.removeIcon}
                onPress={() => removeImage(index)}
              >
              <Image
                source={icons.cross}
                style={{
                  width: RFValue(16),
                  height: RFValue(16),
                  tintColor: themeController.current?.formInputLabelColor,
                }}
                resizeMode='contain'
              />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      <ImagePickerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleImageAdd}
      />
    </View>,
    <View
      style={[
        styles.inputBlock,
        { backgroundColor: themeController.current?.formInputBackground },
      ]}
      key='location'
    >
      <Text style={styles.label}>Location</Text>
      <TextInput
        value={location}
        onChangeText={setLocation}
        placeholder='Type...'
        placeholderTextColor={'#999'}
        style={styles.input}
      />
    </View>,
    <View style={styles.row} key='dateTimeRange'>
      {Platform.OS !== 'android' ? (
        <DateTimeInput
          key='startDateTime'
          label='Start Date & Time'
          value={startDateTime}
          onChange={setStartDateTime}
        />
      ) : (
        <DateTimeInputDouble
          label='Start Date & Time'
          value={startDateTime}
          onChange={setStartDateTime}
        />
      )}
      {Platform.OS !== 'android' ? (
        <DateTimeInput
          key='endDateTime'
          label='End Date & Time'
          value={endDateTime}
          onChange={setEndDateTime}
        />
      ) : (
        <DateTimeInputDouble
          label='End Date & Time'
          value={endDateTime}
          onChange={setEndDateTime}
        />
      )}
    </View>,
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View
        style={{ flex: 1, backgroundColor: themeController.current?.backgroundColor }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            // onPress={() =>
            //   router.canGoBack?.() ? router.back() : router.replace('/store')
            // }
            onPress={() => closeModal()}
          >
            <Image
              source={icons.cross}
              style={{
                width: RFValue(20),
                height: RFValue(20),
                tintColor: themeController.current?.formInputLabelColor,
              }}
              resizeMode='contain'
            />
          </TouchableOpacity>
          <Text
            style={[styles.logo, { color: themeController.current?.primaryColor }]}
          >
            FLALX
          </Text>
        </View>

        {Platform.OS === 'web' ? (
          <CustomFlatList
            data={formContent}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => item}
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps='handled'
          />
        ) : (
          <FlatList
            data={formContent}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => item}
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps='handled'
          />
        )}

        <View style={styles.bottomButtonWrapper}>
          <TouchableOpacity
            style={[
              styles.createButton,
              { backgroundColor: themeController.current?.buttonColorPrimaryDefault },
            ]}
            onPress={handleCreate}
          >
            <Text
              style={{
                color: 'white',
                textAlign: 'center',
                fontWeight: 'bold',
              }}
            >
              {editMode ? 'Save' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: RFValue(14),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: RFValue(14),
  },
  logo: {
    fontSize: RFValue(20),
    fontWeight: 'bold',
  },
  inputBlock: {
    marginBottom: RFValue(10),
    borderRadius: RFValue(5),
    padding: RFValue(8),
    ...Platform.select({
      web: {
        zIndex: 1,
      },
    }),
  },
  imageInputBlock: {
    marginBottom: RFValue(10),
    ...Platform.select({
      web: {
        zIndex: 1,
      },
    }),
  },
  label: {
    fontWeight: 'bold',
    marginBottom: RFValue(4),
  },
  input: {
    padding: RFValue(8),
  },
  autocompleteContainer: {
    position: 'relative',
  },
  suggestionBox: {
    position: 'absolute',
    top: RFValue(28),
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    zIndex: 999,
    maxHeight: RFValue(120),
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
    padding: RFValue(7),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  addImageButton: {
    width: RFValue(80),
    height: RFValue(80),
    backgroundColor: '#84B0F4',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RFValue(6),
    marginRight: RFValue(6),
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  imageScrollContainer: {
    flexDirection: 'row',
  },
  imageThumbnail: {
    width: RFValue(80),
    height: RFValue(80),
    borderRadius: RFValue(6),
    marginRight: RFValue(6),
  },
  imageWrapper: {
    position: 'relative',
    marginRight: RFValue(6), // отступ между картинками
  },
  removeIcon: {
    position: 'absolute',
    top: RFValue(4),
    right: RFValue(4),
    backgroundColor: 'rgba(255,255,255,0.7)', // чуть прозрачный белый фон, чтобы крестик был читаемым
    borderRadius: RFValue(12),
    width: RFValue(20),
    height: RFValue(20),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  bottomButtonWrapper: {
    padding: RFValue(10),
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: RFValue(4),
    elevation: 3,
  },
  createButton: {
    paddingVertical: RFValue(12),
    borderRadius: RFValue(5),
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
});
