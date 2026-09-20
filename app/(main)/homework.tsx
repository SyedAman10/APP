import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/APIService';
import { Ionicons } from '@expo/vector-icons';

export default function HomeworkScreen() {
  const { user } = useAuth();
  const [homework, setHomework] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const patientOrStudentId = user?.id;

  const fetchHomework = async () => {
    if (!patientOrStudentId) return;
    setLoading(true);
    try {
      const queryParam = user?.userType === 'student'
        ? `studentId=${encodeURIComponent(patientOrStudentId)}`
        : `patientId=${encodeURIComponent(patientOrStudentId)}`;
      const resp = await api.get(`/api/homework?${queryParam}`);
      if (resp.success && resp.data) {
        setHomework(resp.data.homeworks || []);
      } else {
        console.warn('Failed to fetch homework', resp.error);
      }
    } catch (err) {
      console.error('Fetch homework error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHomework(); }, [patientOrStudentId, user?.userType]);

  const updateStatus = async (id: number, status: 'completed' | 'not_understood') => {
    setUpdatingId(String(id));
    try {
      const resp = await api.patch('/api/homework', { id, status });
      if (resp.success && resp.data) {
        fetchHomework();
      } else {
        console.warn('Update failed', resp.error);
      }
    } catch (err) {
      console.error('Update error', err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#06b6d4" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Homework</Text>
      {homework.length === 0 ? (
        <View style={styles.center}><Text style={styles.empty}>No homework assigned yet.</Text></View>
      ) : (
        <FlatList
          data={homework}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const isCompleted = item.status === 'completed';

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.title || (item.type === 'voice' ? 'Voice Homework' : 'Homework')}</Text>
                  <Text style={[styles.cardStatus, isCompleted && styles.completedStatus]}>{item.status}</Text>
                </View>
                <Text style={styles.cardBody}>{item.type === 'text' ? item.content : (item.transcript || 'Voice homework')}</Text>
                {!isCompleted && (
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(item.id, 'completed')} disabled={updatingId === String(item.id)}>
                      <Ionicons name="checkmark-done" size={18} color="#fff" />
                      <Text style={styles.actionText}>Mark Completed</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.warn]} onPress={() => updateStatus(item.id, 'not_understood')} disabled={updatingId === String(item.id)}>
                      <Ionicons name="help-circle" size={18} color="#fff" />
                      <Text style={styles.actionText}>Not Understood</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#0b1020' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#e6f7f7', fontSize: 20, fontWeight: '700', marginBottom: 12 },
  empty: { color: '#94a3b8' },
  card: { backgroundColor: '#122034', padding: 12, borderRadius: 10, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { color: '#fff', fontWeight: '600' },
  cardStatus: { color: '#94a3b8', fontSize: 12 },
  completedStatus: { color: '#22c55e', fontWeight: '700' },
  cardBody: { color: '#cbd5e1', marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#06b6d4', padding: 8, borderRadius: 8, marginRight: 8 },
  warn: { backgroundColor: '#f59e0b' },
  actionText: { color: '#fff', marginLeft: 6 }
});
