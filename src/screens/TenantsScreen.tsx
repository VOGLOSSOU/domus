import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TenantDAO } from '../dao/TenantDAO';
import { HouseDAO } from '../dao/HouseDAO';
import { RoomDAO } from '../dao/RoomDAO';
import { TenantWithDetails, House } from '../types';
import AddTenantModal from '../components/AddTenantModal';

export default function TenantsScreen() {
  const [tenants, setTenants] = useState<TenantWithDetails[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<TenantWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [loading, setLoading] = useState(true);

  // Form state
  const [newTenantData, setNewTenantData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    houseId: 0,
    roomName: '',
    roomType: '',
    rentAmount: '',
    paymentFrequency: 'mensuelle' as const,
  });
  const [houses, setHouses] = useState<House[]>([]);
  const [showHousePicker, setShowHousePicker] = useState(false);

  useEffect(() => {
    loadTenants();
    loadHouses();
  }, []);

  useEffect(() => {
    filterTenants();
  }, [tenants, searchQuery]);

  const loadTenants = useCallback(async () => {
    try {
      setLoading(true);
      const tenantsData = await TenantDAO.getAllWithPaymentStatus();
      setTenants(tenantsData);
    } catch (error) {
      console.error('Error loading tenants:', error);
      Alert.alert('Erreur', 'Impossible de charger les locataires');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHouses = useCallback(async () => {
    try {
      const housesData = await HouseDAO.getAll();
      setHouses(housesData);
    } catch (error) {
      console.error('Error loading houses:', error);
    }
  }, []);

  const filterTenants = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredTenants(tenants);
    } else {
      const filtered = tenants.filter(tenant =>
        `${tenant.first_name} ${tenant.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.phone.includes(searchQuery) ||
        tenant.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTenants(filtered);
    }
  }, [tenants, searchQuery]);

  const handleAddTenant = useCallback(async () => {
    if (!newTenantData.firstName.trim() || !newTenantData.lastName.trim() ||
        !newTenantData.phone.trim() || !newTenantData.houseId ||
        !newTenantData.roomName.trim() || !newTenantData.roomType.trim() ||
        !newTenantData.rentAmount) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      // First create the room
      const roomId = await RoomDAO.create({
        house_id: newTenantData.houseId,
        name: newTenantData.roomName.trim(),
        type: newTenantData.roomType.trim(),
      });

      // Then create the tenant with the new room
      await TenantDAO.create({
        house_id: newTenantData.houseId,
        room_id: roomId,
        first_name: newTenantData.firstName.trim(),
        last_name: newTenantData.lastName.trim(),
        phone: newTenantData.phone.trim(),
        email: newTenantData.email.trim() || undefined,
        entry_date: new Date().toISOString().split('T')[0],
        payment_frequency: newTenantData.paymentFrequency,
        rent_amount: parseFloat(newTenantData.rentAmount),
      });

      // Reset form
      setNewTenantData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        houseId: 0,
        roomName: '',
        roomType: '',
        rentAmount: '',
        paymentFrequency: 'mensuelle',
      });
      setShowAddModal(false);
      loadTenants();
      Alert.alert('Succès', 'Locataire et chambre ajoutés avec succès');
    } catch (error) {
      console.error('Error adding tenant:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le locataire');
    }
  }, [newTenantData, loadTenants]);

  // Input change handlers - memoized to prevent modal re-renders
  const handleFirstNameChange = useCallback((text: string) => {
    setNewTenantData(prev => ({ ...prev, firstName: text }));
  }, []);

  const handleLastNameChange = useCallback((text: string) => {
    setNewTenantData(prev => ({ ...prev, lastName: text }));
  }, []);

  const handlePhoneChange = useCallback((text: string) => {
    setNewTenantData(prev => ({ ...prev, phone: text }));
  }, []);

  const handleEmailChange = useCallback((text: string) => {
    setNewTenantData(prev => ({ ...prev, email: text }));
  }, []);

  const handleRoomNameChange = useCallback((text: string) => {
    setNewTenantData(prev => ({ ...prev, roomName: text }));
  }, []);

  const handleRoomTypeChange = useCallback((text: string) => {
    setNewTenantData(prev => ({ ...prev, roomType: text }));
  }, []);

  const handleRentAmountChange = useCallback((text: string) => {
    setNewTenantData(prev => ({ ...prev, rentAmount: text }));
  }, []);

  const TenantCard = memo(({ tenant }: { tenant: TenantWithDetails }) => (
    <TouchableOpacity
      style={styles.tenantCard}
      onPress={() => {/* TODO: Implement tenant details */}}
    >
      <View style={styles.tenantHeader}>
        <View style={styles.tenantAvatar}>
          <Text style={styles.tenantInitial}>
            {tenant.first_name[0]}{tenant.last_name[0]}
          </Text>
        </View>
        <View style={styles.tenantInfo}>
          <Text style={styles.tenantName}>{tenant.first_name} {tenant.last_name}</Text>
          <Text style={styles.tenantDetails}>
            {tenant.house?.name} • {tenant.room?.name}
          </Text>
          <Text style={styles.tenantRent}>
            {tenant.rent_amount.toLocaleString()} F/mois
          </Text>
        </View>
        <View style={styles.tenantStatus}>
          <View style={[
            styles.statusBadge,
            tenant.paymentStatus === 'up_to_date' ? styles.statusUpToDate : styles.statusOverdue
          ]}>
            <Text style={[
              styles.statusText,
              tenant.paymentStatus === 'up_to_date' ? styles.statusTextUpToDate : styles.statusTextOverdue
            ]}>
              {tenant.paymentStatus === 'up_to_date' ? 'À jour' : 'En retard'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  ));

  const HousePickerModal = memo(() => (
    <Modal
      visible={showHousePicker}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setShowHousePicker(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.pickerModalContainer}>
          <View style={styles.pickerModalHeader}>
            <Text style={styles.pickerModalTitle}>Choisir une maison</Text>
            <TouchableOpacity
              onPress={() => setShowHousePicker(false)}
              style={styles.pickerCloseButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.pickerModalContent}>
            {houses.length === 0 ? (
              <View style={styles.emptyPickerState}>
                <Ionicons name="business" size={40} color="#d1d5db" />
                <Text style={styles.emptyPickerTitle}>Aucune maison</Text>
                <Text style={styles.emptyPickerText}>
                  Vous devez d'abord créer une maison avant d'ajouter un locataire
                </Text>
              </View>
            ) : (
              houses.map((house) => (
                <TouchableOpacity
                  key={house.id}
                  style={styles.housePickerItem}
                  onPress={() => {
                    setNewTenantData(prev => ({ ...prev, houseId: house.id }));
                    setShowHousePicker(false);
                  }}
                >
                  <View style={styles.housePickerIcon}>
                    <Ionicons name="business" size={20} color="#2563eb" />
                  </View>
                  <View style={styles.housePickerInfo}>
                    <Text style={styles.housePickerName}>{house.name}</Text>
                    <Text style={styles.housePickerAddress}>{house.address}</Text>
                  </View>
                  {newTenantData.houseId === house.id && (
                    <View style={styles.housePickerSelected}>
                      <Ionicons name="checkmark" size={20} color="#10b981" />
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  ));

  // Memoized handlers for modal
  const handleCancelTenant = useCallback(() => {
    setNewTenantData({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      houseId: 0,
      roomName: '',
      roomType: '',
      rentAmount: '',
      paymentFrequency: 'mensuelle',
    });
    setShowAddModal(false);
  }, []);

  const handleCloseTenantModal = useCallback(() => {
    setShowAddModal(false);
  }, []);

  const handleShowHousePicker = useCallback(() => {
    setShowHousePicker(true);
  }, []);

  // Loading check
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement des locataires...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes locataires</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un locataire..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tenants List */}
      <FlatList
        data={filteredTenants}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <TenantCard tenant={item} />}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'Aucun locataire trouvé' : 'Aucun locataire'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Essayez une autre recherche'
                : 'Commencez par ajouter votre premier locataire'
              }
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyAddButton}
                onPress={() => setShowAddModal(true)}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.emptyAddText}>Ajouter un locataire</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <AddTenantModal
        visible={showAddModal}
        formData={newTenantData}
        houses={houses}
        onFirstNameChange={handleFirstNameChange}
        onLastNameChange={handleLastNameChange}
        onPhoneChange={handlePhoneChange}
        onEmailChange={handleEmailChange}
        onRoomNameChange={handleRoomNameChange}
        onRoomTypeChange={handleRoomTypeChange}
        onRentAmountChange={handleRentAmountChange}
        onSubmit={handleAddTenant}
        onCancel={handleCancelTenant}
        onClose={handleCloseTenantModal}
        onShowHousePicker={handleShowHousePicker}
      />
      <HousePickerModal />
    </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  listContainer: {
    padding: 20,
  },
  tenantCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tenantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tenantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tenantInitial: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tenantInfo: {
    flex: 1,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  tenantDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  tenantRent: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  tenantStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusUpToDate: {
    backgroundColor: '#d1fae5',
  },
  statusOverdue: {
    backgroundColor: '#fef2f2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextUpToDate: {
    color: '#065f46',
  },
  statusTextOverdue: {
    color: '#dc2626',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
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
    marginBottom: 20,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyAddText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
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
  pickerModalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pickerModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  pickerCloseButton: {
    padding: 8,
  },
  pickerModalContent: {
    flex: 1,
    padding: 20,
  },
  emptyPickerState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyPickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyPickerText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  housePickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  housePickerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  housePickerInfo: {
    flex: 1,
  },
  housePickerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  housePickerAddress: {
    fontSize: 14,
    color: '#6b7280',
  },
  housePickerSelected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
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
});