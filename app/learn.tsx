import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '../lib/LocationContext';
import api from '../lib/api';
import { Bookmark, X, ArrowRight, ChevronRight, BookOpen } from 'lucide-react-native';

const { width } = Dimensions.get('window');

// --- Constants & Helpers ---

const CALENDAR_EXPLAINERS: Record<string, string> = {
  gregorian: "The civil standard, tracking the solar year.",
  mayan: "A sacred count of 260 days, weaving time and destiny.",
  chinese: "Tracks months by the moon, corrected by the sun.",
  hebrew: "Lunisolar rhythm aligning festivals with seasons.",
  islamic: "Pure lunar count, drifting through the solar year.",
};

const CALENDAR_TYPES: Record<string, string> = {
  gregorian: "Civil",
  mayan: "Sacred",
  chinese: "Lunisolar",
  hebrew: "Lunisolar",
  islamic: "Lunar",
};

// --- Components ---

function SystemCard({ id, name, onPress }: { id: string, name: string, onPress: () => void }) {
  const type = CALENDAR_TYPES[id] || 'System';
  const explainer = CALENDAR_EXPLAINERS[id] || 'A traditional system of timekeeping.';

  return (
    <TouchableOpacity style={styles.systemCard} onPress={onPress} activeOpacity={0.9}>
      <View>
        <View style={styles.systemHeader}>
          <Text style={styles.systemName}>{name}</Text>
          <View style={styles.systemTypeTag}>
            <Text style={styles.systemTypeText}>{type}</Text>
          </View>
        </View>
        <Text style={styles.systemExplainer}>{explainer}</Text>
      </View>
      
      <View style={styles.rotateCue}>
        <Text style={styles.rotateText}>Rotate lens</Text>
        <ArrowRight size={14} color="rgba(255,255,255,0.6)" />
      </View>
    </TouchableOpacity>
  );
}

function ArtifactCard({ artifact, onSave, isSaved }: { artifact: any, onSave: () => void, isSaved: boolean }) {
  if (!artifact) return null;

  return (
    <View style={styles.artifactCard}>
      <View style={styles.artifactHeader}>
        <View style={styles.artifactTag}>
          <Text style={styles.artifactTagText}>{artifact.region || 'Wisdom'}</Text>
        </View>
        <TouchableOpacity onPress={onSave}>
          <Bookmark 
            size={22} 
            color={isSaved ? "#FFFFFF" : "rgba(255,255,255,0.4)"} 
            fill={isSaved ? "#FFFFFF" : "none"}
          />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.artifactTitle}>{artifact.title}</Text>
      <Text style={styles.artifactSummary}>{artifact.summary}</Text>
      
      <View style={styles.whySurfaced}>
        <Text style={styles.whyText}>Surfaced for today's coherent field.</Text>
      </View>
    </View>
  );
}

function LivingCard({ item }: { item: any }) {
  return (
    <TouchableOpacity style={styles.livingCard} activeOpacity={0.8}>
      <View>
        <Text style={styles.livingTitle}>{item.title}</Text>
        <Text style={styles.livingSummary}>{item.summary}</Text>
      </View>
      <Text style={styles.whyNow}>{item.why_now}</Text>
    </TouchableOpacity>
  );
}

function SavedStrip({ count }: { count: number }) {
  if (count === 0) return null;
  
  return (
    <TouchableOpacity style={styles.savedStrip} activeOpacity={0.9}>
      <View style={styles.savedContent}>
        <BookOpen size={16} color="#FFFFFF" />
        <Text style={styles.savedText}>{count} saved item{count !== 1 ? 's' : ''}</Text>
      </View>
      <ChevronRight size={16} color="rgba(255,255,255,0.4)" />
    </TouchableOpacity>
  );
}

export default function LearnScreen() {
  const { coordinates, timezone } = useLocation();
  const [calendars, setCalendars] = useState<any>(null);
  const [culture, setCulture] = useState<any[]>([]);
  const [living, setLiving] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  
  // Detail Modal State
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [calData, cultureData, livingData] = await Promise.all([
          api.getTraditionalCalendars(coordinates.lat, coordinates.lng, timezone)
            .catch(() => null),
          api.getCulturalContent(1) // Just one featured
            .catch(() => []),
          api.getLivingCalendars()
            .catch(() => [])
        ]);

        setCalendars(calData);
        setCulture(cultureData);
        setLiving(livingData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [coordinates, timezone]);

  const handleSave = (id: string) => {
    setSavedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getSystemDetails = (key: string) => {
    if (!calendars || !calendars[key]) return null;
    return calendars[key];
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Calendar Systems</Text>
        
        {/* 1. Calendar Systems Carousel */}
        <View style={styles.carouselContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.carouselScroll}
            decelerationRate="fast"
            snapToInterval={width * 0.85 + 12}
          >
            {calendars && Object.entries(calendars).map(([key, val]: [string, any]) => (
              <SystemCard 
                key={key} 
                id={key} 
                name={val?.name || key} // Fallback if name is missing in API
                onPress={() => setSelectedSystem(key)} 
              />
            ))}
          </ScrollView>
        </View>

        {/* 2. Artifact of the Day */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ARTIFACT OF THE DAY</Text>
          {culture.length > 0 ? (
            <ArtifactCard 
              artifact={culture[0]} 
              isSaved={savedIds.includes(culture[0].id || 'art1')}
              onSave={() => handleSave(culture[0].id || 'art1')}
            />
          ) : (
            <View style={styles.fallbackCard}>
              <Text style={styles.fallbackText}>No artifact surfaced today.</Text>
            </View>
          )}
        </View>

        {/* 3. Living Calendar */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LIVING CALENDAR</Text>
          {living.map((item, i) => (
            <LivingCard key={i} item={item} />
          ))}
        </View>

      </ScrollView>

      {/* 4. Saved Strip */}
      <SavedStrip count={savedIds.length} />

      {/* Detail Bottom Sheet (Modal) */}
      <Modal
        visible={!!selectedSystem}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedSystem(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setSelectedSystem(null)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedSystem(null)}>
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            {selectedSystem && calendars && calendars[selectedSystem] && (
              <View style={styles.modalBody}>
                <Text style={styles.modalTitle}>Today in {selectedSystem}</Text>
                <View style={styles.modalDateContainer}>
                  {selectedSystem === 'mayan' && (
                    <>
                      <Text style={styles.modalDateMain}>{calendars[selectedSystem].tzolkin?.dayNumber} {calendars[selectedSystem].tzolkin?.dayName}</Text>
                      <Text style={styles.modalDateSub}>{calendars[selectedSystem].tzolkin?.meaning}</Text>
                    </>
                  )}
                  {selectedSystem === 'chinese' && (
                    <>
                      <Text style={styles.modalDateMain}>{calendars[selectedSystem].year} Year</Text>
                      <Text style={styles.modalDateSub}>{calendars[selectedSystem].element} Element</Text>
                    </>
                  )}
                  {(selectedSystem === 'hebrew' || selectedSystem === 'islamic') && (
                    <Text style={styles.modalDateMain}>{calendars[selectedSystem].day} {calendars[selectedSystem].month}, {calendars[selectedSystem].year}</Text>
                  )}
                   {selectedSystem === 'gregorian' && (
                    <Text style={styles.modalDateMain}>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                  )}
                </View>
                
                <Text style={styles.modalDescription}>
                  {CALENDAR_EXPLAINERS[selectedSystem]} This system offers a unique lens on the passage of time, emphasizing {CALENDAR_TYPES[selectedSystem].toLowerCase()} rhythms.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingBottom: 100,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // Carousel
  carouselContainer: {
    marginBottom: 32,
  },
  carouselScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  systemCard: {
    width: width * 0.85,
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    padding: 24,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  systemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  systemName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  systemTypeTag: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  systemTypeText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  systemExplainer: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 24,
    maxWidth: '90%',
  },
  rotateCue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rotateText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  // Artifact
  artifactCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  artifactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  artifactTag: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  artifactTagText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  artifactTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    lineHeight: 28,
  },
  artifactSummary: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 24,
    marginBottom: 20,
  },
  whySurfaced: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 16,
  },
  whyText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
  },
  fallbackCard: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  fallbackText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
  // Living Calendar
  livingCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFFFFF',
  },
  livingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  livingSummary: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
    marginBottom: 12,
  },
  whyNow: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
  },
  // Saved Strip
  savedStrip: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#222',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  savedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  savedText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: -4,
  },
  modalBody: {
    gap: 16,
  },
  modalTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 1,
  },
  modalDateContainer: {
    marginBottom: 8,
  },
  modalDateMain: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modalDateSub: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
  },
  modalDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 24,
  },
});
