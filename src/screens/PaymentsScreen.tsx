import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PaymentDAO } from '../dao/PaymentDAO';
import { TenantDAO } from '../dao/TenantDAO';
import { Payment, TenantWithDetails } from '../types';

interface PaymentWithDetails extends Payment {
  tenant?: TenantWithDetails;
}

interface OverduePayment {
  tenant: TenantWithDetails;
  month: string;
  amount: number;
}

export default function PaymentsScreen() {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [overduePayments, setOverduePayments] = useState<OverduePayment[]>([]);
  const [tenants, setTenants] = useState<TenantWithDetails[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [newPaymentData, setNewPaymentData] = useState({
    tenantId: 0,
    month: '',
    amount: '',
  });

  useEffect(() => {
    loadPayments();
    loadTenants();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const paymentsData = await PaymentDAO.getAll();

      // Get tenant details for each payment
      const paymentsWithDetails = await Promise.all(
        paymentsData.map(async (payment) => {
          const tenant = await TenantDAO.getTenantWithDetails(payment.tenant_id);
          return {
            ...payment,
            tenant: tenant || undefined,
          };
        })
      );

      setPayments(paymentsWithDetails);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTenants = async () => {
    try {
      const tenantsData = await TenantDAO.getAllWithPaymentStatus();
      setTenants(tenantsData);
      calculateOverduePayments(tenantsData);
    } catch (error) {
      console.error('Error loading tenants:', error);
    }
  };

  const calculateOverduePayments = async (tenantsList: TenantWithDetails[]) => {
    const overdue: OverduePayment[] = [];
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    for (const tenant of tenantsList) {
      // According to specs: new tenants are automatically "à jour" when added
      // Only check for overdue if tenant was added in a previous month
      const entryDate = new Date(tenant.entry_date);
      const entryMonth = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`;

      // If tenant was added this month or later, consider them up to date
      if (entryMonth >= currentMonth) {
        continue;
      }

      // Check if current month is paid
      const isCurrentMonthPaid = await PaymentDAO.isMonthPaid(tenant.id, currentMonth);
      if (!isCurrentMonthPaid) {
        overdue.push({
          tenant,
          month: currentMonth,
          amount: tenant.rent_amount,
        });
      }
    }

    setOverduePayments(overdue);
  };

  const handleAddPayment = async () => {
    if (!newPaymentData.tenantId || !newPaymentData.month || !newPaymentData.amount) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      await PaymentDAO.create({
        tenant_id: newPaymentData.tenantId,
        month: newPaymentData.month,
        amount: parseFloat(newPaymentData.amount),
      });

      // Reset form
      setNewPaymentData({
        tenantId: 0,
        month: '',
        amount: '',
      });
      setShowAddModal(false);
      loadPayments();
      loadTenants();
      Alert.alert('Succès', 'Paiement ajouté avec succès');
    } catch (error) {
      console.error('Error adding payment:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le paiement');
    }
  };

  const PaymentCard = ({ payment }: { payment: PaymentWithDetails }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentIcon}>
          <Ionicons name="card" size={20} color="#10b981" />
        </View>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentAmount}>{payment.amount.toLocaleString()} F</Text>
          <Text style={styles.paymentTenant}>
            {payment.tenant?.first_name} {payment.tenant?.last_name}
          </Text>
          <Text style={styles.paymentMonth}>
            {new Date(payment.month + '-01').toLocaleDateString('fr-FR', {
              month: 'long',
              year: 'numeric'
            })}
          </Text>
        </View>
        <View style={styles.paymentDate}>
          <Text style={styles.paymentDateText}>
            {new Date(payment.paid_at).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit'
            })}
          </Text>
        </View>
      </View>
    </View>
  );

  const OverdueCard = ({ overdue }: { overdue: OverduePayment }) => (
    <TouchableOpacity
      style={styles.overdueCard}
      onPress={() => {
        // Auto-fill payment form
        setNewPaymentData({
          tenantId: overdue.tenant.id,
          month: overdue.month,
          amount: overdue.amount.toString(),
        });
        setShowAddModal(true);
      }}
    >
      <View style={styles.overdueHeader}>
        <View style={styles.overdueIcon}>
          <Ionicons name="alert-circle" size={20} color="#ef4444" />
        </View>
        <View style={styles.overdueInfo}>
          <Text style={styles.overdueTenant}>
            {overdue.tenant.first_name} {overdue.tenant.last_name}
          </Text>
          <Text style={styles.overdueAmount}>{overdue.amount.toLocaleString()} F</Text>
          <Text style={styles.overdueMonth}>
            {new Date(overdue.month + '-01').toLocaleDateString('fr-FR', {
              month: 'long',
              year: 'numeric'
            })}
          </Text>
        </View>
        <TouchableOpacity style={styles.payButton}>
          <Text style={styles.payButtonText}>Payer</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const AddPaymentModal = () => {
    const handleTenantChange = useCallback((text: string) => {
      // This would be for a search/filter if needed
    }, []);

    const handleAmountChange = useCallback((text: string) => {
      setNewPaymentData(prev => ({ ...prev, amount: text }));
    }, []);

    return (
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
        statusBarTranslucent={true}
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
          <View style={styles.simpleModalContainer}>
            <View style={styles.simpleModalHeader}>
              <Text style={styles.simpleModalTitle}>Nouveau paiement</Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={styles.simpleCloseButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.simpleModalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
          <View style={styles.simpleFormGroup}>
            <Text style={styles.simpleFormLabel}>Locataire *</Text>
            <TouchableOpacity
              style={styles.simpleFormSelect}
              onPress={() => Alert.alert('Info', 'Sélectionnez un locataire')}
            >
              <Text style={newPaymentData.tenantId ? styles.simpleFormSelectText : styles.simpleFormPlaceholder}>
                {newPaymentData.tenantId ?
                  tenants.find(t => t.id === newPaymentData.tenantId)?.first_name + ' ' +
                  tenants.find(t => t.id === newPaymentData.tenantId)?.last_name
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
              onPress={() => Alert.alert('Info', 'Sélectionnez un mois')}
            >
              <Text style={newPaymentData.month ? styles.simpleFormSelectText : styles.simpleFormPlaceholder}>
                {newPaymentData.month ?
                  new Date(newPaymentData.month + '-01').toLocaleDateString('fr-FR', {
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
                  value={newPaymentData.amount}
                  onChangeText={handleAmountChange}
                  placeholder="Montant en FCFA"
                  keyboardType="numeric"
                  returnKeyType="done"
                />
              </View>

              <View style={styles.simpleFormActions}>
                <TouchableOpacity
                  style={[styles.simpleFormButton, styles.simpleCancelButton]}
                  onPress={() => {
                    setNewPaymentData({
                      tenantId: 0,
                      month: '',
                      amount: '',
                    });
                    setShowAddModal(false);
                  }}
                >
                  <Text style={styles.simpleCancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.simpleFormButton, styles.simpleSubmitButton]}
                  onPress={handleAddPayment}
                >
                  <Text style={styles.simpleSubmitButtonText}>Enregistrer le paiement</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement des paiements...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Paiements</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{payments.length}</Text>
          <Text style={styles.statLabel}>Paiements effectués</Text>
        </View>
        <View style={[styles.statCard, styles.overdueStat]}>
          <Text style={[styles.statNumber, styles.overdueNumber]}>{overduePayments.length}</Text>
          <Text style={[styles.statLabel, styles.overdueLabel]}>En retard</Text>
        </View>
      </View>

      {/* Overdue Payments */}
      {overduePayments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paiements en retard</Text>
          {overduePayments.map((overdue, index) => (
            <OverdueCard key={index} overdue={overdue} />
          ))}
        </View>
      )}

      {/* Recent Payments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paiements récents</Text>
        {payments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="card" size={40} color="#d1d5db" />
            <Text style={styles.emptyTitle}>Aucun paiement</Text>
            <Text style={styles.emptyText}>Les paiements apparaîtront ici</Text>
          </View>
        ) : (
          payments.slice(0, 10).map((payment) => (
            <PaymentCard key={payment.id} payment={payment} />
          ))
        )}
      </View>

      <AddPaymentModal />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#2563eb',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  overdueStat: {
    backgroundColor: '#fef2f2',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  overdueNumber: {
    color: '#dc2626',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  overdueLabel: {
    color: '#dc2626',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  paymentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 2,
  },
  paymentTenant: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 2,
  },
  paymentMonth: {
    fontSize: 12,
    color: '#6b7280',
  },
  paymentDate: {
    alignItems: 'flex-end',
  },
  paymentDateText: {
    fontSize: 12,
    color: '#6b7280',
  },
  overdueCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  overdueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overdueIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  overdueInfo: {
    flex: 1,
  },
  overdueTenant: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 2,
  },
  overdueAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 2,
  },
  overdueMonth: {
    fontSize: 12,
    color: '#dc2626',
  },
  payButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  payButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});