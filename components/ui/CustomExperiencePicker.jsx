import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Image,
  FlatList,
  Platform,
  useWindowDimensions,
  Animated,
  TextInput,
} from 'react-native';
import { useComponentContext } from '../../context/globalAppContext';
import { icons } from '../../constants/icons';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';
import { useTranslation } from 'react-i18next';
import { formatExperience } from '../../utils/experience_ulit';

const CustomExperiencePicker = ({
  label,
  selectedValue,
  onValueChange,
  isRTL,
  fullScreen = false, // Новый пропс, по умолчанию false
  containerStyle = {},
  placeholder = null,
  placeholderColor = null,
  bottomDropdown = true,
}) => {
  const { themeController } = useComponentContext();
  const { width, height } = useWindowDimensions();
  const isWebLandscape = Platform.OS === 'web' && width > height;
  const { t } = useTranslation();

  const experienceLevels = useMemo(
    () => [
      { label: t('register.experience.none'), value: { years: 0, months: 0 } },
      { label: t('register.experience.month'), value: { years: 0, months: 1 } },
      {
        label: t('register.experience.months', { months: 3 }),
        value: { years: 0, months: 3 },
      },
      {
        label: t('register.experience.months', { months: 6 }),
        value: { years: 0, months: 6 },
      },
      { label: t('register.experience.year'), value: { years: 1, months: 0 } },
      {
        label: t('register.experience.years', { years: 2 }),
        value: { years: 2, months: 0 },
      },
      {
        label: t('register.experience.years', { years: 3 }),
        value: { years: 3, months: 0 },
      },
      { label: t('register.experience.other'), value: 'custom' },
    ],
    [t]
  );

  const [isCustomMode, setCustomMode] = useState(false);
  const [years, setYears] = useState(0);
  const [months, setMonths] = useState(0);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'counter'

  const compareExperience = (exp1, exp2) => {
    if (!exp1 || !exp2) return false;
    return exp1.years === exp2.years && exp1.months === exp2.months;
  };

  const parseValue = (value) => {
    if (typeof value === 'object' && value !== null) {
      return {
        years: value.years || 0,
        months: value.months || 0,
      };
    }
    return { years: 0, months: 0 };
  };

  useEffect(() => {
    if (selectedValue && typeof selectedValue === 'object') {
      const { years: y, months: m } = parseValue(selectedValue);
      setYears(y);
      setMonths(m);
    } else {
      setYears(0);
      setMonths(0);
    }
  }, [selectedValue]);

  const handleExperienceChange = (unit, change) => {
    let currentMonths = years * 12 + months;
    if (unit === 'years') {
      currentMonths += change * 12;
    } else {
      currentMonths += change;
    }

    if (currentMonths < 0) currentMonths = 0;

    const newYears = Math.floor(currentMonths / 12);
    const newMonths = currentMonths % 12;

    setYears(newYears);
    setMonths(newMonths);
    onValueChange({ years: newYears, months: newMonths });
  };

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);
    const scale = isWebLandscape ? web : mobile;

    return {
      baseFont: scale(16),
      font: scale(12),
      iconSize: scale(24),
      pickerHeight: scale(64),
      borderRadius: scale(8),
      inputContainerPaddingHorizontal: scale(16),
      labelGap: scale(3),
      counterFontSize: scale(16),
      counterLabelSize: scale(12),
      counterContainerGap: scale(20),
      counterContainerPadding: scale(12),
      counterContainerHeight: scale(165),
      finalTextMarginTop: scale(10),
      modalPadding: scale(10),
      shadowElevation: 5, // Platform-specific, doesn't scale
      shadowOffsetY: 3,
      shadowOpacity: 0.25,
      shadowRadius: 3,
      scrollBarWidth: scale(6),
      scrollBarOffset: scale(2),
      counterUnitPaddingV: scale(10),
      counterUnitPaddingH: scale(20),
      counterButtonFontSize: scale(14),
      counterInputMarginV: scale(10),
      buttonContainerMarginTop: scale(10),
      buttonPadding: scale(10),
      counterWidth: scale(40),
      counterGap: scale(25),
      counterLabelMarginBottom: scale(8),
    };
  }, [isWebLandscape, height]);

  const styles = useMemo(() => {
    return StyleSheet.create({
      pickerContainer: {
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      arrowContainer: {
        justifyContent: 'center',
        alignItems: 'center',
      },
      arrowIcon: {
        resizeMode: 'contain',
      },
      modalBackdrop: {
        flex: 1,
      },
      fullScreenModalContent: {
        position: 'absolute',
        top: '25%',
        left: '10%',
        right: '10%',
        bottom: '25%',
        width: '80%',
        maxHeight: '50%',
        padding: sizes.modalPadding,
        elevation: sizes.shadowElevation,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: bottomDropdown ? sizes.shadowOffsetY : -sizes.shadowOffsetY,
        },
        shadowOpacity: sizes.shadowOpacity,
        shadowRadius: sizes.shadowRadius,
        flexDirection: 'row',
      },
      dropdownContent: {
        position: 'absolute',
        overflow: 'hidden',
        elevation: sizes.shadowElevation,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: bottomDropdown ? sizes.shadowOffsetY : -sizes.shadowOffsetY,
        },
        shadowOpacity: sizes.shadowOpacity,
        shadowRadius: sizes.shadowRadius,
        zIndex: 999,
        flexDirection: 'row',
      },
      option: {
        // paddingHorizontal: 15,
      },
      scrollBarTrack: {
        width: sizes.scrollBarWidth,
        height: '100%',
        backgroundColor: 'transparent',
        borderRadius: sizes.scrollBarWidth / 2,
        position: 'absolute',
        right: sizes.scrollBarOffset,
        top: 0,
        bottom: 0,
      },
      scrollBarIndicator: {
        width: sizes.scrollBarWidth,
        borderRadius: sizes.scrollBarWidth / 2,
      },
      counterUnit: {
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: sizes.counterUnitPaddingV,
        paddingHorizontal: sizes.counterUnitPaddingH,
        width: '100%',
      },
      counterButtonText: {
        fontSize: sizes.counterButtonFontSize,
        color: themeController.current?.unactiveTextColor,
      },
      counterInput: {
        fontSize: sizes.counterFontSize,
        color: themeController.current?.textColor,
        textAlign: 'center',
        marginVertical: sizes.counterInputMarginV,
        fontFamily: 'Rubik-Bold',
        width: sizes.counterFontSize * 2,
      },
      customInputButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: sizes.buttonContainerMarginTop,
      },
    });
  }, [sizes, themeController]);

  const [modalVisible, setModalVisible] = useState(false);
  const [pickerLayout, setPickerLayout] = useState(null);
  const pickerRef = useRef(null);
  const [hoveredValue, setHoveredValue] = useState(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [contentHeight, setContentHeight] = useState(0);

  const getSelectedLabel = () => {
    if (selectedValue && typeof selectedValue === 'object') {
      // Проверяем, есть ли предопределенная опция с таким же значением
      const predefined = experienceLevels.find(
        (option) =>
          typeof option.value === 'object' &&
          compareExperience(option.value, selectedValue)
      );

      if (predefined) {
        return predefined.label;
      }

      // Иначе форматируем кастомное значение
      return formatExperience(selectedValue, t);
    }
    return placeholder ? null : '-';
  };

  const itemHeight = sizes.pickerHeight * 0.9;
  const dropdownHeight =
    itemHeight * (experienceLevels.length > 4 ? 4 : experienceLevels.length);

  useEffect(() => {
    pickerRef.current?.measure((fx, fy, width, height, px, py) => {
      setPickerLayout({
        top: bottomDropdown ? py + height : py - dropdownHeight,
        left: px,
        width: width,
      });
    });
  }, [height, width]);

  const handlePress = () => {
    if (fullScreen) {
      setModalVisible(true);
    } else {
      pickerRef.current.measure((fx, fy, width, height, px, py) => {
        setPickerLayout({
          top: bottomDropdown ? py + height : py - dropdownHeight,
          left: px,
          width: width,
        });
        // Always open in list view unless a custom value is already set
        // const isCustom =
        //   selectedValue &&
        //   typeof selectedValue === 'object' &&
        //   !experienceLevels.some(
        //     (opt) =>
        //       typeof opt.value === 'object' &&
        //       compareExperience(opt.value, selectedValue)
        //   );
        // setViewMode(isCustom ? 'counter' : 'list');
        setViewMode('list');
        setModalVisible(true);
      });
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  const renderCustomScrollBar = (listHeight) => {
    if (contentHeight <= listHeight) {
      return null;
    }

    const indicatorHeight = (listHeight / contentHeight) * listHeight;
    const indicatorTranslateY = scrollY.interpolate({
      inputRange: [0, contentHeight - listHeight],
      outputRange: [0, listHeight - indicatorHeight],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.scrollBarTrack}>
        <Animated.View
          style={[
            styles.scrollBarIndicator,
            {
              height: indicatorHeight,
              transform: [{ translateY: indicatorTranslateY }],
              opacity: 0.5,
              backgroundColor: themeController.current?.formInputLabelColor,
            },
          ]}
        />
      </View>
    );
  };

  const renderOption = ({ item }) => {
    const isSelected =
      typeof item.value === 'object'
        ? compareExperience(selectedValue, item.value)
        : false;
    const isHovered =
      typeof item.value === 'object'
        ? compareExperience(hoveredValue, item.value)
        : hoveredValue === item.value;

    const webHoverProps =
      Platform.OS === 'web'
        ? {
            onMouseEnter: () => setHoveredValue(item.value),
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
            height: itemHeight,
            justifyContent: 'center',
          },
        ]}
        onPress={() => {
          if (item.value === 'custom') {
            setCustomMode(true);
            setViewMode('counter');
            const { years: y, months: m } = parseValue(selectedValue);
            setYears(y);
            setMonths(m);
            // Don't close modal, just switch view
          } else {
            setCustomMode(false);
            onValueChange(item.value);
            setModalVisible(false);
            setViewMode('list');
          }
        }}
      >
        <Text
          style={[
            {
              color:
                isSelected || isHovered
                  ? themeController.current?.textColor
                  : themeController.current?.formInputPlaceholderColor,
              fontSize: sizes.baseFont,
              textAlign: isRTL ? 'right' : 'left',
              paddingHorizontal: sizes.inputContainerPaddingHorizontal,
            },
          ]}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderFullScreenModal = () => (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType='fade'
      onRequestClose={() => {
        setModalVisible(false);
        // setViewMode('list');
      }}
    >
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPressOut={() => {
          setModalVisible(false);
          // setViewMode('list');
        }}
      >
        <View
          style={[
            styles.fullScreenModalContent,
            {
              backgroundColor: themeController.current?.formInputBackground,
            },
          ]}
          onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}
        >
          <FlatList
            data={experienceLevels}
            keyExtractor={(item) => item.value}
            renderItem={renderOption}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={(_, height) => setContentHeight(height)}
          />
          {renderCustomScrollBar(dropdownHeight)}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderCustomInput = () => (
    <TouchableOpacity
      style={{
        alignItems: 'center',
        width: '100%',
        height: sizes.counterContainerHeight,
        justifyContent: 'center',
        padding: sizes.counterContainerPadding,
      }}
      onPress={(e)=> {
        e.stopPropagation()
      }}
      activeOpacity={1}
    >
      <View
        style={{
          flexDirection: isRTL ? 'row-reverse' : 'row',
          gap: sizes.counterGap,
        }}
      >
        {/* Year Counter */}
        <View style={{ alignItems: 'center', width: sizes.counterWidth }}>
          <Text
            style={{
              fontSize: sizes.counterLabelSize,
              color: themeController.current?.unactiveTextColor,
              marginBottom: sizes.counterLabelMarginBottom,
            }}
          >
            {t('register.year_label')}
          </Text>
          <View
            style={[
              styles.counterUnit,
              {
                backgroundColor: themeController.current?.formInputBackground,
                borderRadius: sizes.borderRadius,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => handleExperienceChange('years', 1)}
            >
              <Text style={styles.counterButtonText}>+</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.counterInput}
              value={String(years)}
              onChangeText={(text) => {
                const newYears = parseInt(text, 10) || 0;
                setYears(newYears);
                onValueChange({ years: newYears, months });
              }}
              keyboardType='number-pad'
            />
            <TouchableOpacity
              onPress={() => handleExperienceChange('years', -1)}
            >
              <Text style={styles.counterButtonText}>-</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Month Counter */}
        <View style={{ alignItems: 'center', width: sizes.counterWidth }}>
          <Text
            style={{
              fontSize: sizes.counterLabelSize,
              color: themeController.current?.unactiveTextColor,
              marginBottom: sizes.counterLabelMarginBottom,
            }}
          >
            {t('register.month_label')}
          </Text>
          <View
            style={[
              styles.counterUnit,
              {
                backgroundColor: themeController.current?.formInputBackground,
                borderRadius: sizes.borderRadius,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => handleExperienceChange('months', 1)}
            >
              <Text style={styles.counterButtonText}>+</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.counterInput}
              value={String(months)}
              onChangeText={(text) => {
                const newMonths = parseInt(text, 10) || 0;
                const totalMonths = years * 12 + newMonths;
                const finalYears = Math.floor(totalMonths / 12);
                const finalMonths = totalMonths % 12;
                setYears(finalYears);
                setMonths(finalMonths);
                onValueChange({ years: finalYears, months: finalMonths });
              }}
              keyboardType='number-pad'
            />
            <TouchableOpacity
              onPress={() => handleExperienceChange('months', -1)}
            >
              <Text style={styles.counterButtonText}>-</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <Text
        style={{
          marginTop: sizes.finalTextMarginTop,
          color: themeController.current?.unactiveTextColor,
          fontSize: sizes.font,
        }}
      >
        {formatExperience({ years, months }, t)}
      </Text>
    </TouchableOpacity>
  );

  const renderDropdownModal = () => (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType='fade'
      onRequestClose={() => {
        setModalVisible(false);
        // setViewMode('list');
      }}
    >
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPressOut={() => {
          setModalVisible(false);
          // setViewMode('list');
        }}
      >
        {pickerLayout && (
          <View
            style={[
              styles.dropdownContent,
              {
                top:
                  viewMode === 'counter' && !bottomDropdown
                    ? sizes.counterContainerHeight +
                      pickerLayout.top -
                      sizes.pickerHeight * 1.5
                    : pickerLayout.top,
                left: pickerLayout.left,
                width: pickerLayout.width,
                backgroundColor:
                  viewMode === 'list'
                    ? themeController.current?.formInputBackground
                    : themeController.current?.dropdownBackground,
                ...(bottomDropdown
                  ? {
                      borderBottomLeftRadius: sizes.borderRadius,
                      borderBottomRightRadius: sizes.borderRadius,
                    }
                  : {
                      borderTopLeftRadius: sizes.borderRadius,
                      borderTopRightRadius: sizes.borderRadius,
                    }),
              },
            ]}
          >
            {viewMode === 'list' ? (
              <>
                <FlatList
                  data={experienceLevels}
                  keyExtractor={(item) => item.value}
                  renderItem={renderOption}
                  showsVerticalScrollIndicator={false}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  onContentSizeChange={(width, height) =>
                    setContentHeight(height)
                  }
                  style={{ height: dropdownHeight }}
                />
                {renderCustomScrollBar(dropdownHeight)}
              </>
            ) : (
              renderCustomInput()
            )}
          </View>
        )}
      </TouchableOpacity>
    </Modal>
  );

  return (
    <>
      <TouchableOpacity
        ref={pickerRef}
        style={[
          styles.pickerContainer,
          {
            backgroundColor: themeController.current?.formInputBackground,
            height: sizes.pickerHeight,
            paddingHorizontal: sizes.inputContainerPaddingHorizontal,
            borderRadius: sizes.borderRadius,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
          modalVisible && {
            borderTopLeftRadius: bottomDropdown ? sizes.borderRadius : 0,
            borderTopRightRadius: bottomDropdown ? sizes.borderRadius : 0,
            borderBottomLeftRadius: bottomDropdown ? 0 : sizes.borderRadius,
            borderBottomRightRadius: bottomDropdown ? 0 : sizes.borderRadius,
          },
          containerStyle,
        ]}
        onPress={handlePress}
      >
        <View
          style={{ flex: 1, justifyContent: 'center', gap: sizes.labelGap }}
        >
          <Text
            style={[
              // styles.label,
              {
                color: themeController.current?.unactiveTextColor,
                fontSize: sizes.font,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
          >
            {label}
          </Text>
          <Text
            style={[
              // styles.value,
              {
                color: selectedValue
                  ? themeController.current?.textColor
                  : placeholderColor,
                fontSize: sizes.baseFont,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
          >
            {getSelectedLabel()}
          </Text>
        </View>
        <View style={styles.arrowContainer}>
          <Image
            source={icons.arrowDown}
            style={[
              styles.arrowIcon,
              {
                width: sizes.iconSize,
                height: sizes.iconSize,
                tintColor: themeController.current?.primaryColor,
                transform: modalVisible
                  ? [{ rotate: '180deg' }]
                  : [{ rotate: '0deg' }],
              },
            ]}
          />
        </View>
      </TouchableOpacity>

      {fullScreen ? renderFullScreenModal() : renderDropdownModal()}
    </>
  );
};

export default CustomExperiencePicker;
