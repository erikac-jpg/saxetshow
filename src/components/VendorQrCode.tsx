import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { colors } from '../theme/colors';

const QR_VERSION = 1;

export interface VendorQrPayload {
  t: 'saxetshow-vendor';
  v: number;
  vendorId: number;
}

export function buildVendorQrPayload(vendorId: number): string {
  const payload: VendorQrPayload = { t: 'saxetshow-vendor', v: QR_VERSION, vendorId };
  return JSON.stringify(payload);
}

/** Parses a scanned QR value into a vendor id, or null if it's not one of ours. */
export function parseVendorQrPayload(raw: string): number | null {
  try {
    const parsed = JSON.parse(raw) as Partial<VendorQrPayload>;
    if (parsed.t !== 'saxetshow-vendor' || typeof parsed.vendorId !== 'number') return null;
    return parsed.vendorId;
  } catch {
    return null;
  }
}

export default function VendorQrCode({ vendorId, size = 200 }: { vendorId: number; size?: number }) {
  return (
    <View style={{ padding: 12, backgroundColor: colors.white, borderRadius: 12 }}>
      <QRCode value={buildVendorQrPayload(vendorId)} size={size} color={colors.navy} backgroundColor={colors.white} />
    </View>
  );
}
