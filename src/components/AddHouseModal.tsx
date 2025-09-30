import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AddHouseModalProps {
  visible: boolean;
  formData: {
    name: string;
    address: string;
  };
  onNameChange: (text: string) => void;
  onAddressChange: (text: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onClose: () => void;
}

const AddHouseModal = memo(({
  visible,
  formData,
  onNameChange,
  onAddressChange,
  onSubmit,
  onCancel,
  onClose,
}: AddHouseModalProps) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.simpleModalContainer}>
        <View style={styles.simpleModalHeader}>
          <Text style={styles.simpleModalTitle}>Nouvelle maison</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.simpleCloseButton}
          >
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.simpleModalContent} keyboardShouldPersistTaps="handled">
          <View style={styles.simpleFormGroup}>
            <Text style={styles.simpleFormLabel}>Nom de la maison *</Text>
            <TextInput
              style={styles.simpleFormInput}
              value={formData.name}
              onChangeText={onNameChange}
              placeholder="Ex: Résidence des Fleurs"
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          <View style={styles.simpleFormGroup}>
            <Text style={styles.simpleFormLabel}>Adresse complète *</Text>
            <TextInput
              style={[styles.simpleFormInput, styles.simpleFormTextarea]}
              value={formData.address}
              onChangeText={onAddressChange}
              placeholder="Quartier, rue, ville..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              autoCorrect={false}
              returnKeyType="done"
            />
          </View>

          <View style={styles.simpleFormActions}>
            <TouchableOpacity
              style={[styles.simpleFormButton, styles.simpleCancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.simpleCancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.simpleFormButton, styles.simpleSubmitButton]}
              onPress={onSubmit}
            >
              <Text style={styles.simpleSubmitButtonText}>Créer la maison</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  simpleModalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  simpleModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  simpleModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  simpleCloseButton: {
    padding: 8,
  },
  simpleModalContent: {
    flex: 1,
    padding: 20,
  },
  simpleFormGroup: {
    marginBottom: 24,
  },
  simpleFormLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  simpleFormInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  simpleFormTextarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  simpleFormActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  simpleFormButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  simpleCancelButton: {
    backgroundColor: '#f3f4f6',
  },
  simpleCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  simpleSubmitButton: {
    backgroundColor: '#2563eb',
  },
  simpleSubmitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default AddHouseModal;
