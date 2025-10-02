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
import { TenantDAO } from '../db/dao/TenantDAO';
import { HouseDAO } from '../db/dao/HouseDAO';
import { RoomDAO } from '../db/dao/RoomDAO';
import { TenantWithDetails, House } from '../types/index';
import { useAppContext } from '../context/AppContext';
import AddTenantModal from '../components/AddTenantModal';
import EditTenantModal from '../components/EditTenantModal';

export default function TenantsScreen() {
  const { refreshTrigger, triggerRefresh } = useAppContext();
  const [tenants, setTenants] = useState<TenantWithDetails[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<TenantWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantWithDetails | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit form state
  const [editTenantData, setEditTenantData] = useState({
    fullName: '',
    phone: '',
    email: '',
    houseId: 0,
    roomName: '',
    roomType: '',
    rentAmount: '',
  });

  // Form state
  const [newTenantData, setNewTenantData] = useState({
    fullName: '',
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

  // Refresh data when global refresh is triggered
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadTenants();
      loadHouses();
    }
  }, [refreshTrigger]);

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
    if (!newTenantData.fullName.trim() ||
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

      // Split full name into first and last name
      const nameParts = newTenantData.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Then create the tenant with the new room
      await TenantDAO.create({
        house_id: newTenantData.houseId,
        room_id: roomId,
        first_name: firstName,
        last_name: lastName,
        phone: newTenantData.phone.trim(),
        email: newTenantData.email.trim() || undefined,
        entry_date: new Date().toISOString().split('T')[0],
        payment_frequency: newTenantData.paymentFrequency,
        rent_amount: parseFloat(newTenantData.rentAmount),
      });

      // Reset form
      setNewTenantData({
        fullName: '',
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
      triggerRefresh(); // Refresh all screens
      Alert.alert('Succès', 'Locataire et chambre ajoutés avec succès');
    } catch (error) {
      console.error('Error adding tenant:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le locataire');
    }
  }, [newTenantData, loadTenants, triggerRefresh]);

  // Input change handlers - memoized to prevent modal re-renders
  const handleFullNameChange = useCallback((text: string) => {
    setNewTenantData(prev => ({ ...prev, fullName: text }));
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
      onPress={handleCloseActionsMenu}
      activeOpacity={1}
    >
      <View style={styles.tenantHeader}>
        <View style={styles.tenantAvatar}>
          <Text style={styles.tenantInitial}>
            {tenant.first_name[0]}{tenant.last_name[0]}
          </Text>
        </View>
        
        <View style={styles.tenantMainInfo}>
          <View style={styles.tenantInfoRow}>
            <View style={styles.tenantInfo}>
              <Text style={styles.tenantName} numberOfLines={1}>
                {tenant.first_name} {tenant.last_name}
              </Text>
              <Text style={styles.tenantDetails} numberOfLines={1}>
                {tenant.house?.name} • {tenant.room?.name}
              </Text>
              <Text style={styles.tenantRent}>
                {tenant.rent_amount.toLocaleString()} F/mois
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.tenantActions}
              onPress={() => handleShowActionsMenu(tenant.id)}
            >
              <Ionicons name="ellipsis-vertical" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.tenantStatusRow}>
            <View style={[
              styles.statusBadge,
              tenant.paymentStatus === 'up_to_date' ? styles.statusUpToDate : styles.statusOverdue
            ]}>
              <Text style={[
                styles.statusText,
                tenant.paymentStatus === 'up_to_date' ? styles.statusTextUpToDate : styles.statusTextOverdue
              ]} numberOfLines={1}>
                {tenant.paymentStatus === 'up_to_date' ? 'À jour' : 'En retard'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Actions Menu */}
      {showActionsMenu === tenant.id && (
        <View style={styles.actionsMenu}>
          <TouchableOpacity
            style={styles.actionMenuItem}
            onPress={() => handleEditTenant(tenant)}
          >
            <Ionicons name="create" size={16} color="#2563eb" />
            <Text style={styles.actionMenuText}>Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionMenuItem, styles.deleteAction]}
            onPress={() => handleDeleteTenant(tenant)}
          >
            <Ionicons name="trash" size={16} color="#ef4444" />
            <Text style={[styles.actionMenuText, styles.deleteActionText]}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      )}
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
      fullName: '',
      phone: '',
      email: '',
      houseId: 0,
      roomName: '',
      roomType: '',
      rentAmount: '',
      paymentFrequency: 'mensuelle',
    });
    setShowAddModal(false);
    setShowActionsMenu(null);
  }, []);

  const handleCloseTenantModal = useCallback(() => {
    setShowAddModal(false);
  }, []);

  const handleShowHousePicker = useCallback(() => {
    setShowHousePicker(true);
  }, []);

  const handleEditTenant = useCallback((tenant: TenantWithDetails) => {
    setSelectedTenant(tenant);
    setEditTenantData({
      fullName: `${tenant.first_name} ${tenant.last_name}`,
      phone: tenant.phone,
      email: tenant.email || '',
      houseId: tenant.house_id,
      roomName: tenant.room?.name || '',
      roomType: tenant.room?.type || '',
      rentAmount: tenant.rent_amount.toString(),
    });
    setShowEditModal(true);
    setShowActionsMenu(null);
  }, []);

  const handleDeleteTenant = useCallback((tenant: TenantWithDetails) => {
    Alert.alert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer ${tenant.first_name} ${tenant.last_name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await TenantDAO.delete(tenant.id);
              loadTenants();
              setShowActionsMenu(null);
              triggerRefresh();
              Alert.alert('Succès', 'Locataire supprimé avec succès');
            } catch (error) {
              console.error('Error deleting tenant:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le locataire');
            }
          }
        },
      ]
    );
  }, [loadTenants, triggerRefresh]);

  const handleShowActionsMenu = useCallback((tenantId: number) => {
    setShowActionsMenu(showActionsMenu === tenantId ? null : tenantId);
  }, [showActionsMenu]);

  // Close actions menu when tapping outside
  const handleCloseActionsMenu = useCallback(() => {
    setShowActionsMenu(null);
  }, []);

  // Edit handlers
  const handleEditFullNameChange = useCallback((text: string) => {
    setEditTenantData(prev => ({ ...prev, fullName: text }));
  }, []);

  const handleEditPhoneChange = useCallback((text: string) => {
    setEditTenantData(prev => ({ ...prev, phone: text }));
  }, []);

  const handleEditEmailChange = useCallback((text: string) => {
    setEditTenantData(prev => ({ ...prev, email: text }));
  }, []);

  const handleEditRoomNameChange = useCallback((text: string) => {
    setEditTenantData(prev => ({ ...prev, roomName: text }));
  }, []);

  const handleEditRoomTypeChange = useCallback((text: string) => {
    setEditTenantData(prev => ({ ...prev, roomType: text }));
  }, []);

  const handleEditRentAmountChange = useCallback((text: string) => {
    setEditTenantData(prev => ({ ...prev, rentAmount: text }));
  }, []);

  const handleEditTenantSubmit = useCallback(async () => {
    if (!selectedTenant || !editTenantData.fullName.trim() ||
        !editTenantData.phone.trim() || !editTenantData.houseId ||
        !editTenantData.roomName.trim() || !editTenantData.roomType.trim() ||
        !editTenantData.rentAmount) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      // Split full name into first and last name
      const nameParts = editTenantData.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Update tenant
      await TenantDAO.update(selectedTenant.id, {
        house_id: editTenantData.houseId,
        first_name: firstName,
        last_name: lastName,
        phone: editTenantData.phone.trim(),
        email: editTenantData.email.trim() || undefined,
        rent_amount: parseFloat(editTenantData.rentAmount),
      });

      // Update room
      await RoomDAO.update(selectedTenant.room_id, {
        house_id: editTenantData.houseId,
        name: editTenantData.roomName.trim(),
        type: editTenantData.roomType.trim(),
      });

      setShowEditModal(false);
      setSelectedTenant(null);
      loadTenants();
      triggerRefresh(); // Refresh all screens
      Alert.alert('Succès', 'Locataire modifié avec succès');
    } catch (error) {
      console.error('Error updating tenant:', error);
      Alert.alert('Erreur', 'Impossible de modifier le locataire');
    }
  }, [selectedTenant, editTenantData, loadTenants, triggerRefresh]);

  const handleEditCancel = useCallback(() => {
    setShowEditModal(false);
    setSelectedTenant(null);
    setShowActionsMenu(null);
    setEditTenantData({
      fullName: '',
      phone: '',
      email: '',
      houseId: 0,
      roomName: '',
      roomType: '',
      rentAmount: '',
    });
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
        onFullNameChange={handleFullNameChange}
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
      <EditTenantModal
        visible={showEditModal}
        formData={editTenantData}
        houses={houses}
        onFullNameChange={handleEditFullNameChange}
        onPhoneChange={handleEditPhoneChange}
        onEmailChange={handleEditEmailChange}
        onRoomNameChange={handleEditRoomNameChange}
        onRoomTypeChange={handleEditRoomTypeChange}
        onRentAmountChange={handleEditRentAmountChange}
        onSubmit={handleEditTenantSubmit}
        onCancel={handleEditCancel}
        onClose={handleEditCancel}
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
    alignItems: 'flex-start',
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
  tenantMainInfo: {
    flex: 1,
    minWidth: 0,
  },
  tenantInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  tenantInfo: {
    flex: 1,
    minWidth: 0,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  tenantDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  tenantRent: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  tenantActions: {
    padding: 4,
    marginLeft: 8,
  },
  tenantStatusRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModalContainer: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
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
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
  actionsMenu: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  actionMenuText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 8,
  },
  deleteAction: {
    borderBottomWidth: 0,
  },
  deleteActionText: {
    color: '#ef4444',
  },
});