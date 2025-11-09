import { Platform } from 'react-native';

export async function normalizeImageUri(uri) {
  // web: data:image... или blob URL
  if (Platform.OS === 'web' && uri?.startsWith('data:')) {
    const res = await fetch(uri);
    const blob = await res.blob();
    const ext = (blob.type && blob.type.split('/')[1]) || 'jpg';
    return { blob, ext };
  }

  // web: возможно уже blob:// или object URL (leave it)
  if (Platform.OS === 'web' && uri?.startsWith('blob:')) {
    // можно получить тип через fetch
    const res = await fetch(uri);
    const blob = await res.blob();
    const ext = (blob.type && blob.type.split('/')[1]) || 'jpg';
    return { blob, ext };
  }

  // mobile: file:// path
  return { uri };
}
