import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Platform,
  Keyboard,
  useWindowDimensions,
  Image,
} from 'react-native';
import { useComponentContext } from '../../context/globalAppContext';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';
import { icons } from '../../constants/icons';

const AutocompletePicker = ({
  label,
  options, // { value: 'label', ... }
  selectedValue,
  setValue, // <--- ИЗМЕНЕНО с onValueChange
  placeholder,
  isRTL,
  error,
  containerStyle = {},
  value,
  arrowIcon = false,
}) => {
  const { themeController } = useComponentContext();
  const { width, height } = useWindowDimensions();
  const isWebLandscape = Platform.OS === 'web' && width > height;

  // --- Размеры и стили ---
  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);
    const scale = isWebLandscape ? web : mobile;

    return {
      baseFont: scale(16),
      font: scale(12),
      pickerHeight: isWebLandscape ? web(64) : mobile(64),
      borderRadius: isWebLandscape ? web(8) : mobile(8),
      inputContainerPaddingHorizontal: isWebLandscape ? web(16) : mobile(16),
      labelGap: scale(3),
      iconSize: scale(24),
    };
  }, [isWebLandscape, height]);

  // --- Состояния ---
  const [isFocused, setIsFocused] = useState(false);
  const [layout, setLayout] = useState(null);
  const [inputText, setInputText] = useState(value ? options[value] : '');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [hoveredValue, setHoveredValue] = useState(null);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // --- Эффекты ---

  // Эффект для отслеживания кликов вне компонента (для закрытия списка)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Проверяем, что клик был вне контейнера компонента
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsFocused(false);

        // Проверяем, является ли текущий текст в поле одним из действительных значений
        const isValidOption = Object.values(options).includes(inputText);

        // Если текст недействителен, сбрасываем его к последнему выбранному значению
        if (!isValidOption) {
          setInputText(options[selectedValue] || '');
        }
        // Если текст действителен, мы его не трогаем.
      }
    };

    // Добавляем слушатель только на вебе
    if (Platform.OS === 'web') {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Очистка слушателя при размонтировании компонента
    return () => {
      if (Platform.OS === 'web') {
        document.removeEventListener('mousedown', handleClickOutside);
      }
    };
  }, [selectedValue, options, inputText]); // Добавляем inputText в зависимости

  // Синхронизация текста в инпуте, если он меняется извне
  useEffect(() => {
    setInputText(options[value] || '');
  }, [value, options]);

  // Фильтрация списка
  useEffect(() => {
    if (!inputText) {
      setFilteredOptions(options);
      return;
    }
    const lowercasedInput = inputText.toLowerCase();
    const filtered = Object.entries(options)
      .filter(([, optionLabel]) =>
        optionLabel.toLowerCase().includes(lowercasedInput)
      )
      .reduce((obj, [value, label]) => {
        obj[value] = label;
        return obj;
      }, {});
    setFilteredOptions(filtered);
  }, [inputText, options]);

  // --- Обработчики ---
  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleSelectOption = (value) => {
    const newLabel = options[value] || '';
    setInputText(newLabel); // Немедленно обновляем текст в поле
    setValue(value);
    setIsFocused(false);
    Keyboard.dismiss(); // Скрываем клавиатуру
  };

  // --- Рендер опции ---
  const renderOption = ({ item: [value, label] }) => {
    const isSelected = selectedValue === value;
    const isHovered = hoveredValue === value;

    const webHoverProps =
      Platform.OS === 'web'
        ? {
            onMouseEnter: () => setHoveredValue(value),
            onMouseLeave: () => setHoveredValue(null),
          }
        : {};

    return (
      <TouchableOpacity
        {...webHoverProps}
        style={[
          styles.option,
          {
            backgroundColor: isSelected
              ? themeController.current?.selectedItemBackground
              : isHovered
              ? themeController.current?.profileDefaultBackground
              : 'transparent',
            height: sizes.pickerHeight * 0.9,
            justifyContent: 'center',
          },
        ]}
        onPress={() => handleSelectOption(value)}
      >
        <Text
          style={{
            color:
              isSelected || isHovered
                ? themeController.current?.textColor
                : themeController.current?.formInputPlaceholderColor,
            fontSize: sizes.baseFont,
            textAlign: isRTL ? 'right' : 'left',
            paddingHorizontal: sizes.inputContainerPaddingHorizontal,
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const itemHeight = sizes.pickerHeight * 0.9;
  const filteredEntries = Object.entries(filteredOptions);
  // ...
  const dropdownHeight =
    itemHeight * (filteredEntries.length > 4 ? 4 : filteredEntries.length);

  return (
    <View
      ref={containerRef}
      style={[
        styles.pickerContainer,
        {
          backgroundColor: themeController.current?.formInputBackground,
          height: sizes.pickerHeight,
          paddingHorizontal: sizes.inputContainerPaddingHorizontal,
          borderRadius: sizes.borderRadius,
        },
        error && { borderColor: 'red', borderWidth: 1 },
        containerStyle,
      ]}
    >
      <View style={{ flex: 1, justifyContent: 'center', gap: sizes.labelGap }}>
        <Text
          style={[
            styles.label,
            {
              color: error ? 'red' : themeController.current?.unactiveTextColor,
              fontSize: sizes.font,
              textAlign: isRTL ? 'right' : 'left',
            },
          ]}
        >
          {label}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            ref={inputRef}
            value={inputText}
            onChangeText={setInputText}
            onFocus={handleFocus}
            // onBlur больше не используется для закрытия, т.к. это делает слушатель кликов
            placeholder={placeholder}
            placeholderTextColor={themeController.current?.formInputLabelColor}
            style={[
              styles.input,
              {
                color: themeController.current?.textColor,
                fontSize: sizes.baseFont,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
          />
          {arrowIcon && (
            <View style={styles.arrowContainer}>
              <Image
                source={icons.arrowDown}
                style={[
                  styles.arrowIcon,
                  {
                    width: sizes.iconSize,
                    height: sizes.iconSize,
                    tintColor: themeController.current?.primaryColor,
                    transform: isFocused
                      ? [{ rotate: '180deg' }]
                      : [{ rotate: '0deg' }],
                  },
                ]}
              />
            </View>
          )}
        </View>
      </View>

      {/* Выпадающий список без Modal */}
      {isFocused && filteredEntries.length > 0 && (
        <View
          style={[
            styles.dropdownContent,
            {
              top: sizes.pickerHeight, // Позиционируем относительно родителя
              left: 0,
              right: 0,
              backgroundColor: themeController.current?.formInputBackground,
              borderBottomLeftRadius: sizes.borderRadius,
              borderBottomRightRadius: sizes.borderRadius,
            },
          ]}
        >
          <FlatList
            data={filteredEntries}
            keyExtractor={([value]) => value}
            renderItem={renderOption}
            style={{ maxHeight: dropdownHeight }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  pickerContainer: {
    justifyContent: 'space-between',
    zIndex: 1, // Важно для корректного отображения списка над другими элементами
  },
  label: {
    // Стили для лейбла, если нужно
  },
  input: {
    padding: 0, // Убираем внутренние отступы TextInput
    width: '100%',
  },
  dropdownContent: {
    position: 'absolute',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 9999, // Устанавливаем высокий zIndex
    borderWidth: 1,
    borderColor: '#ddd',
  },
  option: {
    // paddingHorizontal: 15, // <--- Удалено
  },
  arrowIcon: {
    resizeMode: 'contain',
  },
});

export default AutocompletePicker;
