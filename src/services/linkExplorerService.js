import { Platform } from 'react-native';

export const opeUrl = (url) => {
    if (Platform.OS === 'web') {
        window.open(url, '_blank');
    } else {
        import('react-native').then(({ Linking }) => {
            Linking.openURL(url);
        });
    }
};