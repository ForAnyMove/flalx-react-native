import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';
import { logError } from '../utils/log_util';

const GEOLOCATION_ENABLED_KEY = '@geolocation_enabled';
const IP_GEOLOCATION_ENABLED_KEY = '@ip_geolocation_enabled';

export const useGeolocation = () => {
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [enabled, setEnabled] = useState(false); // По умолчанию выключена
    const [ipGeolocationEnabled, setIpGeolocationEnabled] = useState(null); // null = не спрашивали, false = отказался, true = разрешил
    const [isInitialized, setIsInitialized] = useState(false);
    const [dialog, setDialog] = useState(null); // {message, buttons: [{title, onPress}]}

    // Проверка разрешений (объявляем первой, так как используется в других функциях)
    const checkPermissions = useCallback(async () => {
        if (Platform.OS === 'web') {
            if (!navigator.geolocation) {
                return false;
            }

            // Проверяем текущий статус разрешения
            if ('permissions' in navigator) {
                try {
                    const permission = await navigator.permissions.query({ name: 'geolocation' });
                    if (permission.state === 'granted') {
                        return true;
                    } else if (permission.state === 'denied') {
                        return false;
                    }
                    // Если статус 'prompt', делаем пробный запрос
                } catch (err) {
                }
            }

            // Делаем пробный запрос для проверки разрешений
            return new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    () => {
                        resolve(true);
                    },
                    (error) => {
                        if (error.code === error.PERMISSION_DENIED) {
                            resolve(false);
                        } else {
                            // Другие ошибки (например, таймаут) не означают отсутствие разрешения
                            resolve(true);
                        }
                    },
                    {
                        enableHighAccuracy: false,
                        timeout: 5000,
                        maximumAge: 300000, // 5 минут
                    }
                );
            });
        }

        try {
            const hasPermission = await Geolocation.requestAuthorization('whenInUse');
            return hasPermission === 'granted';
        } catch (err) {
            logError('Permission error:', err);
            return false;
        }
    }, []);

    // Проверка доступности геолокации (без запроса разрешений)
    const checkGeolocationAvailability = useCallback(async () => {
        if (Platform.OS === 'web') {
            return 'geolocation' in navigator;
        } else {
            // На мобильных платформах просто проверяем что библиотека доступна
            return true;
        }
    }, []);

    // Загрузка настройки из AsyncStorage
    const loadSettings = useCallback(async () => {
        try {
            const storedEnabled = await AsyncStorage.getItem(GEOLOCATION_ENABLED_KEY);
            const storedIpEnabled = await AsyncStorage.getItem(IP_GEOLOCATION_ENABLED_KEY);

            if (storedEnabled !== null) {
                // Если настройка сохранена, используем её
                setEnabled(JSON.parse(storedEnabled));
            } else {
                // Первый запуск - проверяем доступность геолокации
                const isAvailable = await checkGeolocationAvailability();
                if (isAvailable) {
                    // Если геолокация доступна, оставляем выключенной
                    // Пользователь сам включит при необходимости
                    setEnabled(false);
                    await AsyncStorage.setItem(GEOLOCATION_ENABLED_KEY, JSON.stringify(false));
                } else {
                    // Если геолокация недоступна, оставляем выключенной
                    setEnabled(false);
                }
            }

            // Загружаем настройку IP геолокации (только согласие, не отказ)
            if (storedIpEnabled !== null && JSON.parse(storedIpEnabled) === true) {
                setIpGeolocationEnabled(true); // Только если раньше разрешил
            } else {
                setIpGeolocationEnabled(null); // Сбрасываем при каждом запуске
            }
        } catch (error) {
            logInfo('Error loading geolocation settings:', error);
            setEnabled(false);
            setIpGeolocationEnabled(null);
        } finally {
            setIsInitialized(true);
        }
    }, [checkGeolocationAvailability]);

    // Сохранение настройки в AsyncStorage
    const saveSettings = useCallback(async (isEnabled) => {
        try {
            await AsyncStorage.setItem(GEOLOCATION_ENABLED_KEY, JSON.stringify(isEnabled));
        } catch (error) {
            logInfo('Error saving geolocation settings:', error);
        }
    }, []);

    // Сохранение настройки IP геолокации (только согласие)
    const saveIpGeolocationSettings = useCallback(async (isEnabled) => {
        try {
            // Сохраняем только согласие, отказ не сохраняем
            if (isEnabled) {
                await AsyncStorage.setItem(IP_GEOLOCATION_ENABLED_KEY, JSON.stringify(true));
            }
            setIpGeolocationEnabled(isEnabled);
        } catch (error) {
            logInfo('Error saving IP geolocation settings:', error);
        }
    }, []);

    // Запрос разрешения на IP геолокацию
    const requestIpGeolocationPermission = useCallback(async () => {
        return new Promise((resolve) => {
            const dialogData = {
                message: 'Точное местоположение недоступно.\n\nРазрешить определение приблизительного местоположения по IP-адресу?\n\n• Точность: ~10-50км (город/регион)\n• Данные: только координаты и город\n• Конфиденциальность: IP-адрес передается внешнему сервису\n\nВы сможете изменить это решение в настройках.',
                buttons: [
                    {
                        key: 'deny',
                        title: 'Отказаться',
                        onPress: () => {
                            resolve(false);
                        }
                    },
                    {
                        key: 'allow',
                        title: 'Разрешить',
                        onPress: () => {
                            resolve(true);
                        }
                    }
                ]
            };

            setDialog(dialogData);
        });
    }, []);

    // Переключение настройки геолокации
    const toggleGeolocation = useCallback(async () => {
        const newEnabled = !enabled;

        if (newEnabled) {
            // При включении сначала проверяем разрешения
            try {
                const hasPermission = await checkPermissions();
                if (hasPermission) {
                    setEnabled(true);
                    await saveSettings(true);

                    // Получаем текущую позицию для проверки
                    try {
                        const position = await getCurrentLocationDirect();
                        // console.log('Текущая позиция:', {
                        //     latitude: position.latitude,
                        //     longitude: position.longitude,
                        //     accuracy: position.accuracy + 'm'
                        // });
                    } catch (locationError) {
                        // Выключаем геолокацию если не удалось получить позицию
                        setEnabled(false);
                        await saveSettings(false);
                        setError('Не удалось получить местоположение: ' + locationError.message);
                    }
                } else {
                    const errorMessage = 'Доступ к геолокации заблокирован. Для включения геолокации разрешите доступ в настройках браузера или перезагрузите страницу и выберите "Разрешить" при запросе.';
                    setError(errorMessage);
                    // Не включаем геолокацию без разрешения
                }
            } catch (err) {
                setError('Ошибка проверки разрешений: ' + err.message);
            }
        } else {
            // При отключении просто выключаем
            setEnabled(false);
            await saveSettings(false);
            // Очищаем текущее местоположение
            setLocation(null);
            setError(null);
        }
    }, [enabled, saveSettings, checkPermissions]);

    // Установка настройки геолокации
    const setGeolocationEnabled = useCallback(async (isEnabled) => {
        if (isEnabled) {
            // При включении проверяем разрешения
            try {
                const hasPermission = await checkPermissions();
                if (hasPermission) {
                    setEnabled(true);
                    await saveSettings(true);

                    // Получаем текущую позицию для проверки
                    try {
                        const position = await getCurrentLocationDirect();
                        // console.log('Текущая позиция:', {
                        //     latitude: position.latitude,
                        //     longitude: position.longitude,
                        //     accuracy: position.accuracy + 'm'
                        // });
                    } catch (locationError) {
                        // Выключаем геолокацию если не удалось получить позицию
                        setEnabled(false);
                        await saveSettings(false);
                        setError('Не удалось получить местоположение: ' + locationError.message);
                        throw locationError; // Пробрасываем ошибку для setGeolocationEnabled
                    }
                } else {
                    const errorMessage = 'Доступ к геолокации заблокирован. Для включения геолокации разрешите доступ в настройках браузера или перезагрузите страницу и выберите "Разрешить" при запросе.';
                    setError(errorMessage);
                    throw new Error('Нет разрешения на доступ к геолокации');
                }
            } catch (err) {
                setError('Ошибка проверки разрешений: ' + err.message);
                throw err;
            }
        } else {
            // При отключении
            setEnabled(false);
            await saveSettings(false);
            setLocation(null);
            setError(null);
        }
    }, [saveSettings, checkPermissions]);

    // Инициализация настроек при загрузке хука
    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // Получение позиции через IP (резервный метод)
    const getLocationByIP = useCallback(async () => {
        // console.log('🌐 Пробуем определить местоположение по IP...');
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();

            if (data.latitude && data.longitude) {
                const coords = {
                    latitude: parseFloat(data.latitude),
                    longitude: parseFloat(data.longitude),
                    accuracy: 10000, // Низкая точность для IP геолокации
                    timestamp: Date.now(),
                    source: 'ip',
                    city: data.city,
                    country: data.country_name
                };
                // console.log('✅ Местоположение по IP получено:', {
                //     city: coords.city,
                //     country: coords.country,
                //     latitude: coords.latitude,
                //     longitude: coords.longitude,
                //     accuracy: coords.accuracy + 'м (примерное)'
                // });
                return coords;
            } else {
                throw new Error('Не удалось получить координаты по IP');
            }
        } catch (error) {
            // console.log('❌ Ошибка определения по IP:', error.message);
            throw error;
        }
    }, []);

    // Получение позиции с определенными настройками
    const getPositionWithOptions = useCallback((options, attemptName) => {
        // console.log(`🎯 Попытка: ${attemptName}`);
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp,
                        source: 'gps'
                    };
                    // console.log(`✅ ${attemptName} успешна! Точность: ${coords.accuracy}м`);
                    resolve(coords);
                },
                (error) => {
                    // console.log(`❌ ${attemptName} провалилась:`, {
                    //     code: error.code,
                    //     message: error.message
                    // });
                    reject(error);
                },
                options
            );
        });
    }, []);

    // Получение текущей позиции (напрямую, без проверки enabled)
    const getCurrentLocationDirect = useCallback(async () => {
        setLoading(true);
        setError(null);
        // Сбрасываем IP разрешение при каждой попытке получить позицию
        // чтобы заново спрашивать если GPS не сработает
        const currentIpPermission = ipGeolocationEnabled;
        setIpGeolocationEnabled(null);

        try {
            if (Platform.OS === 'web') {
                // Стратегия 1: Быстрое получение с кешем (менее точное)
                try {
                    const position = await getPositionWithOptions({
                        enableHighAccuracy: false,
                        timeout: 5000,
                        maximumAge: 300000, // 5 минут
                    }, "Быстрое позиционирование (сеть)");

                    setLocation(position);
                    setLoading(false);
                    return position;
                } catch (error1) {

                    // Стратегия 2: Точное позиционирование (GPS)
                    try {
                        const position = await getPositionWithOptions({
                            enableHighAccuracy: true,
                            timeout: 15000,
                            maximumAge: 10000,
                        }, "Точное позиционирование (GPS)");

                        setLocation(position);
                        setLoading(false);
                        return position;
                    } catch (error2) {

                        // Стратегия 3: Базовое позиционирование (максимально мягкие настройки)
                        try {
                            const position = await getPositionWithOptions({
                                enableHighAccuracy: false,
                                timeout: 30000,
                                maximumAge: 600000, // 10 минут
                            }, "Базовое позиционирование");

                            setLocation(position);
                            setLoading(false);
                            return position;
                        } catch (error3) {
                            // console.log('⚠️ Базовое позиционирование не удалось, проверяем IP геолокацию...');

                            // Стратегия 4: Геолокация по IP (резервная)
                            // Проверяем разрешение на IP геолокацию
                            // currentIpPermission содержит предыдущее состояние (из AsyncStorage или предыдущего ответа)
                            if (currentIpPermission === true) {
                                // Ранее разрешал, используем без вопросов
                                // console.log('✅ Используем ранее разрешенную IP геолокацию');
                                setIpGeolocationEnabled(true);
                            } else {
                                // Ранее не разрешал или отказывался - спрашиваем заново
                                // console.log('❓ Спрашиваем разрешение на IP геолокацию...');
                                const userPermission = await requestIpGeolocationPermission();
                                await saveIpGeolocationSettings(userPermission);

                                if (!userPermission) {
                                    // console.log('❌ Пользователь отказался от IP геолокации');
                                    throw new Error('Пользователь отказался от определения местоположения по IP');
                                }
                            }

                            // У нас есть разрешение, используем IP геолокацию
                            try {
                                const position = await getLocationByIP();
                                setLocation(position);
                                setLoading(false);
                                return position;
                            } catch (error4) {
                                // Все стратегии провалились
                                // console.log('❌ Все попытки геолокации провалились');

                                let errorMessage = 'Не удалось определить местоположение';

                                if (error3.code === 1) {
                                    errorMessage = 'Доступ к геолокации запрещен';
                                } else if (error3.code === 2) {
                                    errorMessage = 'Местоположение недоступно. Возможные причины:\n• Службы геолокации отключены в Windows\n• Нет доступа к GPS/Wi-Fi сетям\n• Антивирус блокирует доступ\n• Проблемы с драйверами\n\nПопробуйте:\n• Включить "Службы определения местоположения" в настройках Windows\n• Разрешить браузеру доступ к местоположению\n• Подключиться к Wi-Fi сети';
                                } else if (error3.code === 3) {
                                    errorMessage = 'Превышено время ожидания определения местоположения';
                                }

                                setError(errorMessage);
                                setLoading(false);
                                throw new Error(errorMessage);
                            }
                        }
                    }
                }
            } else {
                // Мобильные платформы
                return new Promise((resolve, reject) => {
                    Geolocation.getCurrentPosition(
                        (position) => {
                            const coords = {
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                                accuracy: position.coords.accuracy,
                                timestamp: position.timestamp,
                            };
                            setLocation(coords);
                            setLoading(false);
                            resolve(coords);
                        },
                        (error) => {

                            let errorMessage = error.message || 'Неизвестная ошибка геолокации';

                            switch (error.code) {
                                case 1: // PERMISSION_DENIED
                                    errorMessage = 'Доступ к геолокации запрещен';
                                    break;
                                case 2: // POSITION_UNAVAILABLE
                                    errorMessage = 'Местоположение недоступно';
                                    break;
                                case 3: // TIMEOUT
                                    errorMessage = 'Превышено время ожидания получения местоположения';
                                    break;
                                default:
                                    errorMessage = error.message || `Ошибка геолокации (код: ${error.code})`;
                            }

                            setError(errorMessage);
                            setLoading(false);
                            reject(new Error(errorMessage));
                        },
                        {
                            enableHighAccuracy: true,
                            timeout: 15000,
                            maximumAge: 10000,
                        }
                    );
                });
            }
        } catch (err) {
            setError(err.message || 'Неизвестная ошибка при получении геолокации');
            setLoading(false);
            throw err;
        }
    }, [getPositionWithOptions, getLocationByIP, ipGeolocationEnabled, requestIpGeolocationPermission, saveIpGeolocationSettings]);

    // Получение текущей позиции
    const getCurrentLocation = useCallback(async () => {
        // Проверяем включена ли геолокация в настройках приложения
        if (!enabled) {
            setError('Геолокация выключена в настройках');
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            const hasPermission = await checkPermissions();
            if (!hasPermission) {
                setError('Нет разрешения на доступ к геолокации');
                setLoading(false);
                return null;
            }

            if (Platform.OS === 'web') {
                return new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const coords = {
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                                accuracy: position.coords.accuracy,
                                timestamp: position.timestamp,
                            };
                            setLocation(coords);
                            setLoading(false);
                            resolve(coords);
                        },
                        (error) => {
                            setError(error.message);
                            setLoading(false);
                            reject(error);
                        },
                        {
                            enableHighAccuracy: true,
                            timeout: 15000,
                            maximumAge: 10000,
                        }
                    );
                });
            } else {
                // Мобильные платформы
                return new Promise((resolve, reject) => {
                    Geolocation.getCurrentPosition(
                        (position) => {
                            const coords = {
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                                accuracy: position.coords.accuracy,
                                timestamp: position.timestamp,
                            };
                            setLocation(coords);
                            setLoading(false);
                            resolve(coords);
                        },
                        (error) => {
                            setError(error.message);
                            setLoading(false);
                            reject(error);
                        },
                        {
                            enableHighAccuracy: true,
                            timeout: 15000,
                            maximumAge: 10000,
                        }
                    );
                });
            }
        } catch (err) {
            setError(err.message);
            setLoading(false);
            return null;
        }
    }, [checkPermissions, enabled]);

    // Отслеживание позиции
    const watchLocation = useCallback(() => {
        if (!enabled) {
            return null;
        }

        if (Platform.OS === 'web') {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp,
                    });
                },
                (error) => setError(error.message),
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 10000,
                }
            );
            return watchId;
        } else {
            const watchId = Geolocation.watchPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp,
                    });
                },
                (error) => setError(error.message),
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 10000,
                }
            );
            return watchId;
        }
    }, [enabled]);

    const clearWatch = useCallback((watchId) => {
        if (Platform.OS === 'web') {
            navigator.geolocation.clearWatch(watchId);
        } else {
            Geolocation.clearWatch(watchId);
        }
    }, []);

    // Очистка ошибки
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Очистка диалога
    const clearDialog = useCallback(() => {
        setDialog(null);
    }, []);

    // Обработчик нажатия на кнопку диалога
    const handleDialogButtonPress = useCallback((onPress) => {
        return () => {
            // Сначала выполняем действие кнопки
            if (onPress) {
                onPress();
            }
            // Затем автоматически закрываем диалог
            clearDialog();
        };
    }, [clearDialog]);

    // Управление настройкой IP геолокации
    const setIpGeolocationPermission = useCallback(async (isEnabled) => {
        await saveIpGeolocationSettings(isEnabled);
    }, [saveIpGeolocationSettings]);

    return {
        location,
        loading,
        error,
        enabled,
        isInitialized,
        ipGeolocationEnabled,
        dialog,
        getCurrentLocation,
        getCurrentLocationDirect,
        watchLocation,
        clearWatch,
        checkPermissions,
        toggleGeolocation,
        setGeolocationEnabled,
        setIpGeolocationPermission,
        clearError,
        clearDialog,
        handleDialogButtonPress,
    };
};