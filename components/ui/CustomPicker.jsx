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
  useWindowDimensions,
  Animated,
} from 'react-native';
import { useComponentContext } from '../../context/globalAppContext';
import { icons } from '../../constants/icons';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';

const CustomPicker = ({
  label,
  options,
  selectedValue,
  onValueChange,
  isRTL,
  fullScreen = false, // Новый пропс, по умолчанию false
  containerStyle = {},
  placeholder = null,
  placeholderColor = null,
}) => {
  const { themeController } = useComponentContext();
  const { width, height } = useWindowDimensions();
  const isWebLandscape = Platform.OS === 'web' && width > height;

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

  const itemHeight = sizes.pickerHeight * 0.9;
  const dropdownHeight = itemHeight * (options.length > 4 ? 4 : options.length);

  const handlePress = () => {
    if (fullScreen) {
      setModalVisible(true);
    } else {
      pickerRef.current.measure((fx, fy, width, height, px, py) => {
        setPickerLayout({
          top: py + height,
          left: px,
          width: width,
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
                height: dropdownHeight,
                backgroundColor: themeController.current?.formInputBackground,
                borderBottomLeftRadius: sizes.borderRadius,
                borderBottomRightRadius: sizes.borderRadius,
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
                color: selectedLabel ? themeController.current?.textColor : placeholderColor,
                fontSize: sizes.baseFont,
                textAlign: isRTL ? 'right' : 'left',
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
