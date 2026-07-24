import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../context/globalAppContext';
import { useWindowInfo } from '../../context/windowContext';
import { useNotification } from '../../src/render';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';
import { icons } from '../../constants/icons';
import CustomTextInput from '../ui/CustomTextInput';
import CustomPicker from '../ui/CustomPicker';
import UpdateEmailModal from './UpdateEmailModal';
import { sendSupportRequest } from '../../src/api/support';
import { parsePhone, formatAsYouType, callingCodeFor } from '../../src/phone/phoneUtils';
import { logError } from '../../utils/log_util';

const SUBJECT_MAX = 100;
const MESSAGE_MAX = 5000;

// "us***er@example.com" style — keeps the pattern readable regardless of
// local-part length instead of guessing a fixed reveal count.
function maskEmail(email) {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  if (local.length >= 4) {
    return `${local.slice(0, 2)}***${local.slice(-2)}@${domain}`;
  }
  return `${local[0] || ''}***@${domain}`;
}

// "+380 50 *** ** 123" style — nationally formatted first (via
// libphonenumber-js/phoneUtils, so spacing is locale-correct), then the
// middle digits masked, first 2 and last 3 left visible.
function maskPhone(e164) {
  if (!e164) return '';
  const parsed = parsePhone(e164);
  if (!parsed) return e164;
  const { countryCode, nationalNumber } = parsed;
  const formatted = formatAsYouType(nationalNumber, countryCode).formatted;
  const digits = formatted.replace(/\D/g, '');
  const code = callingCodeFor(countryCode);
  if (digits.length <= 5) return `+${code} ${formatted}`;
  return `+${code} ${digits.slice(0, 2)} *** ** ${digits.slice(-3)}`;
}

/**
 * Unified Contact Support form — replaces the old separate Contact Us /
 * Feedback modals (client feedback: they're the same thing). "Feedback" now
 * just lives on as one of the Category options instead of its own button.
 * Attachments are intentionally not implemented yet (out of scope for this
 * pass); there's also no ticket-number/"my requests" tracking on the
 * backend yet, so that part of the reference design was dropped — success
 * is a simple confirmation, same copy the old Contact Us modal used.
 */
export default function ContactSupportModal({ visible, onClose }) {
  const SHOW_SIDEBAR = false;
  const { t } = useTranslation();
  const { session, user, themeController, languageController, setAppLoading } =
    useComponentContext();
  const { showError } = useNotification();
  const theme = themeController.current;
  const { height, isLandscape } = useWindowInfo();
  const isRTL = languageController.isRTL;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  // Same fallback as Profile.jsx#displayEmail — while unconfirmed, Supabase
  // doesn't actually have the email set yet, only pendingEmail.
  const displayEmail =
    user.current?.email ||
    (session.authUser?.emailVerified === false ? session.authUser?.pendingEmail : null);
  const phoneNumber = user.current?.phoneNumber;
  const hasEmail = !!displayEmail;

  const [category, setCategory] = useState('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [contactMethod, setContactMethod] = useState(hasEmail ? 'email' : 'phone');
  const [preferredTime, setPreferredTime] = useState('anytime');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [updateEmailVisible, setUpdateEmailVisible] = useState(false);

  const resetForm = () => {
    setCategory('general');
    setSubject('');
    setMessage('');
    setContactMethod(hasEmail ? 'email' : 'phone');
    setPreferredTime('anytime');
    setErrors({});
    setShowSuccess(false);
  };

  const handleClose = () => {
    onClose();
    // Reset after the close animation would've finished — avoids a visible
    // flash of the empty form while the modal is still closing.
    setTimeout(resetForm, 300);
  };

  const handleSubmit = async () => {
    const nextErrors = {};
    if (!subject.trim()) nextErrors.subject = t('settings.modals.contact_support.field_required');
    if (!message.trim()) nextErrors.message = t('settings.modals.contact_support.field_required');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setAppLoading(true);
    try {
      const success = await sendSupportRequest(session, {
        category,
        subject: subject.trim(),
        message: message.trim(),
        contactMethod,
        preferredTime,
      });
      if (success) {
        setShowSuccess(true);
        setTimeout(handleClose, 2000);
      } else {
        showError(t('errors.unexpected_error'));
      }
    } catch (error) {
      logError('Error submitting support request:', error);
      showError(t('errors.unexpected_error'));
    } finally {
      setSubmitting(false);
      setAppLoading(false);
    }
  };

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);
    const scale = isWebLandscape ? web : mobile;

    return {
      modalWidth: isWebLandscape ? scale(920) : '100%',
      modalMaxHeight: isWebLandscape ? '90%' : '100%',
      borderRadius: scale(12),
      paddingHorizontal: isWebLandscape ? scale(28) : scale(16),
      paddingVertical: isWebLandscape ? scale(24) : scale(40),
      closeIconSize: scale(22),
      closeBtnPosition: scale(16),
      headerIconSize: scale(48),
      headerIconInner: scale(24),
      titleFont: scale(22),
      subtitleFont: scale(14),
      sectionLabelFont: scale(15),
      helpTextFont: scale(12.5),
      counterFont: scale(12),
      inputHeight: scale(52),
      textAreaHeight: scale(120),
      fieldFont: scale(15),
      radioRowHeight: scale(60),
      radioIconCircle: scale(34),
      radioIconInner: scale(16),
      badgeFont: scale(11),
      sidebarIconCircle: scale(56),
      sidebarIconInner: scale(24),
      sidebarTitleFont: scale(14),
      sidebarTextFont: scale(12.5),
      submitHeight: scale(54),
      submitFont: scale(17),
      secureNoteFont: scale(12),
      gap: scale(16),
      smallGap: scale(8),
    };
  }, [height, isWebLandscape]);

  const categoryOptions = [
    { value: 'general', label: t('settings.modals.contact_support.category.options.general') },
    { value: 'technical', label: t('settings.modals.contact_support.category.options.technical') },
    { value: 'billing', label: t('settings.modals.contact_support.category.options.billing') },
    { value: 'feedback', label: t('settings.modals.contact_support.category.options.feedback') },
    { value: 'other', label: t('settings.modals.contact_support.category.options.other') },
  ];

  const timeOptions = [
    { value: 'anytime', label: t('settings.modals.contact_support.preferred_time.options.anytime') },
    { value: 'morning', label: t('settings.modals.contact_support.preferred_time.options.morning') },
    { value: 'afternoon', label: t('settings.modals.contact_support.preferred_time.options.afternoon') },
    { value: 'evening', label: t('settings.modals.contact_support.preferred_time.options.evening') },
  ];

  const row = { flexDirection: isRTL ? 'row-reverse' : 'row' };
  const textAlign = isRTL ? 'right' : 'left';

  const SectionLabel = ({ number, text, required }) => (
    <Text
      style={{
        fontSize: sizes.sectionLabelFont,
        fontFamily: 'Rubik-SemiBold',
        color: theme.textColor,
        textAlign,
        marginBottom: sizes.smallGap / 2,
      }}
    >
      {number ? `${number}. ` : ''}
      {text}
      {required && <Text style={{ color: theme.errorTextColor }}> *</Text>}
    </Text>
  );

  const HelpText = ({ children, style }) => (
    <Text
      style={[
        {
          fontSize: sizes.helpTextFont,
          color: theme.unactiveTextColor,
          textAlign,
          fontFamily: 'Rubik-Regular',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );

  const fieldBoxStyle = (extraHeight) => ({
    backgroundColor: theme.formInputBackground,
    borderRadius: sizes.borderRadius / 1.5,
    paddingHorizontal: sizes.smallGap * 1.5,
    justifyContent: 'center',
    height: extraHeight || sizes.inputHeight,
  });

  const RadioRow = ({ selected, onPress, icon, iconColor, iconBg, title, subtitle, badge }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        row,
        {
          alignItems: 'center',
          height: sizes.radioRowHeight,
          borderWidth: 1.5,
          borderColor: selected ? theme.primaryColor : theme.borderColor,
          backgroundColor: selected ? `${theme.primaryColor}14` : 'transparent',
          borderRadius: sizes.borderRadius / 1.5,
          paddingHorizontal: sizes.smallGap * 1.5,
          marginBottom: sizes.smallGap,
        },
      ]}
    >
      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={20}
        color={selected ? theme.primaryColor : theme.unactiveTextColor}
      />
      <View
        style={[
          row,
          {
            alignItems: 'center',
            marginHorizontal: sizes.smallGap,
          },
        ]}
      >
        <View
          style={{
            width: sizes.radioIconCircle,
            height: sizes.radioIconCircle,
            borderRadius: sizes.radioIconCircle / 2,
            backgroundColor: iconBg,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name={icon} size={sizes.radioIconInner} color={iconColor} />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: sizes.fieldFont, fontFamily: 'Rubik-Medium', color: theme.textColor, textAlign }}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={{ fontSize: sizes.helpTextFont, color: theme.unactiveTextColor, textAlign }}>
            {subtitle}
          </Text>
        )}
      </View>
      {!!badge && (
        <View
          style={{
            backgroundColor: `${theme.verifiedMarkerColor}26`,
            paddingHorizontal: sizes.smallGap,
            paddingVertical: 2,
            borderRadius: 20,
          }}
        >
          <Text style={{ fontSize: sizes.badgeFont, color: theme.verifiedMarkerColor, fontFamily: 'Rubik-Medium' }}>
            {badge}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const SidebarCard = ({ icon, iconColor, iconBg, title, text }) => (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: theme.formInputBackground,
        borderRadius: sizes.borderRadius,
        padding: sizes.gap,
        marginBottom: sizes.gap,
      }}
    >
      <View
        style={{
          width: sizes.sidebarIconCircle,
          height: sizes.sidebarIconCircle,
          borderRadius: sizes.sidebarIconCircle / 2,
          backgroundColor: iconBg,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: sizes.smallGap,
        }}
      >
        <Ionicons name={icon} size={sizes.sidebarIconInner} color={iconColor} />
      </View>
      <Text
        style={{
          fontSize: sizes.sidebarTitleFont,
          fontFamily: 'Rubik-SemiBold',
          color: theme.textColor,
          textAlign: 'center',
          marginBottom: 4,
        }}
      >
        {title}
      </Text>
      <Text style={{ fontSize: sizes.sidebarTextFont, color: theme.unactiveTextColor, textAlign: 'center' }}>
        {text}
      </Text>
    </View>
  );

  const renderSuccess = () => (
    <View style={{ alignItems: 'center', paddingVertical: sizes.gap * 2 }}>
      <Image
        source={icons.checkDefault}
        style={{ width: sizes.headerIconSize * 1.5, height: sizes.headerIconSize * 1.5, marginBottom: sizes.gap }}
      />
      <Text
        style={{
          fontSize: sizes.titleFont,
          fontFamily: 'Rubik-Bold',
          color: theme.primaryColor,
          textAlign: 'center',
          marginBottom: sizes.smallGap,
        }}
      >
        {t('settings.modals.contact_us.success_title')}
      </Text>
      <Text style={{ fontSize: sizes.subtitleFont, color: theme.unactiveTextColor, textAlign: 'center' }}>
        {t('settings.modals.contact_us.success_message')}
      </Text>
    </View>
  );

  const renderForm = () => (
    <>
      {/* Header */}
      <View style={[row, { alignItems: 'center', marginBottom: sizes.gap * 1.5 }]}>
        <View
          style={{
            width: sizes.headerIconSize,
            height: sizes.headerIconSize,
            borderRadius: sizes.headerIconSize / 2,
            backgroundColor: theme.profileDefaultBackground,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: isRTL ? 0 : sizes.smallGap * 1.5,
            marginLeft: isRTL ? sizes.smallGap * 1.5 : 0,
          }}
        >
          <Ionicons name='chatbubbles' size={sizes.headerIconInner} color={theme.primaryColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: sizes.titleFont, fontFamily: 'Rubik-Bold', color: theme.textColor, textAlign }}>
            {t('settings.modals.contact_support.title')}
          </Text>
          <Text style={{ fontSize: sizes.subtitleFont, color: theme.unactiveTextColor, textAlign }}>
            {t('settings.modals.contact_support.subtitle')}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: isWebLandscape ? (isRTL ? 'row-reverse' : 'row') : 'column' }}>
        {/* Main column */}
        <View style={{ flex: isWebLandscape ? 2 : undefined, marginRight: isWebLandscape && !isRTL ? sizes.gap : 0, marginLeft: isWebLandscape && isRTL ? sizes.gap : 0 }}>
          {/* 1. Category */}
          <SectionLabel number={1} text={t('settings.modals.contact_support.category.label')} required />
          <CustomPicker
            options={categoryOptions}
            selectedValue={category}
            onValueChange={setCategory}
            isRTL={isRTL}
            containerStyle={{ width: '100%', marginBottom: sizes.smallGap / 2, height: sizes.inputHeight }}
          />
          <HelpText style={{ marginBottom: sizes.gap }}>
            {t('settings.modals.contact_support.category.help')}
          </HelpText>

          {/* 2. Subject */}
          <View style={[row, { justifyContent: 'space-between', marginBottom: sizes.smallGap / 2 }]}>
            <SectionLabel number={2} text={t('settings.modals.contact_support.subject.label')} required />
            <Text style={{ fontSize: sizes.counterFont, color: theme.unactiveTextColor }}>
              {subject.length} / {SUBJECT_MAX}
            </Text>
          </View>
          <View style={fieldBoxStyle()}>
            <CustomTextInput
              value={subject}
              onChangeText={(v) => {
                setSubject(v);
                if (errors.subject) setErrors((p) => ({ ...p, subject: null }));
              }}
              maxLength={SUBJECT_MAX}
              placeholder={t('settings.modals.contact_support.subject.placeholder')}
              placeholderTextColor={theme.formInputPlaceholderColor}
              style={{
                fontFamily: 'Rubik-Medium',
                fontSize: sizes.fieldFont,
                color: theme.textColor,
                textAlign,
                padding: 0,
                backgroundColor: 'transparent',
                borderWidth: 0,
                ...Platform.select({ web: { outlineStyle: 'none' } }),
              }}
            />
          </View>
          {!!errors.subject && (
            <Text style={{ fontSize: sizes.helpTextFont, color: theme.errorTextColor, textAlign, marginTop: 4 }}>
              {errors.subject}
            </Text>
          )}
          <View style={{ marginBottom: sizes.gap }} />

          {/* 3. Message */}
          <SectionLabel number={3} text={t('settings.modals.contact_support.message.label')} required />
          <View style={{ marginBottom: sizes.smallGap / 2 }} />
          <View style={fieldBoxStyle(sizes.textAreaHeight)}>
            <CustomTextInput
              value={message}
              onChangeText={(v) => {
                setMessage(v);
                if (errors.message) setErrors((p) => ({ ...p, message: null }));
              }}
              maxLength={MESSAGE_MAX}
              multiline
              placeholder={t('settings.modals.contact_support.message.placeholder')}
              placeholderTextColor={theme.formInputPlaceholderColor}
              style={{
                fontFamily: 'Rubik-Medium',
                fontSize: sizes.fieldFont,
                color: theme.textColor,
                textAlign,
                padding: 0,
                paddingTop: sizes.smallGap,
                backgroundColor: 'transparent',
                borderWidth: 0,
                height: '100%',
                ...Platform.select({ web: { outlineStyle: 'none' } }),
              }}
            />
          </View>
          {!!errors.message && (
            <Text style={{ fontSize: sizes.helpTextFont, color: theme.errorTextColor, textAlign, marginTop: 4 }}>
              {errors.message}
            </Text>
          )}
          <View style={[row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: sizes.gap }]}>
            <View style={[row, { alignItems: 'center', flex: 1 }]}>
              <Ionicons
                name='shield-checkmark-outline'
                size={14}
                color={theme.unactiveTextColor}
                style={{ marginRight: isRTL ? 0 : 4, marginLeft: isRTL ? 4 : 0 }}
              />
              <HelpText style={{ flex: 1 }}>
                {t('settings.modals.contact_support.message.privacy_hint')}
              </HelpText>
            </View>
            <Text style={{ fontSize: sizes.counterFont, color: theme.unactiveTextColor }}>
              {message.length} / {MESSAGE_MAX}
            </Text>
          </View>

          {/* 4. Contact method */}
          <SectionLabel number={4} text={t('settings.modals.contact_support.contact_method.title')} required />
          <HelpText style={{ marginBottom: sizes.gap }}>
            {t('settings.modals.contact_support.contact_method.subtitle')}
          </HelpText>

          {hasEmail && (
            <RadioRow
              selected={contactMethod === 'email'}
              onPress={() => setContactMethod('email')}
              icon='mail'
              iconColor={theme.primaryColor}
              iconBg={`${theme.primaryColor}1F`}
              title={t('settings.modals.contact_support.contact_method.email_option')}
              subtitle={maskEmail(displayEmail)}
            />
          )}
          <RadioRow
            selected={contactMethod === 'phone'}
            onPress={() => setContactMethod('phone')}
            icon='call'
            iconColor={theme.verifiedMarkerColor}
            iconBg={`${theme.verifiedMarkerColor}26`}
            title={t('settings.modals.contact_support.contact_method.phone_option')}
            subtitle={maskPhone(phoneNumber)}
            badge={t('settings.modals.contact_support.contact_method.recommended')}
          />
          {!hasEmail && (
            <>
              <View
                style={[
                  row,
                  {
                    alignItems: 'center',
                    height: sizes.radioRowHeight,
                    borderWidth: 1.5,
                    borderColor: theme.borderColor,
                    borderRadius: sizes.borderRadius / 1.5,
                    paddingHorizontal: sizes.smallGap * 1.5,
                    opacity: 0.6,
                  },
                ]}
              >
                <Ionicons name='radio-button-off' size={20} color={theme.unactiveTextColor} />
                <View
                  style={{
                    width: sizes.radioIconCircle,
                    height: sizes.radioIconCircle,
                    borderRadius: sizes.radioIconCircle / 2,
                    backgroundColor: theme.formInputBackground,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: sizes.smallGap,
                  }}
                >
                  <Ionicons name='mail-outline' size={sizes.radioIconInner} color={theme.unactiveTextColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: sizes.fieldFont, fontFamily: 'Rubik-Medium', color: theme.textColor, textAlign }}>
                    {t('settings.modals.contact_support.contact_method.email_missing_title')}
                  </Text>
                  <Text style={{ fontSize: sizes.helpTextFont, color: theme.unactiveTextColor, textAlign }}>
                    {t('settings.modals.contact_support.contact_method.email_missing_subtitle')}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  row,
                  {
                    alignItems: 'center',
                    backgroundColor: `${theme.primaryColor}0F`,
                    borderRadius: sizes.borderRadius / 1.5,
                    padding: sizes.smallGap * 1.5,
                    marginTop: sizes.smallGap,
                    marginBottom: sizes.smallGap,
                  },
                ]}
              >
                <Ionicons
                  name='sparkles'
                  size={18}
                  color={theme.primaryColor}
                  style={{ marginRight: isRTL ? 0 : sizes.smallGap, marginLeft: isRTL ? sizes.smallGap : 0 }}
                />
                <Text style={{ flex: 1, fontSize: sizes.helpTextFont, color: theme.unactiveTextColor, textAlign }}>
                  {t('settings.modals.contact_support.contact_method.email_missing_hint')}
                </Text>
                <TouchableOpacity
                  onPress={() => setUpdateEmailVisible(true)}
                  style={{
                    backgroundColor: theme.backgroundColor,
                    borderWidth: 1,
                    borderColor: theme.primaryColor,
                    borderRadius: sizes.borderRadius / 2,
                    paddingHorizontal: sizes.smallGap,
                    paddingVertical: 6,
                    marginLeft: isRTL ? 0 : sizes.smallGap,
                    marginRight: isRTL ? sizes.smallGap : 0,
                  }}
                >
                  <Text style={{ fontSize: sizes.helpTextFont, color: theme.primaryColor, fontFamily: 'Rubik-Medium' }}>
                    {t('settings.modals.contact_support.contact_method.add_email_button')}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={{ marginBottom: sizes.gap }} />

          {/* Preferred contact time */}
          <SectionLabel
            text={`${t('settings.modals.contact_support.preferred_time.label')} ${t('settings.modals.contact_support.preferred_time.optional')}`}
          />
          <HelpText style={{ marginBottom: sizes.smallGap }}>
            {t('settings.modals.contact_support.preferred_time.subtitle')}
          </HelpText>
          <CustomPicker
            options={timeOptions}
            selectedValue={preferredTime}
            onValueChange={setPreferredTime}
            isRTL={isRTL}
            bottomDropdown={false}
            containerStyle={{ width: '100%', marginBottom: sizes.gap, height: sizes.inputHeight }}
          />

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            style={[
              row,
              {
                height: sizes.submitHeight,
                borderRadius: sizes.borderRadius / 1.5,
                backgroundColor: theme.buttonColorPrimaryDefault,
                justifyContent: 'center',
                alignItems: 'center',
                opacity: submitting ? 0.7 : 1,
                marginBottom: sizes.smallGap,
              },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={theme.buttonTextColorPrimary} />
            ) : (
              <>
                <Ionicons
                  name='paper-plane'
                  size={18}
                  color={theme.buttonTextColorPrimary}
                  style={{ marginRight: isRTL ? 0 : sizes.smallGap, marginLeft: isRTL ? sizes.smallGap : 0 }}
                />
                <Text style={{ fontSize: sizes.submitFont, color: theme.buttonTextColorPrimary, fontFamily: 'Rubik-Medium' }}>
                  {t('settings.modals.contact_support.submit')}
                </Text>
              </>
            )}
          </TouchableOpacity>
          <View style={[row, { alignItems: 'center' }]}>
            <Ionicons
              name='lock-closed'
              size={13}
              color={theme.unactiveTextColor}
              style={{ marginRight: isRTL ? 0 : 4, marginLeft: isRTL ? 4 : 0 }}
            />
            <Text style={{ fontSize: sizes.secureNoteFont, color: theme.unactiveTextColor, textAlign, flex: 1 }}>
              {t('settings.modals.contact_support.secure_note')}
            </Text>
          </View>
        </View>

        {/* Sidebar */}
        {
          SHOW_SIDEBAR && (
            <View style={{ flex: isWebLandscape ? 1 : undefined, marginTop: isWebLandscape ? 0 : sizes.gap }}>
              <SidebarCard
                icon='headset'
                iconColor={theme.primaryColor}
                iconBg={`${theme.primaryColor}1F`}
                title={t('settings.modals.contact_support.sidebar.response_time_title')}
                text={t('settings.modals.contact_support.sidebar.response_time_text')}
              />
              <SidebarCard
                icon='shield-checkmark'
                iconColor={theme.verifiedMarkerColor}
                iconBg={`${theme.verifiedMarkerColor}26`}
                title={t('settings.modals.contact_support.sidebar.privacy_title')}
                text={t('settings.modals.contact_support.sidebar.privacy_text')}
              />
            </View>
          )
        }
      </View>
    </>
  );

  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={handleClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: sizes.modalWidth,
            maxHeight: sizes.modalMaxHeight,
            height: isWebLandscape ? undefined : '100%',
            backgroundColor: theme.backgroundColor,
            borderRadius: isWebLandscape ? sizes.borderRadius : 0,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: sizes.closeBtnPosition,
              right: sizes.closeBtnPosition,
              zIndex: 10,
            }}
            onPress={handleClose}
          >
            <Image
              source={icons.cross}
              style={{ width: sizes.closeIconSize, height: sizes.closeIconSize, tintColor: theme.textColor }}
            />
          </TouchableOpacity>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: sizes.paddingHorizontal,
              paddingVertical: sizes.paddingVertical,
            }}
            keyboardShouldPersistTaps='handled'
          >
            {showSuccess ? renderSuccess() : renderForm()}
          </ScrollView>
        </View>
      </View>

      <UpdateEmailModal
        visible={updateEmailVisible}
        onClose={() => setUpdateEmailVisible(false)}
        currentEmail={displayEmail}
        isEmailVerified={session.authUser?.emailVerified}
        onSave={() => { }}
        isLoading={false}
      />
    </Modal>
  );
}
