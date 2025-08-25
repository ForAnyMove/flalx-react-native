import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useComponentContext } from '../../../context/globalAppContext';
import { useState } from 'react';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { icons } from '../../../constants/icons';

export default function Profile() {
  const { user, themeController } = useComponentContext();
  const [userState, setUserState] = useState(user.current || {});

  return (
    <ScrollView
      style={[
        styles.userProfile,
        { backgroundColor: themeController.current?.backgroundColor },
      ]}
    >
      <View style={{ paddingHorizontal: RFValue(5) }}>
        <ImageBackground
          source={userState?.profileBack}
          resizeMode='cover'
          style={[
            styles.profileBack,
            {
              backgroundColor:
                themeController.current?.profileDefaultBackground,
            },
          ]}
        >
          {userState?.avatar && (
            <Image
              source={
                useState.avatar ? { uri: userState.avatar } : icons.person
              }
              style={{
                width: RFValue(100),
                height: RFValue(100),
                borderRadius: RFValue(100),
                backgroundColor: '#ccc',
              }}
            />
          )}
        </ImageBackground>

        <InfoField
          label='First Name'
          value={userState?.name}
          changeInfo={(newText) =>
            setUserState((prev) => ({ ...prev, name: newText }))
          }
        />
        <InfoField
          label='Surname'
          value={userState?.surname}
          changeInfo={(newText) =>
            setUserState((prev) => ({ ...prev, surname: newText }))
          }
        />
        <InfoField
          label='About'
          value={userState?.about}
          changeInfo={(newText) =>
            setUserState((prev) => ({ ...prev, about: newText }))
          }
          multiline
        />
        <InfoField
          label='Location'
          value={userState?.location || 'Not set'}
          changeInfo={(newText) =>
            setUserState((prev) => ({ ...prev, location: newText }))
          }
        />
        <InfoField
          label='Email'
          value={userState?.email}
          changeInfo={(newText) =>
            setUserState((prev) => ({ ...prev, email: newText }))
          }
        />
        <InfoField
          label='Phone Number'
          value={userState?.phoneNumber}
          changeInfo={(newText) =>
            setUserState((prev) => ({ ...prev, phoneNumber: newText }))
          }
        />
        <View
          style={[
            styles.breakLine,
            { backgroundColor: themeController.current?.breakLineColor },
          ]}
        />
        <TouchableOpacity
          style={[
            styles.primaryBtn,
            {
              backgroundColor:
                themeController.current?.buttonColorPrimaryDefault,
            },
          ]}
        >
          <Text
            style={[
              styles.primaryText,
              { color: themeController.current?.buttonTextColorPrimary },
            ]}
          >
            Cupones
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.primaryBtn,
            {
              backgroundColor:
                themeController.current?.buttonColorPrimaryDefault,
            },
          ]}
        >
          <Text
            style={[
              styles.primaryText,
              { color: themeController.current?.buttonTextColorPrimary },
            ]}
          >
            Subscription
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.primaryBtn,
            {
              backgroundColor:
                themeController.current?.buttonColorPrimaryDefault,
            },
          ]}
        >
          <Text
            style={[
              styles.primaryText,
              { color: themeController.current?.buttonTextColorPrimary },
            ]}
          >
            Payment method
          </Text>
        </TouchableOpacity>
        <View
          style={[
            styles.breakLine,
            { backgroundColor: themeController.current?.breakLineColor },
          ]}
        />
        <TouchableOpacity
          style={[
            styles.primaryReverseBtn,
            {
              backgroundColor: themeController.current?.buttonTextColorPrimary,
              borderColor: themeController.current?.buttonColorPrimaryDefault,
            },
          ]}
        >
          <Text
            style={[
              styles.primaryText,
              { color: themeController.current?.buttonColorPrimaryDefault },
            ]}
          >
            Cupones
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.secondaryReverseBtn,
            {
              backgroundColor:
                themeController.current?.buttonTextColorSecondary,
              borderColor: themeController.current?.buttonColorSecondaryDefault,
            },
          ]}
        >
          <Text
            style={[
              styles.secondaryText,
              { color: themeController.current?.buttonColorSecondaryDefault },
            ]}
          >
            Subscription
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.secondaryReverseBtn,
            {
              backgroundColor:
                themeController.current?.buttonTextColorSecondary,
              borderColor: themeController.current?.buttonColorSecondaryDefault,
            },
          ]}
        >
          <Text
            style={[
              styles.secondaryText,
              { color: themeController.current?.buttonColorSecondaryDefault },
            ]}
          >
            Payment method
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.secondaryBtn,
            {
              backgroundColor:
                themeController.current?.buttonColorSecondaryDefault,
            },
          ]}
        >
          <Text
            style={[
              styles.secondaryText,
              { color: themeController.current?.buttonTextColorSecondary },
            ]}
          >
            Cupones
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function InfoField({ label, value, changeInfo, multiline = false }) {
  const { themeController } = useComponentContext();
  const [editMode, setEditMode] = useState(false);
  const [textValue, setTextValue] = useState(value);
  return (
    <View
      style={[
        styles.profileInfoString,
        {
          backgroundColor: editMode
            ? themeController.current?.formInputBackgroundEditMode
            : themeController.current?.formInputBackground,
        },
      ]}
    >
      <View style={{ width: '80%' }}>
        <Text
          style={[
            styles.profileInfoLabel,
            { color: themeController.current?.formInputLabelColor },
          ]}
        >
          {label}
        </Text>
        {editMode ? (
          <TextInput
            style={[
              styles.profileInfoText,
              { color: themeController.current?.formInputTextColor },
            ]}
            value={textValue}
            onChangeText={setTextValue}
            multiline
          />
        ) : (
          <Text
            style={[
              styles.profileInfoText,
              { color: themeController.current?.formInputTextColor },
            ]}
          >
            {textValue}
          </Text>
        )}
      </View>
      {editMode ? (
        <View style={styles.editPanel}>
          <TouchableOpacity
            onPress={() => {
              setEditMode(false);
              setTextValue(value);
            }}
          >
            <Image
              source={icons.cancel}
              style={[styles.icon, { tintColor: '#00000080' }]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setEditMode(false);
              changeInfo(textValue);
            }}
          >
            <Image
              source={icons.checkCircle}
              style={[styles.icon, { tintColor: '#00000080' }]}
            />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity onPress={() => setEditMode(true)}>
          <Image
            source={icons.edit}
            style={[styles.icon, { tintColor: '#00000080' }]}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  userProfile: {
    flex: 1,
    paddingVertical: RFPercentage(2),
  },
  profileBack: {
    width: '100%',
    height: RFPercentage(30),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RFValue(10),
    overflow: 'hidden',
    marginBottom: RFValue(12),
  },
  profileInfoString: {
    marginBottom: RFValue(12),
    borderRadius: 8,
    paddingHorizontal: RFValue(14),
    paddingVertical: RFValue(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakLine: {
    width: '100%',
    height: 1,
    marginBottom: RFValue(16),
  },
  primaryBtn: {
    padding: RFValue(10),
    borderRadius: RFValue(5),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: RFValue(12),
  },
  primaryText: {
    fontWeight: 'bold',
    fontSize: RFValue(12),
  },
  primaryReverseBtn: {
    padding: RFValue(10),
    borderRadius: RFValue(5),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: RFValue(12),
    borderWidth: 1,
  },
  primaryReverseText: {
    fontWeight: 'bold',
    fontSize: RFValue(12),
  },
  secondaryBtn: {
    padding: RFValue(10),
    borderRadius: RFValue(5),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: RFValue(12),
  },
  secondaryText: {
    fontWeight: 'bold',
    fontSize: RFValue(12),
  },
  secondaryReverseBtn: {
    padding: RFValue(10),
    borderRadius: RFValue(5),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: RFValue(12),
    borderWidth: 1,
  },
  secondaryReverseText: {
    fontWeight: 'bold',
    fontSize: RFValue(12),
  },
  profileInfoLabel: {
    fontWeight: 'bold',
    marginBottom: RFValue(4),
    fontSize: RFValue(10),
  },
  profileInfoText: {
    fontSize: RFValue(10),
    width: '100%',
  },
  editPanel: {
    flexDirection: 'row',
    gap: RFValue(5),
  },
  icon: {
    width: RFValue(18),
    height: RFValue(18),
    resizeMode: 'contain',
  },
});
