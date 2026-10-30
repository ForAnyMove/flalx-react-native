# Полное руководство по доступности (Accessibility) в React Native и React Native Web: Роли, Лейблы, Состояния и Атрибуты

Настоящее руководство составлено для разработчиков и QA проекта **FlalxRN** в соответствии со стандартом Израиля **ת"י 5568 חלק 1 (מהדורת ספטמבר 2023)** и международным стандартом **W3C WCAG 2.0 (Level AA)**.

---

## 1. Концепция: как скринридеры воспринимают приложение

Когда человек с нарушением зрения или моторики пользуется приложением, он не взаимодействует с графическими пикселями напрямую. Операционная система (iOS, Android, браузер) строит параллельное виртуальное дерево — **Accessibility Tree (Дерево доступности)**.

Вспомогательные технологии (Assistive Technologies):
- **iOS / macOS:** VoiceOver;
- **Android:** TalkBack;
- **Web (Windows / Mac):** NVDA, JAWS, VoiceOver, ChromeVox, Narrator.

Скринридер перемещается по узлам дерева доступности и синтезирует речь по стандартной грамматической формуле:
$$\text{[Лейбл / Имя]} + \text{[Роль / Тип]} + \text{[Состояние]} + \text{[Подсказка]}$$

> **Пример синтеза речи:**
> - Пользователь слышит: *«סגור, כפתור»* («Закрыть, кнопка»)
> - Или: *«התראות, כרטיסייה, נבחר, 1 מתוך 4»* («Уведомления, вкладка, выбрано, 1 из 4»)
> - Или: *«אימות דו-שלבי, מתג, מופעל»* («Двухфакторная аутентификация, переключатель, включен»)

Если разработчик не настроил роли и лейблы, скринридер прочитает либо невнятное техническое имя файла (`«image_cross_3x, кнопка»`), либо просто промолчит (`«элемент без метки»`), сделав интерфейс полностью непроходимым.

---

## 2. Фундаментальный флаг: `accessible`

### Что это такое
Проп `accessible={true | false}` сообщает движку React Native, должен ли данный компонент быть отдельным интерактивным узлом в дереве доступности.

### Правило 1: Группировка (Accessibility Grouping)
По умолчанию в React Native компоненты `<TouchableOpacity>`, `<TouchableHighlight>`, `<Pressable>` уже имеют `accessible={true}`.
Когда контейнер помечен `accessible={true}`, **все его внутренние дочерние текстовые узлы склеиваются в один читаемый узел**:

```jsx
// Скринридер прочитает ВСЁ за один шаг: "ישראל ישראלי, שרברב מוסמך"
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="ישראל ישראלי, שרברב מוסמך"
>
  <Image source={{ uri: avatar }} />
  <Text>ישראל ישראלי</Text>
  <Text>שרברב מוסמך</Text>
</TouchableOpacity>
```

### Правило 2: Исключение контейнеров из зацикливания (`accessible={false}`)
Если вы делаете сложную обертку, внутри которой находятся независимые интерактивные поля ввода и кнопки, контейнер **НЕ ДОЛЖЕН** быть `accessible={true}`, иначе скринридер «схлопнет» всё содержимое и заблокирует доступ к внутренним кнопкам:

```jsx
// Внешняя подложка или разделитель
<View accessible={false}>
  <CustomTextInput label="אימייל" />
  <TouchableOpacity accessibilityRole="button">
    <Text>שלח</Text>
  </TouchableOpacity>
</View>
```

---

## 3. Роли элементов: `accessibilityRole` и `role`

Роль сообщает скринридеру, **что это за элемент** и **какие жесты к нему применимы** (нажать, переключить, выбрать, перейти по ссылке).

В современных версиях React Native (0.70+) и React Native Web поддерживаются два пропа:
1. `accessibilityRole` — классический нативный проп React Native.
2. `role` — стандартный проп веб-спецификации W3C WAI-ARIA.
*Рекомендуется использовать оба или `accessibilityRole`, так как React Native Web автоматически транслирует их в корректные HTML-теги и ARIA-атрибуты.*

### Сводная таблица ролей

| Значение `accessibilityRole` | WAI-ARIA `role` | HTML-тег в Web (RNW) | Озвучка VoiceOver (iOS) | Озвучка TalkBack (Android) | Когда использовать |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `button` | `button` | `<button>` или `<div role="button">` | «כפתור» (*Кнопка*) | «כפתור» (*Кнопка*) | Любые кликабельные кнопки, иконки действий, крестики закрытия |
| `header` | `heading` | `<h1>`–`<h6>` *(при наличии aria-level)* | «כותרת» (*Заголовок*) | «כותרת» (*Заголовок*) | Семантические заголовки страниц, разделов, модальных окон |
| `link` | `link` | `<a href="...">` | «קישור» (*Ссылка*) | «קישור» (*Ссылка*) | Переходы на внешние URL, переходы между экранами/политиками |
| `switch` | `switch` | `<div role="switch">` | «מתג» (*Переключатель*) | «מתג» (*Переключатель*) | Тумблеры включения/выключения настроек |
| `checkbox` | `checkbox` | `<input type="checkbox">` | «תיבת סימון» (*Флажок*) | «תיבת סימון» (*Флажок*) | Чекбоксы согласия, фильтры выбора категорий |
| `radio` | `radio` | `<input type="radio">` | «כפתור בחירה» (*Радиокнопка*) | «לחצן אפשרויות» | Выбор одного варианта из группы |
| `tab` | `tab` | `<div role="tab">` | «כרטיסייה» (*Вкладка*) | «כרטיסייה» (*Вкладка*) | Верхние вкладки навигации по статусам заявок, каталог |
| `tablist` | `tablist` | `<div role="tablist">` | — | — | Контейнер, объединяющий группу вкладок `tab` |
| `combobox` | `combobox` | `<div role="combobox">` | «תיבת בחירה» (*Выпадающий список*) | «רשימה נפתחת» | Дропдауны выбора языков, опыта, категорий |
| `menuitem` | `menuitem` | `<div role="menuitem">` | «פריט תפריט» | «פריט תפריט» | Элементы внутри раскрытого списка/меню |
| `search` | `search` | `<input type="search">` | «חיפוש» (*Поиск*) | «שדה חיפוש» | Строка поиска услуг или адресов |
| `image` | `img` | `<img>` | «תמונה» (*Изображение*) | «תמונה» (*Изображение*) | Смысловые фотографии (фото работ мастера, аватар) |
| `alert` | `alert` | `<div role="alert">` | Моментальный перехват фокуса | Сообщение о тревоге | Критические ошибки, баннеры сбоя сети |
| `summary` | — | — | «סיכום» (*Сводка*) | «סיכום» | Сводные блоки информации о заказе/мастере |
| `none` / `presentation` | `presentation` | `<div role="presentation">` | Полное игнорирование | Полное игнорирование | Декоративные рамки, фоновые подложки |

---

## 4. Заголовки и израильский регламент 2.4.10: `AppHeading`

В соответствии со стандартом **ת"י 5568 חלק 1 (מהדורת ספטמבר 2023)** пункт **2.4.10 (Section Headings)** ужесточен с уровня AAA до уровня **AA**:
> *«בכל דף רשת שיש בו תוכן טקסטואלי בעל מבנה הייררכי, יצוינו הכותרות בתגית "H".»*  
> *(На любой странице, имеющей иерархическую структуру текста, заголовки обязаны быть размечены тегом "H")*

В приложении создан и используется специальный компонент:
[components/ui/AppHeading.jsx](file:///d:/Portfolio/React%20Native%20Flalx%20(electric)/flalx-react-native-app/FlalxRN/components/ui/AppHeading.jsx)

### Как он работает под капотом:
```jsx
export const AppHeading = ({ level = 1, style, children, ...props }) => {
  const safeLevel = Math.min(Math.max(Number(level) || 1, 1), 6);

  return (
    <Text
      {...props}
      accessibilityRole="header"      // Нативно для iOS VoiceOver и Android TalkBack
      accessibilityLevel={safeLevel}  // Уровень для доступности
      role="heading"                  // ARIA role для Web
      aria-level={safeLevel}          // React Native Web преобразует это в <h1>...<h6>
      style={style}
    >
      {children}
    </Text>
  );
};
```

### Иерархия уровней в приложении FlalxRN:
- **`level={1}` (`<h1>`):** Главный заголовок экрана или логотип бренда.
  *Примеры:* Логотип `FLALX` в шапке, заголовок экрана авторизации `«התחברות»`, заголовок Декларации `«הצהרת נגישות»`.
- **`level={2}` (`<h2>`):** Заголовки модальных диалогов, крупных смысловых секций.
  *Примеры:* Заголовок диалога `ConfirmModal`, раздел `«אבטחה»` (Безопасность) в профиле, заголовки шагов публикации.
- **`level={3}` (`<h3>`):** Подзаголовки карточек, подсекции настроек, плашки уведомлений.
  *Примеры:* Название карточки услуги, карточка отмененной заявки, блок `«אימות דו-שלבי»` (MFA).

---

## 5. Система текстовых меток: `accessibilityLabel`

### Главное золотое правило
> **НИКОГДА не пишите тип/роль элемента в `accessibilityLabel`!**

- **НЕПРАВИЛЬНО:**
  ```jsx
  // Скринридер прочитает: "כפתור סגור, כפתור" (дублирование!)
  <TouchableOpacity accessibilityLabel="כפתור סגור" accessibilityRole="button" />
  ```
- **ПРАВИЛЬНО:**
  ```jsx
  // Скринридер прочитает: "סגור, כפתור"
  <TouchableOpacity accessibilityLabel="סגור" accessibilityRole="button" />
  ```

### Иконки без текста (Icon-only buttons)
Любая кнопка, содержащая только картинку или SVG (крестик, шестеренка, лупа, стрелка), **ОБЯЗАНА** иметь понятный `accessibilityLabel`:

```jsx
// Крестик закрытия
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel={t('common.close', 'סגור')}
  hitSlop={ACCESSIBILITY_HIT_SLOP}
  onPress={onClose}
>
  <Image source={icons.cross} accessible={false} aria-hidden={true} />
</TouchableOpacity>

// Кнопка поиска
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel={t('common.search', 'חיפוש')}
  onPress={handleSearch}
>
  <Image source={icons.search} accessible={false} aria-hidden={true} />
</TouchableOpacity>

// Плавающая кнопка создания заявки (+)
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel={t('common.create_request', 'צור בקשה')}
  hitSlop={ACCESSIBILITY_HIT_SLOP}
  onPress={openCreateModal}
>
  <Image source={icons.plus} accessible={false} aria-hidden={true} />
</TouchableOpacity>
```

---

## 6. Сокрытие декоративных элементов: `aria-hidden` и `accessible={false}`

Если иконка является чисто декоративной (например, стрелочка рядом с текстом «המשך» или галочка рядом со словом «נשמר»), она **НЕ ДОЛЖНА** озвучиваться отдельно, чтобы не замусоривать восприятие незрячего пользователя.

```jsx
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="המשך לשלב הבא"
>
  <Text>המשך</Text>
  {/* Стрелочка чисто декоративная — скрываем её */}
  <Image
    source={icons.arrowRight}
    accessible={false}
    aria-hidden={true}
    importantForAccessibility="no"
  />
</TouchableOpacity>
```

Свойства сокрытия:
- `accessible={false}` — для нативного дерева доступности React Native.
- `aria-hidden={true}` — для веб-платформы (React Native Web).
- `importantForAccessibility="no"` — специфично для Android TalkBack (исключает узел из иерархии).

---

## 7. Состояния элементов: `accessibilityState`

Скринридер должен сообщать пользователю не только название кнопки, но и её текущее состояние.

```jsx
accessibilityState={{
  disabled?: boolean,   // Элемент недоступен для нажатия
  selected?: boolean,   // Вкладка или пункт списка выбран
  checked?: boolean | 'mixed', // Чекбокс отмечен / свитч включен
  busy?: boolean,       // Элемент обновляется (например, идет сетевой запрос)
  expanded?: boolean,   // Выпадающее меню или аккордеон раскрыт
}}
```

### Примеры из FlalxRN:

#### 1. Вкладки статусов заявок (`Jobs.jsx`, `Store.jsx`)
```jsx
<TouchableOpacity
  accessibilityRole="tab"
  accessibilityState={{ selected: activeTab === 'waiting' }}
  accessibilityLabel={t('tabs.business_waiting')}
  onPress={() => handleTabPress('waiting')}
>
  <Text>{t('tabs.business_waiting')}</Text>
</TouchableOpacity>
```
*Скринридер озвучит:* «ממתין, כרטיסייה, נבחר» или «ממתין, כרטיסייה».

#### 2. Переключатель (`CustomSwitch.jsx`)
```jsx
<TouchableOpacity
  accessible={true}
  accessibilityRole="switch"
  accessibilityState={{ checked: isEnabled }}
  accessibilityLabel={label}
  onPress={() => onValueChange(!isEnabled)}
>
  {/* visual switch */}
</TouchableOpacity>
```
*Скринридер озвучит:* «התראות פוש, מתג, מופעל» («Push-уведомления, переключатель, включен»).

#### 3. Выпадающий список (`CustomPicker.jsx`)
```jsx
<TouchableOpacity
  accessible={true}
  accessibilityRole="combobox"
  accessibilityState={{ expanded: isDropdownOpen }}
  accessibilityLabel="בחירת שפה: עברית"
  aria-expanded={isDropdownOpen}
  aria-haspopup="listbox"
  onPress={toggleDropdown}
>
  {/* visual picker */}
</TouchableOpacity>
```
*Скринридер озвучит:* «בחירת שפה: עברית, תיבת בחירה, מורחב / מכווץ» («Выбор языка: иврит, комбобокс, раскрыто / свернуто»).

---

## 8. Модальные окна и экраны: `accessibilityViewIsModal` и `aria-modal`

### Проблема «просачивания» фокуса
Без специальных настроек пользователь скринридера, открыв модальное окно, продолжит смахиванием пальца попадать на кнопки страницы, находящиеся **ПОД** модальным окном.

### Решение
Во всех модальных контейнерах (`AppModal`, `JobModalWrapper`, `BaseActionModal`):

```jsx
<View
  accessibilityViewIsModal={true} // Критично для iOS VoiceOver: изолирует жесты внутри окна
  role="dialog"                   // ARIA role для Web
  aria-modal="true"               // Блокирует доступ к элементам фона в Web
>
  {/* Контент модального окна */}
</View>
```

Если модальное окно является подтверждением опасного действия (удаление, выход без сохранения, подтверждение платежа), используется роль `alertdialog`:
```jsx
<View
  accessibilityViewIsModal={true}
  role="alertdialog"
  aria-modal="true"
>
  <AppHeading level={2}>האם אתה בטוח?</AppHeading>
</View>
```

---

## 9. Динамические зоны и сообщения об ошибках: `accessibilityLiveRegion`

Когда на экране динамически появляется ошибка валидации или статусная плашка, скринридер должен автоматически зачитать этот текст вслух, даже если фокус пользователя находится в другом месте:

```jsx
<View
  accessibilityLiveRegion="polite" // Озвучит сразу после завершения текущей фразы
  aria-live="polite"
>
  {errorMessage && (
    <Text style={{ color: theme.errorTextColor }}>
      {errorMessage}
    </Text>
  )}
</View>
```

Режимы `accessibilityLiveRegion` / `aria-live`:
- `none`: не озвучивать изменения автоматически.
- `polite`: дождаться паузы в речи диктора и вежливо прочитать изменение (рекомендуется для 95% случаев).
- `assertive`: мгновенно прервать любую речь диктора (только для критических предупреждений и тревог).

---

## 10. Минимальная область нажатия: `hitSlop` и правило 44×44 pt

Стандарты WCAG (Критерий 2.5.5 / 2.5.8) и правила мобильных платформ требуют, чтобы область нажатия любого интерактивного элемента составляла **не менее 44×44 pt (пикселей)**.

Если дизайнер нарисовал визуальную иконку размером 16×16 или 20×20 px, физическая область тапа расширяется с помощью глобальной константы из [constants/themes.js](file:///d:/Portfolio/React%20Native%20Flalx%20(electric)/flalx-react-native-app/FlalxRN/constants/themes.js):

```jsx
import { ACCESSIBILITY_HIT_SLOP } from '../constants/themes';
// ACCESSIBILITY_HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 }

<TouchableOpacity
  hitSlop={ACCESSIBILITY_HIT_SLOP}
  accessibilityRole="button"
  accessibilityLabel={t('common.close')}
  onPress={onClose}
>
  <Image source={icons.cross} style={{ width: 20, height: 20 }} />
</TouchableOpacity>
```

---

## 11. Памятка разработчику: Чек-лист перед коммитом любого компонента

Перед сдачей любого нового экрана или UI-компонента проверьте 7 ключевых вопросов:

- [ ] **1. Заголовки:** Размечен ли главный заголовок через `<AppHeading level={1}>`, секции через `<AppHeading level={2}>`, карточки через `<AppHeading level={3}>`?
- [ ] **2. Иконки без текста:** Есть ли у каждого крестика, плюсика, стрелки и лупы явный `accessibilityLabel` на иврите/английском?
- [ ] **3. Декоративные элементы:** Добавлены ли `accessible={false}` и `aria-hidden={true}` на фоновые картинки и декоративные стрелки?
- [ ] **4. Роли кнопок:** Прописаны ли `accessibilityRole="button"` на кликабельных `TouchableOpacity` / `Pressable`?
- [ ] **5. Состояния:** Передаются ли `accessibilityState={{ selected, checked, disabled, expanded }}` для табов, свитчей и списков?
- [ ] **6. Модальные окна:** Заданы ли `accessibilityViewIsModal={true}` и `aria-modal="true"` для всех оверлеев?
- [ ] **7. Область касания:** Задан ли `hitSlop={ACCESSIBILITY_HIT_SLOP}` для небольших иконок (< 44 pt)?
