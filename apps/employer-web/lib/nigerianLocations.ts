export interface NigerianLocation {
  id: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

export const NIGERIAN_LOCATIONS: readonly NigerianLocation[] = [
  // Lagos — mainland
  { id: 'lagos-apapa', name: 'Apapa', city: 'Lagos', state: 'Lagos', lat: 6.4458, lng: 3.3608 },
  { id: 'lagos-ikeja', name: 'Ikeja', city: 'Lagos', state: 'Lagos', lat: 6.6018, lng: 3.3515 },
  { id: 'lagos-mile-2', name: 'Mile 2', city: 'Lagos', state: 'Lagos', lat: 6.4641, lng: 3.3061 },
  { id: 'lagos-surulere', name: 'Surulere', city: 'Lagos', state: 'Lagos', lat: 6.4969, lng: 3.3597 },
  { id: 'lagos-yaba', name: 'Yaba', city: 'Lagos', state: 'Lagos', lat: 6.5095, lng: 3.3711 },
  { id: 'lagos-festac', name: 'Festac', city: 'Lagos', state: 'Lagos', lat: 6.4669, lng: 3.2825 },
  { id: 'lagos-oshodi', name: 'Oshodi', city: 'Lagos', state: 'Lagos', lat: 6.5547, lng: 3.3445 },
  { id: 'lagos-mushin', name: 'Mushin', city: 'Lagos', state: 'Lagos', lat: 6.5275, lng: 3.3543 },
  { id: 'lagos-agege', name: 'Agege', city: 'Lagos', state: 'Lagos', lat: 6.6152, lng: 3.3299 },
  { id: 'lagos-alimosho', name: 'Alimosho', city: 'Lagos', state: 'Lagos', lat: 6.6020, lng: 3.2657 },
  { id: 'lagos-ipaja', name: 'Ipaja', city: 'Lagos', state: 'Lagos', lat: 6.6086, lng: 3.2580 },
  { id: 'lagos-egbeda', name: 'Egbeda', city: 'Lagos', state: 'Lagos', lat: 6.5949, lng: 3.2926 },
  { id: 'lagos-magodo', name: 'Magodo', city: 'Lagos', state: 'Lagos', lat: 6.6177, lng: 3.3845 },
  { id: 'lagos-ojota', name: 'Ojota', city: 'Lagos', state: 'Lagos', lat: 6.5870, lng: 3.3815 },
  { id: 'lagos-gbagada', name: 'Gbagada', city: 'Lagos', state: 'Lagos', lat: 6.5535, lng: 3.3893 },
  { id: 'lagos-maryland', name: 'Maryland', city: 'Lagos', state: 'Lagos', lat: 6.5697, lng: 3.3681 },
  { id: 'lagos-anthony', name: 'Anthony Village', city: 'Lagos', state: 'Lagos', lat: 6.5631, lng: 3.3651 },
  { id: 'lagos-somolu', name: 'Shomolu', city: 'Lagos', state: 'Lagos', lat: 6.5391, lng: 3.3823 },
  { id: 'lagos-bariga', name: 'Bariga', city: 'Lagos', state: 'Lagos', lat: 6.5379, lng: 3.3886 },
  { id: 'lagos-ojo', name: 'Ojo', city: 'Lagos', state: 'Lagos', lat: 6.4581, lng: 3.1751 },
  { id: 'lagos-badagry', name: 'Badagry', city: 'Lagos', state: 'Lagos', lat: 6.4163, lng: 2.8810 },

  // Lagos — island
  { id: 'lagos-vi', name: 'Victoria Island', city: 'Lagos', state: 'Lagos', lat: 6.4281, lng: 3.4219 },
  { id: 'lagos-ikoyi', name: 'Ikoyi', city: 'Lagos', state: 'Lagos', lat: 6.4541, lng: 3.4316 },
  { id: 'lagos-lekki', name: 'Lekki', city: 'Lagos', state: 'Lagos', lat: 6.4392, lng: 3.5036 },
  { id: 'lagos-ajah', name: 'Ajah', city: 'Lagos', state: 'Lagos', lat: 6.4641, lng: 3.5852 },
  { id: 'lagos-sangotedo', name: 'Sangotedo', city: 'Lagos', state: 'Lagos', lat: 6.4670, lng: 3.6217 },
  { id: 'lagos-ibeju-lekki', name: 'Ibeju-Lekki', city: 'Lagos', state: 'Lagos', lat: 6.4513, lng: 3.7128 },
  { id: 'lagos-island', name: 'Lagos Island', city: 'Lagos', state: 'Lagos', lat: 6.4541, lng: 3.3947 },
  { id: 'lagos-obalende', name: 'Obalende', city: 'Lagos', state: 'Lagos', lat: 6.4476, lng: 3.4047 },
  { id: 'lagos-epe', name: 'Epe', city: 'Lagos', state: 'Lagos', lat: 6.5836, lng: 3.9836 },

  // FCT — Abuja
  { id: 'abuja-central', name: 'Central Area', city: 'Abuja', state: 'FCT', lat: 9.0578, lng: 7.4951 },
  { id: 'abuja-wuse', name: 'Wuse', city: 'Abuja', state: 'FCT', lat: 9.0726, lng: 7.4827 },
  { id: 'abuja-wuse-2', name: 'Wuse 2', city: 'Abuja', state: 'FCT', lat: 9.0820, lng: 7.4760 },
  { id: 'abuja-maitama', name: 'Maitama', city: 'Abuja', state: 'FCT', lat: 9.0884, lng: 7.4972 },
  { id: 'abuja-asokoro', name: 'Asokoro', city: 'Abuja', state: 'FCT', lat: 9.0440, lng: 7.5239 },
  { id: 'abuja-garki', name: 'Garki', city: 'Abuja', state: 'FCT', lat: 9.0316, lng: 7.4892 },
  { id: 'abuja-gwarinpa', name: 'Gwarinpa', city: 'Abuja', state: 'FCT', lat: 9.1078, lng: 7.4076 },
  { id: 'abuja-kubwa', name: 'Kubwa', city: 'Abuja', state: 'FCT', lat: 9.1471, lng: 7.3360 },
  { id: 'abuja-lugbe', name: 'Lugbe', city: 'Abuja', state: 'FCT', lat: 8.9690, lng: 7.3766 },
  { id: 'abuja-jabi', name: 'Jabi', city: 'Abuja', state: 'FCT', lat: 9.0764, lng: 7.4255 },
  { id: 'abuja-utako', name: 'Utako', city: 'Abuja', state: 'FCT', lat: 9.0691, lng: 7.4339 },
  { id: 'abuja-nyanya', name: 'Nyanya', city: 'Abuja', state: 'FCT', lat: 9.0162, lng: 7.5749 },

  // Rivers — Port Harcourt
  { id: 'ph-central', name: 'Port Harcourt', city: 'Port Harcourt', state: 'Rivers', lat: 4.8156, lng: 7.0498 },
  { id: 'ph-trans-amadi', name: 'Trans-Amadi', city: 'Port Harcourt', state: 'Rivers', lat: 4.8019, lng: 7.0292 },
  { id: 'ph-gra', name: 'GRA Port Harcourt', city: 'Port Harcourt', state: 'Rivers', lat: 4.8348, lng: 7.0061 },
  { id: 'ph-diobu', name: 'Diobu / Mile 1', city: 'Port Harcourt', state: 'Rivers', lat: 4.7912, lng: 6.9933 },
  { id: 'ph-eleme', name: 'Eleme', city: 'Port Harcourt', state: 'Rivers', lat: 4.7993, lng: 7.1147 },
  { id: 'ph-obio-akpor', name: 'Obio-Akpor', city: 'Port Harcourt', state: 'Rivers', lat: 4.8581, lng: 7.0339 },

  // Kano
  { id: 'kano-city', name: 'Kano City', city: 'Kano', state: 'Kano', lat: 12.0022, lng: 8.5919 },
  { id: 'kano-fagge', name: 'Fagge', city: 'Kano', state: 'Kano', lat: 12.0166, lng: 8.5232 },
  { id: 'kano-sabon-gari', name: 'Sabon Gari', city: 'Kano', state: 'Kano', lat: 12.0089, lng: 8.5208 },
  { id: 'kano-nasarawa', name: 'Nasarawa', city: 'Kano', state: 'Kano', lat: 12.0102, lng: 8.5544 },

  // Oyo — Ibadan
  { id: 'ibadan-bodija', name: 'Bodija', city: 'Ibadan', state: 'Oyo', lat: 7.4392, lng: 3.9081 },
  { id: 'ibadan-mokola', name: 'Mokola', city: 'Ibadan', state: 'Oyo', lat: 7.4083, lng: 3.8965 },
  { id: 'ibadan-ring-road', name: 'Ring Road', city: 'Ibadan', state: 'Oyo', lat: 7.3678, lng: 3.8989 },
  { id: 'ibadan-challenge', name: 'Challenge', city: 'Ibadan', state: 'Oyo', lat: 7.3578, lng: 3.8742 },
  { id: 'ibadan-iwo-road', name: 'Iwo Road', city: 'Ibadan', state: 'Oyo', lat: 7.4060, lng: 3.9382 },
  { id: 'ibadan-ojoo', name: 'Ojoo', city: 'Ibadan', state: 'Oyo', lat: 7.4823, lng: 3.9215 },

  // Kaduna
  { id: 'kaduna-central', name: 'Kaduna Central', city: 'Kaduna', state: 'Kaduna', lat: 10.5222, lng: 7.4384 },
  { id: 'kaduna-sabon-tasha', name: 'Sabon Tasha', city: 'Kaduna', state: 'Kaduna', lat: 10.4486, lng: 7.4514 },
  { id: 'kaduna-kawo', name: 'Kawo', city: 'Kaduna', state: 'Kaduna', lat: 10.5604, lng: 7.4307 },

  // Edo — Benin City
  { id: 'benin-central', name: 'Benin City', city: 'Benin City', state: 'Edo', lat: 6.3350, lng: 5.6037 },
  { id: 'benin-ring-road', name: 'Ring Road', city: 'Benin City', state: 'Edo', lat: 6.3380, lng: 5.6204 },

  // Enugu
  { id: 'enugu-central', name: 'Enugu', city: 'Enugu', state: 'Enugu', lat: 6.5244, lng: 7.5186 },
  { id: 'enugu-independence', name: 'Independence Layout', city: 'Enugu', state: 'Enugu', lat: 6.4413, lng: 7.5039 },

  // Anambra
  { id: 'anambra-onitsha', name: 'Onitsha', city: 'Onitsha', state: 'Anambra', lat: 6.1450, lng: 6.7860 },
  { id: 'anambra-awka', name: 'Awka', city: 'Awka', state: 'Anambra', lat: 6.2120, lng: 7.0739 },
  { id: 'anambra-nnewi', name: 'Nnewi', city: 'Nnewi', state: 'Anambra', lat: 6.0203, lng: 6.9101 },

  // Imo — Owerri
  { id: 'owerri-central', name: 'Owerri', city: 'Owerri', state: 'Imo', lat: 5.4836, lng: 7.0334 },
  { id: 'owerri-world-bank', name: 'World Bank Area', city: 'Owerri', state: 'Imo', lat: 5.4682, lng: 7.0297 },

  // Abia — Aba
  { id: 'abia-aba', name: 'Aba', city: 'Aba', state: 'Abia', lat: 5.1213, lng: 7.3676 },
  { id: 'abia-umuahia', name: 'Umuahia', city: 'Umuahia', state: 'Abia', lat: 5.5249, lng: 7.4925 },

  // Akwa Ibom — Uyo
  { id: 'uyo-central', name: 'Uyo', city: 'Uyo', state: 'Akwa Ibom', lat: 5.0377, lng: 7.9128 },

  // Cross River — Calabar
  { id: 'calabar-central', name: 'Calabar', city: 'Calabar', state: 'Cross River', lat: 4.9589, lng: 8.3269 },

  // Plateau — Jos
  { id: 'jos-central', name: 'Jos', city: 'Jos', state: 'Plateau', lat: 9.8965, lng: 8.8583 },

  // Kwara — Ilorin
  { id: 'ilorin-central', name: 'Ilorin', city: 'Ilorin', state: 'Kwara', lat: 8.4799, lng: 4.5418 },

  // Ogun
  { id: 'ogun-abeokuta', name: 'Abeokuta', city: 'Abeokuta', state: 'Ogun', lat: 7.1475, lng: 3.3619 },
  { id: 'ogun-sango-ota', name: 'Sango Ota', city: 'Sango Ota', state: 'Ogun', lat: 6.6985, lng: 3.2367 },
  { id: 'ogun-ijebu-ode', name: 'Ijebu Ode', city: 'Ijebu Ode', state: 'Ogun', lat: 6.8194, lng: 3.9170 },

  // Delta
  { id: 'delta-warri', name: 'Warri', city: 'Warri', state: 'Delta', lat: 5.5167, lng: 5.7500 },
  { id: 'delta-effurun', name: 'Effurun', city: 'Effurun', state: 'Delta', lat: 5.5582, lng: 5.7723 },
  { id: 'delta-asaba', name: 'Asaba', city: 'Asaba', state: 'Delta', lat: 6.1980, lng: 6.7330 },
  { id: 'delta-sapele', name: 'Sapele', city: 'Sapele', state: 'Delta', lat: 5.8939, lng: 5.6776 },

  // Bayelsa
  { id: 'bayelsa-yenagoa', name: 'Yenagoa', city: 'Yenagoa', state: 'Bayelsa', lat: 4.9267, lng: 6.2676 },
];

export const LOCATIONS_BY_ID: Record<string, NigerianLocation> = Object.fromEntries(
  NIGERIAN_LOCATIONS.map((loc) => [loc.id, loc]),
);

export const DEFAULT_LOCATION_ID = 'lagos-apapa';

export const DEFAULT_LOCATION: NigerianLocation =
  LOCATIONS_BY_ID[DEFAULT_LOCATION_ID] ?? NIGERIAN_LOCATIONS[0]!;
