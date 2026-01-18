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
import { useComponentContext } from '../context/globalAppContext';
import CustomFlatList from './ui/CustomFlatList';
import DateTimeInput from './ui/DateTimeInput';
import DateTimeInputDouble from './ui/DateTimeInputDouble';
import ImagePickerModal from './ui/ImagePickerModal';
import { icons } from '../constants/icons';
import { uploadImageToSupabase } from '../utils/supabase/uploadImageToSupabase';
import { useWindowInfo } from '../context/windowContext';
import { useTranslation } from 'react-i18next';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { t } from 'i18next';
import SubscriptionsModal from './SubscriptionsModal';
import { createJob } from '../src/api/jobs';
import { useWebView } from '../context/webViewContext';
import AutocompletePicker from './ui/AutocompletePicker';
import AddressPicker from './ui/AddressPicker';
import { useLocalization } from '../src/services/useLocalization';
import CustomPicker from './ui/CustomPicker';
import CustomExperiencePicker from './ui/CustomExperiencePicker';
import { formatCurrency } from '../utils/currency_formatter';

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
      openWebView(data.paymentUrl, () => { });
    } else if (data.job) {
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
  top: { i18n: 'top', default: 'TOP' },
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
  executor,
}) {
  const {
    themeController,
    session,
    user,
    jobsController,
    languageController,
    setAppLoading,
    subscription,
    jobTypesController,
  } = useComponentContext();
  const { tField } = useLocalization(languageController.current);
  const { width, height, isLandscape, sidebarWidth = 0 } = useWindowInfo();
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  // Объявляем состояния сначала, чтобы они были доступны в useMemo
  const [type, setType] = useState(
    initialJob ? (initialJob.type.key || '') : (activeKey?.typeKey || activeKey || '')
  );

  const [subType, setSubType] = useState(initialJob?.subType.key || activeKey?.subTypeKey || '');

  // Преобразуем данные из jobTypesController в нужный формат
  const jobTypesOptions = useMemo(() => {
    const options = {};
    if (executor != null) {
      executor.professions.forEach((profession) => {
        const { job_type, job_subtype } = profession;
        options[job_type.key] = tField(job_type, 'name');
      });
    } else {
      jobTypesController.jobTypesWithSubtypes?.forEach((type) => {
        options[type.key] = tField(type, 'name');
      });
    }
    return options;
  }, [jobTypesController.jobTypesWithSubtypes, languageController.current]);

  const jobSubTypesOptions = useMemo(() => {
    const options = {};
    if (type) {
      if (executor != null) {
        executor.professions.forEach((profession) => {
          const { job_type, job_subtype } = profession;
          if (job_type.key === type) {
            options[job_subtype.key] = tField(job_subtype, 'name');
          }
        });
      } else if (jobTypesController.jobTypesWithSubtypes) {
        const selectedType = jobTypesController.jobTypesWithSubtypes.find(
          (t) => t.key === type
        );
        if (selectedType?.subtypes) {
          selectedType.subtypes.forEach((subtype) => {
            options[subtype.key] = tField(subtype, 'name');
          });
        }
      }
    }
    return options;
  }, [
    jobTypesController.jobTypesWithSubtypes,
    type,
    languageController.current,
  ]);

  const [statusOptions, setStatusOptions] = useState(STATUS_OPTIONS);
  const sizes = useMemo(() => {
    const webLandscapeScale = (size) => scaleByHeight(size, height);
    const mobileScale = (size) => scaleByHeightMobile(size, height);

    return {
      font: isWebLandscape ? webLandscapeScale(12) : mobileScale(12),
      inputFont: isWebLandscape ? webLandscapeScale(16) : mobileScale(16),
      padding: isWebLandscape ? webLandscapeScale(4) : mobileScale(8),
      inputContainerPaddingHorizontal: isWebLandscape
        ? webLandscapeScale(16)
        : mobileScale(16),
      inputContainerPaddingVertical: isWebLandscape
        ? webLandscapeScale(10)
        : mobileScale(10),
      margin: isWebLandscape ? webLandscapeScale(18) : mobileScale(10),
      mobileGap: mobileScale(16),
      borderRadius: isWebLandscape ? webLandscapeScale(8) : mobileScale(8),
      thumb: isWebLandscape ? webLandscapeScale(128) : mobileScale(128),
      thumbGap: isWebLandscape ? webLandscapeScale(16) : mobileScale(16),
      headerMargin: isWebLandscape ? webLandscapeScale(30) : mobileScale(5),
      modalPadding: isWebLandscape ? webLandscapeScale(45) : mobileScale(12),
      modalRadius: isWebLandscape ? webLandscapeScale(8) : mobileScale(5),
      modalCrossTopRightPos: isWebLandscape
        ? webLandscapeScale(7)
        : mobileScale(10),
      modalTitle: isWebLandscape ? webLandscapeScale(24) : mobileScale(16),
      modalTitleMarginBottom: isWebLandscape
        ? webLandscapeScale(22)
        : mobileScale(10),
      modalSub: isWebLandscape ? webLandscapeScale(20) : mobileScale(12),
      chipFont: isWebLandscape ? webLandscapeScale(14) : mobileScale(12),
      chipHeight: isWebLandscape ? webLandscapeScale(34) : mobileScale(30),
      chipPadH: isWebLandscape ? webLandscapeScale(11) : mobileScale(12),
      chipGap: isWebLandscape ? webLandscapeScale(8) : mobileScale(8),
      chipMarginBottom: isWebLandscape
        ? webLandscapeScale(40 / 3)
        : mobileScale(12 / 3),
      modalCardW: isWebLandscape ? webLandscapeScale(450) : '88%',
      btnH: isWebLandscape ? webLandscapeScale(62) : mobileScale(42),
      btnW: isWebLandscape ? webLandscapeScale(300) : '100%',
      btnMarginBottom: isWebLandscape ? webLandscapeScale(16) : mobileScale(10),
      headerHeight: isWebLandscape ? webLandscapeScale(50) : height * 0.07,
      headerPaddingHorizontal: isWebLandscape
        ? webLandscapeScale(7)
        : mobileScale(3),
      containerPaddingHorizontal: isWebLandscape
        ? webLandscapeScale(20)
        : mobileScale(14),
      inputHeight: isWebLandscape ? webLandscapeScale(64) : mobileScale(64),
      photosLabelSize: isWebLandscape ? webLandscapeScale(18) : mobileScale(18),
      photosLabelMarginBottom: isWebLandscape
        ? webLandscapeScale(14)
        : mobileScale(16),
      saveBtnWidth: isWebLandscape ? webLandscapeScale(380) : '100%',
      saveBtnHeight: isWebLandscape ? webLandscapeScale(62) : mobileScale(62),
      saveBtnFont: isWebLandscape ? webLandscapeScale(20) : mobileScale(20),
      iconSize: isWebLandscape ? webLandscapeScale(24) : mobileScale(20),
      removeIconSize: isWebLandscape ? webLandscapeScale(20) : mobileScale(20),
      removeIconPosition: isWebLandscape
        ? webLandscapeScale(3)
        : mobileScale(4),
      imageSize: isWebLandscape ? webLandscapeScale(32) : height * 0.03,
      crossIconSize: isWebLandscape ? webLandscapeScale(24) : mobileScale(20),
      logoSize: isWebLandscape ? webLandscapeScale(24) : mobileScale(18),
      descriptionHeight: isWebLandscape ? height * 0.12 : mobileScale(70),
      mobileBottomContainerPaddingVertical: mobileScale(16),
      dateTimeGapMobile: mobileScale(20),
      mobileBottomPaddingExtraSpace: mobileScale(120),
    };
  }, [isWebLandscape, height]);

  const [filteredTypes, setFilteredTypes] = useState({});
  const [filteredSubTypes, setFilteredSubTypes] = useState({});

  // Обновляем фильтрованные данные при изменении исходных данных
  useEffect(() => {
    setFilteredTypes(jobTypesOptions);
  }, [jobTypesOptions]);

  useEffect(() => {
    setFilteredSubTypes(jobSubTypesOptions);
    // Очищаем выбранный подтип если он не принадлежит текущему типу
    if (subType && Object.keys(jobSubTypesOptions).length > 0) {
      if (!jobSubTypesOptions[subType]) {
        setSubType('');
      }
    }
  }, [jobSubTypesOptions]);

  // Очищаем подтип при смене типа
  useEffect(() => {
    if (type !== (initialJob?.type?.key || activeKey?.typeKey || activeKey || '')) {
      setSubType('');
    }
  }, [type]);

  // Остальные локальные стейты
  const [description, setDescription] = useState(initialJob?.description || '');
  const [price, setPrice] = useState(initialJob?.price || '');
  const [images, setImages] = useState(initialJob?.images || []); // тут будут уже public URLs
  const [location, setLocation] = useState(initialJob?.location || null);
  const [startDateTime, setStartDateTime] = useState(
    initialJob?.startDateTime || null
  );
  const [endDateTime, setEndDateTime] = useState(
    initialJob?.endDateTime || null
  );
  const [jobType, setJobType] = useState('normal');
  const selectedOption =
    jobsController.products.find((o) => o.type === jobType) ||
    jobsController.products[0];

  const [experience, setExperience] = useState(initialJob?.experience || null);

  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [plansModalVisible, setPlansModalVisible] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);

  // Состояния для управления фокусом на полях ввода
  const [focusStates, setFocusStates] = useState([false, false, false]);

  const [fieldErrors, setFieldErrors] = useState({});

  // Список обязательных для заполнения полей.
  // Просто добавьте или удалите названия полей для изменения логики валидации.
  const requiredFields = [
    'type',
    'subType',
    'price',
    // 'location',
    // 'description',
  ];

  const { openWebView } = useWebView();

  // Функция для получения ID типа по ключу
  const getTypeIdByKey = (typeKey) => {
    if (!typeKey || !jobTypesController.jobTypesWithSubtypes) return null;
    const foundType = jobTypesController.jobTypesWithSubtypes.find(
      (t) => t.key === typeKey
    );
    return foundType?.id || null;
  };

  // Функция для получения ID подтипа по ключу
  const getSubTypeIdByKey = (subTypeKey) => {
    if (!subTypeKey || !jobTypesController.jobTypesWithSubtypes) return null;
    for (const jobType of jobTypesController.jobTypesWithSubtypes) {
      const foundSubType = jobType.subtypes?.find(
        (st) => st.key === subTypeKey
      );
      if (foundSubType) return foundSubType.id;
    }
    return null;
  };

  const handleCreate = () => {
    const newErrors = {};
    requiredFields.forEach((field) => {
      // Проверяем, заполнено ли поле. Для location нужна особая проверка.
      if (field === 'location') {
        newErrors[field] = !location || !location?.address;
      } else {
        // Для других полей (type, subType, description и т.д.)
        // используется преобразование в булев тип.
        // Пустая строка, null или undefined дадут false, что после "!" станет true (ошибка).
        newErrors[field] = !eval(field);
      }
    });

    setFieldErrors(newErrors);

    const hasErrors = Object.values(newErrors).some((e) => e);
    console.log('error fields ', newErrors);

    if (hasErrors) return;

    if (editMode && currentJobId) {
      const jobChanges = {};

      if (type !== initialJob.type) jobChanges.type = getTypeIdByKey(type);
      if (subType !== initialJob.subType)
        jobChanges.subType = getSubTypeIdByKey(subType);
      if (description !== initialJob.description)
        jobChanges.description = description;
      if (JSON.stringify(images) !== JSON.stringify(initialJob.images))
        jobChanges.images = images;
      if (price !== initialJob.price) jobChanges.price = price;
      // if (location !== initialJob.location) jobChanges.location = location;
      // New comparison for location object
      if (JSON.stringify(location) !== JSON.stringify(initialJob.location))
        jobChanges.location = location;
      // сравнение дат (если обе существуют и разные)
      if (experience !== initialJob.experience)
        jobChanges.experience = experience;
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
        type: getTypeIdByKey(type),
        subType: getSubTypeIdByKey(subType),
        description,
        price,
        images,
        location,
        experience,
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

  // Элементы мобильной версии формы
  const formContent = [
    <AutocompletePicker
      label={t('newJob.type', { defaultValue: 'Type' })}
      selectedValue={type}
      value={type}
      setValue={(text) => {
        setType(text);
        if (fieldErrors.type && text) {
          setFieldErrors((prev) => ({ ...prev, type: false }));
        }
        // Сбрасываем ошибку подтипа при смене типа
        if (fieldErrors.subType) {
          setFieldErrors((prev) => ({ ...prev, subType: false }));
        }
      }}
      filtered={filteredTypes}
      setFiltered={setFilteredTypes}
      options={jobTypesOptions}
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
      selectedValue={subType}
      setValue={(text) => {
        setSubType(text);
        if (fieldErrors.subType && text) {
          setFieldErrors((prev) => ({ ...prev, subType: false }));
        }
      }}
      filtered={filteredSubTypes}
      setFiltered={setFilteredSubTypes}
      options={jobSubTypesOptions}
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
    <AddressPicker
      key='location'
      label={t('newJob.location', { defaultValue: 'Location' })}
      initialAddress={location?.address || ''}
      onLocationSelect={setLocation}
      placeholder={t('newJob.typePlaceholder', { defaultValue: 'Type...' })}
      isRTL={isRTL}
      error={fieldErrors.location}
    />,
    <View
      style={[
        styles.inputBlock,
        {
          backgroundColor: themeController.current?.formInputBackground,
          padding: 0,
          paddingHorizontal: sizes.inputContainerPaddingHorizontal,
          paddingVertical: sizes.inputContainerPaddingVertical,
          borderRadius: sizes.borderRadius,
        },
        isWebLandscape && {
          marginBottom: sizes.margin,
        },
        fieldErrors.description && styles.errorBorder,
      ]}
      key='description'
    >
      <Text
        style={[
          styles.label,
          {
            color: fieldErrors.description
              ? 'red'
              : themeController.current?.unactiveTextColor,
            fontSize: sizes.font,
          },
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
        placeholderTextColor={
          themeController.current?.formInputPlaceholderColor
        }
        style={[
          styles.input,
          {
            height: sizes.descriptionHeight,
            color: themeController.current?.textColor,
            fontSize: sizes.inputFont,
            borderRadius: sizes.borderRadius,
            fontFamily: 'Rubik-Regular',
          },
          isRTL && { textAlign: 'right' },
          isWebLandscape && {
            height: height * 0.12,
          },
        ]}
        multiline
      />
    </View>,
    <View
      style={[
        styles.inputBlock,
        {
          padding: 0,
          paddingHorizontal: sizes.inputContainerPaddingHorizontal,
          paddingVertical: sizes.inputContainerPaddingVertical,
          borderRadius: sizes.borderRadius,
          height: sizes.inputHeight,
          backgroundColor: themeController.current?.formInputBackground,
        },
        fieldErrors.price && styles.errorBorder,
      ]}
      key='price'
    >
      <Text
        style={[
          styles.label,
          {
            color: fieldErrors.price
              ? 'red'
              : themeController.current?.unactiveTextColor,
            fontSize: sizes.font,
          },
          isRTL && { textAlign: 'right' },
          isWebLandscape && { fontSize: sizes.font },
        ]}
      >
        {t('newJob.price', { defaultValue: 'Price' })}
      </Text>
      <TextInput
        value={price}
        onChangeText={(text) => setPrice(text.replace(/[^0-9]/g, ''))}
        placeholder={t('newJob.typePlaceholder', { defaultValue: 'Type...' })}
        placeholderTextColor={
          themeController.current?.formInputPlaceholderColor
        }
        style={[
          styles.input,
          {
            color: themeController.current?.textColor,
            fontSize: sizes.inputFont,
            fontFamily: 'Rubik-Regular',
          },
          isRTL && { textAlign: 'right' },
        ]}
        keyboardType='numeric'
      />
    </View>,
    <View style={styles.imageInputBlock} key='images'>
      <Text
        style={[
          styles.label,
          isRTL && { textAlign: 'right' },
          {
            fontSize: sizes.photosLabelSize,
            marginBottom: sizes.photosLabelMarginBottom,
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

      <ImagePickerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleImageAdd}
      />
    </View>,
    // <View
    //   style={[
    //     styles.inputBlock,
    //     {
    //       backgroundColor: themeController.current?.formInputBackground,
    //       padding: 0,
    //       paddingHorizontal: sizes.inputContainerPaddingHorizontal,
    //       paddingVertical: sizes.inputContainerPaddingVertical,
    //       borderRadius: sizes.borderRadius,
    //       height: sizes.inputHeight,
    //     },
    //   ]}
    //   key='location'
    // >
    //   <Text
    //     style={[
    //       styles.label,
    //       {
    //         color: themeController.current?.unactiveTextColor,
    //         fontSize: sizes.font,
    //       },
    //       isRTL && { textAlign: 'right' },
    //       isWebLandscape && { fontSize: sizes.font },
    //     ]}
    //   >
    //     {t('newJob.location', { defaultValue: 'Location' })}
    //   </Text>
    //   <TextInput
    //     value={location}
    //     onChangeText={setLocation}
    //     placeholder={t('newJob.typePlaceholder', { defaultValue: 'Type...' })}
    //     placeholderTextColor={
    //       themeController.current?.formInputPlaceholderColor
    //     }
    //     style={[
    //       styles.input,
    //       {
    //         color: themeController.current?.textColor,
    //         fontSize: sizes.inputFont,
    //         borderRadius: sizes.borderRadius,
    //         fontFamily: 'Rubik-Regular',
    //       },
    //       isRTL && { textAlign: 'right' },
    //     ]}
    //   />
    // </View>,
    <CustomExperiencePicker
      label={t('register.experience_label')}
      selectedValue={experience}
      onValueChange={setExperience}
      isRTL={isRTL}
      containerStyle={{
        marginBottom: sizes.typeTagsSelectorMarginBottom,
      }}
      bottomDropdown={false}
    />,
    <View
      style={[
        styles.row,
        {
          gap: sizes.dateTimeGapMobile,
          paddingBottom: sizes.mobileBottomPaddingExtraSpace, // чтобы не закрывались кнопками
        },
        isRTL && { flexDirection: 'row-reverse' },
      ]}
      key='dateTimeRange'
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
                width: sizes.crossIconSize,
                height: sizes.crossIconSize,
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
                fontSize: sizes.logoSize,
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
                        // Сбрасываем ошибку подтипа при смене типа
                        if (fieldErrors.subType) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            subType: false,
                          }));
                        }
                      }}
                      filtered={filteredTypes}
                      setFiltered={setFilteredTypes}
                      options={jobTypesOptions}
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
                          padding: 0,
                          paddingHorizontal:
                            sizes.inputContainerPaddingHorizontal,
                          paddingVertical: sizes.inputContainerPaddingVertical,
                          borderRadius: sizes.borderRadius,
                          marginBottom: 0,
                          height: '100%',
                        },
                        fieldErrors.description && styles.errorBorder,
                      ]}
                    >
                      <Text
                        style={[
                          styles.label,
                          {
                            color: fieldErrors.description
                              ? 'red'
                              : themeController.current?.unactiveTextColor,
                            fontSize: sizes.font,
                          },
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
                        style={{
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
                      options={jobSubTypesOptions}
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
                    <AddressPicker
                      label={t('newJob.location', {
                        defaultValue: 'Location',
                      })}
                      initialAddress={location?.address || ''}
                      onLocationSelect={setLocation}
                      placeholder={t('newJob.typePlaceholder', {
                        defaultValue: 'Type...',
                      })}
                      isRTL={isRTL}
                      error={fieldErrors.location}
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
                        fieldErrors.price && styles.errorBorder,
                      ]}
                    >
                      <Text
                        style={[
                          styles.label,
                          isRTL && { textAlign: 'right' },
                          {
                            fontSize: sizes.font,
                            color: fieldErrors.price
                              ? 'red'
                              : themeController.current?.unactiveTextColor,
                          },
                        ]}
                      >
                        {t('newJob.price', { defaultValue: 'Price' })}
                      </Text>
                      <TextInput
                        key='priceInput'
                        value={price}
                        onChangeText={(text) => setPrice(text.replace(/[^0-9]/g, ''))}
                        placeholder={t('newJob.typePlaceholder', {
                          defaultValue: 'Type...',
                        })}
                        placeholderTextColor={
                          themeController.current?.formInputPlaceholderColor
                        }
                        style={{
                          padding: 0,
                          paddingVertical: sizes.padding,
                          color: fieldErrors.price
                            ? 'red'
                            : themeController.current?.textColor,
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
                    <CustomExperiencePicker
                      label={t('register.experience_label')}
                      selectedValue={experience}
                      onValueChange={setExperience}
                      isRTL={isRTL}
                      containerStyle={{
                        marginBottom: sizes.typeTagsSelectorMarginBottom,
                      }}
                    />
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
                contentContainerStyle={{
                  ...styles.container,
                  ...{
                    gap: sizes.mobileGap,
                  },
                }}
                keyboardShouldPersistTaps='handled'
              />
            )}
          </>
        ) : (
          <FlatList
            data={formContent}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => item}
            contentContainerStyle={{
              ...styles.container,
              ...{
                gap: sizes.mobileGap,
              },
            }}
            keyboardShouldPersistTaps='handled'
          />
        )}

        {!isWebLandscape && (
          <View
            style={[
              styles.bottomButtonWrapper,
              {
                width: width,
                backgroundColor: themeController.current?.backgroundColor,
                paddingHorizontal: sizes.containerPaddingHorizontal,
                paddingVertical: sizes.mobileBottomContainerPaddingVertical,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -6 },
                shadowOpacity: 0.12,
                shadowRadius: 8,
                elevation: 16,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.createButton,
                {
                  backgroundColor:
                    themeController.current?.buttonColorPrimaryDefault,
                  paddingVertical: sizes.padding * 1.2,
                  borderRadius: sizes.borderRadius,
                  height: sizes.saveBtnHeight,
                  width: sizes.saveBtnWidth,
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
                  color: themeController.current?.buttonTextColorPrimary,
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
                      tintColor: themeController.current?.textColor,
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
                    const productName = tField(opt, 'name');
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
                          {productName}
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

                <View
                  style={{
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: sizes.chipMarginBottom,
                    gap: sizes.margin / 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: sizes.modalSub,
                      color: themeController.current?.buttonColorPrimaryDefault,
                    }}
                  >
                    {t('', {
                      defaultValue: '{{price}}',
                      price:
                        subscription.current != null &&
                          selectedOption.type == 'normal'
                          ? t('newJob.statusModal.free', {
                            defaultValue: 'Free',
                          })
                          : `${formatCurrency(selectedOption.price, selectedOption.currency)}`,
                    })}
                  </Text>
                  {(subscription.current == null &&
                    selectedOption.type == 'normal') &&
                    <Text
                      style={{
                        fontSize: sizes.modalSub,
                        color: themeController.current?.formInputLabelColor,
                        marginLeft: isRTL ? 0 : sizes.margin / 4,
                        marginRight: isRTL ? sizes.margin / 4 : 0,
                      }}
                    >
                      or
                    </Text>
                  }
                  {(subscription.current == null &&
                    selectedOption.type == 'normal') &&
                    <Text
                      style={{
                        fontSize: sizes.modalSub,
                        color: themeController.current?.buttonColorSecondaryDefault,
                        marginLeft: isRTL ? 0 : sizes.margin / 4,
                        marginRight: isRTL ? sizes.margin / 4 : 0,
                      }}
                    >
                      1
                    </Text>
                  }
                  {(subscription.current == null &&
                    selectedOption.type == 'normal') &&
                    <Image
                      source={icons.coupon}
                      style={{
                        width: sizes.iconSize,
                        height: sizes.iconSize,
                        tintColor:
                          themeController.current
                            ?.buttonColorSecondaryDefault,
                      }}
                    />
                  }
                </View>

                {(subscription.current == null ||
                  selectedOption.type != 'normal') && (
                    <Text
                      style={{
                        fontSize: sizes.chipFont,
                        color: themeController.current?.formInputLabelColor,
                        marginBottom: sizes.chipMarginBottom,
                        textAlign: 'center',
                      }}
                    >
                      You must pay for publishing this type of ad after
                      moderation.
                    </Text>
                  )}

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
                    marginBottom: sizes.borderRadius * 2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: sizes.modalSub,
                      color: themeController.current?.buttonColorPrimaryDefault,
                    }}
                  >
                    {t('newJob.statusModal.buttons.sendToModeration', {
                      defaultValue: 'Send to moderation',
                    })}
                  </Text>
                </TouchableOpacity>

                {/* кнопка тарифов */}
                {/* {subscription.current == null &&
                  selectedOption?.type == 'normal' && (
                    <TouchableOpacity
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
                          color:
                            themeController.current?.buttonTextColorPrimary,
                        }}
                      >
                        {t('newJob.statusModal.buttons.viewPlans', {
                          defaultValue: 'See pricing plans',
                        })}
                      </Text>
                    </TouchableOpacity>
                  )} */}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* PLANS MODAL (простая заглушка, такой же фон/центрирование) */}
      <SubscriptionsModal
        visible={plansModalVisible}
        main={false}
        closeModal={() => {
          setPlansModalVisible(false);
          setStatusModalVisible(true);
        }}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  logo: {
    fontFamily: 'Rubik-Bold',
  },
  inputBlock: {
    ...Platform.select({
      web: {
        zIndex: 1,
      },
    }),
  },
  imageInputBlock: {
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
    width: '100%',
    fontFamily: 'Rubik-Medium',
  },
  autocompleteContainer: {
    position: 'relative',
  },
  suggestionBox: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 999,
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
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  addImageButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  imageScrollContainer: {
    flexDirection: 'row',
  },
  imageThumbnail: {},
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
  bottomButtonWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  createButton: {
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
  errorBorder: { borderColor: 'red', borderWidth: 1 },
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
    elevation: 8,
  },
  chip: {
    // базовые параметры, динамика — в JSX
    boxSizing: 'border-box',
  },
});
