import { LMN8Colors, LMN8Spacing, LMN8Typography } from '@/constants/LMN8DesignSystem';
import { journalAPI, JournalEntryCreateRequest } from '@/services/APIService';
import { OCRService } from '@/services/OCRService';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

type MediaType = 'text' | 'photo' | 'handwritten' | 'voice';

interface EntryFormData {
  title: string;
  content: string;
  mood?: number;
  imageUri?: string;
  transcribedText?: string;
  audioUri?: string;
  audioDuration?: number;
}

export default function NewEntryScreen() {
  const router = useRouter();
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType>('text');
  const [formData, setFormData] = useState<EntryFormData>({
    title: '',
    content: '',
    mood: undefined,
    imageUri: undefined,
    transcribedText: undefined,
    audioUri: undefined,
    audioDuration: undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [recording, sound]);

  const mediaTypes: { 
    type: MediaType; 
    icon: keyof typeof Ionicons.glyphMap; 
    label: string; 
    description: string;
    color: string;
  }[] = [
    {
      type: 'text',
      icon: 'document-text-outline',
      label: 'Written',
      description: 'Express yourself through words',
      color: LMN8Colors.accentPrimary,
    },
    {
      type: 'voice',
      icon: 'mic-outline',
      label: 'Voice Memo',
      description: 'Record your thoughts aloud',
      color: '#f59e0b',
    },
    {
      type: 'photo',
      icon: 'image-outline',
      label: 'Visual',
      description: 'Capture a moment in time',
      color: LMN8Colors.accentSecondary,
    },
    {
      type: 'handwritten',
      icon: 'brush-outline',
      label: 'Handwritten',
      description: 'Journal entry with transcription',
      color: LMN8Colors.accentHighlight,
    },
  ];

  const handleMediaTypeSelect = (type: MediaType) => {
    setSelectedMediaType(type);
  };

  const handleInputChange = (field: keyof EntryFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Request camera/gallery permissions
   */
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    return { cameraStatus, galleryStatus };
  };

  /**
   * Pick an image from the gallery
   */
  const pickImageFromGallery = async () => {
    try {
      const { galleryStatus } = await requestPermissions();
      
      if (galleryStatus !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 0.5, // Reduced quality to stay under 1MB limit
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        console.log('📷 Image selected:', imageUri);
        
        setFormData(prev => ({ ...prev, imageUri }));
        
        // If handwritten type, automatically run OCR
        if (selectedMediaType === 'handwritten') {
          await extractTextFromImage(imageUri);
        }
      }
    } catch (error) {
      console.error('❌ Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  /**
   * Take a photo with the camera
   */
  const takePhoto = async () => {
    try {
      const { cameraStatus } = await requestPermissions();
      
      if (cameraStatus !== 'granted') {
        Alert.alert('Permission Required', 'Please allow camera access to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.5, // Reduced quality to stay under 1MB limit
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        console.log('📷 Photo taken:', imageUri);
        
        setFormData(prev => ({ ...prev, imageUri }));
        
        // If handwritten type, automatically run OCR
        if (selectedMediaType === 'handwritten') {
          await extractTextFromImage(imageUri);
        }
      }
    } catch (error) {
      console.error('❌ Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  /**
   * Compress and resize image to stay under 1MB limit
   */
  const compressImage = async (imageUri: string): Promise<string> => {
    try {
      console.log('🔧 Compressing image...');
      
      // Resize and compress the image
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1200 } }], // Resize to max width of 1200px
        {
          compress: 0.7, // Compress to 70% quality
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      
      console.log('✅ Image compressed:', manipulatedImage.uri);
      return manipulatedImage.uri;
    } catch (error) {
      console.error('❌ Failed to compress image:', error);
      return imageUri; // Return original if compression fails
    }
  };

  /**
   * Extract text from image using OCR
   */
  const extractTextFromImage = async (imageUri: string) => {
    setIsProcessingOCR(true);
    
    try {
      console.log('🔍 Extracting text from image...');
      
      // Compress image before sending to OCR
      const compressedUri = await compressImage(imageUri);
      
      const result = await OCRService.extractTextFromImage(compressedUri);
      
      if (result.success && result.text) {
        console.log('✅ Text extracted successfully');
        setFormData(prev => ({ ...prev, transcribedText: result.text }));
        
        Alert.alert(
          'Text Extracted!',
          'Text has been successfully extracted from your image. You can edit it below.',
          [{ text: 'OK' }]
        );
      } else {
        console.error('❌ OCR failed:', result.error);
        Alert.alert(
          'OCR Failed',
          result.error || 'Could not extract text from the image. You can still add notes manually.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Exception during OCR:', error);
      Alert.alert('Error', 'An error occurred while processing the image.');
    } finally {
      setIsProcessingOCR(false);
    }
  };

  /**
   * Show image picker options
   */
  const showImagePickerOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add your image',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Gallery',
          onPress: pickImageFromGallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  /**
   * Request audio recording permissions
   */
  const requestAudioPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow microphone access to record voice memos.');
        return false;
      }
      return true;
    } catch (error) {
      console.error('❌ Error requesting audio permission:', error);
      return false;
    }
  };

  /**
   * Start recording audio
   */
  const startRecording = async () => {
    try {
      const hasPermission = await requestAudioPermission();
      if (!hasPermission) return;

      // Stop any playing audio
      if (sound) {
        await sound.stopAsync();
        setIsPlaying(false);
      }

      console.log('🎤 Starting recording...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      console.log('🎤 Recording started');
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  /**
   * Stop recording audio
   */
  const stopRecording = async () => {
    if (!recording) return;

    try {
      console.log('⏹️ Stopping recording...');
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      const duration = status.durationMillis ? status.durationMillis / 1000 : 0;

      console.log('✅ Recording stopped:', uri, 'Duration:', duration, 'seconds');
      
      if (uri) {
        setFormData(prev => ({ 
          ...prev, 
          audioUri: uri,
          audioDuration: duration,
        }));
      }

      setRecording(null);
    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  /**
   * Delete recorded audio
   */
  const deleteAudio = () => {
    Alert.alert(
      'Delete Recording?',
      'Are you sure you want to delete this voice memo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            if (sound) {
              await sound.stopAsync();
              await sound.unloadAsync();
              setSound(null);
            }
            setIsPlaying(false);
            setFormData(prev => ({ 
              ...prev, 
              audioUri: undefined,
              audioDuration: undefined,
            }));
          }
        },
      ]
    );
  };

  /**
   * Play/pause audio
   */
  const togglePlayback = async () => {
    try {
      if (!formData.audioUri) return;

      if (sound && isPlaying) {
        // Pause
        console.log('⏸️ Pausing playback');
        await sound.pauseAsync();
        setIsPlaying(false);
      } else if (sound && !isPlaying) {
        // Resume
        console.log('▶️ Resuming playback');
        await sound.playAsync();
        setIsPlaying(true);
      } else {
        // Start new playback
        console.log('▶️ Starting playback');
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: formData.audioUri },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded && status.didJustFinish) {
              setIsPlaying(false);
            }
          }
        );
        setSound(newSound);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('❌ Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio.');
    }
  };

  /**
   * Upload audio file from device
   */
  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('🎵 Audio file selected:', asset.uri);
        
        setFormData(prev => ({ 
          ...prev, 
          audioUri: asset.uri,
          audioDuration: 0, // Duration will be set on playback
        }));
      }
    } catch (error) {
      console.error('❌ Error picking audio file:', error);
      Alert.alert('Error', 'Failed to select audio file.');
    }
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your entry');
      return false;
    }
    
    // For handwritten/photo entries, we need either an image or content
    if (selectedMediaType === 'handwritten' || selectedMediaType === 'photo') {
      if (!formData.imageUri && !formData.content.trim()) {
        Alert.alert('Missing Content', 'Please add an image or some content to your entry');
        return false;
      }
    } else {
      // For text entries, content is required
      if (!formData.content.trim()) {
        Alert.alert('Missing Content', 'Please add some content to your entry');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Prepare entry data for API
      const entryData: JournalEntryCreateRequest = {
        title: formData.title,
        content: formData.content,
        mediaType: selectedMediaType,
        mood: formData.mood,
        // Include image URI if present (backend will need to handle file upload)
        mediaUrl: formData.imageUri,
        // Include transcribed text for handwritten entries
        transcribedText: formData.transcribedText,
      };

      console.log('📝 Creating journal entry:', entryData);
      
      // Call the API to create the entry
      const response = await journalAPI.createEntry(entryData);

      if (response.success && response.data) {
        console.log('✅ Entry created successfully:', response.data);
        
        Alert.alert(
          'Entry Saved',
          'Your journal entry has been saved successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        console.error('❌ Failed to create entry:', response.error);
        Alert.alert(
          'Error',
          response.error || 'Failed to save your entry. Please try again.'
        );
      }
    } catch (error) {
      console.error('❌ Exception while creating entry:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (formData.title || formData.content) {
      Alert.alert(
        'Discard Changes?',
        'Are you sure you want to discard this entry?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const renderMediaTypeSelector = () => (
    <View style={styles.mediaTypeSection}>
      <Text style={styles.sectionTitle}>How would you like to journal?</Text>
      <Text style={styles.sectionDescription}>
        Choose the format that feels right for this moment
      </Text>
      
      <View style={styles.mediaTypeGrid}>
        {mediaTypes.map((mediaType) => {
          const isSelected = selectedMediaType === mediaType.type;
          return (
            <TouchableOpacity
              key={mediaType.type}
              style={styles.mediaTypeCard}
              onPress={() => handleMediaTypeSelect(mediaType.type)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={
                  isSelected
                    ? [`${mediaType.color}25`, `${mediaType.color}15`]
                    : [`${LMN8Colors.container}98`, `${LMN8Colors.container}95`]
                }
                style={[
                  styles.mediaTypeGradient,
                  isSelected && { borderColor: mediaType.color },
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              >
                <View style={[
                  styles.mediaTypeIconContainer,
                  { backgroundColor: `${mediaType.color}${isSelected ? '20' : '10'}` }
                ]}>
                  <Ionicons 
                    name={mediaType.icon} 
                    size={28} 
                    color={isSelected ? mediaType.color : LMN8Colors.text85} 
                  />
                </View>
                <Text style={[
                  styles.mediaTypeLabel,
                  isSelected && { color: mediaType.color },
                ]}>
                  {mediaType.label}
                </Text>
                <Text style={[
                  styles.mediaTypeDescription,
                  isSelected && { color: LMN8Colors.text85 },
                ]}>
                  {mediaType.description}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

    const renderTextEntryForm = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Text Entry</Text>
      
      {/* Title Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Title</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Give your entry a meaningful title"
          placeholderTextColor={LMN8Colors.text60}
          value={formData.title}
          onChangeText={(value) => handleInputChange('title', value)}
        />
      </View>

      {/* Content Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Content</Text>
        <TextInput
          style={[styles.textInput, styles.textInputMultiline]}
          placeholder="Write your thoughts, feelings, or reflections..."
          placeholderTextColor={LMN8Colors.text60}
          value={formData.content}
          onChangeText={(value) => handleInputChange('content', value)}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      {/* Mood Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Mood (Optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Rate your mood from 1-10"
          placeholderTextColor={LMN8Colors.text60}
          value={formData.mood?.toString() || ''}
          onChangeText={(value) => {
            const numValue = parseInt(value);
            handleInputChange('mood', isNaN(numValue) ? 0 : numValue);
          }}
          keyboardType="numeric"
        />
        <Text style={styles.helperText}>1 = Very Low, 10 = Very High</Text>
      </View>
    </View>
  );

  const renderPhotoEntryForm = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Photo Entry</Text>
      
      {/* Title Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Title</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Give your photo entry a meaningful title"
          placeholderTextColor={LMN8Colors.text60}
          value={formData.title}
          onChangeText={(value) => handleInputChange('title', value)}
        />
      </View>

      {/* Image Upload Buttons */}
      {!formData.imageUri && (
        <View style={styles.photoUploadContainer}>
          <TouchableOpacity 
            style={styles.photoUploadButton}
            onPress={takePhoto}
          >
            <Ionicons name="camera-outline" size={28} color={LMN8Colors.text100} />
            <Text style={styles.photoUploadText}>Take Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.photoUploadButton}
            onPress={pickImageFromGallery}
          >
            <Ionicons name="images-outline" size={28} color={LMN8Colors.text100} />
            <Text style={styles.photoUploadText}>Choose Gallery</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Display Selected Image */}
      {formData.imageUri && (
        <View style={styles.selectedImageContainer}>
          <Image 
            source={{ uri: formData.imageUri }} 
            style={styles.selectedImage}
            resizeMode="cover"
          />
          <TouchableOpacity 
            style={styles.changeImageButton}
            onPress={showImagePickerOptions}
          >
            <Ionicons name="refresh-outline" size={20} color={LMN8Colors.text100} />
            <Text style={styles.changeImageText}>Change Photo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Description Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Description</Text>
        <TextInput
          style={[styles.textInput, styles.textInputMultiline]}
          placeholder="Describe what this photo means to you..."
          placeholderTextColor={LMN8Colors.text60}
          value={formData.content}
          onChangeText={(value) => handleInputChange('content', value)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Mood Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Mood (Optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Rate your mood from 1-10"
          placeholderTextColor={LMN8Colors.text60}
          value={formData.mood?.toString() || ''}
          onChangeText={(value) => {
            const numValue = parseInt(value);
            handleInputChange('mood', isNaN(numValue) ? 0 : numValue);
          }}
          keyboardType="numeric"
        />
        <Text style={styles.helperText}>1 = Very Low, 10 = Very High</Text>
      </View>
    </View>
  );

  const renderHandwrittenEntryForm = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Handwritten Entry</Text>
      
      {/* Title Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Title</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Give your handwritten entry a meaningful title"
          placeholderTextColor={LMN8Colors.text60}
          value={formData.title}
          onChangeText={(value) => handleInputChange('title', value)}
        />
      </View>

      <View style={styles.handwrittenContainer}>
        <View style={styles.handwrittenInstructions}>
          <Ionicons name="information-circle-outline" size={20} color={LMN8Colors.accentPrimary} style={{ marginBottom: 8 }} />
          <Text style={styles.handwrittenInstructionsText}>
            Take a photo of your handwritten journal entry. The app will automatically extract the text for searchability.
          </Text>
        </View>
        
        {/* Image Upload Button */}
        {!formData.imageUri && (
          <TouchableOpacity 
            style={styles.photoUploadButton}
            onPress={showImagePickerOptions}
          >
            <Ionicons name="camera-outline" size={28} color={LMN8Colors.text100} />
            <Text style={styles.photoUploadText}>Capture Entry</Text>
          </TouchableOpacity>
        )}

        {/* Display Selected Image */}
        {formData.imageUri && (
          <View style={styles.selectedImageContainer}>
            <Image 
              source={{ uri: formData.imageUri }} 
              style={styles.selectedImage}
              resizeMode="cover"
            />
            <TouchableOpacity 
              style={styles.changeImageButton}
              onPress={showImagePickerOptions}
            >
              <Ionicons name="refresh-outline" size={20} color={LMN8Colors.text100} />
              <Text style={styles.changeImageText}>Change Image</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* OCR Processing Indicator */}
        {isProcessingOCR && (
          <View style={styles.ocrProcessingContainer}>
            <ActivityIndicator size="large" color={LMN8Colors.accentPrimary} />
            <Text style={styles.ocrProcessingText}>Extracting text from image...</Text>
          </View>
        )}

        {/* Display Extracted Text */}
        {formData.transcribedText && !isProcessingOCR && (
          <View style={styles.transcribedTextContainer}>
            <View style={styles.transcribedHeader}>
              <Ionicons name="text-outline" size={18} color={LMN8Colors.accentSecondary} />
              <Text style={styles.transcribedLabel}>Extracted Text</Text>
            </View>
            <TextInput
              style={[styles.textInput, styles.textInputMultiline]}
              value={formData.transcribedText}
              onChangeText={(value) => handleInputChange('transcribedText', value)}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholder="Extracted text will appear here..."
              placeholderTextColor={LMN8Colors.text60}
            />
            <Text style={styles.helperText}>You can edit the extracted text above</Text>
          </View>
        )}
      </View>

      {/* Additional Notes Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
        <TextInput
          style={[styles.textInput, styles.textInputMultiline]}
          placeholder="Add any additional thoughts or context..."
          placeholderTextColor={LMN8Colors.text60}
          value={formData.content}
          onChangeText={(value) => handleInputChange('content', value)}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Mood Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Mood (Optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Rate your mood from 1-10"
          placeholderTextColor={LMN8Colors.text60}
          value={formData.mood?.toString() || ''}
          onChangeText={(value) => {
            const numValue = parseInt(value);
            handleInputChange('mood', isNaN(numValue) ? 0 : numValue);
          }}
          keyboardType="numeric"
        />
        <Text style={styles.helperText}>1 = Very Low, 10 = Very High</Text>
      </View>
    </View>
  );

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderVoiceMemoForm = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Voice Memo Entry</Text>
      
      {/* Title Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Title</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Give your voice memo a meaningful title"
          placeholderTextColor={LMN8Colors.text60}
          value={formData.title}
          onChangeText={(value) => handleInputChange('title', value)}
        />
      </View>

      {/* Voice Recorder Section */}
      <View style={styles.voiceRecorderContainer}>
        <View style={styles.voiceInstructions}>
          <Ionicons name="mic" size={24} color="#f59e0b" style={{ marginBottom: 8 }} />
          <Text style={styles.voiceInstructionsText}>
            {formData.audioUri 
              ? 'Voice memo recorded! You can play it back or record a new one.'
              : 'Record your thoughts aloud or upload an existing audio file.'}
          </Text>
        </View>

        {/* Recording/Audio Not Present */}
        {!formData.audioUri && !isRecording && (
          <View style={styles.voiceActionsContainer}>
            <TouchableOpacity 
              style={styles.voiceActionButton}
              onPress={startRecording}
            >
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                style={styles.voiceActionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="mic" size={32} color="#fff" />
                <Text style={styles.voiceActionText}>Start Recording</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.orDivider}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>

            <TouchableOpacity 
              style={styles.voiceActionButton}
              onPress={pickAudioFile}
            >
              <LinearGradient
                colors={[`${LMN8Colors.accentSecondary}90`, `${LMN8Colors.accentSecondary}70`]}
                style={styles.voiceActionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="cloud-upload-outline" size={32} color={LMN8Colors.text100} />
                <Text style={styles.voiceActionText}>Upload Audio File</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Recording in Progress */}
        {isRecording && (
          <View style={styles.recordingContainer}>
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingPulse} />
              <Ionicons name="mic" size={48} color="#ef4444" />
            </View>
            <Text style={styles.recordingText}>Recording...</Text>
            <Text style={styles.recordingHint}>Tap the button below to stop</Text>
            
            <TouchableOpacity 
              style={styles.stopRecordingButton}
              onPress={stopRecording}
            >
              <View style={styles.stopIcon} />
              <Text style={styles.stopRecordingText}>Stop Recording</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Audio Player */}
        {formData.audioUri && !isRecording && (
          <View style={styles.audioPlayerContainer}>
            <View style={styles.audioPlayer}>
              <TouchableOpacity 
                style={styles.playButton}
                onPress={togglePlayback}
              >
                <LinearGradient
                  colors={['#f59e0b', '#d97706']}
                  style={styles.playButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons 
                    name={isPlaying ? "pause" : "play"} 
                    size={28} 
                    color="#fff" 
                  />
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.audioInfo}>
                <View style={styles.audioWaveform}>
                  <Ionicons name="analytics" size={24} color="#f59e0b" />
                  <Text style={styles.audioStatusText}>
                    {isPlaying ? 'Playing...' : 'Ready to play'}
                  </Text>
                </View>
                {formData.audioDuration !== undefined && formData.audioDuration > 0 && (
                  <Text style={styles.audioDuration}>
                    {formatDuration(formData.audioDuration)}
                  </Text>
                )}
              </View>

              <TouchableOpacity 
                style={styles.deleteAudioButton}
                onPress={deleteAudio}
              >
                <Ionicons name="trash-outline" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>

            <View style={styles.reRecordContainer}>
              <TouchableOpacity 
                style={styles.reRecordButton}
                onPress={startRecording}
              >
                <Ionicons name="mic-outline" size={18} color={LMN8Colors.text85} />
                <Text style={styles.reRecordText}>Record New</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.reRecordButton}
                onPress={pickAudioFile}
              >
                <Ionicons name="cloud-upload-outline" size={18} color={LMN8Colors.text85} />
                <Text style={styles.reRecordText}>Upload Different</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Additional Notes Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
        <TextInput
          style={[styles.textInput, styles.textInputMultiline]}
          placeholder="Add any additional context or thoughts..."
          placeholderTextColor={LMN8Colors.text60}
          value={formData.content}
          onChangeText={(value) => handleInputChange('content', value)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Mood Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Mood (Optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Rate your mood from 1-10"
          placeholderTextColor={LMN8Colors.text60}
          value={formData.mood?.toString() || ''}
          onChangeText={(value) => {
            const numValue = parseInt(value);
            handleInputChange('mood', isNaN(numValue) ? 0 : numValue);
          }}
          keyboardType="numeric"
        />
        <Text style={styles.helperText}>1 = Very Low, 10 = Very High</Text>
      </View>
    </View>
  );

  const renderFormByMediaType = () => {
    switch (selectedMediaType) {
      case 'text':
        return renderTextEntryForm();
      case 'voice':
        return renderVoiceMemoForm();
      case 'photo':
        return renderPhotoEntryForm();
      case 'handwritten':
        return renderHandwrittenEntryForm();
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Background with gradient overlay */}
      <LinearGradient
        colors={[
          LMN8Colors.bgDark,
          '#1e1e3f',
          LMN8Colors.bgDark,
          '#2a1a4e',
          LMN8Colors.bgDark
        ]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Floating background elements */}
      <View style={styles.floatingElement1} />
      <View style={styles.floatingElement2} />
      <View style={styles.floatingElement3} />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
            <Ionicons name="arrow-back" size={24} color={LMN8Colors.text85} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="create-outline" size={32} color={LMN8Colors.accentPrimary} />
            </View>
            <Text style={styles.title}>New Entry</Text>
            <Text style={styles.subtitle}>
              Take a moment to reflect and document your journey
            </Text>
          </View>
        </View>

        {/* Media Type Selector */}
        {renderMediaTypeSelector()}

        {/* Dynamic Form */}
        {renderFormByMediaType()}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.cancelButtonNew}
            onPress={handleCancel}
          >
            <Ionicons name="close-circle-outline" size={20} color={LMN8Colors.text85} />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.submitButtonNew}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={[LMN8Colors.accentPrimary, `${LMN8Colors.accentPrimary}CC`]}
              style={styles.submitButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isSubmitting ? (
                <Text style={styles.submitButtonText}>Saving...</Text>
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color={LMN8Colors.text100} />
                  <Text style={styles.submitButtonText}>Save Entry</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LMN8Colors.bgDark,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: LMN8Spacing.xl,
    paddingTop: 60,
  },

  // Floating background elements
  floatingElement1: {
    position: 'absolute',
    top: height * 0.15,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: `${LMN8Colors.accentPrimary}06`,
    opacity: 0.4,
  },

  floatingElement2: {
    position: 'absolute',
    top: height * 0.5,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: `${LMN8Colors.accentSecondary}04`,
    opacity: 0.3,
  },

  floatingElement3: {
    position: 'absolute',
    bottom: height * 0.15,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: `${LMN8Colors.accentHighlight}05`,
    opacity: 0.25,
  },

  // Header
  header: {
    marginBottom: LMN8Spacing.xxl,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${LMN8Colors.container}80`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: LMN8Spacing.lg,
  },

  headerContent: {
    alignItems: 'center',
  },

  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${LMN8Colors.accentPrimary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: LMN8Spacing.md,
  },

  title: {
    ...LMN8Typography.h1,
    fontSize: 28,
    fontWeight: '600',
    color: LMN8Colors.text100,
    marginBottom: LMN8Spacing.sm,
    textAlign: 'center',
  },

  subtitle: {
    ...LMN8Typography.body,
    fontSize: 14,
    fontWeight: '300',
    color: LMN8Colors.text60,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: LMN8Spacing.md,
  },

  // Media Type Section
  mediaTypeSection: {
    marginBottom: LMN8Spacing.xxl,
  },

  sectionTitle: {
    ...LMN8Typography.h2,
    fontSize: 20,
    fontWeight: '600',
    color: LMN8Colors.text100,
    marginBottom: LMN8Spacing.sm,
  },

  sectionDescription: {
    ...LMN8Typography.body,
    fontSize: 14,
    fontWeight: '300',
    color: LMN8Colors.text60,
    marginBottom: LMN8Spacing.lg,
    lineHeight: 22,
  },

  mediaTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: LMN8Spacing.md,
  },

  mediaTypeCard: {
    width: '48%',
    borderRadius: 18,
    overflow: 'hidden',
  },

  mediaTypeGradient: {
    padding: LMN8Spacing.lg,
    paddingVertical: LMN8Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: `${LMN8Colors.accentPrimary}15`,
    height: 140,
  },

  mediaTypeIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: LMN8Spacing.sm,
  },

  mediaTypeLabel: {
    ...LMN8Typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: LMN8Colors.text100,
    textAlign: 'center',
    marginBottom: 4,
  },

  mediaTypeDescription: {
    ...LMN8Typography.caption,
    fontSize: 10,
    fontWeight: '300',
    color: LMN8Colors.text60,
    textAlign: 'center',
    lineHeight: 13,
    paddingHorizontal: 2,
    height: 26,
  },

  // Form Section
  formSection: {
    marginBottom: LMN8Spacing.xxl,
  },

  // Input Styles
  inputContainer: {
    marginBottom: LMN8Spacing.lg,
  },

  inputLabel: {
    ...LMN8Typography.label,
    fontSize: 12,
    fontWeight: '600',
    color: LMN8Colors.text85,
    marginBottom: LMN8Spacing.sm,
    letterSpacing: 0.5,
  },

  textInput: {
    ...LMN8Typography.body,
    backgroundColor: `${LMN8Colors.container}95`,
    borderWidth: 1,
    borderColor: `${LMN8Colors.accentPrimary}20`,
    borderRadius: 16,
    padding: LMN8Spacing.lg,
    color: LMN8Colors.text100,
    fontSize: 15,
    minHeight: 52,
  },

  textInputMultiline: {
    minHeight: 120,
    paddingTop: LMN8Spacing.lg,
    textAlignVertical: 'top',
  },

  helperText: {
    ...LMN8Typography.metadata,
    fontSize: 11,
    color: LMN8Colors.text60,
    marginTop: LMN8Spacing.xs,
    paddingHorizontal: LMN8Spacing.sm,
  },

  photoUploadContainer: {
    flexDirection: 'row',
    gap: LMN8Spacing.md,
    marginBottom: LMN8Spacing.lg,
  },

  photoUploadButton: {
    flex: 1,
    backgroundColor: `${LMN8Colors.accentSecondary}90`,
    borderRadius: 16,
    padding: LMN8Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${LMN8Colors.accentSecondary}40`,
    gap: LMN8Spacing.sm,
  },

  photoUploadText: {
    ...LMN8Typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: LMN8Colors.text100,
    textAlign: 'center',
  },

  handwrittenContainer: {
    marginBottom: LMN8Spacing.lg,
  },

  handwrittenInstructions: {
    alignItems: 'center',
    marginBottom: LMN8Spacing.lg,
    padding: LMN8Spacing.lg,
    backgroundColor: `${LMN8Colors.container}80`,
    borderRadius: 16,
    borderLeftWidth: 3,
    borderLeftColor: LMN8Colors.accentPrimary,
  },

  handwrittenInstructionsText: {
    ...LMN8Typography.body,
    fontSize: 14,
    fontWeight: '300',
    color: LMN8Colors.text85,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: LMN8Spacing.md,
    marginTop: LMN8Spacing.xl,
  },

  cancelButtonNew: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${LMN8Colors.container}90`,
    borderRadius: 16,
    padding: LMN8Spacing.lg,
    borderWidth: 1,
    borderColor: `${LMN8Colors.text60}30`,
    gap: LMN8Spacing.sm,
  },

  cancelButtonText: {
    ...LMN8Typography.body,
    fontSize: 15,
    fontWeight: '600',
    color: LMN8Colors.text85,
  },

  submitButtonNew: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },

  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: LMN8Spacing.lg,
    gap: LMN8Spacing.sm,
  },

  submitButtonText: {
    ...LMN8Typography.body,
    fontSize: 15,
    fontWeight: '600',
    color: LMN8Colors.text100,
  },

  cancelButton: {
    flex: 1,
  },

  submitButton: {
    flex: 1,
  },

  bottomPadding: {
    height: 40,
  },

  // Image Selection Styles
  selectedImageContainer: {
    marginVertical: LMN8Spacing.lg,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: `${LMN8Colors.container}90`,
    borderWidth: 1,
    borderColor: `${LMN8Colors.accentPrimary}20`,
  },

  selectedImage: {
    width: '100%',
    height: 300,
    backgroundColor: LMN8Colors.bgLight,
  },

  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: LMN8Spacing.md,
    backgroundColor: `${LMN8Colors.accentSecondary}20`,
    gap: LMN8Spacing.sm,
  },

  changeImageText: {
    ...LMN8Typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: LMN8Colors.text100,
  },

  // OCR Processing Styles
  ocrProcessingContainer: {
    alignItems: 'center',
    padding: LMN8Spacing.xl,
    backgroundColor: `${LMN8Colors.container}80`,
    borderRadius: 16,
    marginVertical: LMN8Spacing.lg,
    borderWidth: 1,
    borderColor: `${LMN8Colors.accentPrimary}20`,
  },

  ocrProcessingText: {
    ...LMN8Typography.body,
    fontSize: 14,
    fontWeight: '300',
    color: LMN8Colors.text85,
    marginTop: LMN8Spacing.md,
    textAlign: 'center',
  },

  // Transcribed Text Styles
  transcribedTextContainer: {
    marginVertical: LMN8Spacing.lg,
    padding: LMN8Spacing.lg,
    backgroundColor: `${LMN8Colors.bgLight}60`,
    borderRadius: 16,
    borderLeftWidth: 3,
    borderLeftColor: LMN8Colors.accentSecondary,
  },

  transcribedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: LMN8Spacing.sm,
    gap: LMN8Spacing.xs,
  },

  transcribedLabel: {
    ...LMN8Typography.label,
    fontSize: 12,
    fontWeight: '600',
    color: LMN8Colors.accentSecondary,
    letterSpacing: 0.8,
  },

  // Voice Memo Styles
  voiceRecorderContainer: {
    marginBottom: LMN8Spacing.lg,
  },

  voiceInstructions: {
    alignItems: 'center',
    marginBottom: LMN8Spacing.lg,
    padding: LMN8Spacing.lg,
    backgroundColor: `${LMN8Colors.container}80`,
    borderRadius: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },

  voiceInstructionsText: {
    ...LMN8Typography.body,
    fontSize: 14,
    fontWeight: '300',
    color: LMN8Colors.text85,
    textAlign: 'center',
    lineHeight: 22,
  },

  voiceActionsContainer: {
    gap: LMN8Spacing.lg,
  },

  voiceActionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },

  voiceActionGradient: {
    padding: LMN8Spacing.xl,
    alignItems: 'center',
    gap: LMN8Spacing.sm,
  },

  voiceActionText: {
    ...LMN8Typography.body,
    fontSize: 16,
    fontWeight: '600',
    color: LMN8Colors.text100,
  },

  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: LMN8Spacing.sm,
  },

  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: `${LMN8Colors.text60}30`,
  },

  orText: {
    ...LMN8Typography.caption,
    color: LMN8Colors.text60,
    paddingHorizontal: LMN8Spacing.md,
    fontSize: 12,
    fontWeight: '600',
  },

  recordingContainer: {
    alignItems: 'center',
    padding: LMN8Spacing.xxl,
    backgroundColor: `${LMN8Colors.container}90`,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ef4444',
  },

  recordingIndicator: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `#ef444420`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: LMN8Spacing.lg,
    position: 'relative',
  },

  recordingPulse: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ef4444',
    opacity: 0.3,
  },

  recordingText: {
    ...LMN8Typography.h2,
    fontSize: 20,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: LMN8Spacing.xs,
  },

  recordingHint: {
    ...LMN8Typography.caption,
    fontSize: 13,
    color: LMN8Colors.text60,
    marginBottom: LMN8Spacing.xl,
  },

  stopRecordingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LMN8Spacing.sm,
    backgroundColor: '#ef4444',
    paddingHorizontal: LMN8Spacing.xl,
    paddingVertical: LMN8Spacing.md,
    borderRadius: 12,
  },

  stopIcon: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 4,
  },

  stopRecordingText: {
    ...LMN8Typography.body,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  audioPlayerContainer: {
    gap: LMN8Spacing.md,
  },

  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: LMN8Spacing.lg,
    backgroundColor: `${LMN8Colors.container}95`,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f59e0b40',
    gap: LMN8Spacing.md,
  },

  playButton: {
    borderRadius: 28,
    overflow: 'hidden',
  },

  playButtonGradient: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },

  audioInfo: {
    flex: 1,
    gap: LMN8Spacing.xs,
  },

  audioWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LMN8Spacing.xs,
  },

  audioStatusText: {
    ...LMN8Typography.body,
    fontSize: 15,
    fontWeight: '500',
    color: LMN8Colors.text100,
  },

  audioDuration: {
    ...LMN8Typography.caption,
    fontSize: 13,
    color: LMN8Colors.text60,
    fontWeight: '600',
  },

  deleteAudioButton: {
    padding: LMN8Spacing.sm,
  },

  reRecordContainer: {
    flexDirection: 'row',
    gap: LMN8Spacing.md,
  },

  reRecordButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: LMN8Spacing.xs,
    padding: LMN8Spacing.md,
    backgroundColor: `${LMN8Colors.container}80`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${LMN8Colors.accentPrimary}20`,
  },

  reRecordText: {
    ...LMN8Typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: LMN8Colors.text85,
  },
});
