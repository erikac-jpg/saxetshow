import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * There's no login yet, so we can't know "which vendor" is using a given
 * phone. As a stand-in until real auth exists, we remember the vendor
 * profile this device created/used last, stored locally on-device. This
 * is not authentication - it's just "the same phone reopens the same
 * profile" - and will be replaced once vendors actually sign in.
 */
const STORAGE_KEY = 'saxetshow.myVendorId';

export async function getMyVendorId(): Promise<number | null> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return null;
  }
  const parsed = Number(stored);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function setMyVendorId(id: number): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, String(id));
}
