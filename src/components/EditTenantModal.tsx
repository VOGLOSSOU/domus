import React, { memo } from 'react';
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
import { House } from '../types/index';

interface TenantFormData {
  fullName: string;
  phone: string;
  email: string;
  houseId: number;
  roomName: string;
  roomType: string;
  rentAmount: string;
}

interface EditTenantModalProps {
  visible: boolean;
  formData: TenantFormData;
  houses: House[];
  onFullNameChange: (text: string) => void;
  onPhoneChange: (text: string) => void;
  onEmailChange: (text: string) => void;
  onRoomNameChange: (text: string) => void;
  onRoomTypeChange: (text: string) => void;
  onRentAmountChange: (text: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onClose: () => void;
  onShowHousePicker: () => void;
}

const EditTenantModal = memo(({
  visible,
  formData,
  houses,
  onFullNameChange,
  onPhoneChange,
  onEmailChange,
  onRoomNameChange,
  onRoomTypeChange,
  onRentAmountChange,
  onSubmit,
  onCancel,
  onClose,
  onShowHousePicker,
}: EditTenantModalProps) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Modifier le locataire</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.simpleFormGroup}>
            <Text style={styles.simpleFormLabel}>Nom complet *</Text>
            <TextInput
              style={styles.simpleFormInput}
              value={formData.fullName}
              onChangeText={onFullNameChange}
              placeholder="Nom complet du locataire"
              autoCapitalize="words"
              autoCorrect={false}
              keyboardType="default"
              returnKeyType="next"
            />
          </View>

          <View style={styles.simpleFormGroup}>
            <Text style={styles.simpleFormLabel}>Téléphone *</Text>
            <TextInput
              style={styles.simpleFormInput}
              value={formData.phone}
              onChangeText={onPhoneChange}
              placeholder="Numéro de téléphone"
              keyboardType="phone-pad"
              returnKeyType="next"
            />
          </View>

          <View style={styles.simpleFormGroup}>
            <Text style={styles.simpleFormLabel}>Email (optionnel)</Text>
            <TextInput
              style={styles.simpleFormInput}
              value={formData.email}
              onChangeText={onEmailChange}
              placeholder="email@exemple.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          <View style={styles.simpleFormGroup}>
            <Text style={styles.simpleFormLabel}>Maison *</Text>
            <TouchableOpacity
              style={styles.simpleFormSelect}
              onPress={onShowHousePicker}
            >
              <Text style={formData.houseId ? styles.simpleFormSelectText : styles.simpleFormPlaceholder}>
                {formData.houseId ? houses.find(h => h.id === formData.houseId)?.name : 'Choisir une maison'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.simpleFormGroup}>
            <Text style={styles.simpleFormLabel}>Nom de la chambre *</Text>
            <TextInput
              style={styles.simpleFormInput}
              value={formData.roomName}
              onChangeText={onRoomNameChange}
              placeholder="Ex: Chambre 101, Studio A"
              autoCapitalize="words"
              autoCorrect={false}
              keyboardType="default"
              returnKeyType="next"
            />
          </View>

          <View style={styles.simpleFormGroup}>
            <Text style={styles.simpleFormLabel}>Type de chambre *</Text>
            <TextInput
              style={styles.simpleFormInput}
              value={formData.roomType}
              onChangeText={onRoomTypeChange}
              placeholder="Ex: Studio, Chambre simple, Suite"
              autoCapitalize="words"
              autoCorrect={false}
              keyboardType="default"
              returnKeyType="next"
            />
          </View>

          <View style={styles.simpleFormGroup}>
            <Text style={styles.simpleFormLabel}>Loyer mensuel *</Text>
            <TextInput
              style={styles.simpleFormInput}
              value={formData.rentAmount}
              onChangeText={onRentAmountChange}
              placeholder="Montant en FCFA"
              keyboardType="numeric"
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
              <Text style={styles.simpleSubmitButtonText}>Modifier le locataire</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  simpleFormGroup: {
    marginBottom: 20,
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
  simpleFormSelect: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  simpleFormSelectText: {
    fontSize: 16,
    color: '#111827',
  },
  simpleFormPlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
  },
  simpleFormActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    paddingBottom: 20,
  },
  simpleFormButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  simpleCancelButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  simpleCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  simpleSubmitButton: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  simpleSubmitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
});

export default EditTenantModal;