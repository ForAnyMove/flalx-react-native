import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNotification } from '../other/NotificationContext';

export const NotificationDemo = () => {
    const { showInfo, showWarning, showError, showAlert, showConfirm, showNotification } = useNotification();

    const handleCustomNotification = () => {
        showNotification({
            type: 'info',
            message: 'Это **пример** с *markdown* разметкой и пользовательскими кнопками',
            buttons: [
                {
                    title: 'Отмена',
                    backgroundColor: '#E5E7EB',
                    textColor: '#374151',
                },
                {
                    title: 'Действие 1',
                    backgroundColor: '#10B981',
                    textColor: '#FFFFFF',
                    onPress: () => console.log('Действие 1 выполнено'),
                },
                {
                    title: 'Действие 2',
                    backgroundColor: '#8B5CF6',
                    textColor: '#FFFFFF',
                    onPress: () => console.log('Действие 2 выполнено'),
                }
            ]
        });
    };

    const handleConfirmDemo = () => {
        showConfirm(
            'Вы уверены, что хотите **удалить** этот элемент?',
            () => console.log('Элемент удален'),
            () => console.log('Отменено')
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Демо нотификаций</Text>

            <Pressable style={[styles.button, styles.infoButton]} onPress={() => showInfo('Это информационное сообщение')}>
                <Text style={styles.buttonText}>Показать Info</Text>
            </Pressable>

            <Pressable style={[styles.button, styles.warningButton]} onPress={() => showWarning('Это предупреждение')}>
                <Text style={styles.buttonText}>Показать Warning</Text>
            </Pressable>

            <Pressable style={[styles.button, styles.errorButton]} onPress={() => showError('Произошла ошибка!')}>
                <Text style={styles.buttonText}>Показать Error</Text>
            </Pressable>

            <Pressable style={[styles.button, styles.alertButton]} onPress={() => showAlert('Простое уведомление с кнопкой OK', 'info')}>
                <Text style={styles.buttonText}>Показать Alert</Text>
            </Pressable>

            <Pressable style={[styles.button, styles.confirmButton]} onPress={handleConfirmDemo}>
                <Text style={styles.buttonText}>Показать Confirm</Text>
            </Pressable>

            <Pressable style={[styles.button, styles.customButton]} onPress={handleCustomNotification}>
                <Text style={styles.buttonText}>Кастомное уведомление</Text>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        color: '#374151',
    },
    button: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        marginVertical: 8,
        minWidth: 200,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
    infoButton: {
        backgroundColor: '#3B82F6',
    },
    warningButton: {
        backgroundColor: '#F59E0B',
    },
    errorButton: {
        backgroundColor: '#EF4444',
    },
    alertButton: {
        backgroundColor: '#10B981',
    },
    confirmButton: {
        backgroundColor: '#8B5CF6',
    },
    customButton: {
        backgroundColor: '#6B7280',
    },
});