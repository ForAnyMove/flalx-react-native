import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Image,
  FlatList,
  Platform,
} from 'react-native';
import { useComponentContext } from '../../context/globalAppContext';
import { icons } from '../../constants/icons';
import { RFValue } from 'react-native-responsive-fontsize';

const CustomPicker = ({
  label,
  options,
  selectedValue,
  onValueChange,
  isRTL,
  sizes,
  fullScreen = false, // Новый пропс, по умолчанию false
}) => {
  const { themeController } = useComponentContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [pickerLayout, setPickerLayout] = useState(null);
  const pickerRef = useRef(null);

  const selectedLabel =
    options.find((option) => option.value === selectedValue)?.label || '';

  const itemHeight = sizes.pickerHeight * 0.9;
  const dropdownHeight =
    itemHeight * (options.length > 4 ? 4 : options.length);

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

  const renderOption = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.option,
        {
          backgroundColor:
            selectedValue === item.value
              ? themeController.current?.primaryColor
              : 'transparent',
          borderRadius: sizes.borderRadius,
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
        style={{
          color:
            selectedValue === item.value
              ? themeController.current?.buttonTextColorPrimary
              : themeController.current?.textColor,
          fontSize: sizes.baseFont,
          textAlign: 'center',
        }}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

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
              backgroundColor: themeController.current?.backgroundColor,
              borderRadius: sizes.borderRadius,
            },
          ]}
        >
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={renderOption}
          />
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
                backgroundColor: themeController.current?.backgroundColor,
                borderRadius: sizes.borderRadius,
                padding: sizes.baseFont * 0.5,
              },
            ]}
          >
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={renderOption}
            />
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
            flex: 1,
            paddingHorizontal: sizes.inputContainerPaddingHorizontal,
            borderRadius: sizes.borderRadius,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}
        onPress={handlePress}
      >
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text
            style={[
              styles.label,
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
              styles.value,
              {
                color: themeController.current?.textColor,
                fontSize: sizes.baseFont,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
          >
            {selectedLabel}
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
                transform: modalVisible ? [{ rotate: '180deg' }] : [{ rotate: '0deg' }],
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
  label: {
    position: 'absolute',
    top: RFValue(5),
  },
  value: {
    marginTop: RFValue(10),
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
  },
  option: {
    paddingHorizontal: 15,
  },
});

export default CustomPicker;
