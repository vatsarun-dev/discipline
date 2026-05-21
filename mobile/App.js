import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const tasks = [
  { id: '1', title: 'Wake up on first alarm', time: '06:00', streak: 5, priority: 'critical' },
  { id: '2', title: 'Deep work sprint', time: '09:30', streak: 6, priority: 'critical' },
  { id: '3', title: 'Workout', time: '18:00', streak: 11, priority: 'high' }
];

export default function App() {
  const [alarmVisible, setAlarmVisible] = useState(false);
  const score = useMemo(() => 84, []);

  if (alarmVisible) {
    return <AlarmScreen onDismiss={() => setAlarmVisible(false)} />;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>DisciplineOS Mobile</Text>
          <Text style={styles.title}>Command</Text>
        </View>
        <Pressable style={styles.iconButton} onPress={() => setAlarmVisible(true)}>
          <Ionicons name="notifications" size={20} color="#e0e7ff" />
        </Pressable>
      </View>

      <View style={styles.scoreCard}>
        <Text style={styles.cardLabel}>Discipline Score</Text>
        <Text style={styles.score}>{score}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${score}%` }]} />
        </View>
      </View>

      <View style={styles.coachCard}>
        <View style={styles.row}>
          <Ionicons name="sparkles" size={18} color="#c7d2fe" />
          <Text style={styles.sectionTitle}>Military Coach</Text>
        </View>
        <Text style={styles.coachText}>
          You do not need a better mood. You need the next action done before hesitation becomes the plan.
        </Text>
        <Waveform />
      </View>

      <Text style={styles.sectionTitle}>Today&apos;s Commitments</Text>
      <View style={styles.taskList}>
        {tasks.map((task) => (
          <View key={task.id} style={styles.taskCard}>
            <View>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskMeta}>{task.time} · {task.priority}</Text>
            </View>
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={14} color="#c7d2fe" />
              <Text style={styles.streakText}>{task.streak}d</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.bottomNav}>
        {['grid', 'checkmark-circle', 'analytics', 'person'].map((icon) => (
          <Pressable key={icon} style={styles.navItem}>
            <Ionicons name={icon} size={22} color="#a1a1aa" />
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

function AlarmScreen({ onDismiss }) {
  return (
    <SafeAreaView style={styles.alarmScreen}>
      <StatusBar barStyle="light-content" />
      <Text style={styles.alarmKicker}>Fullscreen Alarm</Text>
      <View style={styles.alarmOrb}>
        <Text style={styles.alarmTime}>09:30</Text>
      </View>
      <Text style={styles.alarmTitle}>Deep work sprint</Text>
      <Text style={styles.alarmCopy}>
        This is the exact moment you planned for. Do not teach your brain that pressure means escape.
      </Text>
      <Waveform large />
      <View style={styles.alarmActions}>
        <Pressable style={styles.secondaryButton} onPress={onDismiss}>
          <Text style={styles.buttonText}>Snooze</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={onDismiss}>
          <Text style={styles.primaryButtonText}>Complete</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Waveform({ large = false }) {
  const bars = [18, 32, 22, 42, 28, 52, 26, 38, 20, 44, 30, 48];
  return (
    <View style={[styles.waveform, large && styles.waveformLarge]}>
      {bars.map((height, index) => (
        <View key={index} style={[styles.waveBar, { height: large ? height + 18 : height }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#050505',
    paddingHorizontal: 18
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 18,
    paddingTop: 10
  },
  kicker: {
    color: '#8b8b96',
    fontSize: 13
  },
  title: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800'
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(129,140,248,0.14)',
    borderColor: 'rgba(199,210,254,0.24)',
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  scoreCard: {
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    padding: 18
  },
  cardLabel: {
    color: '#9ca3af',
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: 'uppercase'
  },
  score: {
    color: '#fff',
    fontSize: 52,
    fontWeight: '800',
    marginVertical: 8
  },
  progressTrack: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    height: 10,
    overflow: 'hidden'
  },
  progressFill: {
    backgroundColor: '#c7d2fe',
    borderRadius: 999,
    height: '100%'
  },
  coachCard: {
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderColor: 'rgba(199,210,254,0.2)',
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 16,
    padding: 18
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700'
  },
  coachText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 12
  },
  waveform: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    height: 62,
    marginTop: 12
  },
  waveformLarge: {
    alignSelf: 'stretch',
    height: 96,
    justifyContent: 'center'
  },
  waveBar: {
    backgroundColor: '#c7d2fe',
    borderRadius: 999,
    flex: 1,
    maxWidth: 12
  },
  taskList: {
    gap: 10,
    marginTop: 12
  },
  taskCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14
  },
  taskTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  taskMeta: {
    color: '#8b8b96',
    marginTop: 4
  },
  streakBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  streakText: {
    color: '#fff',
    fontWeight: '700'
  },
  bottomNav: {
    alignItems: 'center',
    backgroundColor: 'rgba(17,18,20,0.96)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    bottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-around',
    left: 18,
    padding: 12,
    position: 'absolute',
    right: 18
  },
  navItem: {
    padding: 8
  },
  alarmScreen: {
    alignItems: 'center',
    backgroundColor: '#020204',
    flex: 1,
    justifyContent: 'center',
    padding: 22
  },
  alarmKicker: {
    color: '#c7d2fe',
    fontSize: 12,
    letterSpacing: 2.2,
    marginBottom: 20,
    textTransform: 'uppercase'
  },
  alarmOrb: {
    alignItems: 'center',
    backgroundColor: 'rgba(99,102,241,0.16)',
    borderColor: 'rgba(199,210,254,0.25)',
    borderRadius: 100,
    borderWidth: 1,
    height: 190,
    justifyContent: 'center',
    marginBottom: 28,
    width: 190
  },
  alarmTime: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '800'
  },
  alarmTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center'
  },
  alarmCopy: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
    maxWidth: 330,
    textAlign: 'center'
  },
  alarmActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
    width: '100%'
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    padding: 16
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(129,140,248,0.26)',
    borderColor: 'rgba(199,210,254,0.32)',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    padding: 16
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700'
  },
  primaryButtonText: {
    color: '#eef2ff',
    fontWeight: '800'
  }
});
