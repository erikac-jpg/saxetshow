import type { NavigatorScreenParams } from '@react-navigation/native';

import type { Event } from '../db/types';

export type ShowsStackParamList = {
  Home: undefined;
  Detail: { event: Event };
  PrivacyPolicy: undefined;
  TermsAndConditions: undefined;
};

export type VendorStackParamList = {
  VendorAuth: undefined;
  VendorProfile: undefined;
};

export type StaffStackParamList = {
  StaffAuth: undefined;
  StaffAccessRequired: undefined;
  StaffDashboard: undefined;
  StaffVendorProfile: { vendorId: number };
  StaffAgreement: { vendorId: number; eventId: number };
  StaffQrCheckIn: { eventId: number };
};

export type RootTabParamList = {
  ShowsTab: NavigatorScreenParams<ShowsStackParamList>;
  VendorTab: NavigatorScreenParams<VendorStackParamList>;
  StaffTab: NavigatorScreenParams<StaffStackParamList>;
};
