import React, { useState, useEffect, useCallback } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HouseDAO } from '../dao/HouseDAO';
import { TenantDAO } from '../dao/TenantDAO';
import { House, Tenant } from '../types';

interface HouseWithTenants extends House {
  tenants: Tenant[];
  totalRent: number;
  overdueCount: number;
}

export default function HousesScreen() {
  const [houses, setHouses] = useState<HouseWithTenants[]>([]);
  const [filteredHouses, setFilteredHouses] = useState<HouseWithTenants[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState<HouseWithTenants | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [newHouseName, setNewHouseName] = useState('');
  const [newHouseAddress, setNewHouseAddress] = useState('');

  // Debounced input handlers to prevent excessive re-renders
  const handleNameChange = useCallback((text: string) => {
    setNewHouseName(text);
  }, []);

  const handleAddressChange = useCallback((text: string) => {
    setNewHouseAddress(text);
  }, []);

  useEffect(() => {
    loadHouses();
  }, []);

  useEffect(() => {
    filterHouses();
  }, [houses, searchQuery]);

  const loadHouses = async () => {
    try {
      setLoading(true);
      const housesData = await HouseDAO.getAll();

      // Load tenants for each house
      const housesWithTenants = await Promise.all(
        housesData.map(async (house) => {
          const tenants = await TenantDAO.getByHouseId(house.id);
          const totalRent = tenants.reduce((sum, tenant) => sum + tenant.rent_amount, 0);
          const overdueCount = tenants.filter(tenant => {
            // Simple logic: if no payments in current month, consider overdue
            // In a real app, this would be more sophisticated
            return false; // Placeholder
          }).length;

          return {
            ...house,
            tenants,
            totalRent,
            overdueCount,
          };
        })
      );

      setHouses(housesWithTenants);
    } catch (error) {
      console.error('Error loading houses:', error);
      Alert.alert('Erreur', 'Impossible de charger les maisons');
    } finally {
      setLoading(false);
    }
  };

  const filterHouses = () => {
    if (!searchQuery.trim()) {
      setFilteredHouses(houses);
    } else {
      const filtered = houses.filter(house =>
        house.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        house.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredHouses(filtered);
    }
  };

  const handleAddHouse = async () => {
    if (!newHouseName.trim() || !newHouseAddress.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      await HouseDAO.create({
        name: newHouseName.trim(),
        address: newHouseAddress.trim(),
      });

      setNewHouseName('');
      setNewHouseAddress('');
      setShowAddModal(false);
      loadHouses();
      Alert.alert('Succès', 'Maison ajoutée avec succès');
    } catch (error) {
      console.error('Error adding house:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter la maison');
    }
  };

  const handleDeleteHouse = (house: HouseWithTenants) => {
    Alert.alert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer "${house.name}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await HouseDAO.delete(house.id);
              loadHouses();
              Alert.alert('Succès', 'Maison supprimée');
            } catch (error) {
              console.error('Error deleting house:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la maison');
            }
          }
        }
      ]
    );
  };

  const HouseCard = ({ house }: { house: HouseWithTenants }) => (
    <TouchableOpacity
      style={styles.houseCard}
      onPress={() => setSelectedHouse(house)}
    >
      <View style={styles.houseHeader}>
        <View style={styles.houseIcon}>
          <Ionicons name="business" size={24} color="#2563eb" />
        </View>
        <View style={styles.houseInfo}>
          <Text style={styles.houseName}>{house.name}</Text>
          <Text style={styles.houseAddress}>{house.address}</Text>
        </View>
        <View style={styles.houseStats}>
          <Text style={styles.tenantCount}>{house.tenants.length}</Text>
          <Text style={styles.tenantLabel}>locataires</Text>
        </View>
      </View>

      <View style={styles.houseMetrics}>
        <View style={styles.metric}>
          <Ionicons name="cash" size={16} color="#10b981" />
          <Text style={styles.metricText}>{house.totalRent.toLocaleString()} F/mois</Text>
        </View>
        {house.overdueCount > 0 && (
          <View style={styles.metric}>
            <Ionicons name="alert-circle" size={16} color="#ef4444" />
            <Text style={styles.overdueText}>{house.overdueCount} en retard</Text>
          </View>
        )}
      </View>

      <View style={styles.houseActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setSelectedHouse(house)}
        >
          <Ionicons name="eye" size={16} color="#6b7280" />
          <Text style={styles.actionText}>Détails</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => {/* TODO: Edit functionality */}}
        >
          <Ionicons name="pencil" size={16} color="#2563eb" />
          <Text style={styles.editText}>Modifier</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteHouse(house)}
        >
          <Ionicons name="trash" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const HouseDetailsModal = () => {
    if (!selectedHouse) return null;

    return (
      <Modal
        visible={!!selectedHouse}
        animationType="slide"
        onRequestClose={() => setSelectedHouse(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedHouse(null)}>
              <Ionicons name="arrow-back" size={24} color="#2563eb" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedHouse.name}</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.houseDetailCard}>
              <Ionicons name="location" size={20} color="#6b7280" />
              <Text style={styles.houseDetailAddress}>{selectedHouse.address}</Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{selectedHouse.tenants.length}</Text>
                <Text style={styles.statLabel}>Locataires</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{selectedHouse.totalRent.toLocaleString()} F</Text>
                <Text style={styles.statLabel}>Revenus/mois</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{selectedHouse.overdueCount}</Text>
                <Text style={styles.statLabel}>En retard</Text>
              </View>
            </View>

            <Text style={styles.tenantsTitle}>Locataires</Text>
            {selectedHouse.tenants.length === 0 ? (
              <View style={styles.emptyTenants}>
                <Ionicons name="people" size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>Aucun locataire</Text>
              </View>
            ) : (
              selectedHouse.tenants.map((tenant) => (
                <View key={tenant.id} style={styles.tenantCard}>
                  <View style={styles.tenantAvatar}>
                    <Text style={styles.tenantInitial}>
                      {tenant.first_name[0]}{tenant.last_name[0]}
                    </Text>
                  </View>
                  <View style={styles.tenantInfo}>
                    <Text style={styles.tenantName}>
                      {tenant.first_name} {tenant.last_name}
                    </Text>
                    <Text style={styles.tenantRent}>
                      {tenant.rent_amount.toLocaleString()} F/mois
                    </Text>
                  </View>
                  <View style={styles.tenantStatus}>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>À jour</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const AddHouseModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowAddModal(false)}
    >
      <View style={styles.simpleModalContainer}>
        <View style={styles.simpleModalHeader}>
          <Text style={styles.simpleModalTitle}>Nouvelle maison</Text>
          <TouchableOpacity
            onPress={() => setShowAddModal(false)}
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
              value={newHouseName}
              onChangeText={handleNameChange}
              placeholder="Ex: Résidence des Fleurs"
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View style={styles.simpleFormGroup}>
            <Text style={styles.simpleFormLabel}>Adresse complète *</Text>
            <TextInput
              style={[styles.simpleFormInput, styles.simpleFormTextarea]}
              value={newHouseAddress}
              onChangeText={handleAddressChange}
              placeholder="Quartier, rue, ville..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              autoCorrect={false}
            />
          </View>

          <View style={styles.simpleFormActions}>
            <TouchableOpacity
              style={[styles.simpleFormButton, styles.simpleCancelButton]}
              onPress={() => {
                setNewHouseName('');
                setNewHouseAddress('');
                setShowAddModal(false);
              }}
            >
              <Text style={styles.simpleCancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.simpleFormButton, styles.simpleSubmitButton]}
              onPress={handleAddHouse}
            >
              <Text style={styles.simpleSubmitButtonText}>Créer la maison</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement des maisons...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes maisons</Text>
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
          placeholder="Rechercher une maison..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Houses List */}
      <FlatList
        data={filteredHouses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <HouseCard house={item} />}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="business" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'Aucune maison trouvée' : 'Aucune maison'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Essayez une autre recherche'
                : 'Commencez par ajouter votre première maison'
              }
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyAddButton}
                onPress={() => setShowAddModal(true)}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.emptyAddText}>Ajouter une maison</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <HouseDetailsModal />
      <AddHouseModal />
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
  houseCard: {
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
  houseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  houseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  houseInfo: {
    flex: 1,
  },
  houseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  houseAddress: {
    fontSize: 14,
    color: '#6b7280',
  },
  houseStats: {
    alignItems: 'center',
  },
  tenantCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  tenantLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  houseMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    fontSize: 14,
    color: '#10b981',
    marginLeft: 4,
    fontWeight: '600',
  },
  overdueText: {
    fontSize: 14,
    color: '#ef4444',
    marginLeft: 4,
    fontWeight: '600',
  },
  houseActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  actionText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#eff6ff',
  },
  editText: {
    color: '#2563eb',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
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
  houseDetailCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  houseDetailAddress: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  tenantsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  emptyTenants: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  tenantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
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
  tenantRent: {
    fontSize: 14,
    color: '#6b7280',
  },
  tenantStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#065f46',
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  formTextarea: {
    height: 80,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  formButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  submitButton: {
    backgroundColor: '#2563eb',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
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