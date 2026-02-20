import React, { useEffect, useState } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { ActivityIndicator, Dimensions, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import MapView, { Marker } from 'react-native-maps';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../lib/api';
import { uploadFile, UploadAsset } from '../lib/storage';
import Icon from '../components/Icon';
import { ScalePress } from '../components/AnimatedComponents';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_PADDING = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05));
const SECTION_GAP = 20;

const CreateEventScreen: React.FC = () => {
  const router = useRouter();
  const rawInsets = useSafeAreaInsets();
  const insets = {
    top: rawInsets?.top ?? 0,
    bottom: rawInsets?.bottom ?? 0,
    left: rawInsets?.left ?? 0,
    right: rawInsets?.right ?? 0,
  };
  const [isLoading, setIsLoading] = useState(false);
  // On Android, do not mount MapView to avoid native crash on open; use placeholder only
  const useMapOnAndroid = false;
  const [mapReady, setMapReady] = useState(Platform.OS !== 'android');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [eventImage, setEventImage] = useState<UploadAsset | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const paymentMethod: 'later' = 'later';

  const jobTypes = ['Serving', 'Volunteering', 'Security', 'Hospitality', 'Cleaning', 'Logistics', 'Other'];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    venue: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    jobType: '',
    jobTypeOther: '',
    maleCount: 0,
    femaleCount: 0,
    malePay: 0,
    femalePay: 0,
  });
  const [startDateValue, setStartDateValue] = useState<Date | null>(new Date());
  const [endDateValue, setEndDateValue] = useState<Date | null>(null);
  const [startTimeValue, setStartTimeValue] = useState<Date | null>(null);
  const [endTimeValue, setEndTimeValue] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 28.6139,
    longitude: 77.2090,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  });
  const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const calculateTotal = () => {
    const maleTotal = formData.maleCount * formData.malePay;
    const femaleTotal = formData.femaleCount * formData.femalePay;
    const subtotal = maleTotal + femaleTotal;
    const commission = subtotal * 0.13;
    return { subtotal, commission, total: subtotal + commission };
  };

  const { subtotal, commission, total } = calculateTotal();

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const formatDate = (value: Date) => value.toISOString().slice(0, 10);
  const formatDateLabel = (value: Date | null) => {
    if (!value) return '';
    return value.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };
  const formatTime = (value: Date) =>
    value.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS === 'android' && useMapOnAndroid) {
        setMapReady(false);
        const t = setTimeout(() => setMapReady(true), 800);
        return () => {
          clearTimeout(t);
          setMapReady(false);
        };
      }
    }, [])
  );

  useEffect(() => {
    if (!locationQuery || locationQuery.trim().length < 3) {
      setLocationResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setIsSearchingLocation(true);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(locationQuery)}`,
          { signal: controller.signal }
        );
        const data = await response.json();
        if (Array.isArray(data)) {
          setLocationResults(data);
        }
      } catch (err) {
        if ((err as any).name !== 'AbortError') {
          setLocationResults([]);
        }
      } finally {
        setIsSearchingLocation(false);
      }
    }, 500);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [locationQuery]);

  const handleSelectLocation = (item: any) => {
    const latitude = Number(item.lat);
    const longitude = Number(item.lon);
    setLocationQuery(item.display_name);
    handleChange('location', item.display_name);
    setLocationResults([]);
    if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
      setSelectedCoords({ latitude, longitude });
      setMapRegion(prev => ({
        ...prev,
        latitude,
        longitude,
      }));
    }
  };

  const handleMapPress = async (coords: { latitude: number; longitude: number }) => {
    setSelectedCoords(coords);
    setMapRegion(prev => ({
      ...prev,
      latitude: coords.latitude,
      longitude: coords.longitude,
    }));
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`
      );
      const data = await response.json();
      if (data?.display_name) {
        setLocationQuery(data.display_name);
        handleChange('location', data.display_name);
      }
    } catch {
      // Ignore reverse geocode failure
    }
  };

  const handleImageSelect = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', multiple: false });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setEventImage({ uri: asset.uri, name: asset.name || 'event.jpg', mimeType: asset.mimeType || 'image/jpeg' });
      setImagePreview(asset.uri);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      setError('Event name is required');
      return;
    }
    if (!formData.startDate) {
      setError('Start date is required');
      return;
    }
    if (formData.maleCount === 0 && formData.femaleCount === 0) {
      setError('Please add at least one gig worker');
      return;
    }

    setIsLoading(true);
    setError('');

    let imageUrl = '';
    if (eventImage) {
      const uploadResult = await uploadFile(eventImage);
      if (uploadResult.success && uploadResult.fileUrl) {
        imageUrl = uploadResult.fileUrl;
      } else {
        setError(uploadResult.error || 'Failed to upload image. Please try again.');
        setIsLoading(false);
        return;
      }
    }

    const finalJobType = formData.jobType === 'Other' ? formData.jobTypeOther.trim() : formData.jobType;
    const latitude = selectedCoords?.latitude ?? null;
    const longitude = selectedCoords?.longitude ?? null;
    const result = await api.createEvent({
      title: formData.title,
      description: formData.description,
      location: formData.location,
      venue: formData.venue,
      eventDate: formData.startDate,
      endDate: formData.endDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      jobType: finalJobType,
      imageUrl,
      maleCount: formData.maleCount,
      femaleCount: formData.femaleCount,
      malePay: formData.malePay,
      femalePay: formData.femalePay,
      paymentMethod,
      subtotal,
      commission,
      total,
      latitude,
      longitude,
    });

    if (result.data) {
      setSuccess(true);
      setTimeout(() => {
        router.replace('/organizer');
      }, 1200);
    } else {
      setError(result.error || 'Failed to create event');
    }

    setIsLoading(false);
  };

  const isFormValid = formData.title && formData.startDate && (formData.maleCount > 0 || formData.femaleCount > 0);

  if (success) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center px-8">
        <View className="items-center">
          <View className="h-20 w-20 rounded-full bg-emerald-100 items-center justify-center mb-5">
            <Icon name="check_circle" className="text-emerald-500 text-5xl" />
          </View>
          <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-xl text-slate-900 mb-2 text-center">Event created</Text>
          <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-500 text-sm text-center">₹{total.toFixed(2)} added to pending payments</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-slate-100" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View className="bg-white flex-row items-center border-b border-slate-200/80" style={{ paddingTop: insets.top + 12, paddingBottom: 14, paddingHorizontal: CARD_PADDING }}>
        <ScalePress onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
          <Icon name="arrow_back_ios_new" className="text-slate-600 text-lg" />
        </ScalePress>
        <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-base text-slate-900 flex-1 text-center">
          Create Event
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: SECTION_GAP, paddingBottom: 48 + insets.bottom + 100, paddingHorizontal: CARD_PADDING }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View className="mb-4 p-4 bg-red-50 rounded-xl border border-red-100">
            <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-red-600 text-sm">{error}</Text>
          </View>
        )}

        {/* Event poster */}
        <ScalePress onPress={handleImageSelect} className="mb-5">
          <View className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm" style={{ shadowOpacity: 0.06, elevation: 2 }}>
            <View className="w-full aspect-[16/9] bg-slate-100">
              {imagePreview ? (
                <Image source={{ uri: imagePreview }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <View className="flex-1 items-center justify-center p-6">
                  <View className="h-14 w-14 rounded-full bg-primary/10 items-center justify-center mb-3">
                    <Icon name="add-photo-alternate" className="text-primary text-3xl" />
                  </View>
                  <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-slate-600 text-sm">Add event poster</Text>
                  <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-400 text-xs mt-1">Tap to upload image</Text>
                </View>
              )}
            </View>
            {imagePreview && (
              <View className="absolute bottom-3 right-3 rounded-full bg-primary p-2.5">
                <Icon name="edit" className="text-white text-base" />
              </View>
            )}
          </View>
        </ScalePress>

        {/* Event basics card */}
        <View className="bg-white rounded-2xl p-4 mb-5 border border-slate-200/80 shadow-sm" style={{ shadowOpacity: 0.04, elevation: 2 }}>
          <View className="flex-row items-center gap-2 mb-4">
            <Icon name="description" className="text-primary text-xl" />
            <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-slate-800 text-sm">Event basics</Text>
          </View>
          <TextInput
            value={formData.title}
            onChangeText={(v) => handleChange('title', v)}
            placeholder="Event name *"
            placeholderTextColor="#94a3b8"
            className="rounded-xl border border-slate-200 bg-slate-50 h-12 px-4 text-slate-900 text-base mb-3"
            style={{ fontFamily: 'Inter_500Medium' }}
          />
          <TextInput
            value={formData.description}
            onChangeText={(v) => handleChange('description', v)}
            placeholder="Description (optional)"
            placeholderTextColor="#94a3b8"
            multiline
            className="rounded-xl border border-slate-200 bg-slate-50 min-h-[88px] p-4 text-slate-900 text-base"
            style={{ fontFamily: 'Inter_500Medium', textAlignVertical: 'top' }}
          />
        </View>

        {/* Schedule card — date & time side by side */}
        <View className="bg-white rounded-2xl p-4 mb-5 border border-slate-200/80 shadow-sm" style={{ shadowOpacity: 0.04, elevation: 2 }}>
          <View className="flex-row items-center gap-2 mb-4">
            <Icon name="schedule" className="text-primary text-xl" />
            <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-slate-800 text-sm">Schedule</Text>
          </View>
          {/* Date row */}
          <View className="flex-row gap-3 mb-3">
            <ScalePress onPress={() => setShowStartDatePicker(true)} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 h-14 px-4 justify-center">
              <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-[10px] text-slate-400 uppercase tracking-wide">Start date</Text>
              <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-slate-800 text-sm mt-0.5" numberOfLines={1}>
                {startDateValue ? formatDateLabel(startDateValue) : 'Select'}
              </Text>
            </ScalePress>
            <ScalePress onPress={() => setShowEndDatePicker(true)} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 h-14 px-4 justify-center">
              <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-[10px] text-slate-400 uppercase tracking-wide">End date</Text>
              <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-slate-800 text-sm mt-0.5" numberOfLines={1}>
                {endDateValue ? formatDateLabel(endDateValue) : 'Optional'}
              </Text>
            </ScalePress>
          </View>
          {/* Time row — side by side */}
          <View className="flex-row gap-3">
            <ScalePress onPress={() => setShowStartTimePicker(true)} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 h-14 px-4 justify-center">
              <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-[10px] text-slate-400 uppercase tracking-wide">Start time</Text>
              <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-slate-800 text-sm mt-0.5">
                {formData.startTime || 'Select'}
              </Text>
            </ScalePress>
            <ScalePress onPress={() => setShowEndTimePicker(true)} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 h-14 px-4 justify-center">
              <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-[10px] text-slate-400 uppercase tracking-wide">End time</Text>
              <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-slate-800 text-sm mt-0.5">
                {formData.endTime || 'Optional'}
              </Text>
            </ScalePress>
          </View>
        </View>

        {showStartDatePicker && (
          <DateTimePicker
            value={startDateValue || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={new Date()}
            onChange={(event, date) => {
              if (Platform.OS !== 'ios') setShowStartDatePicker(false);
              if (date) {
                setStartDateValue(date);
                handleChange('startDate', formatDate(date));
                if (endDateValue && endDateValue < date) {
                  setEndDateValue(null);
                  handleChange('endDate', '');
                }
              }
            }}
          />
        )}
        {showEndDatePicker && (
          <DateTimePicker
            value={endDateValue || startDateValue || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={startDateValue || new Date()}
            onChange={(event, date) => {
              if (Platform.OS !== 'ios') setShowEndDatePicker(false);
              if (date) {
                setEndDateValue(date);
                handleChange('endDate', formatDate(date));
              }
            }}
          />
        )}
        {showStartTimePicker && (
          <DateTimePicker
            value={startTimeValue || new Date()}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
            onChange={(event, date) => {
              setShowStartTimePicker(false);
              if (date) {
                setStartTimeValue(date);
                handleChange('startTime', formatTime(date));
              }
            }}
          />
        )}
        {showEndTimePicker && (
          <DateTimePicker
            value={endTimeValue || startTimeValue || new Date()}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
            onChange={(event, date) => {
              setShowEndTimePicker(false);
              if (date) {
                setEndTimeValue(date);
                handleChange('endTime', formatTime(date));
              }
            }}
          />
        )}

        {/* Location card */}
        <View className="bg-white rounded-2xl p-4 mb-5 border border-slate-200/80 shadow-sm" style={{ shadowOpacity: 0.04, elevation: 2 }}>
          <View className="flex-row items-center gap-2 mb-4">
            <Icon name="location-on" className="text-primary text-xl" />
            <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-slate-800 text-sm">Location</Text>
          </View>
          <TextInput
            value={locationQuery}
            onChangeText={(v) => {
              setLocationQuery(v);
              if (!v) handleChange('location', '');
            }}
            placeholder="Search city, area or landmark"
            placeholderTextColor="#94a3b8"
            className="rounded-xl border border-slate-200 bg-slate-50 h-12 px-4 text-slate-900 text-base mb-3"
            style={{ fontFamily: 'Inter_500Medium' }}
          />
          {isSearchingLocation && (
            <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-400 text-xs mb-2">Searching...</Text>
          )}
          {locationResults.length > 0 && (
            <View className="rounded-xl border border-slate-200 overflow-hidden mb-3">
              {locationResults.map((item) => (
                <ScalePress key={`${item.place_id}`} onPress={() => handleSelectLocation(item)} className="px-4 py-3 border-b border-slate-100 bg-white">
                  <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-700 text-sm" numberOfLines={2}>{item.display_name}</Text>
                </ScalePress>
              ))}
            </View>
          )}
          <View className="rounded-xl overflow-hidden border border-slate-200" style={{ height: 200 }}>
            {Platform.OS === 'android' && !useMapOnAndroid ? (
              <View className="flex-1 bg-slate-100 items-center justify-center" style={{ height: 200 }}>
                <Icon name="location_on" className="text-slate-400 text-3xl mb-2" />
                <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-500 text-sm text-center px-4">
                  Use search above to set location. Map not shown on this device.
                </Text>
              </View>
            ) : mapReady ? (
              <MapView
                style={{ height: 200, width: '100%' }}
                region={mapRegion}
                onRegionChangeComplete={setMapRegion}
                onPress={(e) => handleMapPress(e.nativeEvent.coordinate)}
              >
                {selectedCoords && <Marker coordinate={selectedCoords} />}
              </MapView>
            ) : (
              <View className="flex-1 bg-slate-100 items-center justify-center" style={{ height: 200 }}>
                <ActivityIndicator size="small" color="#008080" />
              </View>
            )}
          </View>
          <TextInput
            value={formData.venue}
            onChangeText={(v) => handleChange('venue', v)}
            placeholder="Venue name / full address"
            placeholderTextColor="#94a3b8"
            className="rounded-xl border border-slate-200 bg-slate-50 h-12 px-4 text-slate-900 text-base mt-3"
            style={{ fontFamily: 'Inter_500Medium' }}
          />
        </View>

        {/* Job type card */}
        <View className="bg-white rounded-2xl p-4 mb-5 border border-slate-200/80 shadow-sm" style={{ shadowOpacity: 0.04, elevation: 2 }}>
          <View className="flex-row items-center gap-2 mb-3">
            <Icon name="work" className="text-primary text-xl" />
            <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-slate-800 text-sm">Job type</Text>
          </View>
          <View className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
            <Picker
              selectedValue={formData.jobType}
              onValueChange={(v) => handleChange('jobType', String(v))}
              style={{ height: 48 }}
            >
              <Picker.Item label="Select job type" value="" />
              {jobTypes.map((type) => (
                <Picker.Item key={type} label={type} value={type} />
              ))}
            </Picker>
          </View>
          {formData.jobType === 'Other' && (
            <TextInput
              value={formData.jobTypeOther}
              onChangeText={(v) => handleChange('jobTypeOther', v)}
              placeholder="Specify job type"
              placeholderTextColor="#94a3b8"
              className="rounded-xl border border-slate-200 bg-slate-50 h-12 px-4 text-slate-900 text-sm mt-3"
              style={{ fontFamily: 'Inter_500Medium' }}
            />
          )}
        </View>

        {/* Worker requirements card */}
        <View className="bg-white rounded-2xl p-4 mb-5 border border-slate-200/80 shadow-sm" style={{ shadowOpacity: 0.04, elevation: 2 }}>
          <View className="flex-row items-center gap-2 mb-4">
            <Icon name="groups" className="text-primary text-xl" />
            <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-slate-800 text-sm">Worker requirements</Text>
          </View>
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-slate-500 text-xs mb-1.5">Male — count</Text>
              <TextInput
                value={String(formData.maleCount)}
                onChangeText={(v) => handleChange('maleCount', Number(v) || 0)}
                placeholder="0"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                className="rounded-xl border border-slate-200 bg-slate-50 h-12 px-4 text-slate-900"
                style={{ fontFamily: 'Inter_600SemiBold' }}
              />
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-slate-500 text-xs mb-1.5">Male — pay (₹)</Text>
              <TextInput
                value={String(formData.malePay)}
                onChangeText={(v) => handleChange('malePay', Number(v) || 0)}
                placeholder="0"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                className="rounded-xl border border-slate-200 bg-slate-50 h-12 px-4 text-slate-900"
                style={{ fontFamily: 'Inter_600SemiBold' }}
              />
            </View>
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-slate-500 text-xs mb-1.5">Female — count</Text>
              <TextInput
                value={String(formData.femaleCount)}
                onChangeText={(v) => handleChange('femaleCount', Number(v) || 0)}
                placeholder="0"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                className="rounded-xl border border-slate-200 bg-slate-50 h-12 px-4 text-slate-900"
                style={{ fontFamily: 'Inter_600SemiBold' }}
              />
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-slate-500 text-xs mb-1.5">Female — pay (₹)</Text>
              <TextInput
                value={String(formData.femalePay)}
                onChangeText={(v) => handleChange('femalePay', Number(v) || 0)}
                placeholder="0"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                className="rounded-xl border border-slate-200 bg-slate-50 h-12 px-4 text-slate-900"
                style={{ fontFamily: 'Inter_600SemiBold' }}
              />
            </View>
          </View>
        </View>

        {/* Total summary card */}
        <View className="bg-white rounded-2xl p-4 mb-5 border border-slate-200/80 shadow-sm" style={{ shadowOpacity: 0.04, elevation: 2 }}>
          <View className="flex-row justify-between mb-2">
            <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-500 text-sm">Subtotal</Text>
            <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-slate-800">₹{subtotal.toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-500 text-sm">Platform fee (13%)</Text>
            <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-slate-800">₹{commission.toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between pt-3 border-t border-slate-200">
            <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-slate-900 text-base">Total</Text>
            <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-primary text-xl">₹{total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Submit */}
        <ScalePress
          onPress={handleSubmit}
          disabled={!isFormValid || isLoading}
          className={`w-full py-4 rounded-2xl items-center justify-center ${isFormValid && !isLoading ? 'bg-primary' : 'bg-slate-200'}`}
          style={isFormValid && !isLoading ? { shadowColor: '#008080', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 } : undefined}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View className="flex-row items-center gap-2">
              <Text style={{ fontFamily: 'Inter_700Bold' }} className={isFormValid ? 'text-white text-base' : 'text-slate-500 text-base'}>Create event</Text>
              {isFormValid && <Icon name="check_circle" className="text-white text-xl" />}
            </View>
          )}
        </ScalePress>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreateEventScreen;
