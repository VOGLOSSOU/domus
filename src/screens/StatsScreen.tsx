import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HouseDAO } from '../dao/HouseDAO';
import { TenantDAO } from '../dao/TenantDAO';
import { PaymentDAO } from '../dao/PaymentDAO';
import { HouseWithStats } from '../types';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const [stats, setStats] = useState({
    totalHouses: 0,
    totalTenants: 0,
    totalPayments: 0,
    totalRevenue: 0,
    overduePayments: 0,
    occupancyRate: 0,
  });
  const [housesStats, setHousesStats] = useState<HouseWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Load houses with stats
      const housesData = await HouseDAO.getAllWithStats();
      setHousesStats(housesData);

      // Load payments
      const payments = await PaymentDAO.getAll();

      // Calculate stats
      const totalHouses = housesData.length;
      const totalTenants = housesData.reduce((sum, house) => sum + house.tenant_count, 0);
      const totalPayments = payments.length;
      const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const overduePayments = housesData.reduce((sum, house) => sum + house.overdue_count, 0);

      // Calculate occupancy rate (simplified)
      const occupancyRate = totalTenants > 0 ? Math.round((totalTenants / (totalHouses * 4)) * 100) : 0;

      setStats({
        totalHouses,
        totalTenants,
        totalPayments,
        totalRevenue,
        overduePayments,
        occupancyRate: Math.min(occupancyRate, 100), // Cap at 100%
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle }: {
    title: string;
    value: string | number;
    icon: string;
    color: string;
    subtitle?: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statIcon}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  const ProgressBar = ({ value, max, color }: { value: number; max: number; color: string }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: color, width: `${percentage}%` }]} />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement des statistiques...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="bar-chart" size={28} color="#2563eb" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Statistiques</Text>
            <Text style={styles.headerSubtitle}>Aperçu de votre activité</Text>
          </View>
        </View>
      </View>

      {/* Main Stats */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Maisons"
          value={stats.totalHouses}
          icon="business"
          color="#2563eb"
        />
        <StatCard
          title="Locataires"
          value={stats.totalTenants}
          icon="people"
          color="#10b981"
        />
        <StatCard
          title="Paiements"
          value={stats.totalPayments}
          icon="card"
          color="#8b5cf6"
        />
        <StatCard
          title="Revenus totaux"
          value={`${stats.totalRevenue.toLocaleString()} F`}
          icon="cash"
          color="#f59e0b"
        />
      </View>

      {/* Additional Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Indicateurs clés</Text>
        <View style={styles.additionalStats}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <Text style={styles.metricTitle}>Paiements en retard</Text>
            </View>
            <Text style={styles.metricValue}>{stats.overduePayments}</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="home" size={20} color="#2563eb" />
              <Text style={styles.metricTitle}>Taux d'occupation</Text>
            </View>
            <Text style={styles.metricValue}>{stats.occupancyRate}%</Text>
            <ProgressBar value={stats.occupancyRate} max={100} color="#2563eb" />
          </View>
        </View>
      </View>

      {/* Houses Performance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance par maison</Text>
        {housesStats.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="business" size={40} color="#d1d5db" />
            <Text style={styles.emptyTitle}>Aucune maison</Text>
            <Text style={styles.emptyText}>Ajoutez des maisons pour voir les statistiques</Text>
          </View>
        ) : (
          <View style={styles.housesList}>
            {housesStats.map((house) => (
              <View key={house.id} style={styles.houseCard}>
                <View style={styles.houseHeader}>
                  <Text style={styles.houseName}>{house.name}</Text>
                  <View style={styles.houseStats}>
                    <Text style={styles.houseStat}>{house.tenant_count} locataires</Text>
                    <Text style={styles.houseRevenue}>
                      {house.total_rent.toLocaleString()} F/mois
                    </Text>
                  </View>
                </View>

                <View style={styles.houseMetrics}>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Revenus</Text>
                    <Text style={styles.metricValueSmall}>
                      {house.total_rent.toLocaleString()} F
                    </Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Occupants</Text>
                    <Text style={styles.metricValueSmall}>{house.tenant_count}</Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Retards</Text>
                    <Text style={[styles.metricValueSmall, house.overdue_count > 0 && styles.overdueText]}>
                      {house.overdue_count}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Résumé</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            Votre portefeuille immobilier compte {stats.totalHouses} maison{stats.totalHouses !== 1 ? 's' : ''} avec {stats.totalTenants} locataire{stats.totalTenants !== 1 ? 's' : ''} actifs.
            Les revenus mensuels s'élèvent à {stats.totalRevenue.toLocaleString()} F CFA.
            {stats.overduePayments > 0 && ` Attention: ${stats.overduePayments} paiement${stats.overduePayments !== 1 ? 's' : ''} en retard.`}
          </Text>
        </View>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 40 - 12) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statSubtitle: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
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
  additionalStats: {
    gap: 12,
  },
  metricCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginTop: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
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
    gap: 12,
  },
  houseCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  houseHeader: {
    marginBottom: 12,
  },
  houseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  houseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  houseStat: {
    fontSize: 12,
    color: '#6b7280',
  },
  houseRevenue: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  houseMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: '#9ca3af',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  metricValueSmall: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  overdueText: {
    color: '#ef4444',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});