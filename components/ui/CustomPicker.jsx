import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Image,
  FlatList,
  Platform,
  Animated,
  StatusBar,
} from 'react-native';
import { useComponentContext } from '../../context/globalAppContext';
import { icons } from '../../constants/icons';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';
import { useWindowInfo } from '../../context/windowContext';

const CustomPicker = ({
  label,
  options,
  selectedValue,
  onValueChange,
  isRTL,
  fullScreen = false,
  containerStyle = {},
  placeholder = null,
  placeholderColor = null,
  bottomDropdown = true,
  headerStyle = false,
  iconOnly = false, // compact mode: globe icon only, content-width dropdown
  insideModal = false,
}) => {
  const { themeController } = useComponentContext();
  const { width, height, isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);
    const scale = isWebLandscape ? web : mobile;

    return {
      baseFont: scale(16),
      font: scale(12),
      headerFont: scale(16),
      iconSize: scale(24),
      langIconSize: scale(20),
      pickerHeight: scale(64),
      headerPickerHeight: scale(40),
      borderRadius: scale(8),
      inputContainerPaddingHorizontal: scale(16),
      headerInputContainerPaddingLeft: scale(24),
      headerInputContainerPaddingRight: scale(20),
      labelGap: scale(3),
    };
  }, [isWebLandscape, height]);

  const [modalVisible, setModalVisible] = useState(false);
  const [pickerLayout, setPickerLayout] = useState(null);
  const pickerRef = useRef(null);
  const [hoveredValue, setHoveredValue] = useState(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [contentHeight, setContentHeight] = useState(0);

  const selectedLabel =
    options.find((option) => option.value === selectedValue)?.label ||
    (placeholder ? null : options[0]?.label);

  const itemHeight = headerStyle
    ? sizes.headerPickerHeight * 0.9
    : sizes.pickerHeight * 0.9;
  const dropdownHeight = itemHeight * (options.length > 4 ? 4 : options.length);

  const handlePress = () => {
    if (fullScreen) {
      setModalVisible(true);
    } else if (iconOnly) {
      pickerRef.current.measure((fx, fy, btnW, btnH, px, py) => {
        const dropdownW = btnW;
        // measure() returns physical coords regardless of RTL.
        // If the button center is in the right half of the screen, right-align
        // the dropdown (dropdown's right edge = button's right edge).
        // Otherwise left-align (dropdown's left edge = button's left edge).
        // Then clamp so the dropdown never exceeds the screen.
        const buttonCenter = px + btnW / 2;
        const preferred = buttonCenter > width / 2
          ? px + btnW - dropdownW  // right-align
          : px;                    // left-align
        const left = Math.max(0, Math.min(preferred, width - dropdownW));
        setPickerLayout({ top: py + btnH, left, width: dropdownW });
        setModalVisible(true);
      });
    } else {
      pickerRef.current.measure((fx, fy, btnW, btnH, px, py) => {
        const left = Math.max(0, Math.min(px, width - btnW));
        const pyAdjusted = Platform.OS === 'android' && insideModal ? py + (StatusBar.currentHeight || 0) : py;
        setPickerLayout({
          top: bottomDropdown ? pyAdjusted + btnH : pyAdjusted - dropdownHeight,
          left,
          width: btnW,
        });
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
    const isSelected = selectedValue === item.value;
    const isHovered = hoveredValue === item.value;

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
          onValueChange(item.value);
          setModalVisible(false);
        }}
      >
        <Text
          style={[
            {
              color: headerStyle
                ? isSelected || isHovered
                  ? themeController.current?.primaryColor
                  : themeController.current?.textColor
                : isSelected || isHovered
                ? themeController.current?.textColor
                : themeController.current?.formInputPlaceholderColor,
              fontSize: sizes.baseFont,
              textAlign: headerStyle ? 'center' : isRTL ? 'right' : 'left',
              paddingHorizontal: iconOnly ? 0 : sizes.inputContainerPaddingHorizontal,
              includeFontPadding: false,
              textAlignVertical: 'center',
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
      statusBarTranslucent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPressOut={() => setModalVisible(false)}
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
            data={options}
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

  const renderDropdownModal = () => (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType='fade'
      statusBarTranslucent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPressOut={() => setModalVisible(false)}
      >
        {pickerLayout && (
          <View
            style={[
              styles.dropdownContent,
              {
                top: pickerLayout.top,
                left: pickerLayout.left,
                width: pickerLayout.width,
                height: dropdownHeight + (headerStyle ? 2 : 0), // Компенсируем рамку (border), чтобы не появлялся скролл
                backgroundColor: headerStyle
                  ? themeController.current?.backgroundColor
                  : themeController.current?.formInputBackground,
                ...(headerStyle && {
                  borderLeftWidth: 1,
                  borderRightWidth: 1,
                  borderBottomWidth: 1,
                  borderTopWidth: 0,
                  borderColor:
                    themeController.current?.headerPickerDropdownBorder,
                }),
                ...(bottomDropdown
                  ? {
                      borderBottomLeftRadius: sizes.borderRadius,
                      borderBottomRightRadius: sizes.borderRadius,
                    }
                  : {
                      borderTopLeftRadius: sizes.borderRadius,
                      borderTopRightRadius: sizes.borderRadius,
                      elevation: 0,
                      shadowOpacity: 0,
                      borderWidth: 1,
                      borderColor: themeController.current?.borderColor || 'rgba(0,0,0,0.1)',
                    }),
              },
            ]}
          >
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={renderOption}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              onContentSizeChange={(width, height) => setContentHeight(height)}
            />
            {renderCustomScrollBar(dropdownHeight)}
          </View>
        )}
      </TouchableOpacity>
    </Modal>
  );

  if (headerStyle) {
    return (
      <>
        <TouchableOpacity
          ref={pickerRef}
          style={[
            styles.headerPickerContainer,
            {
              borderColor: themeController.current?.primaryColor,
              height: sizes.headerPickerHeight,
              alignItems: 'center',
              justifyContent: iconOnly ? 'center' : 'space-between',
              flexDirection: isRTL ? 'row-reverse' : 'row',
            },
            iconOnly && { width: sizes.headerPickerHeight },
            modalVisible
              ? bottomDropdown
                ? {
                    borderTopLeftRadius: sizes.borderRadius,
                    borderTopRightRadius: sizes.borderRadius,
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    borderBottomWidth: 0,
                  }
                : {
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    borderBottomLeftRadius: sizes.borderRadius,
                    borderBottomRightRadius: sizes.borderRadius,
                    borderTopWidth: 0,
                  }
              : {
                  borderRadius: sizes.borderRadius,
                },
            !iconOnly && (isRTL
              ? {
                  paddingRight: sizes.headerInputContainerPaddingLeft,
                  paddingLeft: sizes.headerInputContainerPaddingRight,
                }
              : {
                  paddingRight: sizes.headerInputContainerPaddingRight,
                  paddingLeft: sizes.headerInputContainerPaddingLeft,
                }),
            containerStyle,
          ]}
          onPress={handlePress}
        >
          <Image
            source={icons.language}
            style={{
              width: sizes.langIconSize,
              height: sizes.langIconSize,
              tintColor: themeController.current?.primaryColor,
            }}
          />
          {!iconOnly && (
            <>
              <Text
                style={{
                  color: themeController.current?.primaryColor,
                  fontSize: sizes.headerFont,
                  lineHeight: sizes.headerFont * 1.2,
                  includeFontPadding: false,
                  textAlignVertical: 'center',
                }}
              >
                {selectedLabel}
              </Text>
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
            </>
          )}
        </TouchableOpacity>

        {fullScreen ? renderFullScreenModal() : renderDropdownModal()}
      </>
    );
  }

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
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
          modalVisible
              ? bottomDropdown
                ? {
                    borderTopLeftRadius: sizes.borderRadius,
                    borderTopRightRadius: sizes.borderRadius,
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                  }
                : {
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    borderBottomLeftRadius: sizes.borderRadius,
                    borderBottomRightRadius: sizes.borderRadius,
                  }
            : {
                borderRadius: sizes.borderRadius,
              },
          containerStyle,
        ]}
        onPress={handlePress}
      >
        <View
          style={{ flex: 1, justifyContent: 'center', gap: sizes.labelGap }}
        >
          {!!label && (
            <Text
              style={[
                // styles.label,
                {
                  color: themeController.current?.unactiveTextColor,
                  fontSize: sizes.font,
                  lineHeight: sizes.font * 1.2,
                  textAlign: isRTL ? 'right' : 'left',
                  includeFontPadding: false,
                  textAlignVertical: 'center',
                },
              ]}
            >
              {label}
            </Text>
          )}
          <Text
            style={[
              // styles.value,
              {
                color: selectedLabel
                  ? themeController.current?.textColor
                  : placeholderColor,
                fontSize: sizes.baseFont,
                lineHeight: sizes.baseFont * 1.2,
                textAlign: isRTL ? 'right' : 'left',
                includeFontPadding: false,
                textAlignVertical: 'center',
              },
            ]}
          >
            {placeholder ? placeholder : selectedLabel}
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

const styles = StyleSheet.create({
  headerPickerContainer: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  pickerContainer: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 10,
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
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    flexDirection: 'row', // Для размещения скроллбара
  },
  dropdownContent: {
    position: 'absolute',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 999,
    flexDirection: 'row', // Для размещения скроллбара
  },
  option: {
    // paddingHorizontal: 15,
  },
  scrollBarTrack: {
    width: 6,
    height: '100%',
    backgroundColor: 'transparent', // Прозрачный фон
    borderRadius: 3,
    position: 'absolute',
    right: 2,
    top: 0,
    bottom: 0,
  },
  scrollBarIndicator: {
    width: 6,
    borderRadius: 3,
  },
});

export default CustomPicker;
