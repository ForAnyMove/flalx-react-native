import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Image,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../context/globalAppContext';
import { useWindowInfo } from '../context/windowContext';
import { BASE_DESIGN_HEIGHT, scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { icons } from '../constants/icons';
import { ACCESSIBILITY_HIT_SLOP } from '../constants/themes';
import AppHeading from '../components/ui/AppHeading';

/**
 * Screen displaying the official Accessibility Statement (הצהרת נגישות)
 * in compliance with Israeli Standard ת"י 5568 חלק 1 (September 2023 edition)
 * and Israeli Equal Rights for Persons with Disabilities Regulations (Clause 35).
 */
export default function AccessibilityStatementScreen({ onBack }) {
  const { t } = useTranslation();
  const { themeController, languageController } = useComponentContext();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;
  const { height, isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const sizes = useMemo(() => {
    const scale = (val, opts) => isWebLandscape
      ? scaleByHeight(val, height, BASE_DESIGN_HEIGHT, opts)
      : scaleByHeightMobile(val, height, opts);
    return {
      paddingH: isWebLandscape ? scale(32) : scale(16, { maxScale: 1.2 }),
      paddingTop: isWebLandscape ? scale(24) : scale(16, { maxScale: 1.2 }),
      headerHeight: scale(56, { maxScale: 1.2 }),
      titleSize: scale(22, { maxScale: 1.25 }),
      h2Size: scale(18, { maxScale: 1.25 }),
      bodySize: scale(15, { maxScale: 1.25 }),
      smallSize: scale(13, { maxScale: 1.25 }),
      iconSize: scale(22, { maxScale: 1.25 }),
      gap: scale(16, { maxScale: 1.2 }),
      blockMargin: scale(20, { maxScale: 1.2 }),
      cardRadius: scale(8),
      linkMarginTop: scale(8, { maxScale: 1.2 }),
      bulletSize: scale(18, { maxScale: 1.25 }),
      lastUpdatedMarginTop: scale(10, { maxScale: 1.2 }),
    };
  }, [height, isWebLandscape]);

  const handleEmailPress = () => {
    const email = t('accessibility.coordinatorEmail', { defaultValue: 'accessibility@flalx.com' });
    Linking.openURL(`mailto:${email}?subject=Accessibility Inquiry`);
  };

  const handlePhonePress = () => {
    const phone = t('accessibility.coordinatorPhone', { defaultValue: '+972-50-0000000' });
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.backgroundColor }]}>
      {/* Top Bar */}
      <View
        style={[
          styles.topBar,
          {
            paddingHorizontal: sizes.paddingH,
            height: sizes.headerHeight,
            borderBottomColor: theme.borderColor,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}
      >
        <TouchableOpacity
          onPress={onBack}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t('common.back', { defaultValue: 'חזרה' })}
          hitSlop={ACCESSIBILITY_HIT_SLOP}
          style={styles.backButton}
        >
          <Image
            source={isRTL ? icons.forward : icons.back}
            accessible={false}
            aria-hidden={true}
            style={{
              width: sizes.iconSize,
              height: sizes.iconSize,
              tintColor: theme.textColor,
            }}
          />
        </TouchableOpacity>

        <AppHeading
          level={1}
          style={[
            styles.headerTitle,
            {
              color: theme.textColor,
              fontSize: sizes.titleSize,
              textAlign: isRTL ? 'right' : 'left',
            },
          ]}
        >
          {t('accessibility.statementTitle', { defaultValue: 'הצהרת נגישות' })}
        </AppHeading>
        <View style={{ width: sizes.iconSize }} />
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: sizes.paddingH,
            paddingTop: sizes.paddingTop,
            paddingBottom: sizes.blockMargin * 2,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Subtitle / Intro */}
        <Text
          style={[
            styles.subtitle,
            {
              color: theme.unactiveTextColor,
              fontSize: sizes.bodySize,
              textAlign: isRTL ? 'right' : 'left',
              marginBottom: sizes.gap,
            },
          ]}
        >
          {t('accessibility.statementSubtitle')}
        </Text>

        <Text
          style={[
            styles.paragraph,
            {
              color: theme.textColor,
              fontSize: sizes.bodySize,
              textAlign: isRTL ? 'right' : 'left',
              marginBottom: sizes.blockMargin,
            },
          ]}
        >
          {t('accessibility.complianceIntro')}
        </Text>

        {/* Standard Info Box */}
        <View
          style={[
            styles.cardBox,
            {
              backgroundColor: theme.profileDefaultBackground || '#F0F0FA',
              borderRadius: sizes.cardRadius,
              padding: sizes.gap,
              marginBottom: sizes.blockMargin,
            },
          ]}
        >
          <Text
            style={[
              styles.standardText,
              {
                color: theme.textColor,
                fontSize: sizes.bodySize,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
          >
            {t('accessibility.complianceStandard')}
          </Text>
        </View>

        {/* Accommodations List */}
        <AppHeading
          level={2}
          style={[
            styles.sectionHeading,
            {
              color: theme.textColor,
              fontSize: sizes.h2Size,
              textAlign: isRTL ? 'right' : 'left',
              marginBottom: sizes.gap,
            },
          ]}
        >
          {t('accessibility.featuresTitle', { defaultValue: 'התאמות הנגישות שבוצעו' })}
        </AppHeading>

        <View style={{ marginBottom: sizes.blockMargin, gap: sizes.gap / 2 }}>
          <View style={[styles.bulletRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.bullet, { color: theme.primaryColor, fontSize: sizes.bulletSize }]}>• </Text>
            <Text
              style={[
                styles.bulletText,
                { color: theme.textColor, fontSize: sizes.bodySize, textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {t('accessibility.featureHeadings')}
            </Text>
          </View>

          <View style={[styles.bulletRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.bullet, { color: theme.primaryColor, fontSize: sizes.bulletSize }]}>• </Text>
            <Text
              style={[
                styles.bulletText,
                { color: theme.textColor, fontSize: sizes.bodySize, textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {t('accessibility.featureScreenReaders')}
            </Text>
          </View>

          <View style={[styles.bulletRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.bullet, { color: theme.primaryColor, fontSize: sizes.bulletSize }]}>• </Text>
            <Text
              style={[
                styles.bulletText,
                { color: theme.textColor, fontSize: sizes.bodySize, textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {t('accessibility.featureContrast')}
            </Text>
          </View>

          <View style={[styles.bulletRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.bullet, { color: theme.primaryColor, fontSize: sizes.bulletSize }]}>• </Text>
            <Text
              style={[
                styles.bulletText,
                { color: theme.textColor, fontSize: sizes.bodySize, textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {t('accessibility.featureTouch')}
            </Text>
          </View>
        </View>

        {/* Accessibility Coordinator Section */}
        <AppHeading
          level={2}
          style={[
            styles.sectionHeading,
            {
              color: theme.textColor,
              fontSize: sizes.h2Size,
              textAlign: isRTL ? 'right' : 'left',
              marginBottom: sizes.gap,
            },
          ]}
        >
          {t('accessibility.coordinatorTitle', { defaultValue: 'פרטי רכז הנגישות' })}
        </AppHeading>

        <Text
          style={[
            styles.paragraph,
            {
              color: theme.textColor,
              fontSize: sizes.bodySize,
              textAlign: isRTL ? 'right' : 'left',
              marginBottom: sizes.gap,
            },
          ]}
        >
          {t('accessibility.requestsNotice')}
        </Text>

        <View
          style={[
            styles.contactCard,
            {
              borderColor: theme.borderColor,
              borderRadius: sizes.cardRadius,
              padding: sizes.gap,
              marginBottom: sizes.blockMargin,
            },
          ]}
        >
          <Text
            style={[
              styles.contactName,
              { color: theme.textColor, fontSize: sizes.bodySize, textAlign: isRTL ? 'right' : 'left' },
            ]}
          >
            {t('accessibility.coordinatorName')}
          </Text>

          <TouchableOpacity
            onPress={handleEmailPress}
            accessible={true}
            accessibilityRole="link"
            accessibilityLabel={`Email: ${t('accessibility.coordinatorEmail')}`}
            style={{ marginTop: sizes.linkMarginTop }}
          >
            <Text style={[styles.linkText, { color: theme.primaryColor, fontSize: sizes.bodySize, textAlign: isRTL ? 'right' : 'left' }]}>
              {t('accessibility.coordinatorEmail')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePhonePress}
            accessible={true}
            accessibilityRole="link"
            accessibilityLabel={`Phone: ${t('accessibility.coordinatorPhone')}`}
            style={{ marginTop: sizes.linkMarginTop }}
          >
            <Text style={[styles.linkText, { color: theme.primaryColor, fontSize: sizes.bodySize, textAlign: isRTL ? 'right' : 'left' }]}>
              {t('accessibility.coordinatorPhone')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Last updated */}
        <Text
          style={[
            styles.lastUpdated,
            {
              color: theme.unactiveTextColor,
              fontSize: sizes.smallSize,
              textAlign: isRTL ? 'right' : 'left',
              marginTop: sizes.lastUpdatedMarginTop,
            },
          ]}
        >
          {t('accessibility.lastUpdated')}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  backButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Rubik-Bold',
    fontWeight: 'bold',
  },
  scrollContent: {
    flexGrow: 1,
  },
  subtitle: {
    fontFamily: 'Rubik-Medium',
  },
  paragraph: {
    fontFamily: 'Rubik-Regular',
  },
  cardBox: {
    borderLeftWidth: 4,
    borderLeftColor: '#0A62EA',
  },
  standardText: {
    fontFamily: 'Rubik-Medium',
  },
  sectionHeading: {
    fontFamily: 'Rubik-Bold',
    fontWeight: 'bold',
  },
  bulletRow: {
    alignItems: 'flex-start',
  },
  bullet: {
    fontWeight: 'bold',
  },
  bulletText: {
    flex: 1,
    fontFamily: 'Rubik-Regular',
  },
  contactCard: {
    borderWidth: 1,
  },
  contactName: {
    fontFamily: 'Rubik-Bold',
    fontWeight: 'bold',
  },
  linkText: {
    fontFamily: 'Rubik-Medium',
    textDecorationLine: 'underline',
  },
  lastUpdated: {
    fontFamily: 'Rubik-Regular',
    fontStyle: 'italic',
  },
});
