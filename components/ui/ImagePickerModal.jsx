import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';
import { normalizeImageUri } from '../../utils/supabase/uriHelpers';
import { useComponentContext } from '../../context/globalAppContext';
import { useWindowInfo } from '../../context/windowContext';
import { logError } from '../../utils/log_util';
import { icons } from '../../constants/icons';
import CustomTextInput from './CustomTextInput';
import ImageViewerModal from './ImageViewerModal';
import { useNotification } from '../../src/render';

let nextId = 0;
const makeId = () => `img-${Date.now()}-${nextId++}`;

// Matches src/files/uploadFile.js's own MAX_FILE_MB fallback — used only
// when imageLimits[limitType] hasn't loaded yet (or limitType wasn't given).
const DEFAULT_MAX_SIZE_MB = 5;

/**
 * Staged picker: URL/device/camera picks all just populate `items` — nothing
 * is handed to `onAdd` until "Add" is pressed. `items[].uri` is always the
 * *raw* picker/typed URI (renders directly in <Image>); normalizeImageUri()
 * (which on web returns {blob, ext} instead of a string for blob:/data: URIs
 * — see utils/supabase/uriHelpers.js) only runs at Add-time, right before
 * handing off to onAdd. Doing that normalization eagerly at pick-time (as an
 * earlier version of this file did) is the bug that made the preview show an
 * empty box: the wrapper object doesn't work as an <Image source={{uri}}>.
 *
 * `multiple` (default false — right for avatars) switches device/camera
 * picks and URL entries from "replace the single slot" to "append to the
 * list", and enables the OS multi-select picker. Preview tiles are tappable
 * (ImageViewerModal — the same fullscreen viewer job images use; nested
 * *inside* our own Modal rather than as a sibling, see the comment down by
 * its render call for why that placement matters on native).
 */
export default function ImagePickerModal({ visible, onClose, onAdd, limitType, multiple = false }) {
  const [url, setUrl] = useState('');
  const [items, setItems] = useState([]); // [{ id, uri, source: 'device' | 'url' }]
  const [viewerIndex, setViewerIndex] = useState(null); // index into items, or null when closed
  const { themeController, languageController, imageLimits } = useComponentContext();
  const { showInfo } = useNotification();
  const { t } = useTranslation();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;
  const { height, isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const limits = limitType ? imageLimits?.[limitType] : null;
  const limitsText = limits
    ? t('imagePicker.limits', {
        size: limits.maxSizeMB,
        types: (limits.allowedTypes || [])
          .map((type) => String(type).replace('image/', '').toUpperCase())
          .join(', '),
      })
    : null;
  const title = t(limitType === 'avatar' ? 'imagePicker.titleAvatar' : 'imagePicker.titleImage');

  const sizes = useMemo(() => {
    const scale = isWebLandscape ? scaleByHeight : scaleByHeightMobile;
    return {
      modalWidth: isWebLandscape ? scale(420, height) : '90%',
      borderRadius: scale(16, height),
      padding: scale(24, height),
      titleFontSize: scale(19, height),
      subtitleFontSize: scale(13, height),
      labelFontSize: scale(14, height),
      inputHeight: scale(48, height),
      inputFontSize: scale(15, height),
      buttonHeight: scale(50, height),
      buttonFontSize: scale(15, height),
      previewSize: scale(96, height),
      gap: scale(16, height),
      smallGap: scale(8, height),
      footerBtnHeight: scale(48, height),
      closeIconSize: scale(18, height),
    };
  }, [isWebLandscape, height]);

  const resetState = () => {
    setUrl('');
    setItems([]);
  };

  const handleCancel = () => {
    // Both this Modal and the nested ImageViewerModal render a real web
    // <Modal> when the viewer is open, and both listen for Escape — one
    // keypress fires both onRequestClose handlers. While the viewer is up,
    // let it handle Escape alone; the picker's own close controls are
    // covered by the fullscreen overlay anyway, so this never blocks a real
    // user action.
    if (viewerIndex !== null) return;
    resetState();
    onClose();
  };

  // Single mode: any new pick (device/camera/url keystroke) replaces the
  // whole list — there's only ever one slot. Multi mode: appends, so
  // re-opening the gallery or typing another URL adds to what's already
  // there instead of clobbering it.
  const addItems = (newOnes) => {
    setItems((prev) => (multiple ? [...prev, ...newOnes] : newOnes));
  };

  const removeItem = (id) => {
    if (!multiple) {
      resetState();
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Client-side pre-upload check — the OS picker only restricts to images
  // generally, not the specific size/mime-type limits this endpoint enforces
  // (limits.maxSizeMB/allowedTypes, from imageLimits[limitType]). Without
  // this, an oversized file just silently fails deep inside the upload call
  // with no feedback (reported bug: "app just gets stuck or does nothing").
  // fileSize/mimeType aren't always populated by expo-image-picker (notably
  // sometimes missing on web) — when absent, let the pick through; the
  // server-side limit (and uploadFile.js's own fallback check) still apply.
  const validateAsset = (asset) => {
    const maxMB = limits?.maxSizeMB ?? DEFAULT_MAX_SIZE_MB;
    if (asset.fileSize && asset.fileSize / (1024 * 1024) > maxMB) {
      return 'size';
    }
    const allowedTypes = limits?.allowedTypes;
    if (allowedTypes?.length && asset.mimeType && !allowedTypes.includes(asset.mimeType)) {
      return 'format';
    }
    return null;
  };

  const reportRejected = (reason) => {
    if (reason === 'size') {
      showInfo(t('imagePicker.fileTooLarge', { size: limits?.maxSizeMB ?? DEFAULT_MAX_SIZE_MB }));
    } else if (reason === 'format') {
      showInfo(
        t('imagePicker.fileTypeNotAllowed', {
          types: (limits?.allowedTypes || [])
            .map((type) => String(type).replace('image/', '').toUpperCase())
            .join(', '),
        })
      );
    }
  };

  const pickImageFromDevice = async () => {
    try {
      await ImagePicker.getMediaLibraryPermissionsAsync();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        // Cropping UI and multi-select are mutually exclusive in
        // expo-image-picker — only offer the 1:1 crop for single-image
        // pickers (avatars); job/document pickers skip it.
        allowsEditing: !multiple,
        aspect: multiple ? undefined : [1, 1],
        allowsMultipleSelection: multiple,
        selectionLimit: multiple ? 0 : 1,
        quality: 0.8,
        base64: null,
      });

      if (!result.canceled && result.assets?.length) {
        const accepted = [];
        let rejectedReason = null;
        for (const asset of result.assets) {
          const reason = validateAsset(asset);
          if (reason) {
            rejectedReason = reason;
          } else {
            accepted.push({ id: makeId(), uri: asset.uri, source: 'device' });
          }
        }
        if (rejectedReason) reportRejected(rejectedReason);
        if (accepted.length) {
          addItems(accepted);
          if (!multiple) setUrl('');
        }
      }
    } catch (error) {
      logError('Error picking image:', error);
    }
  };

  const openCameraFromDevice = async () => {
    if (Platform.OS === 'web') return;
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert(t('imagePicker.cameraPermissionDenied'));
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: !multiple,
        aspect: multiple ? undefined : [1, 1],
        quality: 0.8,
        base64: null,
      });

      if (!result.canceled && result.assets?.[0]) {
        const reason = validateAsset(result.assets[0]);
        if (reason) {
          reportRejected(reason);
          return;
        }
        addItems([{ id: makeId(), uri: result.assets[0].uri, source: 'device' }]);
        if (!multiple) setUrl('');
      }
    } catch (error) {
      logError('Error opening camera:', error);
    }
  };

  // Single mode: the URL field IS the one slot, live — every keystroke
  // replaces items with the current text (or clears it). Multi mode: typing
  // alone doesn't commit anything (an in-progress URL shouldn't flash into
  // the grid) — commitUrl() (Enter or the + button) adds it as a new tile.
  const handleUrlChange = (text) => {
    setUrl(text);
    if (!multiple) {
      addItems(text.trim() ? [{ id: 'url-draft', uri: text.trim(), source: 'url' }] : []);
    }
  };

  const commitUrl = () => {
    if (!multiple) return;
    const trimmed = url.trim();
    if (!trimmed) return;
    addItems([{ id: makeId(), uri: trimmed, source: 'url' }]);
    setUrl('');
  };

  const handleAdd = async () => {
    if (items.length === 0) return;
    const normalized = await Promise.all(
      items.map((item) => (item.source === 'device' ? normalizeImageUri(item.uri) : item.uri))
    );
    onAdd(normalized);
    resetState();
    onClose();
  };

  const row = { flexDirection: isRTL ? 'row-reverse' : 'row' };
  const textAlign = isRTL ? 'right' : 'left';

  const PreviewTile = ({ uri, onPress, onRemove }) => (
    <View style={{ width: sizes.previewSize, height: sizes.previewSize }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ width: '100%', height: '100%' }}>
        <Image source={{ uri }} style={{ width: '100%', height: '100%', borderRadius: sizes.smallGap }} resizeMode='cover' />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onRemove}
        style={{
          position: 'absolute',
          top: -6,
          [isRTL ? 'left' : 'right']: -6,
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: theme.backgroundColor,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: theme.borderColor,
        }}
      >
        <Ionicons name='close' size={14} color={theme.textColor} />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={handleCancel}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      >
        <View
          style={{
            backgroundColor: theme.backgroundColor,
            borderRadius: sizes.borderRadius,
            width: sizes.modalWidth,
            maxHeight: '90%',
            padding: sizes.padding,
          }}
        >
          {/* Header */}
          <View style={[row, { justifyContent: 'space-between', alignItems: 'flex-start' }]}>
            <Text
              style={{
                fontSize: sizes.titleFontSize,
                fontFamily: 'Rubik-Bold',
                color: theme.textColor,
                textAlign,
              }}
            >
              {title}
            </Text>
            <TouchableOpacity onPress={handleCancel}>
              <Image
                source={icons.cross}
                style={{ width: sizes.closeIconSize, height: sizes.closeIconSize, tintColor: theme.textColor }}
              />
            </TouchableOpacity>
          </View>
          {!!limitsText && (
            <Text
              style={{
                fontSize: sizes.subtitleFontSize,
                color: theme.unactiveTextColor,
                marginTop: 4,
                textAlign,
              }}
            >
              {limitsText}
            </Text>
          )}

          {/* URL input */}
          <Text
            style={{
              fontSize: sizes.labelFontSize,
              fontFamily: 'Rubik-Medium',
              color: theme.textColor,
              marginTop: sizes.gap,
              marginBottom: sizes.smallGap,
              textAlign,
            }}
          >
            {t('imagePicker.urlLabel')}
          </Text>
          <View
            style={[
              row,
              {
                alignItems: 'center',
                height: sizes.inputHeight,
                borderWidth: 1,
                borderColor: theme.borderColor,
                borderRadius: sizes.smallGap,
                backgroundColor: theme.formInputBackground,
                paddingHorizontal: sizes.smallGap * 1.5,
              },
            ]}
          >
            <Ionicons
              name='link-outline'
              size={18}
              color={theme.unactiveTextColor}
              style={{ marginRight: isRTL ? 0 : sizes.smallGap, marginLeft: isRTL ? sizes.smallGap : 0 }}
            />
            <CustomTextInput
              placeholder='https://example.com/image.jpg'
              placeholderTextColor={theme.formInputPlaceholderColor}
              value={url}
              onChangeText={handleUrlChange}
              onSubmitEditing={multiple ? commitUrl : undefined}
              style={{
                flex: 1,
                color: theme.formInputTextColor,
                fontSize: sizes.inputFontSize,
                textAlign,
                backgroundColor: 'transparent',
                borderWidth: 0,
                padding: 0,
                ...Platform.select({ web: { outlineStyle: 'none' } }),
              }}
            />
            {multiple && !!url.trim() && (
              <TouchableOpacity onPress={commitUrl} style={{ marginLeft: isRTL ? 0 : sizes.smallGap, marginRight: isRTL ? sizes.smallGap : 0 }}>
                <Ionicons name='add-circle' size={22} color={theme.primaryColor} />
              </TouchableOpacity>
            )}
          </View>

          {/* Divider */}
          <View style={[row, { alignItems: 'center', marginVertical: sizes.gap }]}>
            <View style={{ flex: 1, height: 1, backgroundColor: theme.borderColor }} />
            <Text style={{ marginHorizontal: sizes.smallGap, color: theme.unactiveTextColor, fontSize: sizes.subtitleFontSize }}>
              {t('common.or')}
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: theme.borderColor }} />
          </View>

          {/* Device gallery */}
          <TouchableOpacity
            onPress={pickImageFromDevice}
            style={[
              row,
              {
                alignItems: 'center',
                justifyContent: 'center',
                height: sizes.buttonHeight,
                borderWidth: 1,
                borderColor: theme.primaryColor,
                borderRadius: sizes.smallGap,
              },
            ]}
          >
            <Ionicons
              name='image-outline'
              size={20}
              color={theme.primaryColor}
              style={{ marginRight: isRTL ? 0 : sizes.smallGap, marginLeft: isRTL ? sizes.smallGap : 0 }}
            />
            <Text style={{ color: theme.primaryColor, fontFamily: 'Rubik-Medium', fontSize: sizes.buttonFontSize }}>
              {t('imagePicker.pickFromDevice')}
            </Text>
          </TouchableOpacity>

          {Platform.OS !== 'web' && (
            <TouchableOpacity onPress={openCameraFromDevice} style={{ alignItems: 'center', marginTop: sizes.smallGap * 1.5 }}>
              <Text style={{ color: theme.primaryColor, fontSize: sizes.subtitleFontSize, fontFamily: 'Rubik-Medium' }}>
                {t('imagePicker.openCamera')}
              </Text>
            </TouchableOpacity>
          )}

          {/* Preview */}
          {items.length > 0 && (
            <View style={{ marginTop: sizes.gap }}>
              <Text
                style={{
                  fontSize: sizes.labelFontSize,
                  fontFamily: 'Rubik-Medium',
                  color: theme.textColor,
                  marginBottom: sizes.smallGap,
                  textAlign,
                }}
              >
                {t('imagePicker.previewLabel')}
                {multiple && items.length > 1 ? ` (${items.length})` : ''}
              </Text>
              {multiple ? (
                <View style={[row, { flexWrap: 'wrap', gap: sizes.smallGap * 1.5 }]}>
                  {items.map((item, idx) => (
                    <PreviewTile
                      key={item.id}
                      uri={item.uri}
                      onPress={() => setViewerIndex(idx)}
                      onRemove={() => removeItem(item.id)}
                    />
                  ))}
                </View>
              ) : (
                <PreviewTile
                  uri={items[0].uri}
                  onPress={() => setViewerIndex(0)}
                  onRemove={() => removeItem(items[0].id)}
                />
              )}
            </View>
          )}

          {/* Footer */}
          <View
            style={[
              row,
              {
                justifyContent: 'flex-end',
                gap: sizes.smallGap,
                marginTop: sizes.gap,
                paddingTop: sizes.gap,
                borderTopWidth: 1,
                borderTopColor: theme.borderColor,
              },
            ]}
          >
            <TouchableOpacity
              onPress={handleCancel}
              style={{
                height: sizes.footerBtnHeight,
                paddingHorizontal: sizes.gap,
                borderRadius: sizes.smallGap,
                borderWidth: 1,
                borderColor: theme.borderColor,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: theme.textColor, fontFamily: 'Rubik-Medium', fontSize: sizes.buttonFontSize }}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAdd}
              disabled={items.length === 0}
              style={{
                height: sizes.footerBtnHeight,
                paddingHorizontal: sizes.gap,
                borderRadius: sizes.smallGap,
                backgroundColor: theme.buttonColorPrimaryDefault,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: items.length > 0 ? 1 : 0.5,
              }}
            >
              <Text style={{ color: theme.buttonTextColorPrimary, fontFamily: 'Rubik-Medium', fontSize: sizes.buttonFontSize }}>
                {t('imagePicker.addButton')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Nested inside our own Modal (not a sibling) so the fullscreen
          overlay it renders on native — an absolute View, not a real
          <Modal>, to avoid nested-Modal issues on Android — is actually
          covered by *this* Modal's presentation layer. Mirrors how
          ShowJobModal.jsx nests it inside its own (caller-provided) Modal
          wrapper. */}
      <ImageViewerModal
        visible={viewerIndex !== null}
        images={items.map((item) => item.uri)}
        initialIndex={viewerIndex ?? 0}
        onClose={() => setViewerIndex(null)}
      />
    </Modal>
  );
}
