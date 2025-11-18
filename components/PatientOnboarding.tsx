import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDatabase } from '@/contexts/DatabaseContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface PatientOnboardingProps {
  onComplete: () => void;
}

export const PatientOnboarding: React.FC<PatientOnboardingProps> = ({ onComplete }) => {
  const { createNewPatient } = useDatabase();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dateOfBirth: '',
    therapeuticGoals: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Required Field', 'Please enter your name to continue.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createNewPatient({
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        dateOfBirth: formData.dateOfBirth.trim() || undefined,
        therapeuticGoals: formData.therapeuticGoals.trim() || undefined,
      });
      
      onComplete();
    } catch (error) {
      console.error('Failed to create patient:', error);
      Alert.alert(
        'Error',
        'Failed to save your information. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Welcome to LMN8 KTC
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Your Sacred Space for Therapeutic Growth
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.formContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Let's Get Started
          </ThemedText>
          <ThemedText style={styles.description}>
            This information helps us create your personalized therapeutic experience. 
            All data is stored locally on your device and encrypted for your privacy.
          </ThemedText>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Full Name *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              placeholder="Enter your full name"
              placeholderTextColor="#666"
              autoFocus
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Email (Optional)</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              placeholder="Enter your email address"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Date of Birth (Optional)</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.dateOfBirth}
              onChangeText={(value) => updateFormData('dateOfBirth', value)}
              placeholder="MM/DD/YYYY"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Therapeutic Goals (Optional)</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.therapeuticGoals}
              onChangeText={(value) => updateFormData('therapeuticGoals', value)}
              placeholder="What would you like to work on? (e.g., anxiety, depression, personal growth)"
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Creating Your Space...' : 'Begin My Journey'}
            </Text>
          </TouchableOpacity>

          <ThemedText style={styles.privacyNote}>
            Your information is stored locally on your device and encrypted. 
            We respect your privacy and data never leaves your device.
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#7f8c8d',
    lineHeight: 22,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    color: '#2c3e50',
  },
  description: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
    marginBottom: 25,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#2c3e50',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fafafa',
    color: '#2c3e50',
  },
  textArea: {
    height: 80,
    paddingTop: 15,
  },
  submitButton: {
    backgroundColor: '#3498db',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  privacyNote: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center',
    lineHeight: 16,
    fontStyle: 'italic',
  },
});
