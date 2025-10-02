import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { HouseDAO } from '../db/dao/HouseDAO';
import { TenantDAO } from '../db/dao/TenantDAO';
import { PaymentDAO } from '../db/dao/PaymentDAO';
import { HouseWithTenants } from '../types/index';
import { useAppContext } from '../context/AppContext';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { refreshTrigger, triggerRefresh } = useAppContext();
  const [stats, setStats] = useState({
    houses: 0,
    tenants: 0,
    overduePayments: 0,
    monthlyRevenue: 0,
  });
  const [houses, setHouses] = useState<HouseWithTenants[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
    }, [])
  );

  // Refresh data when global refresh is triggered
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadDashboardData();
    }
  }, [refreshTrigger]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Loading dashboard data...');

      // Load houses with tenants
      const housesData = await HouseDAO.getAll();
      console.log('Houses data loaded:', housesData.length, 'houses');

      // Load tenants for each house and calculate stats
      const housesWithStats = await Promise.all(
        housesData.map(async (house) => {
          const tenants = await TenantDAO.getByHouseId(house.id);
          const totalRent = tenants.reduce((sum, tenant) => sum + tenant.rent_amount, 0);

          // Calculate overdue payments for current month
          const currentDate = new Date();
          const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

          const overdueCount = await Promise.all(
            tenants.map(async (tenant) => {
              const entryDate = new Date(tenant.entry_date);
              const entryMonth = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`;

              if (entryMonth >= currentMonth) return false;

              const hasPayment = await PaymentDAO.isMonthPaid(tenant.id, currentMonth);
              return !hasPayment;
            })
          ).then(results => results.filter(Boolean).length);

          return {
            ...house,
            tenants,
            totalRent,
            overdueCount,
          };
        })
      );

      setHouses(housesWithStats);

      // Calculate stats
      const totalHouses = housesWithStats.length;
      const totalTenants = housesWithStats.reduce((sum, house) => sum + house.tenants.length, 0);
      const totalRevenue = housesWithStats.reduce((sum, house) => sum + house.totalRent, 0);
      const totalOverdue = housesWithStats.reduce((sum, house) => sum + house.overdueCount, 0);

      setStats({
        houses: totalHouses,
        tenants: totalTenants,
        overduePayments: totalOverdue,
        monthlyRevenue: totalRevenue,
      });

      console.log('Dashboard stats updated:', { totalHouses, totalTenants, totalRevenue, totalOverdue });
    } catch (error) {
      console.error('Error in loadDashboardData:', error);
      // Set empty state on error
      setStats({
        houses: 0,
        tenants: 0,
        overduePayments: 0,
        monthlyRevenue: 0,
      });
      setHouses([]);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color }: { title: string; value: any; icon: string; color: string }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statIcon}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{typeof value === 'number' ? value.toLocaleString() : value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="home" size={28} color="#2563eb" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>TSB</Text>
            <Text style={styles.headerSubtitle}>Gestion immobilière</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={triggerRefresh}
          >
            <Ionicons name="refresh" size={20} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitial}>A</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard title="Maisons" value={stats.houses} icon="business" color="#2563eb" />
        <StatCard title="Locataires" value={stats.tenants} icon="people" color="#10b981" />
        <StatCard title="Dernier paiement effectué" value={stats.overduePayments} icon="alert-circle" color="#ef4444" />
        <StatCard title="Revenus/mois" value={`${stats.monthlyRevenue.toLocaleString()} F`} icon="cash" color="#8b5cf6" />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#2563eb' }]}
            onPress={() => navigation.navigate('Houses' as never)}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.actionText}>Maison</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#10b981' }]}
            onPress={() => navigation.navigate('Tenants' as never)}
          >
            <Ionicons name="person-add" size={20} color="white" />
            <Text style={styles.actionText}>Locataire</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#8b5cf6' }]}
            onPress={() => navigation.navigate('Payments' as never)}
          >
            <Ionicons name="card" size={20} color="white" />
            <Text style={styles.actionText}>Paiement</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Houses List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes maisons</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {houses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="business" size={40} color="#d1d5db" />
            <Text style={styles.emptyTitle}>Aucune maison</Text>
            <Text style={styles.emptyText}>Ajoutez votre première maison</Text>
          </View>
        ) : (
          <View style={styles.housesList}>
            {houses.slice(0, 3).map((house) => (
              <TouchableOpacity
                key={house.id}
                style={styles.houseCard}
                onPress={() => navigation.navigate('Houses' as never)}
              >
                <View style={styles.houseIcon}>
                  <Ionicons name="business" size={18} color="#6b7280" />
                </View>
                <View style={styles.houseInfo}>
                  <Text style={styles.houseName} numberOfLines={1}>{house.name}</Text>
                  <Text style={styles.houseStats}>
                    {house.tenants.length} locataire{house.tenants.length !== 1 ? 's' : ''} • {house.totalRent.toLocaleString()} F
                  </Text>
                </View>
                {house.overdueCount > 0 && (
                  <View style={styles.overdueBadge}>
                    <Text style={styles.overdueText}>{house.overdueCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
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
    color: '#2563eb',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  profileButton: {
    padding: 4,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
    marginLeft: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 11,
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 4,
  },
  actionText: {
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
  housesList: {
    gap: 8,
  },
  houseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  houseIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  houseInfo: {
    flex: 1,
  },
  houseName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  houseStats: {
    fontSize: 11,
    color: '#6b7280',
  },
  overdueBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  overdueText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});