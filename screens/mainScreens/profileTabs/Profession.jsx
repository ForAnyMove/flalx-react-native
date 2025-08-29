import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useComponentContext } from '../../../context/globalAppContext';
import SearchPanel from '../../../components/SearchPanel';
import { RFValue } from 'react-native-responsive-fontsize';
import { icons } from '../../../constants/icons';
import { useState } from 'react';

export default function Profession() {
  const { user, themeController } = useComponentContext();
  const [searchValue, setSearchValue] = useState('');

  return (
    <View
      style={[
        styles.professionScreen,
        { backgroundColor: themeController.current?.backgroundColor },
      ]}
    >
      <SearchPanel searchValue={searchValue} setSearchValue={setSearchValue} />
      <ScrollView>
        {user.current?.professions
          ?.filter((val) =>
            LICENSES[val].toLowerCase().includes(searchValue.toLowerCase())
          )
          .map((prof, index) => (
            <View
              key={index}
              style={[
                styles.professionContainer,
                {
                  backgroundColor: themeController.current?.formInputBackground,
                },
              ]}
            >
              <FontAwesome6
                name='check'
                size={RFValue(14)}
                color={themeController.current?.textColor}
              />
              <Image
                source={icons.checkCircle}
                style={[
                  {
                    with: RFValue(14),
                    height: RFValue(14),
                    tintColor: themeController.current?.textColor,
                  },
                ]}
                resizeMode='contain'
              />
              <Text
                style={[
                  styles.professionTitle,
                  { color: themeController.current?.textColor },
                ]}
              >
                {LICENSES[prof]}
              </Text>
              {true && (
                <Text
                  style={[
                    styles.verifiedMarker,
                    { color: themeController.current?.unactiveTextColor },
                  ]}
                >
                  verified
                </Text>
              )}
            </View>
          ))}
      </ScrollView>
      <TouchableOpacity
        style={{
          backgroundColor: themeController.current?.mainBadgeBackground,
          width: 45,
          height: 45,
          borderRadius: 25,
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute',
          right: 20,
          bottom: 20,
          ...Platform.select({
            web: {
              right: 40,
            },
          }),
        }}
        // onPress={() => router.push('/new-job-modal')}
      >
        <Image
          source={icons.plus}
          style={[
            {
              with: RFValue(14),
              height: RFValue(14),
              tintColor: themeController.current?.badgeTextColor,
            },
          ]}
          resizeMode='contain'
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  professionScreen: {
    flex: 1,
    padding: RFValue(10),
  },
  professionContainer: {
    borderRadius: RFValue(5),
    paddingVertical: RFValue(10),
    paddingHorizontal: RFValue(14),
    flexDirection: 'row',
    gap: RFValue(8),
    marginBottom: RFValue(8),
  },
  professionTitle: {
    fontSize: RFValue(10),
    fontWeight: '500',
  },
  verifiedMarker: {
    fontSize: RFValue(10),
    textAlign: 'right',
    flex: 1,
  },
});
