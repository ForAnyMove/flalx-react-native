import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
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
import { useWindowInfo } from '../context/windowContext';
import { useTranslation } from 'react-i18next';
import { scaleByHeight } from '../utils/resizeFuncs';
import { t } from 'i18next';
import SubscriptionsModal from './SubscriptionsModal';
import { createJob } from '../src/api/jobs';
import { useWebView } from '../context/webViewContext';
import AutocompletePicker from './ui/AutocompletePicker';

const getResponsiveSize = (mobileSize, webSize, isLandscape) => {
  if (Platform.OS === 'web') {
    return isLandscape ? webSize : RFValue(mobileSize);
  }
  return RFValue(mobileSize);
};

const WebAbsoluteWrapper = ({ children, style, landscapeStyles }) => {
  if (Platform.OS === 'web') {
    return (
      <div
        style={{
          position: 'absolute',
          left: landscapeStyles?.left ?? style?.left ?? 0,
          right: style?.right ?? 0,
          backgroundColor: style?.backgroundColor ?? 'white',
          border: style?.borderWidth
            ? `${style.borderWidth}px solid ${style.borderColor}`
            : undefined,
          borderRadius:
            landscapeStyles?.borderRadius ?? style?.borderRadius ?? 0,
          maxHeight:
            landscapeStyles?.maxHeight ?? style?.maxHeight ?? undefined,
          overflow: style?.overflow ?? 'hidden',
          zIndex: 999,
          width: landscapeStyles?.width ?? style?.width ?? '110%',
        }}
      >
        {children}
      </div>
    );
  }
  return <ScrollView style={style}>{children}</ScrollView>;
};

// Новый компонент для элемента списка с поддержкой hover-эффекта
const SuggestionItem = ({
  itemKey,
  text,
  onPress,
  themeController,
  isWebLandscape,
  sizeOverrides,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Обработчики событий для веб-платформы
  const webHoverProps =
    Platform.OS === 'web'
      ? {
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
      }
      : {};

  return (
    <TouchableOpacity key={itemKey} onPress={onPress} {...webHoverProps}>
      <Text
        style={[
          styles.suggestionItem,
          { color: themeController.current?.formInputLabelColor },
          isWebLandscape && {
            paddingHorizontal: sizeOverrides.inputContainerPaddingHorizontal,
            fontSize: sizeOverrides.inputFont,
            paddingVertical: sizeOverrides.inputContainerPaddingVertical,
          },
          // Применяем стиль при наведении
          isHovered && {
            backgroundColor: themeController.current?.profileDefaultBackground,
            borderRadius: themeController.current?.textColor,
          },
        ]}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
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
  backgroundColor = '#F0F0FA',
  rtl = false,
  isWebLandscape = false,
  sizeOverrides = {},
}) => {
  const { themeController } = useComponentContext();
  return (
    <View
      style={[
        styles.inputBlock,
        { backgroundColor },
        isWebLandscape && {
          paddingVertical: sizeOverrides.inputContainerPaddingVertical,
          paddingHorizontal: sizeOverrides.inputContainerPaddingHorizontal,
          borderRadius: sizeOverrides.borderRadius,
          marginBottom: 0,
          height: sizeOverrides.inputHeight,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: error
              ? '#FF0000'
              : themeController.current?.unactiveTextColor,
          },
          rtl && { textAlign: 'right' },
          isWebLandscape && { fontSize: sizeOverrides.font },
        ]}
      >
        {label}
      </Text>
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
          placeholderTextColor={
            error ? '#FF0000' : themeController.current?.formInputLabelColor
          }
          style={[
            styles.input,
            rtl && { textAlign: 'right' },
            { color: error ? '#FF0000' : themeController.current?.textColor },
            isWebLandscape && {
              padding: 0,
              paddingVertical: sizeOverrides.padding,
              fontSize: sizeOverrides.inputFont,
              borderRadius: sizeOverrides.borderRadius,
            },
          ]}
        />
        {Object.keys(filtered).length > 0 && focusStates[stateFocusIndex] && (
          <WebAbsoluteWrapper
            style={{
              ...styles.suggestionBox,
              backgroundColor: themeController.current?.formInputBackground,
            }}
            landscapeStyles={
              isWebLandscape && {
                maxHeight: sizeOverrides.thumb,
                borderRadius: sizeOverrides.borderRadius,
                width: `calc(100% + ${sizeOverrides.inputContainerPaddingHorizontal * 2
                  }px)`,
                left: `-${sizeOverrides.inputContainerPaddingHorizontal}px`,
              }
            }
          >
            {Object.keys(filtered).map((item, index) => (
              // <TouchableOpacity
              //   key={index}
              //   style={{ zIndex: 1999 }}
              //   onPress={() => {
              //     setValue(item);
              //     setFiltered([]);
              //     setFocusStates((prev) => {
              //       const newFocusStates = Array(3).fill(false);
              //       newFocusStates[stateFocusIndex] = false;
              //       return newFocusStates;
              //     });
              //   }}
              // >
              //   <Text
              //     style={[
              //       styles.suggestionItem,
              //       { color: themeController.current?.formInputLabelColor },
              //       isWebLandscape && {
              //         paddingHorizontal:
              //           sizeOverrides.inputContainerPaddingHorizontal,
              //         fontSize: sizeOverrides.inputFont,
              //         paddingVertical:
              //           sizeOverrides.inputContainerPaddingVertical,
              //       },
              //     ]}
              //   >
              //     {options[item]}
              //   </Text>
              // </TouchableOpacity>
              <SuggestionItem
                key={index}
                itemKey={item}
                text={options[item]}
                onPress={() => {
                  setValue(item);
                  setFiltered([]);
                  setFocusStates((prev) => {
                    const newFocusStates = Array(3).fill(false);
                    newFocusStates[stateFocusIndex] = false;
                    return newFocusStates;
                  });
                }}
                themeController={themeController}
                isWebLandscape={isWebLandscape}
                sizeOverrides={sizeOverrides}
              />
            ))}
          </WebAbsoluteWrapper>
        )}
      </View>
    </View>
  );
};

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

async function createNewJob(jobData, session, openWebView, updateJobsList) {
  try {
    const data = await createJob(jobData, session);
    if (data.paymentUrl) {
      openWebView(data.paymentUrl, () => {
        // reload jobs after closing webview
      });
    }
    else if (data.job) {
      updateJobsList?.();
    }
  } catch (error) {
    console.error('Ошибка создания job:', error.message);
    throw error;
  }

  // try {
  //   const token = session?.token?.access_token;

  //   const response = await fetch(`${session.serverURL}/jobs`, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       Authorization: `Bearer ${token}`, // если у тебя авторизация через JWT
  //     },
  //     body: JSON.stringify(jobData),
  //   });

  //   if (!response.ok) {
  //     const errorData = await response.json();
  //     throw new Error(errorData.error || 'Ошибка при создании заявки');
  //   }

  //   const createdJob = await response.json();
  //   return createdJob;
  // } catch (error) {
  //   console.error('Ошибка создания job:', error.message);
  //   throw error;
  // }
}

// варианты статусов и цены
const STATUS_OPTIONS = {
  normal: { i18n: 'default', default: 'Default' },
  top: { i18n: 'top', default: 'Top' },
  quick: { i18n: 'quick', default: 'Quickly' },
  pro: { i18n: 'pro', default: 'for Pro users' },
};

export default function NewJobModal({
  activeKey = '',
  closeModal,
  editMode = false,
  currentJobId = null,
  initialJob = null,
  executorId,
}) {
  const { themeController, session, user, jobsController, languageController, setAppLoading, subscription } =
    useComponentContext();
  const { width, height, isLandscape, sidebarWidth = 0 } = useWindowInfo();
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const [statusOptions, setStatusOptions] = useState(STATUS_OPTIONS);

  // размеры
  const sizes = {
    font: isWebLandscape ? scaleByHeight(12, height) : RFValue(12),
    inputFont: isWebLandscape ? scaleByHeight(16, height) : RFValue(10),
    padding: isWebLandscape ? scaleByHeight(4, height) : RFValue(8),
    inputContainerPaddingHorizontal: isWebLandscape
      ? scaleByHeight(16, height)
      : RFValue(8),
    inputContainerPaddingVertical: isWebLandscape
      ? scaleByHeight(10, height)
      : RFValue(6),
    margin: isWebLandscape ? scaleByHeight(18, height) : RFValue(10),
    borderRadius: isWebLandscape ? scaleByHeight(8, height) : RFValue(5),
    thumb: isWebLandscape ? scaleByHeight(128, height) : RFValue(80),
    thumbGap: isWebLandscape ? height * 0.05 : RFValue(28),
    headerMargin: isWebLandscape ? scaleByHeight(30, height) : RFValue(5),
    modalPadding: isWebLandscape ? scaleByHeight(45, height) : RFValue(12),
    modalRadius: isWebLandscape ? scaleByHeight(8, height) : RFValue(5),
    modalCrossTopRightPos: isWebLandscape
      ? scaleByHeight(7, height)
      : RFValue(10),
    modalTitle: isWebLandscape ? scaleByHeight(24, height) : RFValue(16),
    modalTitleMarginBottom: isWebLandscape
      ? scaleByHeight(22, height)
      : RFValue(10),
    modalSub: isWebLandscape ? scaleByHeight(20, height) : RFValue(12),
    chipFont: isWebLandscape ? scaleByHeight(14, height) : RFValue(12),
    chipHeight: isWebLandscape ? scaleByHeight(34, height) : RFValue(6),
    chipPadH: isWebLandscape ? scaleByHeight(11, height) : RFValue(12),
    chipGap: isWebLandscape ? scaleByHeight(8, height) : RFValue(8),
    chipMarginBottom: isWebLandscape ? scaleByHeight(40, height) : RFValue(12),
    modalCardW: isWebLandscape ? scaleByHeight(450, height) : '88%',
    btnH: isWebLandscape ? scaleByHeight(62, height) : RFValue(42),
    btnW: isWebLandscape ? scaleByHeight(300, height) : '100%',
    btnMarginBottom: isWebLandscape ? scaleByHeight(16, height) : RFValue(10),
    headerHeight: isWebLandscape ? scaleByHeight(50, height) : RFPercentage(7),
    headerPaddingHorizontal: isWebLandscape
      ? scaleByHeight(7, height)
      : RFValue(3),
    containerPaddingHorizontal: isWebLandscape
      ? scaleByHeight(20, height)
      : RFValue(14),
    inputHeight: isWebLandscape ? scaleByHeight(64, height) : RFValue(40),
    photosLabelSize: isWebLandscape ? scaleByHeight(18, height) : RFValue(12),
    photosLabelMarginBottom: isWebLandscape
      ? scaleByHeight(14, height)
      : RFValue(6),
    saveBtnWidth: isWebLandscape ? scaleByHeight(380, height) : RFValue(120),
    saveBtnHeight: isWebLandscape ? scaleByHeight(62, height) : RFValue(40),
    saveBtnFont: isWebLandscape ? scaleByHeight(20, height) : RFValue(14),
    iconSize: isWebLandscape ? scaleByHeight(24, height) : RFValue(20),
  };

  const [filteredTypes, setFilteredTypes] = useState(JOB_TYPES);
  const [filteredSubTypes, setFilteredSubTypes] = useState(JOB_SUB_TYPES);
  const [filteredProfessions, setFilteredProfessions] = useState(LICENSES);
  // локальные стейты не зависят от async-данных при создании
  const [type, setType] = useState(
    initialJob ? initialJob.type || '' : activeKey || ''
  );
  const [subType, setSubType] = useState(initialJob?.subType || '');
  const [profession, setProfession] = useState(initialJob?.profession || '');
  const [description, setDescription] = useState(initialJob?.description || '');
  const [price, setPrice] = useState(initialJob?.price || '');
  const [images, setImages] = useState(initialJob?.images || []); // тут будут уже public URLs
  const [location, setLocation] = useState(initialJob?.location || '');
  const [startDateTime, setStartDateTime] = useState(
    initialJob?.startDateTime || null
  );
  const [endDateTime, setEndDateTime] = useState(
    initialJob?.endDateTime || null
  );
  const [jobType, setJobType] = useState('normal');
  const selectedOption =
    jobsController.products.find((o) => o.type === jobType) || jobsController.products[0];

  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [plansModalVisible, setPlansModalVisible] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);

  // Состояния для управления фокусом на полях ввода
  const [focusStates, setFocusStates] = useState([false, false, false]);

  const [fieldErrors, setFieldErrors] = useState({
    type: false,
    subType: false,
    profession: false,
  });

  const { openWebView } = useWebView();

  const handleCreate = () => {
    const newErrors = {
      type: !type,
      subType: !subType,
      // profession: !profession,
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
      if (JSON.stringify(images) !== JSON.stringify(initialJob.images))
        jobChanges.images = images;
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
        editJobById(currentJobId, jobChanges, session).then(() =>
          jobsController.reloadCreator()
        );
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
        jobType: jobType, // статус задания
        creator: user.current.id,
      };
      if (executorId) {
        newJob.personalExecutor = executorId;
      }

      setAppLoading(true);

      createNewJob(newJob, session, openWebView, () => {
        jobsController.reloadCreator();
        setAppLoading(false);
      }).then(() => {
        setAppLoading(false);
      });
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
    <AutocompletePicker
      label={t('newJob.type', { defaultValue: 'Type' })}
      value={type}
      setValue={(text) => {
        setType(text);
        if (fieldErrors.type && text) {
          setFieldErrors((prev) => ({ ...prev, type: false }));
        }
      }}
      filtered={filteredTypes}
      setFiltered={setFilteredTypes}
      options={JOB_TYPES}
      placeholder={t('newJob.selectOrType', {
        defaultValue: 'Select or type...',
      })}
      stateFocusIndex={0}
      setFocusStates={setFocusStates}
      filterOptions={filterOptions}
      focusStates={focusStates}
      error={fieldErrors.type}
      backgroundColor={themeController.current?.formInputBackground}
      rtl={isRTL}
      isWebLandscape={isWebLandscape}
      sizeOverrides={sizes}
    />,
    <AutocompletePicker
      label={t('newJob.subType', { defaultValue: 'Sub type' })}
      value={subType}
      setValue={(text) => {
        setSubType(text);
        if (fieldErrors.subType && text) {
          setFieldErrors((prev) => ({ ...prev, subType: false }));
        }
      }}
      filtered={filteredSubTypes}
      setFiltered={setFilteredSubTypes}
      options={JOB_SUB_TYPES}
      placeholder={t('newJob.selectOrType', {
        defaultValue: 'Select or type...',
      })}
      stateFocusIndex={1}
      setFocusStates={setFocusStates}
      filterOptions={filterOptions}
      focusStates={focusStates}
      error={fieldErrors.subType}
      backgroundColor={themeController.current?.formInputBackground}
      rtl={isRTL}
      isWebLandscape={isWebLandscape}
      sizeOverrides={sizes}
    />,
    <AutocompletePicker
      label={t('newJob.profession', {
        defaultValue: 'Profession (optional)',
      })}
      value={profession}
      setValue={(text) => {
        setProfession(text);
        if (fieldErrors.profession && text) {
          setFieldErrors((prev) => ({ ...prev, profession: false }));
        }
      }}
      filtered={filteredProfessions}
      setFiltered={setFilteredProfessions}
      options={LICENSES}
      placeholder={t('newJob.select', { defaultValue: 'Select...' })}
      stateFocusIndex={2}
      setFocusStates={setFocusStates}
      filterOptions={filterOptions}
      focusStates={focusStates}
      error={fieldErrors.profession}
      backgroundColor={themeController.current?.formInputBackground}
      rtl={isRTL}
      isWebLandscape={isWebLandscape}
      sizeOverrides={sizes}
    />,
    <View
      style={[
        styles.inputBlock,
        { backgroundColor: themeController.current?.formInputBackground },
        isWebLandscape && {
          padding: sizes.padding,
          borderRadius: sizes.borderRadius,
          marginBottom: sizes.margin,
        },
      ]}
      key='description'
    >
      <Text
        style={[
          styles.label,
          isRTL && { textAlign: 'right' },
          isWebLandscape && { fontSize: sizes.font },
        ]}
      >
        {t('newJob.description', { defaultValue: 'Description' })}
      </Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder={t('newJob.typePlaceholder', { defaultValue: 'Type...' })}
        placeholderTextColor={'#999'}
        style={[
          styles.input,
          { height: RFValue(70) },
          isRTL && { textAlign: 'right' },
          isWebLandscape && {
            height: height * 0.12,
            padding: sizes.padding,
            fontSize: sizes.inputFont,
            borderRadius: sizes.borderRadius,
          },
        ]}
        multiline
      />
    </View>,
    <View
      style={[
        styles.inputBlock,
        { backgroundColor: themeController.current?.formInputBackground },
        isWebLandscape && {
          padding: sizes.padding,
          borderRadius: sizes.borderRadius,
          marginBottom: sizes.margin,
        },
      ]}
      key='price'
    >
      <Text
        style={[
          styles.label,
          isRTL && { textAlign: 'right' },
          isWebLandscape && { fontSize: sizes.font },
        ]}
      >
        {t('newJob.price', { defaultValue: 'Price' })}
      </Text>
      <TextInput
        value={price}
        onChangeText={setPrice}
        placeholder={t('newJob.typePlaceholder', { defaultValue: 'Type...' })}
        placeholderTextColor={'#999'}
        style={[
          styles.input,
          isRTL && { textAlign: 'right' },
          isWebLandscape && {
            padding: sizes.padding,
            fontSize: sizes.inputFont,
            borderRadius: sizes.borderRadius,
          },
        ]}
        keyboardType='numeric'
      />
    </View>,
    <View style={styles.imageInputBlock} key='images'>
      <Text
        style={[
          styles.label,
          { marginBottom: RFValue(8) },
          isRTL && { textAlign: 'right' },
          isWebLandscape && {
            fontSize: sizes.font,
            marginBottom: sizes.margin / 2,
          },
        ]}
      >
        {t('newJob.uploadingPhotos', { defaultValue: 'Uploading photos' })}
      </Text>
      <View
        style={[styles.imageRow, isRTL && { flexDirection: 'row-reverse' }]}
      >
        {/* Кнопка добавления */}
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={[
            styles.addImageButton,
            {
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
            <View
              key={index}
              style={[
                styles.imageWrapper,
                isWebLandscape && {
                  marginRight: isRTL ? 0 : sizes.margin / 2,
                  marginLeft: isRTL ? sizes.margin / 2 : 0,
                },
              ]}
            >
              <Image
                source={{ uri }}
                style={[
                  styles.imageThumbnail,
                  isWebLandscape && {
                    width: sizes.thumb,
                    height: sizes.thumb,
                    borderRadius: sizes.borderRadius,
                  },
                ]}
              />
              <TouchableOpacity
                style={[
                  styles.removeIcon,
                  {
                    top: RFValue(4),
                    right: RFValue(4),
                    width: sizes.iconSize,
                    height: sizes.iconSize,
                  },
                  isRTL && { right: 'auto', left: RFValue(4) },
                ]}
                onPress={() => removeImage(index)}
              >
                <Image
                  source={icons.cross}
                  style={{
                    width: sizes.iconSize,
                    height: sizes.iconSize,
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
        isWebLandscape && {
          padding: sizes.padding,
          borderRadius: sizes.borderRadius,
          marginBottom: sizes.margin,
        },
      ]}
      key='location'
    >
      <Text
        style={[
          styles.label,
          isRTL && { textAlign: 'right' },
          isWebLandscape && { fontSize: sizes.font },
        ]}
      >
        {t('newJob.location', { defaultValue: 'Location' })}
      </Text>
      <TextInput
        value={location}
        onChangeText={setLocation}
        placeholder={t('newJob.typePlaceholder', { defaultValue: 'Type...' })}
        placeholderTextColor={'#999'}
        style={[
          styles.input,
          isRTL && { textAlign: 'right' },
          isWebLandscape && {
            padding: sizes.padding,
            fontSize: sizes.inputFont,
            borderRadius: sizes.borderRadius,
          },
        ]}
      />
    </View>,
    <View style={styles.row} key='dateTimeRange'>
      {Platform.OS !== 'android' ? (
        <DateTimeInput
          key='startDateTime'
          label={t('newJob.startDateTime', {
            defaultValue: 'Start date and time',
          })}
          value={startDateTime}
          onChange={setStartDateTime}
        />
      ) : (
        <DateTimeInputDouble
          label={t('newJob.startDateTime', {
            defaultValue: 'Start date and time',
          })}
          value={startDateTime}
          onChange={setStartDateTime}
        />
      )}
      {Platform.OS !== 'android' ? (
        <DateTimeInput
          key='endDateTime'
          label={t('newJob.endDateTime', {
            defaultValue: 'End date and time',
          })}
          value={endDateTime}
          onChange={setEndDateTime}
        />
      ) : (
        <DateTimeInputDouble
          label={t('newJob.endDateTime', {
            defaultValue: 'End date and time',
          })}
          value={endDateTime}
          onChange={setEndDateTime}
        />
      )}
    </View>,
  ];

  const bg = themeController.current?.formInputBackground;

  // --- GRID (ТОЛЬКО веб-альбомная ориентация) ---
  // const GridWebLandscape = () => {
  //   return (
  //     <ScrollView
  //       contentContainerStyle={[styles.container, { padding: sizes.margin }]}
  //       keyboardShouldPersistTaps='handled'
  //     >
  //       <View
  //         direction={isRTL ? 'rtl' : 'ltr'}
  //         style={[
  //           styles.gridContainer,
  //           {
  //             justifyContent: isRTL ? 'end' : 'start',
  //             position: 'relative',
  //             gridRowGap: height * 0.02,
  //           },
  //         ]}
  //       >
  //         {/* Row 1: Type (1/2) + Description (1/2, высота побольше) */}
  //         <View
  //           style={[
  //             styles.gridHalf,
  //             {
  //               // marginBottom: sizes.margin,
  //               zIndex: 10,
  //               gridArea: isRTL ? '1 / 2 / 2 / 3' : '1 / 1 / 2 / 2',
  //             },
  //           ]}
  //         >
  //           {renderAutocomplete({
  //             label: t('newJob.type', { defaultValue: 'Type' }),
  //             value: type,
  //             setValue: (text) => {
  //               setType(text);
  //               if (fieldErrors.type && text) {
  //                 setFieldErrors((prev) => ({ ...prev, type: false }));
  //               }
  //             },
  //             filtered: filteredTypes,
  //             setFiltered: setFilteredTypes,
  //             options: JOB_TYPES,
  //             placeholder: t('newJob.selectOrType', {
  //               defaultValue: 'Select or type...',
  //             }),
  //             stateFocusIndex: 0,
  //             setFocusStates: setFocusStates,
  //             filterOptions,
  //             focusStates,
  //             error: fieldErrors.type,
  //             backgroundColor: bg,
  //             rtl: isRTL,
  //             isWebLandscape,
  //             sizeOverrides: sizes,
  //           })}
  //         </View>

  //         <View
  //           style={[
  //             styles.gridHalf,
  //             {
  //               // marginBottom: sizes.margin,
  //               zIndex: 9,
  //               gridArea: isRTL ? '1 / 1 / 3 / 2' : '1 / 2 / 3 / 3',
  //             },
  //           ]}
  //         >
  //           <View
  //             style={[
  //               styles.inputBlock,
  //               { backgroundColor: bg },
  //               {
  //                 padding: sizes.padding,
  //                 borderRadius: sizes.borderRadius,
  //                 marginBottom: 0,
  //                 height: '100%',
  //               },
  //             ]}
  //           >
  //             <Text
  //               style={[
  //                 styles.label,
  //                 isRTL && { textAlign: 'right' },
  //                 { fontSize: sizes.font },
  //               ]}
  //             >
  //               {t('newJob.description', { defaultValue: 'Description' })}
  //             </Text>
  //             <TextInput
  //               value={description}
  //               onChangeText={setDescription}
  //               placeholder={t('newJob.typePlaceholder', {
  //                 defaultValue: 'Type...',
  //               })}
  //               placeholderTextColor={'#999'}
  //               style={{
  //                 padding: sizes.padding,
  //                 fontSize: sizes.inputFont,
  //                 borderRadius: sizes.borderRadius,
  //                 height: height * 0.12,
  //                 backgroundColor: 'transparent',
  //                 textAlign: isRTL ? 'right' : 'left',
  //               }}
  //               multiline
  //             />
  //           </View>
  //         </View>

  //         {/* Row 2: Sub type (1/2) + Price (1/2) */}
  //         <View
  //           style={[
  //             styles.gridHalf,
  //             {
  //               // marginBottom: sizes.margin,
  //               zIndex: 8,
  //               gridArea: isRTL ? '2 / 2 / 3 / 3' : '2 / 1 / 3 / 2',
  //             },
  //           ]}
  //         >
  //           {renderAutocomplete({
  //             label: t('newJob.subType', { defaultValue: 'Sub type' }),
  //             value: subType,
  //             setValue: (text) => {
  //               setSubType(text);
  //               if (fieldErrors.subType && text) {
  //                 setFieldErrors((prev) => ({ ...prev, subType: false }));
  //               }
  //             },
  //             filtered: filteredSubTypes,
  //             setFiltered: setFilteredSubTypes,
  //             options: JOB_SUB_TYPES,
  //             placeholder: t('newJob.selectOrType', {
  //               defaultValue: 'Select or type...',
  //             }),
  //             stateFocusIndex: 1,
  //             setFocusStates: setFocusStates,
  //             filterOptions,
  //             focusStates,
  //             error: fieldErrors.subType,
  //             backgroundColor: bg,
  //             rtl: isRTL,
  //             isWebLandscape,
  //             sizeOverrides: sizes,
  //           })}
  //         </View>

  //         {/* Row 3: Profession (1/2) + Location (1/2) */}
  //         <View
  //           style={[
  //             styles.gridHalf,
  //             {
  //               // marginBottom: sizes.margin,
  //               zIndex: 7,
  //               gridArea: isRTL ? '3 / 2 / 4 / 3' : '3 / 1 / 4 / 2',
  //             },
  //           ]}
  //         >
  //           {renderAutocomplete({
  //             label: t('newJob.profession', {
  //               defaultValue: 'Profession (optional)',
  //             }),
  //             value: profession,
  //             setValue: (text) => {
  //               setProfession(text);
  //               if (fieldErrors.profession && text) {
  //                 setFieldErrors((prev) => ({ ...prev, profession: false }));
  //               }
  //             },
  //             filtered: filteredProfessions,
  //             setFiltered: setFilteredProfessions,
  //             options: LICENSES,
  //             placeholder: t('newJob.select', { defaultValue: 'Select...' }),
  //             stateFocusIndex: 2,
  //             setFocusStates: setFocusStates,
  //             filterOptions,
  //             focusStates,
  //             error: fieldErrors.profession,
  //             backgroundColor: bg,
  //             rtl: isRTL,
  //             isWebLandscape,
  //             sizeOverrides: sizes,
  //           })}
  //         </View>

  //         <View
  //           key='price'
  //           style={[
  //             styles.gridHalf,
  //             {
  //               // marginBottom: sizes.margin,
  //               zIndex: 6,
  //               gridArea: isRTL ? '3 / 1 / 4 / 2' : '3 / 2 / 4 / 3',
  //             },
  //           ]}
  //         >
  //           <View
  //             style={[
  //               styles.inputBlock,
  //               { backgroundColor: bg },
  //               {
  //                 padding: sizes.padding,
  //                 borderRadius: sizes.borderRadius,
  //                 marginBottom: 0,
  //               },
  //             ]}
  //           >
  //             <Text
  //               style={[
  //                 styles.label,
  //                 isRTL && { textAlign: 'right' },
  //                 { fontSize: sizes.font },
  //               ]}
  //             >
  //               {t('newJob.price', { defaultValue: 'Price' })}
  //             </Text>
  //             <TextInput
  //               key='priceInput'
  //               value={price}
  //               onChangeText={setPrice}
  //               placeholder={t('newJob.typePlaceholder', {
  //                 defaultValue: 'Type...',
  //               })}
  //               placeholderTextColor={'#999'}
  //               style={{
  //                 padding: sizes.padding,
  //                 fontSize: sizes.inputFont,
  //                 borderRadius: sizes.borderRadius,
  //                 backgroundColor: 'transparent',
  //                 textAlign: isRTL ? 'right' : 'left',
  //               }}
  //               keyboardType='numeric'
  //             />
  //           </View>
  //         </View>

  //         {/* Row 4: Uploading photos (full) */}
  //         <View
  //           style={[
  //             styles.gridFull,
  //             {
  //               // marginBottom: sizes.margin,
  //               zIndex: 5,
  //               gridArea: isRTL ? '4 / 1 / 6 / 3' : '4 / 1 / 6 / 3',
  //             },
  //           ]}
  //         >
  //           <Text
  //             style={[
  //               styles.label,
  //               isRTL && { textAlign: 'right' },
  //               { fontSize: sizes.font, marginBottom: sizes.margin / 2 },
  //             ]}
  //           >
  //             {t('newJob.uploadingPhotos', {
  //               defaultValue: 'Uploading photos',
  //             })}
  //           </Text>

  //           <View
  //             style={[
  //               styles.imageRow,
  //               isRTL && { flexDirection: 'row-reverse' },
  //             ]}
  //           >
  //             <TouchableOpacity
  //               onPress={() => setModalVisible(true)}
  //               style={[
  //                 styles.addImageButton,
  //                 {
  //                   width: sizes.thumb,
  //                   height: sizes.thumb,
  //                   borderRadius: sizes.borderRadius,
  //                   marginRight: isRTL ? 0 : sizes.margin / 2,
  //                   marginLeft: isRTL ? sizes.margin / 2 : 0,
  //                 },
  //               ]}
  //             >
  //               <Image
  //                 source={icons.plus}
  //                 style={{
  //                   width: RFPercentage(3),
  //                   height: RFPercentage(3),
  //                   tintColor: themeController.current?.buttonTextColorPrimary,
  //                 }}
  //                 resizeMode='contain'
  //               />
  //             </TouchableOpacity>

  //             <ScrollView
  //               horizontal
  //               showsHorizontalScrollIndicator={false}
  //               contentContainerStyle={[
  //                 styles.imageScrollContainer,
  //                 isRTL && { flexDirection: 'row-reverse' },
  //               ]}
  //             >
  //               {images.map((uri, index) => (
  //                 <View
  //                   key={index}
  //                   style={[
  //                     styles.imageWrapper,
  //                     {
  //                       marginRight: isRTL ? 0 : sizes.margin / 2,
  //                       marginLeft: isRTL ? sizes.margin / 2 : 0,
  //                     },
  //                   ]}
  //                 >
  //                   <Image
  //                     source={{ uri }}
  //                     style={{
  //                       width: sizes.thumb,
  //                       height: sizes.thumb,
  //                       borderRadius: sizes.borderRadius,
  //                     }}
  //                   />
  //                   <TouchableOpacity
  //                     style={styles.removeIcon}
  //                     onPress={() => removeImage(index)}
  //                   >
  //                     <Image
  //                       source={icons.cross}
  //                       style={{
  //                         width: RFValue(16),
  //                         height: RFValue(16),
  //                         tintColor:
  //                           themeController.current?.formInputLabelColor,
  //                       }}
  //                       resizeMode='contain'
  //                     />
  //                   </TouchableOpacity>
  //                 </View>
  //               ))}
  //             </ScrollView>
  //           </View>
  //         </View>

  //         <View
  //           style={[
  //             styles.gridHalf,
  //             {
  //               // marginBottom: sizes.margin,
  //               zIndex: 4,
  //               gridArea: isRTL ? '6 / 2 / 7 / 3' : '6 / 1 / 7 / 2',
  //             },
  //           ]}
  //         >
  //           <View
  //             style={[
  //               styles.inputBlock,
  //               { backgroundColor: bg },
  //               {
  //                 padding: sizes.padding,
  //                 borderRadius: sizes.borderRadius,
  //                 marginBottom: 0,
  //               },
  //             ]}
  //           >
  //             <Text
  //               style={[
  //                 styles.label,
  //                 isRTL && { textAlign: 'right' },
  //                 { fontSize: sizes.font },
  //               ]}
  //             >
  //               {t('newJob.location', { defaultValue: 'Location' })}
  //             </Text>
  //             <TextInput
  //               value={location}
  //               onChangeText={setLocation}
  //               placeholder={t('newJob.typePlaceholder', {
  //                 defaultValue: 'Type...',
  //               })}
  //               placeholderTextColor={'#999'}
  //               style={{
  //                 padding: sizes.padding,
  //                 fontSize: sizes.inputFont,
  //                 borderRadius: sizes.borderRadius,
  //                 backgroundColor: 'transparent',
  //                 textAlign: isRTL ? 'right' : 'left',
  //               }}
  //             />
  //           </View>
  //         </View>

  //         {/* Row 5: Start/End date (1/2 + 1/2) */}
  //         <View
  //           style={[
  //             styles.gridHalf,
  //             {
  //               // marginBottom: sizes.margin,
  //               zIndex: 3,
  //               gridArea: isRTL ? '7 / 2 / 8 / 3' : '7 / 1 / 8 / 2',
  //             },
  //             { flexDirection: isRTL ? 'row-reverse' : 'row' },
  //           ]}
  //         >
  //           {Platform.OS !== 'android' ? (
  //             <DateTimeInput
  //               key='startDateTime'
  //               label={t('newJob.startDateTime', {
  //                 defaultValue: 'Start date and time',
  //               })}
  //               value={startDateTime}
  //               onChange={setStartDateTime}
  //             />
  //           ) : (
  //             <DateTimeInputDouble
  //               label={t('newJob.startDateTime', {
  //                 defaultValue: 'Start date and time',
  //               })}
  //               value={startDateTime}
  //               onChange={setStartDateTime}
  //             />
  //           )}
  //         </View>

  //         <View
  //           style={[
  //             styles.gridHalf,
  //             {
  //               // marginBottom: sizes.margin,
  //               zIndex: 2,
  //               gridArea: isRTL ? '7 / 1 / 8 / 2' : '7 / 2 / 8 / 3',
  //             },
  //             { flexDirection: isRTL ? 'row-reverse' : 'row' },
  //           ]}
  //         >
  //           {Platform.OS !== 'android' ? (
  //             <DateTimeInput
  //               key='endDateTime'
  //               label={t('newJob.endDateTime', {
  //                 defaultValue: 'End date and time',
  //               })}
  //               value={endDateTime}
  //               onChange={setEndDateTime}
  //             />
  //           ) : (
  //             <DateTimeInputDouble
  //               label={t('newJob.endDateTime', {
  //                 defaultValue: 'End date and time',
  //               })}
  //               value={endDateTime}
  //               onChange={setEndDateTime}
  //             />
  //           )}
  //         </View>
  //         {/* Bottom button (слева, зеркалим для RTL) */}
  //         <View
  //           style={[
  //             // styles.bottomButtonWrapper,
  //             {
  //               alignItems: isRTL ? 'flex-end' : 'flex-start',
  //               backgroundColor: themeController.current?.backgroundColor,
  //               zIndex: 1,
  //               gridArea: isRTL ? '8 / 1 / 9 / 3' : '8 / 1 / 9 / 3',
  //             },
  //           ]}
  //         >
  //           <TouchableOpacity
  //             style={[
  //               styles.createButton,
  //               {
  //                 backgroundColor:
  //                   themeController.current?.buttonColorPrimaryDefault,
  //                 width: '60%',
  //                 alignSelf: isRTL ? 'flex-end' : 'flex-start',
  //                 paddingVertical: sizes.padding * 1.2,
  //                 borderRadius: sizes.borderRadius,
  //               },
  //             ]}
  //             onPress={handleCreate}
  //           >
  //             <Text
  //               style={{
  //                 color: 'white',
  //                 textAlign: 'center',
  //                 fontWeight: 'bold',
  //                 fontSize: sizes.font,
  //               }}
  //             >
  //               {editMode
  //                 ? t('common.save', { defaultValue: 'Save' })
  //                 : t('common.create', { defaultValue: 'Create' })}
  //             </Text>
  //           </TouchableOpacity>
  //         </View>
  //       </View>
  //     </ScrollView>
  //   );
  // };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: themeController.current?.backgroundColor,
          paddingHorizontal: sizes.containerPaddingHorizontal,
        }}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: themeController.current?.backgroundColor,
              borderBottomColor:
                themeController.current?.profileDefaultBackground,
              height: sizes.headerHeight,
              paddingHorizontal: sizes.headerPaddingHorizontal,
              marginVertical: sizes.headerMargin,
            },
            isRTL && { flexDirection: 'row-reverse' },
          ]}
        >
          <TouchableOpacity onPress={() => closeModal()}>
            <Image
              source={icons.cross}
              style={{
                width: getResponsiveSize(
                  20,
                  scaleByHeight(24, height),
                  isLandscape
                ),
                height: getResponsiveSize(
                  20,
                  scaleByHeight(24, height),
                  isLandscape
                ),
                tintColor: themeController.current?.formInputLabelColor,
              }}
              resizeMode='contain'
            />
          </TouchableOpacity>
          <Text
            style={[
              styles.logo,
              {
                color: themeController.current?.primaryColor,
                fontSize: getResponsiveSize(
                  18,
                  scaleByHeight(24, height),
                  isLandscape
                ),
              },
            ]}
          >
            FLALX
          </Text>
        </View>

        {Platform.OS === 'web' ? (
          <>
            {isWebLandscape ? (
              // <GridWebLandscape />

              <ScrollView
                contentContainerStyle={[
                  styles.container,
                  // { padding: sizes.margin },
                ]}
                keyboardShouldPersistTaps='handled'
              >
                <View
                  direction={isRTL ? 'rtl' : 'ltr'}
                  style={[
                    styles.gridContainer,
                    {
                      justifyContent: isRTL ? 'end' : 'start',
                      position: 'relative',
                      gridRowGap: scaleByHeight(15, height),
                      gridColumnGap: scaleByHeight(21, height),
                      gridTemplateColumns: `repeat(2, ${scaleByHeight(
                        330,
                        height
                      )}px)`,
                      gridTemplateRows: `
                        ${scaleByHeight(64, height)}px 
                        ${scaleByHeight(64, height)}px 
                        ${scaleByHeight(64, height)}px 
                        ${scaleByHeight(75, height)}px 
                        ${scaleByHeight(75, height)}px 
                        ${scaleByHeight(64, height)}px 
                        ${scaleByHeight(64, height)}px 
                        ${scaleByHeight(64, height)}px
                      `,
                    },
                  ]}
                >
                  {/* Row 1: Type (1/2) + Description (1/2, высота побольше) */}
                  <View
                    style={[
                      styles.gridHalf,
                      {
                        // marginBottom: sizes.margin,
                        zIndex: 10,
                        gridArea: isRTL ? '1 / 2 / 2 / 3' : '1 / 1 / 2 / 2',
                      },
                    ]}
                  >
                    <AutocompletePicker
                      label={t('newJob.type', { defaultValue: 'Type' })}
                      value={type}
                      setValue={(text) => {
                        setType(text);
                        if (fieldErrors.type && text) {
                          setFieldErrors((prev) => ({ ...prev, type: false }));
                        }
                      }}
                      filtered={filteredTypes}
                      setFiltered={setFilteredTypes}
                      options={JOB_TYPES}
                      placeholder={t('newJob.selectOrType', {
                        defaultValue: 'Select or type...',
                      })}
                      stateFocusIndex={0}
                      setFocusStates={setFocusStates}
                      filterOptions={filterOptions}
                      focusStates={focusStates}
                      error={fieldErrors.type}
                      backgroundColor={bg}
                      rtl={isRTL}
                      isWebLandscape={isWebLandscape}
                      sizeOverrides={sizes}
                    />
                  </View>

                  <View
                    style={[
                      styles.gridHalf,
                      {
                        // marginBottom: sizes.margin,
                        zIndex: 9,
                        gridArea: isRTL ? '1 / 1 / 3 / 2' : '1 / 2 / 3 / 3',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.inputBlock,
                        { backgroundColor: bg },
                        {
                          paddingVertical: sizes.inputContainerPaddingVertical,
                          paddingHorizontal:
                            sizes.inputContainerPaddingHorizontal,
                          borderRadius: sizes.borderRadius,
                          marginBottom: 0,
                          height: '100%',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.label,
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
                  </View>

                  {/* Row 2: Sub type (1/2) + Price (1/2) */}
                  <View
                    style={[
                      styles.gridHalf,
                      {
                        // marginBottom: sizes.margin,
                        zIndex: 8,
                        gridArea: isRTL ? '2 / 2 / 3 / 3' : '2 / 1 / 3 / 2',
                      },
                    ]}
                  >
                    <AutocompletePicker
                      label={t('newJob.subType', { defaultValue: 'Sub type' })}
                      value={subType}
                      setValue={(text) => {
                        setSubType(text);
                        if (fieldErrors.subType && text) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            subType: false,
                          }));
                        }
                      }}
                      filtered={filteredSubTypes}
                      setFiltered={setFilteredSubTypes}
                      options={JOB_SUB_TYPES}
                      placeholder={t('newJob.selectOrType', {
                        defaultValue: 'Select or type...',
                      })}
                      stateFocusIndex={1}
                      setFocusStates={setFocusStates}
                      filterOptions={filterOptions}
                      focusStates={focusStates}
                      error={fieldErrors.subType}
                      backgroundColor={bg}
                      rtl={isRTL}
                      isWebLandscape={isWebLandscape}
                      sizeOverrides={sizes}
                    />
                  </View>

                  {/* Row 3: Profession (1/2) + Location (1/2) */}
                  <View
                    style={[
                      styles.gridHalf,
                      {
                        // marginBottom: sizes.margin,
                        zIndex: 7,
                        gridArea: isRTL ? '3 / 2 / 4 / 3' : '3 / 1 / 4 / 2',
                      },
                    ]}
                  >
                    <AutocompletePicker
                      label={t('newJob.profession', {
                        defaultValue: 'Profession (optional)',
                      })}
                      value={profession}
                      setValue={(text) => {
                        setProfession(text);
                        if (fieldErrors.profession && text) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            profession: false,
                          }));
                        }
                      }}
                      filtered={filteredProfessions}
                      setFiltered={setFilteredProfessions}
                      options={LICENSES}
                      placeholder={t('newJob.select', {
                        defaultValue: 'Select...',
                      })}
                      stateFocusIndex={2}
                      setFocusStates={setFocusStates}
                      filterOptions={filterOptions}
                      focusStates={focusStates}
                      error={fieldErrors.profession}
                      backgroundColor={bg}
                      rtl={isRTL}
                      isWebLandscape={isWebLandscape}
                      sizeOverrides={sizes}
                    />
                  </View>

                  <View
                    key='price'
                    style={[
                      styles.gridHalf,
                      {
                        // marginBottom: sizes.margin,
                        zIndex: 6,
                        gridArea: isRTL ? '3 / 1 / 4 / 2' : '3 / 2 / 4 / 3',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.inputBlock,
                        { backgroundColor: bg },
                        {
                          padding: 0,
                          paddingHorizontal:
                            sizes.inputContainerPaddingHorizontal,
                          paddingVertical: sizes.inputContainerPaddingVertical,
                          borderRadius: sizes.borderRadius,
                          marginBottom: 0,
                          height: sizes.inputHeight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.label,
                          {
                            color: themeController.current?.unactiveTextColor,
                          },
                          isRTL && { textAlign: 'right' },
                          { fontSize: sizes.font },
                        ]}
                      >
                        {t('newJob.price', { defaultValue: 'Price' })}
                      </Text>
                      <TextInput
                        key='priceInput'
                        value={price}
                        onChangeText={setPrice}
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
                        keyboardType='numeric'
                      />
                    </View>
                  </View>

                  {/* Row 4: Uploading photos (full) */}
                  <View
                    style={[
                      styles.gridFull,
                      {
                        // marginBottom: sizes.margin,
                        zIndex: 5,
                        gridArea: isRTL ? '4 / 1 / 6 / 3' : '4 / 1 / 6 / 3',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.label,
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
                        onPress={() => setModalVisible(true)}
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
                            width: scaleByHeight(32, height),
                            height: scaleByHeight(32, height),
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
                                  borderRadius: sizes.iconSize,
                                  top: scaleByHeight(3, height),
                                  right: scaleByHeight(3, height),
                                  width: scaleByHeight(20, height),
                                  height: scaleByHeight(20, height),
                                },
                              ]}
                              onPress={() => removeImage(index)}
                            >
                              <Image
                                source={icons.cross}
                                style={{
                                  width: scaleByHeight(16, height),
                                  height: scaleByHeight(16, height),
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

                  <ImagePickerModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    onAdd={handleImageAdd}
                  />

                  <View
                    style={[
                      styles.gridHalf,
                      {
                        // marginBottom: sizes.margin,
                        zIndex: 4,
                        gridArea: isRTL ? '6 / 2 / 7 / 3' : '6 / 1 / 7 / 2',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.inputBlock,
                        { backgroundColor: bg },
                        {
                          paddingVertical: sizes.inputContainerPaddingVertical,
                          paddingHorizontal:
                            sizes.inputContainerPaddingHorizontal,
                          borderRadius: sizes.borderRadius,
                          marginBottom: 0,
                          height: sizes.inputHeight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.label,
                          {
                            color: themeController.current?.unactiveTextColor,
                          },
                          isRTL && { textAlign: 'right' },
                          { fontSize: sizes.font },
                        ]}
                      >
                        {t('newJob.location', { defaultValue: 'Location' })}
                      </Text>
                      <TextInput
                        value={location}
                        onChangeText={setLocation}
                        placeholder={t('newJob.typePlaceholder', {
                          defaultValue: 'Type...',
                        })}
                        placeholderTextColor={'#999'}
                        style={{
                          fontWeight: '500',
                          color: themeController.current?.textColor,
                          padding: 0,
                          paddingVertical: sizes.padding,
                          fontSize: sizes.inputFont,
                          borderRadius: sizes.borderRadius,
                          backgroundColor: 'transparent',
                          textAlign: isRTL ? 'right' : 'left',
                        }}
                      />
                    </View>
                  </View>

                  {/* Row 5: Start/End date (1/2 + 1/2) */}
                  <View
                    style={[
                      styles.gridHalf,
                      {
                        // marginBottom: sizes.margin,
                        zIndex: 3,
                        gridArea: isRTL ? '7 / 2 / 8 / 3' : '7 / 1 / 8 / 2',
                      },
                      { flexDirection: isRTL ? 'row-reverse' : 'row' },
                    ]}
                  >
                    {Platform.OS !== 'android' ? (
                      <DateTimeInput
                        key='startDateTime'
                        label={t('newJob.startDateTime', {
                          defaultValue: 'Start date and time',
                        })}
                        value={startDateTime}
                        onChange={setStartDateTime}
                      />
                    ) : (
                      <DateTimeInputDouble
                        label={t('newJob.startDateTime', {
                          defaultValue: 'Start date and time',
                        })}
                        value={startDateTime}
                        onChange={setStartDateTime}
                      />
                    )}
                  </View>

                  <View
                    style={[
                      styles.gridHalf,
                      {
                        // marginBottom: sizes.margin,
                        zIndex: 2,
                        gridArea: isRTL ? '7 / 1 / 8 / 2' : '7 / 2 / 8 / 3',
                      },
                      { flexDirection: isRTL ? 'row-reverse' : 'row' },
                    ]}
                  >
                    {Platform.OS !== 'android' ? (
                      <DateTimeInput
                        key='endDateTime'
                        label={t('newJob.endDateTime', {
                          defaultValue: 'End date and time',
                        })}
                        value={endDateTime}
                        onChange={setEndDateTime}
                      />
                    ) : (
                      <DateTimeInputDouble
                        label={t('newJob.endDateTime', {
                          defaultValue: 'End date and time',
                        })}
                        value={endDateTime}
                        onChange={setEndDateTime}
                      />
                    )}
                  </View>
                  {/* Bottom button (слева, зеркалим для RTL) */}
                  <View
                    style={[
                      // styles.bottomButtonWrapper,
                      {
                        alignItems: isRTL ? 'flex-end' : 'flex-start',
                        backgroundColor:
                          themeController.current?.backgroundColor,
                        zIndex: 1,
                        gridArea: isRTL ? '8 / 1 / 9 / 3' : '8 / 1 / 9 / 3',
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.createButton,
                        {
                          backgroundColor:
                            themeController.current?.buttonColorPrimaryDefault,
                          width: '60%',
                          alignSelf: isRTL ? 'flex-end' : 'flex-start',
                          paddingVertical: sizes.padding * 1.2,
                          borderRadius: sizes.borderRadius,
                          height: sizes.saveBtnHeight,
                          width: sizes.saveBtnWidth,
                          marginTop: scaleByHeight(17, height),
                        },
                      ]}
                      onPress={
                        editMode
                          ? () => handleCreate()
                          : () => setStatusModalVisible(true)
                      }
                    >
                      <Text
                        style={{
                          color:
                            themeController.current?.buttonTextColorPrimary,
                          textAlign: 'center',
                          fontSize: sizes.saveBtnFont,
                        }}
                      >
                        {editMode
                          ? t('common.save', { defaultValue: 'Save' })
                          : t('common.create', { defaultValue: 'Create' })}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            ) : (
              <CustomFlatList
                data={formContent}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item }) => item}
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps='handled'
              />
            )}
          </>
        ) : (
          <FlatList
            data={formContent}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => item}
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps='handled'
          />
        )}

        {!isWebLandscape && (
          <View style={styles.bottomButtonWrapper}>
            <TouchableOpacity
              style={[
                styles.createButton,
                {
                  backgroundColor:
                    themeController.current?.buttonColorPrimaryDefault,
                },
              ]}
              onPress={
                editMode
                  ? () => handleCreate()
                  : () => setStatusModalVisible(true)
              }
            >
              <Text
                style={{
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: 'bold',
                }}
              >
                {editMode
                  ? t('common.save', { defaultValue: 'Save' })
                  : t('common.create', { defaultValue: 'Create' })}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {/* <Modal visible={statusModalVisible} animationType='fade' transparent >
        <View style={{width: 500, height: 500, backgroundColor: themeController.current?.backgroundColor}}>
          <Text>Test</Text>
          <TouchableOpacity onPress={() => {
            handleCreate()
            setStatusModalVisible(false);
          }}>
            <Text>OK</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            setStatusModalVisible(false);
          }}>
            <Text>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal> */}
      {/* jobType PICKER MODAL */}
      <Modal visible={statusModalVisible} animationType='fade' transparent>
        {/* кликабельная подложка с отступом под сайдбар на web-landscape */}
        <View
          style={[
            styles.backdrop,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          {/* пустая зона над сайдбаром — клик закрывает */}
          {/* {isWebLandscape ? (
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setStatusModalVisible(false)}
              style={{ width: sidebarWidth, height: '100%' }}
            />
          ) : null} */}

          {/* рабочая область — центрируем карточку */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setStatusModalVisible(false)}
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
                  onPress={() => setStatusModalVisible(false)}
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
                      tintColor: themeController.current?.formInputLabelColor,
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
                  {t('newJob.statusModal.title', {
                    defaultValue: 'Choose the post type to publish',
                  })}
                </Text>

                {/* подзаголовок (второй ряд) */}
                {/* <Text
                  style={{
                    fontSize: sizes.modalSub,
                    color: themeController.current?.formInputLabelColor,
                    textAlign: 'center',
                    marginBottom: sizes.modalPadding,
                  }}
                >
                  {t('newJob.statusModal.subtitle', {
                    defaultValue: 'Select how your request will be shown',
                  })}
                </Text> */}

                {/* плашки статусов */}
                <View
                  style={{
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    flexWrap: 'wrap',
                    gap: sizes.chipGap,
                    marginBottom: sizes.chipMarginBottom,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {jobsController.products.map((opt) => {
                    const productType = opt.type;
                    const active = jobType === productType;

                    return (
                      <TouchableOpacity
                        key={productType}
                        onPress={() => setJobType(productType)}
                        style={[
                          styles.chip,
                          {
                            height: sizes.chipHeight,
                            paddingHorizontal: sizes.chipPadH,
                            borderRadius: sizes.modalRadius / 2,
                            borderWidth: 1,
                            borderColor: active
                              ? themeController.current
                                ?.buttonColorPrimaryDefault
                              : themeController.current
                                ?.formInputPlaceholderColor,
                            backgroundColor: active
                              ? themeController.current
                                ?.buttonColorPrimaryDefault
                              : 'transparent',
                            flexDirection: isRTL ? 'row-reverse' : 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: sizes.chipFont,
                            color: active
                              ? themeController.current?.buttonTextColorPrimary
                              : themeController.current
                                ?.formInputPlaceholderColor,
                          }}
                        >
                          {t(`newJob.statusModal.option.${STATUS_OPTIONS[productType].i18n}`, {
                            defaultValue: STATUS_OPTIONS[productType].default,
                          })}
                        </Text>

                        {/* маленький PRO-бейдж для некоторых опций */}
                        {/* {opt.pro && (
                    <View
                      style={{
                        marginHorizontal: isRTL ? 0 : RFValue(6),
                        marginLeft: isRTL ? RFValue(6) : 0,
                        backgroundColor: themeController.current?.formInputBackground,
                        paddingHorizontal: sizes.chipPadH * 0.5,
                        paddingVertical: sizes.chipPadV * 0.5,
                        borderRadius: sizes.modalRadius * 0.7,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: isWebLandscape ? height * 0.012 : RFValue(10),
                          color: themeController.current?.formInputLabelColor,
                          fontWeight: '600',
                        }}
                      >
                        {t('newJob.statusModal.proBadge', {
                          defaultValue: 'For PRO users',
                        })}
                      </Text>
                    </View>
                  )} */}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* кнопка подтверждения с ценой */}
                <TouchableOpacity
                  onPress={() => {
                    handleCreate();
                    setStatusModalVisible(false);
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
                    marginBottom: sizes.borderRadius,
                  }}
                >
                  <Text
                    style={{
                      fontSize: sizes.modalSub,
                      color: themeController.current?.buttonColorPrimaryDefault,
                    }}
                  >
                    {t('newJob.statusModal.buttons.confirmWithPrice', {
                      defaultValue: 'Publish for {{price}}',
                      price:
                        subscription.current != null && selectedOption.type == 'normal'
                          ? t('newJob.statusModal.free', {
                            defaultValue: 'Free',
                          })
                          : `$${selectedOption?.price.toFixed(2)}`,
                    })}
                  </Text>
                </TouchableOpacity>

                {/* кнопка тарифов */}
                {(subscription.current == null && selectedOption.type == 'normal') && < TouchableOpacity
                  onPress={() => {
                    setPlansModalVisible(true);
                    setStatusModalVisible(false);
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
                      color: themeController.current?.buttonTextColorPrimary,
                    }}
                  >
                    {t('newJob.statusModal.buttons.viewPlans', {
                      defaultValue: 'See pricing plans',
                    })}
                  </Text>
                </TouchableOpacity>}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </Modal >

      {/* PLANS MODAL (простая заглушка, такой же фон/центрирование) */}
      < SubscriptionsModal
        visible={plansModalVisible}
        main={false}
        closeModal={() => {
          setPlansModalVisible(false);
          setStatusModalVisible(true);
        }
        }
      />
      {/* <Modal visible={plansModalVisible} animationType='fade' transparent>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setPlansModalVisible(false)}
          style={styles.backdrop}
        >
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
                alignSelf: 'center',
              },
            ]}
          >
            <Text
              style={{
                fontSize: sizes.modalTitle,
                fontWeight: '700',
                color: themeController.current?.textColor,
                textAlign: 'center',
                marginBottom: sizes.modalPadding,
              }}
            >
              {t('newJob.statusModal.plansTitle', {
                defaultValue: 'Pricing plans',
              })}
            </Text>
            <TouchableOpacity
              onPress={() => setPlansModalVisible(false)}
              style={{
                marginTop: sizes.modalPadding,
                height: sizes.btnH,
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
                  fontWeight: '700',
                  color: themeController.current?.buttonTextColorPrimary,
                }}
              >
                {t('common.close', { defaultValue: 'Close' })}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal> */}
    </KeyboardAvoidingView >
  );
}

const styles = StyleSheet.create({
  container: {
    // padding: RFValue(14),
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  logo: {
    fontSize: RFValue(20),
    fontFamily: 'Rubik-Bold',
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
    // fontWeight: 'bold',
    // marginBottom: RFValue(4),
  },
  input: {
    padding: RFValue(8),
    width: '100%',
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
  },
  autocompleteContainer: {
    position: 'relative',
  },
  suggestionBox: {
    position: 'absolute',
    top: RFValue(28),
    left: 0,
    right: 0,
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
    shadowRadius: RFValue(10),
    shadowOffset: { width: 0, height: RFValue(6) },
    elevation: 8,
  },
  chip: {
    // базовые параметры, динамика — в JSX
    boxSizing: 'border-box',
  },
});
