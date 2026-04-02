import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import api from '../lib/api';
import { uploadFile, UploadAsset } from '../lib/storage';
import Icon from '../components/Icon';

const CreateEventScreen: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
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
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
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

  useEffect(() => {
    if (!locationQuery || locationQuery.trim().length < 2) {
      setLocationResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setIsSearchingLocation(true);
        const q = encodeURIComponent(locationQuery.trim());
        // Photon API (by Komoot) — free, no key, OSM data with better fuzzy search
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${q}&limit=6&lang=en&lat=20.5937&lon=78.9629&zoom=5`,
          { signal: controller.signal }
        );
        const data = await response.json();
        if (data?.features && Array.isArray(data.features)) {
          setLocationResults(data.features);
        }
      } catch (err) {
        if ((err as any).name !== 'AbortError') {
          setLocationResults([]);
        }
      } finally {
        setIsSearchingLocation(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [locationQuery]);

  const getPhotonDisplayName = (feature: any) => {
    const p = feature.properties || {};
    const parts = [p.name, p.street, p.city || p.town || p.village, p.district, p.state, p.country].filter(Boolean);
    const unique: string[] = [];
    for (const part of parts) {
      if (!unique.includes(part)) unique.push(part);
    }
    return unique.join(', ');
  };

  const handleSelectLocation = (feature: any) => {
    const coords = feature.geometry?.coordinates; // [lng, lat]
    const displayName = getPhotonDisplayName(feature);
    setLocationQuery(displayName);
    handleChange('location', displayName);
    setLocationResults([]);
    if (coords && coords.length >= 2) {
      const longitude = Number(coords[0]);
      const latitude = Number(coords[1]);
      if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
        setSelectedCoords({ latitude, longitude });
      }
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
      <View className="flex-1 bg-surface-secondary items-center justify-center">
        <View className="items-center">
          <View
            className="h-24 w-24 rounded-full bg-success/10 items-center justify-center mb-6"
            style={{
              shadowColor: '#00C48C',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <Icon name="check_circle" className="text-success text-5xl" />
          </View>
          <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-2xl text-primary-900 mb-2">Event Created!</Text>
          <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-400">{'\u20B9'}{total.toFixed(2)} added to pending payments</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface-secondary">
      {/* Header */}
      <View
        className="bg-white px-6 py-4 flex-row items-center"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-surface-tertiary">
          <Icon name="arrow_back_ios_new" className="text-primary-900" size={18} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-lg text-primary-900 flex-1 text-center pr-10">Create Event</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        {error && (
          <View className="mx-5 mt-4 p-4 bg-error/10 rounded-2xl">
            <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-error text-sm">{error}</Text>
          </View>
        )}

        {/* Image Upload */}
        <View className="px-5 pt-4">
          <Pressable
            onPress={handleImageSelect}
            className="relative w-full aspect-[16/9] rounded-3xl bg-surface-tertiary border-2 border-dashed border-slate-200 overflow-hidden"
          >
            {imagePreview ? (
              <Image source={{ uri: imagePreview }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <View className="flex-1 items-center justify-center">
                <View className="h-14 w-14 rounded-2xl bg-accent-50 items-center justify-center mb-3">
                  <Icon name="add-photo-alternate" className="text-accent text-2xl" />
                </View>
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-sm text-slate-400">Add Event Poster</Text>
                <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-xs text-slate-300 mt-1">Recommended: 16:9 ratio</Text>
              </View>
            )}
            {imagePreview && (
              <View className="absolute bottom-3 right-3 bg-accent rounded-full p-2.5"
                style={{
                  shadowColor: '#E94560',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Icon name="edit" className="text-white text-lg" />
              </View>
            )}
          </Pressable>
        </View>

        {/* Event Basics */}
        <View className="mx-5 mt-4">
          <View
            className="bg-white rounded-3xl p-5"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 12,
              elevation: 2,
            }}
          >
            <View className="flex-row items-center gap-2 mb-4">
              <Icon name="event-note" className="text-accent text-lg" />
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900">Event Basics</Text>
            </View>
            <View className="gap-4">
              <View>
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">
                  Event Name <Text className="text-accent">*</Text>
                </Text>
                <View className="h-14 rounded-2xl bg-surface-tertiary px-4 justify-center">
                  <TextInput
                    value={formData.title}
                    onChangeText={(value) => handleChange('title', value)}
                    placeholder="e.g. Corporate Gala Night"
                    placeholderTextColor="#B8B8D0"
                    style={{ fontFamily: 'Inter_500Medium' }}
                    className="text-base text-primary-900"
                  />
                </View>
              </View>
              <View>
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">Description</Text>
                <View className="rounded-2xl bg-surface-tertiary p-4 min-h-[80px]">
                  <TextInput
                    value={formData.description}
                    onChangeText={(value) => handleChange('description', value)}
                    placeholder="Describe your event..."
                    placeholderTextColor="#B8B8D0"
                    multiline
                    style={{ fontFamily: 'Inter_500Medium' }}
                    className="text-base text-primary-900"
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Schedule */}
        <View className="mx-5 mt-3">
          <View
            className="bg-white rounded-3xl p-5"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 12,
              elevation: 2,
            }}
          >
            <View className="flex-row items-center gap-2 mb-4">
              <Icon name="schedule" className="text-accent text-lg" />
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900">Schedule</Text>
            </View>
            <View className="gap-3">
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">
                    Start Date <Text className="text-accent">*</Text>
                  </Text>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                    style={{
                      width: '100%',
                      height: 48,
                      borderRadius: 16,
                      border: 'none',
                      backgroundColor: '#F1F3F8',
                      paddingLeft: 16,
                      paddingRight: 16,
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#1A1A2E',
                      fontFamily: 'Inter',
                    }}
                  />
                </View>
                <View className="flex-1">
                  <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">End Date</Text>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleChange('endDate', e.target.value)}
                    min={formData.startDate}
                    style={{
                      width: '100%',
                      height: 48,
                      borderRadius: 16,
                      border: 'none',
                      backgroundColor: '#F1F3F8',
                      paddingLeft: 16,
                      paddingRight: 16,
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#1A1A2E',
                      fontFamily: 'Inter',
                    }}
                  />
                </View>
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">Start Time</Text>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleChange('startTime', e.target.value)}
                    style={{
                      width: '100%',
                      height: 48,
                      borderRadius: 16,
                      border: 'none',
                      backgroundColor: '#F1F3F8',
                      paddingLeft: 16,
                      paddingRight: 16,
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#1A1A2E',
                      fontFamily: 'Inter',
                    }}
                  />
                </View>
                <View className="flex-1">
                  <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">End Time</Text>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleChange('endTime', e.target.value)}
                    style={{
                      width: '100%',
                      height: 48,
                      borderRadius: 16,
                      border: 'none',
                      backgroundColor: '#F1F3F8',
                      paddingLeft: 16,
                      paddingRight: 16,
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#1A1A2E',
                      fontFamily: 'Inter',
                    }}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Location */}
        <View className="mx-5 mt-3">
          <View
            className="bg-white rounded-3xl p-5"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 12,
              elevation: 2,
            }}
          >
            <View className="flex-row items-center gap-2 mb-4">
              <Icon name="location-on" className="text-accent text-lg" />
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900">Location</Text>
            </View>
            <View className="gap-3">
              <View className="h-14 rounded-2xl bg-surface-tertiary px-4 flex-row items-center">
                <Icon name="search" className="text-slate-300 mr-2" size={18} />
                <TextInput
                  value={locationQuery}
                  onChangeText={(value) => {
                    setLocationQuery(value);
                    if (!value) {
                      handleChange('location', '');
                    }
                  }}
                  placeholder="Search location (city, area, landmark)"
                  placeholderTextColor="#B8B8D0"
                  style={{ fontFamily: 'Inter_500Medium' }}
                  className="flex-1 text-base text-primary-900"
                />
              </View>
              {isSearchingLocation && (
                <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-xs text-slate-400 px-1">Searching...</Text>
              )}
              {locationResults.length > 0 && (
                <View className="rounded-2xl bg-surface-tertiary overflow-hidden">
                  {locationResults.map((feature, idx) => {
                    const p = feature.properties || {};
                    const title = p.name || p.street || p.city || p.town || 'Unknown';
                    const subtitle = [p.city || p.town || p.village, p.district, p.state, p.country].filter(Boolean).filter(v => v !== title).join(', ');
                    return (
                      <Pressable
                        key={`${p.osm_id || idx}`}
                        onPress={() => handleSelectLocation(feature)}
                        className="px-4 py-3 border-b border-white/50 flex-row items-center gap-3"
                      >
                        <Icon name="location-on" className="text-accent text-base" />
                        <View className="flex-1">
                          <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-sm text-primary-900" numberOfLines={1}>{title}</Text>
                          {subtitle ? <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-[10px] text-slate-400 mt-0.5" numberOfLines={1}>{subtitle}</Text> : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
              <View className="rounded-2xl overflow-hidden" style={{ height: 200 }}>
                {selectedCoords ? (
                  <iframe
                    title="Event Location"
                    width="100%"
                    height="200"
                    style={{ border: 0, borderRadius: 16 }}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedCoords.longitude - 0.01},${selectedCoords.latitude - 0.01},${selectedCoords.longitude + 0.01},${selectedCoords.latitude + 0.01}&layer=mapnik&marker=${selectedCoords.latitude},${selectedCoords.longitude}`}
                  />
                ) : (
                  <View className="h-[200px] items-center justify-center bg-surface-tertiary rounded-2xl">
                    <Icon name="map" className="text-slate-200 text-3xl mb-2" />
                    <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-sm text-slate-400">Search a location to see it on the map</Text>
                  </View>
                )}
              </View>
              <View className="h-14 rounded-2xl bg-surface-tertiary px-4 justify-center">
                <TextInput
                  value={formData.venue}
                  onChangeText={(value) => handleChange('venue', value)}
                  placeholder="Venue name / Full address"
                  placeholderTextColor="#B8B8D0"
                  style={{ fontFamily: 'Inter_500Medium' }}
                  className="text-base text-primary-900"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Job Type */}
        <View className="mx-5 mt-3">
          <View
            className="bg-white rounded-3xl p-5"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 12,
              elevation: 2,
            }}
          >
            <View className="flex-row items-center gap-2 mb-4">
              <Icon name="category" className="text-accent text-lg" />
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900">Job Type</Text>
            </View>
            <View className="rounded-2xl bg-surface-tertiary overflow-hidden">
              <Picker
                selectedValue={formData.jobType}
                onValueChange={(value) => handleChange('jobType', String(value))}
                style={{ fontFamily: 'Inter' }}
              >
                <Picker.Item label="Select job type" value="" />
                {jobTypes.map((type) => (
                  <Picker.Item key={type} label={type} value={type} />
                ))}
              </Picker>
            </View>
            {formData.jobType === 'Other' && (
              <View className="h-12 rounded-2xl bg-surface-tertiary px-4 justify-center mt-3">
                <TextInput
                  value={formData.jobTypeOther}
                  onChangeText={(value) => handleChange('jobTypeOther', value)}
                  placeholder="Enter job type"
                  placeholderTextColor="#B8B8D0"
                  style={{ fontFamily: 'Inter_500Medium' }}
                  className="text-sm text-primary-900"
                />
              </View>
            )}
          </View>
        </View>

        {/* Workers */}
        <View className="mx-5 mt-3">
          <View
            className="bg-white rounded-3xl p-5"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 12,
              elevation: 2,
            }}
          >
            <View className="flex-row items-center gap-2 mb-4">
              <Icon name="group" className="text-accent text-lg" />
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900">Worker Requirements</Text>
            </View>
            <View className="gap-4">
              <View>
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-sm text-primary-900 mb-3">Male Gig Workers</Text>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">Count</Text>
                    <View className="h-12 rounded-2xl bg-surface-tertiary px-4 justify-center">
                      <TextInput
                        value={String(formData.maleCount)}
                        onChangeText={(value) => handleChange('maleCount', Number(value || 0))}
                        placeholder="0"
                        placeholderTextColor="#B8B8D0"
                        keyboardType="numeric"
                        style={{ fontFamily: 'Inter_500Medium' }}
                        className="text-sm text-primary-900"
                      />
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">Pay Each</Text>
                    <View className="h-12 rounded-2xl bg-surface-tertiary px-4 justify-center">
                      <TextInput
                        value={String(formData.malePay)}
                        onChangeText={(value) => handleChange('malePay', Number(value || 0))}
                        placeholder={'\u20B90'}
                        placeholderTextColor="#B8B8D0"
                        keyboardType="numeric"
                        style={{ fontFamily: 'Inter_500Medium' }}
                        className="text-sm text-primary-900"
                      />
                    </View>
                  </View>
                </View>
              </View>
              <View>
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-sm text-primary-900 mb-3">Female Gig Workers</Text>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">Count</Text>
                    <View className="h-12 rounded-2xl bg-surface-tertiary px-4 justify-center">
                      <TextInput
                        value={String(formData.femaleCount)}
                        onChangeText={(value) => handleChange('femaleCount', Number(value || 0))}
                        placeholder="0"
                        placeholderTextColor="#B8B8D0"
                        keyboardType="numeric"
                        style={{ fontFamily: 'Inter_500Medium' }}
                        className="text-sm text-primary-900"
                      />
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">Pay Each</Text>
                    <View className="h-12 rounded-2xl bg-surface-tertiary px-4 justify-center">
                      <TextInput
                        value={String(formData.femalePay)}
                        onChangeText={(value) => handleChange('femalePay', Number(value || 0))}
                        placeholder={'\u20B90'}
                        placeholderTextColor="#B8B8D0"
                        keyboardType="numeric"
                        style={{ fontFamily: 'Inter_500Medium' }}
                        className="text-sm text-primary-900"
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Total */}
        <View className="mx-5 mt-3">
          <View
            className="bg-white rounded-3xl p-5"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 12,
              elevation: 2,
            }}
          >
            <View className="flex-row items-center gap-2 mb-4">
              <Icon name="payments" className="text-accent text-lg" />
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900">Cost Summary</Text>
            </View>
            <View className="gap-3">
              <View className="flex-row justify-between">
                <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-400">Subtotal</Text>
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900">{'\u20B9'}{subtotal.toFixed(2)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-400">Platform Fee (13%)</Text>
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900">{'\u20B9'}{commission.toFixed(2)}</Text>
              </View>
              <View className="h-px bg-surface-tertiary" />
              <View className="flex-row justify-between">
                <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-lg text-primary-900">Total</Text>
                <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-xl text-accent">{'\u20B9'}{total.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Submit */}
        <View className="px-5 py-6">
          <Pressable
            onPress={handleSubmit}
            disabled={!isFormValid || isLoading}
            className={`w-full py-4 rounded-2xl items-center justify-center ${isFormValid && !isLoading ? 'bg-accent' : 'bg-surface-tertiary'}`}
            style={isFormValid && !isLoading ? {
              shadowColor: '#E94560',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 6,
            } : undefined}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View className="flex-row items-center gap-2">
                <Icon name="check" className={isFormValid ? 'text-white' : 'text-slate-400'} size={20} />
                <Text style={{ fontFamily: 'Inter_700Bold' }} className={`${isFormValid ? 'text-white' : 'text-slate-400'} text-lg`}>Create Event</Text>
              </View>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

export default CreateEventScreen;
