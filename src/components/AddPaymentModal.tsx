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
import { TenantWithDetails } from '../types/index';

interface PaymentFormData {
  tenantId: number;
  month: string;
  amount: string;
  notes: string;
}

interface AddPaymentModalProps {
  visible: boolean;
  formData: PaymentFormData;
  tenants: TenantWithDetails[];
  onAmountChange: (text: string) => void;
  onNotesChange: (text: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onClose: () => void;
  onShowTenantPicker: () => void;
  onShowMonthPicker: () => void;
}

const AddPaymentModal = memo(({
  visible,
  formData,
  tenants,
  onAmountChange,
  onNotesChange,
  onSubmit,
  onCancel,
  onClose,
  onShowTenantPicker,
  onShowMonthPicker,
}: AddPaymentModalProps) => {
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
          <Text style={styles.modalTitle}>Nouveau paiement</Text>
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
        >
          <View style={styles.simpleFormGroup}>
            <Text style={styles.simpleFormLabel}>Locataire *</Text>
            <TouchableOpacity
              style={styles.simpleFormSelect}
              onPress={onShowTenantPicker}
            >
              <Text style={formData.tenantId ? styles.simpleFormSelectText : styles.simpleFormPlaceholder}>
                {formData.tenantId ?
                  tenants.find(t => t.id === formData.tenantId)?.first_name + ' ' +
                  tenants.find(t => t.id === formData.tenantId)?.last_name
                  : 'Choisir un locataire'
                }
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.simpleFormGroup}>
            <Text style={styles.simpleFormLabel}>Mois *</Text>
            <TouchableOpacity
              style={styles.simpleFormSelect}
              onPress={onShowMonthPicker}
            >
              <Text style={formData.month ? styles.simpleFormSelectText : styles.simpleFormPlaceholder}>
                {formData.month ?
                  new Date(formData.month + '-01').toLocaleDateString('fr-FR', {
                    month: 'long',
                    year: 'numeric'
                  })
                  : 'Choisir un mois'
                }
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.simpleFormGroup}>
            <Text style={styles.simpleFormLabel}>Montant *</Text>
            <TextInput
              style={styles.simpleFormInput}
              value={formData.amount}
              onChangeText={onAmountChange}
              placeholder="Montant en FCFA"
              keyboardType="numeric"
              returnKeyType="next"
            />
          </View>

          <View style={styles.simpleFormGroup}>
            <Text style={styles.simpleFormLabel}>Remarques (optionnel)</Text>
            <TextInput
              style={[styles.simpleFormInput, { height: 80, textAlignVertical: 'top' }]}
              value={formData.notes}
              onChangeText={onNotesChange}
              placeholder="Ajouter une remarque..."
              multiline
              numberOfLines={3}
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
              <Text style={styles.simpleSubmitButtonText}>Enregistrer le paiement</Text>
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

export default AddPaymentModal;
