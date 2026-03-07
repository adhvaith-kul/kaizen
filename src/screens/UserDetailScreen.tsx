import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Image, Modal } from 'react-native';
import { backend } from '../services/backend';
import { DailyLog, Habit } from '../types';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import Loader from '../components/Loader';

export default function UserDetailScreen({ route, navigation }: any) {
  const { userId, username } = route.params;
  const { group } = useAuth();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      if (group?.id) {
        Promise.all([
          backend.getUserLogs(userId, group.id),
          backend.getAllHabits(userId, group.id),
          backend.getUser(userId),
        ])
          .then(([logsData, habitsData, userData]) => {
            if (isActive) {
              setLogs(logsData || []);
              setHabits(habitsData || []);
              setAvatarUrl(userData?.avatarUrl || null);
              setLoading(false);
            }
          })
          .catch(err => {
            console.error(err);
            if (isActive) {
              setLoading(false);
            }
          });
      }

      return () => {
        isActive = false;
      };
    }, [userId, group?.id]) // Safe safely dependency is group?.id
  );

  const toggleExpand = (logId: string) => {
    setExpandedLogId(prev => (prev === logId ? null : logId));
  };

  const renderLog = ({ item }: { item: { date: string; logs: DailyLog[] } }) => {
    const isExpanded = expandedLogId === item.date;
    let displayPoints = 0;

    item.logs.forEach(log => {
      const h = habits.find(habit => habit.id === log.habitId);
      if (h && group?.settings?.pointsPerCategory?.[h.category]) {
        displayPoints += Number(group.settings.pointsPerCategory[h.category]);
      } else {
        displayPoints += 10;
      }
    });

    return (
      <TouchableOpacity style={styles.logCard} activeOpacity={0.8} onPress={() => toggleExpand(item.date)}>
        <View style={styles.logHeader}>
          <Text style={styles.logDate}>{item.date}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.logPoints}>{displayPoints} pts</Text>
            <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
          </View>
        </View>
        <Text style={styles.logDetails}>
          {item.logs.length} habit{item.logs.length === 1 ? '' : 's'} completed
        </Text>

        {isExpanded && (
          <View style={styles.expandedContent}>
            {item.logs.length > 0 ? (
              item.logs.map(log => {
                const h = habits.find(habit => habit.id === log.habitId);
                const imageUrl = log.imageUrl;

                return (
                  <View key={log.id} style={styles.completedHabitRow}>
                    {imageUrl && (
                      <TouchableOpacity onPress={() => setSelectedImage(imageUrl)}>
                        <Image source={{ uri: imageUrl }} style={styles.habitImage} />
                      </TouchableOpacity>
                    )}
                    <View style={styles.habitTextContent}>
                      <View style={styles.habitInfoRow}>
                        <Text style={styles.habitCategory}>{h ? h.category.toUpperCase() : '?'}</Text>
                        <Text style={styles.habitPointValue}>
                          +{h ? group?.settings?.pointsPerCategory?.[h.category] || 10 : 0}
                        </Text>
                      </View>
                      <Text style={[styles.habitName, !h && { color: '#666', fontStyle: 'italic' }]}>
                        {h ? h.name : '(Habit changed or deleted)'}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.noHabitsText}>No habits tracked this day</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const groupedLogs = React.useMemo(() => {
    const groups: { [key: string]: DailyLog[] } = {};
    logs.forEach(log => {
      if (!groups[log.date]) groups[log.date] = [];
      groups[log.date].push(log);
    });
    return Object.entries(groups)
      .map(([date, items]) => ({ date, logs: items }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [logs]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← BACK</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={{
              uri:
                avatarUrl || `https://api.dicebear.com/9.x/micah/png?seed=${username}&backgroundColor=C2FF05&radius=50`,
            }}
            style={styles.headerAvatar}
          />
          <View>
            <Text style={styles.title}>
              <Text style={{ color: '#C2FF05' }}>{username}</Text>'s Log
            </Text>
            <Text style={styles.subtitle}>SQUAD MEMBER</Text>
          </View>
        </View>

        {loading ? (
          <Loader style={{ marginTop: 50 }} />
        ) : logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No logs yet 🍃</Text>
          </View>
        ) : (
          <FlatList
            data={groupedLogs}
            keyExtractor={item => item.date}
            renderItem={renderLog}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
      </View>

      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}>
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setSelectedImage(null)}>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.fullScreenImage} resizeMode="contain" />
          )}
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0E0E11' },
  container: { flex: 1, paddingHorizontal: 20 },
  topBar: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  backBtn: { alignSelf: 'flex-start', padding: 5, marginLeft: -5 },
  backBtnText: { color: '#888', fontWeight: '800', letterSpacing: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, marginTop: 10 },
  headerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#C2FF05',
    marginRight: 15,
  },
  title: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  subtitle: { fontSize: 10, fontWeight: '800', color: '#888', letterSpacing: 1.5, marginTop: 2 },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#666', fontSize: 18, fontWeight: '700' },
  logCard: {
    backgroundColor: '#1A1A24',
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  logDate: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  logPoints: { color: '#C2FF05', fontSize: 16, fontWeight: '900', marginRight: 8 },
  expandIcon: { color: '#666', fontSize: 12 },
  logDetails: { color: '#A0A0B0', fontSize: 14, fontWeight: '600' },
  expandedContent: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#2A2A35',
  },
  completedHabitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  habitImage: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#0A0A0F',
    borderWidth: 1,
    borderColor: '#333',
  },
  habitTextContent: {
    flex: 1,
    justifyContent: 'center',
  },
  habitInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  habitCategory: {
    fontSize: 10,
    color: '#888',
    fontWeight: '800',
    letterSpacing: 1,
    flex: 1,
    marginRight: 8,
  },
  habitPointValue: {
    fontSize: 10,
    color: '#C2FF05',
    fontWeight: '900',
    backgroundColor: 'rgba(194, 255, 5, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  habitName: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  noHabitsText: {
    color: '#666',
    fontStyle: 'italic',
    fontSize: 14,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
});
