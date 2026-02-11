import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import MapView, { Marker } from 'react-native-maps';
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
  const [startDateValue, setStartDateValue] = useState<Date | null>(null);
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
  const formatTime = (value: Date) =>
    value.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

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
      <View className="flex-1 bg-white items-center justify-center">
        <View className="items-center">
          <View className="h-24 w-24 rounded-full bg-green-100 items-center justify-center mb-6">
            <Icon name="check_circle" className="text-green-500 text-5xl" />
          </View>
          <Text className="text-2xl font-extrabold text-slate-900 mb-2">Event Created!</Text>
          <Text className="text-slate-400">₹{total.toFixed(2)} added to pending payments</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-slate-50" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View className="bg-white px-6 py-4 flex-row items-center border-b border-slate-100">
        <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full">
          <Icon name="arrow_back_ios_new" className="text-slate-700" />
        </Pressable>
        <Text className="text-lg font-extrabold text-slate-900 flex-1 text-center pr-10">Create Event</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        {error && (
          <View className="mx-4 mt-4 p-4 bg-red-50 rounded-xl">
            <Text className="text-red-600 text-sm font-medium">{error}</Text>
          </View>
        )}

        <View className="p-4">
          <Pressable onPress={handleImageSelect} className="relative w-full aspect-[16/9] rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 overflow-hidden">
            {imagePreview ? (
              <Image source={{ uri: imagePreview }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Icon name="add-photo-alternate" className="text-slate-300 text-4xl mb-2" />
                <Text className="text-sm font-bold text-slate-400">Add Event Poster</Text>
              </View>
            )}
            <View className="absolute bottom-3 right-3 bg-primary rounded-full p-2">
              <Icon name="edit" className="text-white text-lg" />
            </View>
          </Pressable>
        </View>

        <View className="px-4 py-2 space-y-3">
          <Text className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Event basics</Text>
          <TextInput
            value={formData.title}
            onChangeText={(value) => handleChange('title', value)}
            className="w-full rounded-2xl border border-slate-100 bg-white h-14 px-5 text-base font-medium"
            placeholder="Event Name *"
          />
          <TextInput
            value={formData.description}
            onChangeText={(value) => handleChange('description', value)}
            className="w-full rounded-2xl border border-slate-100 bg-white min-h-[80px] p-4 text-base font-medium"
            placeholder="Event Description"
            multiline
          />
          <Text className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mt-2">Schedule</Text>
          <Pressable
            onPress={() => setShowStartDatePicker(true)}
            className="w-full rounded-2xl border border-slate-100 bg-white h-12 px-4 justify-center"
          >
            <Text className="text-sm font-medium text-slate-700">
              {formData.startDate ? `Start Date: ${formData.startDate}` : 'Select Start Date *'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setShowEndDatePicker(true)}
            className="w-full rounded-2xl border border-slate-100 bg-white h-12 px-4 justify-center"
          >
            <Text className="text-sm font-medium text-slate-700">
              {formData.endDate ? `End Date: ${formData.endDate}` : 'Select End Date'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setShowStartTimePicker(true)}
            className="w-full rounded-2xl border border-slate-100 bg-white h-12 px-4 justify-center"
          >
            <Text className="text-sm font-medium text-slate-700">
              {formData.startTime ? `Start Time: ${formData.startTime}` : 'Select Start Time'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setShowEndTimePicker(true)}
            className="w-full rounded-2xl border border-slate-100 bg-white h-12 px-4 justify-center"
          >
            <Text className="text-sm font-medium text-slate-700">
              {formData.endTime ? `End Time: ${formData.endTime}` : 'Select End Time'}
            </Text>
          </Pressable>
          {showStartDatePicker && (
            <DateTimePicker
              value={startDateValue || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                setShowStartDatePicker(false);
                if (date) {
                  setStartDateValue(date);
                  handleChange('startDate', formatDate(date));
                }
              }}
            />
          )}
          {showEndDatePicker && (
            <DateTimePicker
              value={endDateValue || startDateValue || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                setShowEndDatePicker(false);
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
          <Text className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mt-2">Location</Text>
          <TextInput
            value={locationQuery}
            onChangeText={(value) => {
              setLocationQuery(value);
              if (!value) {
                handleChange('location', '');
              }
            }}
            className="w-full rounded-2xl border border-slate-100 bg-white h-14 px-5 text-base font-medium"
            placeholder="Search location (city, area, landmark)"
          />
          {isSearchingLocation && (
            <Text className="text-xs text-slate-400 px-1">Searching...</Text>
          )}
          {locationResults.length > 0 && (
            <View className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
              {locationResults.map((item) => (
                <Pressable
                  key={`${item.place_id}`}
                  onPress={() => handleSelectLocation(item)}
                  className="px-4 py-3 border-b border-slate-100"
                >
                  <Text className="text-sm font-medium text-slate-700">{item.display_name}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <View className="rounded-2xl border border-slate-100 overflow-hidden">
            <MapView
              style={{ height: 220, width: '100%' }}
              region={mapRegion}
              onRegionChangeComplete={setMapRegion}
              onPress={(event) => handleMapPress(event.nativeEvent.coordinate)}
            >
              {selectedCoords && <Marker coordinate={selectedCoords} />}
            </MapView>
          </View>
          <TextInput
            value={formData.venue}
            onChangeText={(value) => handleChange('venue', value)}
            className="w-full rounded-2xl border border-slate-100 bg-white h-14 px-5 text-base font-medium"
            placeholder="Venue name / Full address"
          />
          <Text className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mt-2">Job type</Text>
          <View className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
            <Picker
              selectedValue={formData.jobType}
              onValueChange={(value) => handleChange('jobType', String(value))}
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
              onChangeText={(value) => handleChange('jobTypeOther', value)}
              className="w-full rounded-2xl border border-slate-100 bg-white h-12 px-4 text-sm font-medium"
              placeholder="Enter job type"
            />
          )}
          <Text className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mt-2">Worker requirements</Text>
          <View className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
            <Text className="text-sm font-extrabold text-slate-900">Male gig workers</Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-[11px] font-bold text-slate-400 mb-2">Number of male</Text>
                <TextInput
                  value={String(formData.maleCount)}
                  onChangeText={(value) => handleChange('maleCount', Number(value || 0))}
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50 h-12 px-4 text-sm font-medium"
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-bold text-slate-400 mb-2">Pay per male</Text>
                <TextInput
                  value={String(formData.malePay)}
                  onChangeText={(value) => handleChange('malePay', Number(value || 0))}
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50 h-12 px-4 text-sm font-medium"
                  placeholder="₹0"
                  keyboardType="numeric"
                />
              </View>
            </View>
            <Text className="text-sm font-extrabold text-slate-900 mt-2">Female gig workers</Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-[11px] font-bold text-slate-400 mb-2">Number of female</Text>
                <TextInput
                  value={String(formData.femaleCount)}
                  onChangeText={(value) => handleChange('femaleCount', Number(value || 0))}
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50 h-12 px-4 text-sm font-medium"
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-bold text-slate-400 mb-2">Pay per female</Text>
                <TextInput
                  value={String(formData.femalePay)}
                  onChangeText={(value) => handleChange('femalePay', Number(value || 0))}
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50 h-12 px-4 text-sm font-medium"
                  placeholder="₹0"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </View>

        <View className="px-4 py-4 space-y-2">
          <View className="flex-row justify-between">
            <Text className="text-slate-500 font-medium">Subtotal</Text>
            <Text className="font-bold text-slate-700">₹{subtotal.toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-slate-500 font-medium">Platform Fee (13%)</Text>
            <Text className="font-bold text-slate-700">₹{commission.toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between border-t border-slate-100 pt-2">
            <Text className="text-lg font-extrabold text-slate-900">Total</Text>
            <Text className="text-xl font-extrabold text-primary">₹{total.toFixed(2)}</Text>
          </View>
        </View>

        <View className="px-4 pb-6">
          <Pressable
            onPress={handleSubmit}
            disabled={!isFormValid || isLoading}
            className={`w-full py-4 rounded-2xl items-center justify-center ${
              isFormValid && !isLoading ? 'bg-primary' : 'bg-slate-100'
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View className="flex-row items-center gap-2">
                <Text className={`${isFormValid ? 'text-white' : 'text-slate-400'} text-lg font-extrabold`}>Create Event</Text>
                {isFormValid && <Icon name="event" className="text-white" />}
              </View>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreateEventScreen;
