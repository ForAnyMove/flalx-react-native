import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { useComponentContext } from '../context/globalAppContext';
import CustomFlatList from './ui/CustomFlatList';
import UserSummaryBlock from './UserSummaryBlock';

  function showTitleByStatus(status) {
    switch (status) {
      case 'store-waiting':
        return 'Interested Providers';
      case 'store-in-progress':
        return 'Provider working on request';
      case 'store-done':
        return 'Provider complete request';
      case 'jobs-in-progress':
        return 'Customer placed request';
      case 'jobs-done':
        return 'Customer placed request';
      default:
        return '';
    }
  }

export default function ProvidersSection({styles, currentJobInfo, status='store-waiting'}) {
  const { getUserById, activeThemeStyles } = useComponentContext();
  const [isModalVisible, setIsModalVisible] = useState(false);

  function checkListByStatus() {
    switch (status) {
      case 'store-waiting':
        return currentJobInfo?.providers;
      case 'store-in-progress':
        return [currentJobInfo?.approvedProvider];
      case 'store-done':
        return [currentJobInfo?.approvedProvider];
      case 'jobs-in-progress':
        return [currentJobInfo?.creator];
      case 'jobs-done':
        return [currentJobInfo?.creator];
      default:
        return '';
    }
  }

  const providerList = checkListByStatus();
  
  const renderProviderList = () => (
    <>
      {Platform.OS === 'web' ? (
        <CustomFlatList
          data={providerList || []}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => <UserSummaryBlock status={status} user={getUserById(item)} />}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps='handled'
        />
      ) : (
        <FlatList
          data={providerList || []}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => <UserSummaryBlock status={status} user={getUserById(item)} />}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps='handled'
        />
      )}
    </>
  );
  
  return (
    <View
      style={[
        styles.inputBlock,
        { backgroundColor: activeThemeStyles?.formInputBackground, maxHeight: RFValue(200), overflow: 'hidden' },
      ]}
      key='providers'
    >
      <View>
        <View style={styleRow.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {status==='store-waiting' && providerList?.length > 0 && (
              <View style={[styles.badge, { backgroundColor: activeThemeStyles?.secondaryBadgeBackground }]}> 
                <Text style={[styles.badgeText, { color: activeThemeStyles?.badgeTextColor }]}> 
                  {providerList.length} 
                </Text>
              </View>
            )}
            <Text style={[styles.label, {marginBottom: 0, marginLeft: RFValue(8)}]}>{showTitleByStatus(status)}</Text>
          </View>

          {status==='store-waiting' && <Pressable onPress={() => setIsModalVisible(true)} style={styleRow.iconButton}>
            <Ionicons name="expand" size={RFValue(16)} color={activeThemeStyles?.textColor} />
          </Pressable>}
        </View>
      </View>

      {renderProviderList()}

      <Modal
        visible={isModalVisible}
        animationType='slide'
        presentationStyle='fullScreen'
      >
        <View style={[styleRow.modalContainer, { backgroundColor: activeThemeStyles?.backgroundColor }]}>
          <View style={styleRow.modalHeader}>
            <Text style={styleRow.modalTitle}>Interested Providers</Text>
            <Pressable onPress={() => setIsModalVisible(false)}>
              <Ionicons name="contract" size={RFValue(18)} color={activeThemeStyles?.textColor} />
            </Pressable>
          </View>
          {renderProviderList()}
        </View>
      </Modal>
    </View>
  );
}

const styleRow = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    padding: RFValue(4),
  },
  modalContainer: {
    flex: 1,
    padding: RFValue(10),
    paddingTop: RFValue(30),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RFValue(10),
  },
  modalTitle: {
    fontSize: RFValue(16),
    fontWeight: 'bold',
  },
});
