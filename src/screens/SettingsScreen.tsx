import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HouseDAO } from '../db/dao/HouseDAO';
import { TenantDAO } from '../db/dao/TenantDAO';
import { PaymentDAO } from '../db/dao/PaymentDAO';
import { RoomDAO } from '../db/dao/RoomDAO';

export default function SettingsScreen() {
  const [showResetModal, setShowResetModal] = useState(false);

  const handleResetData = async () => {
    try {
      // Delete all data
      await PaymentDAO.getAll().then(payments =>
        Promise.all(payments.map(p => PaymentDAO.delete(p.id)))
      );

      await TenantDAO.getAll().then(tenants =>
        Promise.all(tenants.map(t => TenantDAO.delete(t.id)))
      );

      await RoomDAO.getAll().then(rooms =>
        Promise.all(rooms.map(r => RoomDAO.delete(r.id)))
      );

      await HouseDAO.getAll().then(houses =>
        Promise.all(houses.map(h => HouseDAO.delete(h.id)))
      );

      setShowResetModal(false);
      Alert.alert(
        'Succès',
        'Toutes les données ont été supprimées.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error resetting data:', error);
      Alert.alert('Erreur', 'Impossible de supprimer les données.');
    }
  };

  const handleRefreshData = async () => {
    try {
      // Force refresh by re-querying all data
      await Promise.all([
        HouseDAO.getAll(),
        TenantDAO.getAll(),
        PaymentDAO.getAll(),
        RoomDAO.getAll()
      ]);

      Alert.alert(
        'Succès',
        'Les données ont été actualisées.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert('Erreur', 'Impossible d\'actualiser les données.');
    }
  };

  const confirmReset = () => {
    Alert.alert(
      'Attention',
      'Cette action va supprimer définitivement toutes vos données (maisons, locataires, paiements). Cette action est irréversible.\n\nÊtes-vous sûr de vouloir continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => setShowResetModal(true) },
      ]
    );
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    destructive = false
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    destructive?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, destructive && styles.destructiveIcon]}>
          <Ionicons
            name={icon as any}
            size={20}
            color={destructive ? '#ef4444' : '#2563eb'}
          />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, destructive && styles.destructiveText]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.settingSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="settings" size={28} color="#2563eb" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Paramètres</Text>
            <Text style={styles.headerSubtitle}>Configuration de l'application</Text>
          </View>
        </View>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>À propos</Text>
        <View style={styles.infoCard}>
          <Text style={styles.appName}>TSB</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appDescription}>
            Application de gestion immobilière pour maisons en location
          </Text>
        </View>
      </View>

      {/* Data Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gestion des données</Text>
        <SettingItem
          icon="refresh"
          title="Actualiser les données"
          subtitle="Recharger toutes les données depuis la base"
          onPress={handleRefreshData}
        />
        <SettingItem
          icon="trash"
          title="Nettoyer toutes les données"
          subtitle="Supprimer définitivement toutes les maisons, locataires et paiements"
          onPress={confirmReset}
          destructive={true}
        />
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Préférences</Text>
        <SettingItem
          icon="notifications"
          title="Notifications"
          subtitle="Gérer les rappels de paiement"
          onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')}
        />
        <SettingItem
          icon="moon"
          title="Thème"
          subtitle="Mode sombre/clair"
          onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')}
        />
        <SettingItem
          icon="language"
          title="Langue"
          subtitle="Français"
          onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')}
        />
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <SettingItem
          icon="help-circle"
          title="Aide"
          subtitle="Guide d'utilisation"
          onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')}
        />
        <SettingItem
          icon="mail"
          title="Contact"
          subtitle="Support technique"
          onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')}
        />
        <SettingItem
          icon="information-circle"
          title="À propos"
          subtitle="Informations sur l'application"
          onPress={() => Alert.alert('À propos', 'TSB v1.0.0\nApplication de gestion immobilière')}
        />
      </View>

      {/* Reset Modal */}
      <Modal
        visible={showResetModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowResetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.resetModal}>
            <View style={styles.resetIcon}>
              <Ionicons name="warning" size={32} color="#ef4444" />
            </View>
            <Text style={styles.resetTitle}>Confirmer la suppression</Text>
            <Text style={styles.resetText}>
              Cette action va supprimer définitivement toutes vos données.
              Cette opération est irréversible.
            </Text>
            <View style={styles.resetActions}>
              <TouchableOpacity
                style={[styles.resetButton, styles.cancelButton]}
                onPress={() => setShowResetModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.resetButton, styles.confirmButton]}
                onPress={handleResetData}
              >
                <Text style={styles.confirmButtonText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
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
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  appDescription: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  destructiveIcon: {
    backgroundColor: '#fef2f2',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  destructiveText: {
    color: '#ef4444',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resetModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  resetIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  resetText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  resetActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  confirmButton: {
    backgroundColor: '#ef4444',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});