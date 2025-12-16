import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const AddressPicker2 = () => {
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  return (
    <View style={styles.container}>
      <GooglePlacesAutocomplete
        placeholder='Введите адрес'
        onPress={(data, details = null) => {
          // 'details' содержит более подробную информацию о месте
          setSelectedPlace(details);
          if (details && details.geometry && details.geometry.location) {
            setMapRegion({
              latitude: details.geometry.location.lat,
              longitude: details.geometry.location.lng,
              latitudeDelta: 0.005, // Более крупный масштаб для выбранного места
              longitudeDelta: 0.005,
            });
          }
        }}
        query={{
          key: process.env.GOOGLE_PLACES_API_KEY, // Используй свой API ключ здесь
          language: 'ru', // Опционально: установить язык результатов
          components: 'country:ru', // Опционально: ограничить поиск Россией
        }}
        fetchDetails={true} // Обязательно, чтобы получить координаты и другие детали
        styles={{
          textInputContainer: {
            width: '100%',
          },
          textInput: {
            height: 50,
            color: '#5d5d5d',
            fontSize: 16,
            backgroundColor: '#ffffff',
            borderWidth: 1,
            borderColor: '#cccccc',
            borderRadius: 5,
            paddingHorizontal: 10,
          },
        }}
        enablePoweredByContainer={false} // Отключает "Powered by Google" если не нужно
        debounce={200} // Задержка перед отправкой запроса к API
      />

      {selectedPlace && (
        <View style={styles.selectedPlaceInfo}>
          <Text style={styles.placeName}>{selectedPlace.name}</Text>
          <Text>{selectedPlace.formatted_address}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
  },
  selectedPlaceInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  placeName: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 5,
  },
  map: {
    flex: 1,
    marginTop: 20,
    borderRadius: 8,
  },
});

export default AddressPicker2;
