// ============================================
// PrithviNet Constants
// ============================================

// WAQI API - Replace with your real token from aqicn.org/data-platform/token/
export const WAQI_API_TOKEN = process.env.NEXT_PUBLIC_WAQI_TOKEN || "YOUR_WAQI_TOKEN_HERE";
export const WAQI_API_BASE = "https://api.waqi.info";
export const WAQI_TILES_BASE = "https://tiles.aqicn.org/tiles";

// India bounding box (lat1,lng1,lat2,lng2)
export const INDIA_BOUNDS = { lat1: 6.5, lng1: 68.0, lat2: 37.0, lng2: 97.5 };

// WAQI tile pollutant options for heatmap overlay
export const HEATMAP_POLLUTANTS = [
  { id: "usepa-aqi", label: "AQI (Overall)" },
  { id: "usepa-pm25", label: "PM₂.₅" },
  { id: "usepa-pm10", label: "PM₁₀" },
  { id: "usepa-o3", label: "Ozone (O₃)" },
  { id: "usepa-no2", label: "NO₂" },
  { id: "usepa-so2", label: "SO₂" },
  { id: "usepa-co", label: "CO" },
];

// Indian cities to monitor (WAQI station UIDs)
export const MONITORED_CITIES = [
  { name: "Delhi - Anand Vihar", uid: 7023, city: "Delhi", state: "Delhi" },
  { name: "Delhi - ITO", uid: 8686, city: "Delhi", state: "Delhi" },
  { name: "Mumbai - Bandra", uid: 11262, city: "Mumbai", state: "Maharashtra" },
  { name: "Mumbai - Worli", uid: 11269, city: "Mumbai", state: "Maharashtra" },
  { name: "Bengaluru - BTM", uid: 8190, city: "Bengaluru", state: "Karnataka" },
  { name: "Bengaluru - Silk Board", uid: 11293, city: "Bengaluru", state: "Karnataka" },
  { name: "Kolkata - Jadavpur", uid: 11286, city: "Kolkata", state: "West Bengal" },
  { name: "Chennai - Alandur", uid: 11264, city: "Chennai", state: "Tamil Nadu" },
  { name: "Hyderabad - Jubilee Hills", uid: 11248, city: "Hyderabad", state: "Telangana" },
  { name: "Pune - Shivajinagar", uid: 11300, city: "Pune", state: "Maharashtra" },
  { name: "Ahmedabad - Maninagar", uid: 11243, city: "Ahmedabad", state: "Gujarat" },
  { name: "Jaipur - Adarsh Nagar", uid: 11277, city: "Jaipur", state: "Rajasthan" },
  { name: "Lucknow - Lalbagh", uid: 11290, city: "Lucknow", state: "Uttar Pradesh" },
  { name: "Kanpur - Nehru Nagar", uid: 11280, city: "Kanpur", state: "Uttar Pradesh" },
  { name: "Patna - IGSC", uid: 11296, city: "Patna", state: "Bihar" },
  { name: "Varanasi - Ardhali Bazar", uid: 11310, city: "Varanasi", state: "Uttar Pradesh" },
];

// AQI breakpoints (India NAQI standard)
export const AQI_BREAKPOINTS = [
  { min: 0, max: 50, category: "Good" as const, color: "#22c55e", textColor: "#000", emoji: "😊" },
  { min: 51, max: 100, category: "Satisfactory" as const, color: "#86efac", textColor: "#000", emoji: "🙂" },
  { min: 101, max: 200, category: "Moderate" as const, color: "#fbbf24", textColor: "#000", emoji: "😐" },
  { min: 201, max: 300, category: "Poor" as const, color: "#f97316", textColor: "#fff", emoji: "😷" },
  { min: 301, max: 400, category: "Very Poor" as const, color: "#ef4444", textColor: "#fff", emoji: "🤢" },
  { min: 401, max: 500, category: "Severe" as const, color: "#991b1b", textColor: "#fff", emoji: "☠️" },
];

// CPCB prescribed limits for air quality (µg/m³, 24-hour average)
export const AIR_LIMITS = {
  pm25: 60,
  pm10: 100,
  so2: 80,
  no2: 80,
  co: 4000, // µg/m³ (4 mg/m³)
  o3: 180,
  nh3: 400,
};

// CPCB prescribed limits for water quality
export const WATER_LIMITS = {
  bod: { safe: 3, caution: 6, critical: 10, unit: "mg/L" },
  dissolvedOxygen: { safe: 6, caution: 4, critical: 2, unit: "mg/L", invertCheck: true },
  ph: { min: 6.5, max: 8.5, unit: "" },
  temperature: { max: 40, unit: "°C" },
  nitrate: { safe: 45, caution: 100, unit: "mg/L" },
  cod: { safe: 10, caution: 25, critical: 50, unit: "mg/L" },
  turbidity: { safe: 5, caution: 10, critical: 25, unit: "NTU" },
};

// CPCB prescribed noise limits (dBA)
export const NOISE_LIMITS = {
  Industrial: { day: 75, night: 70 },
  Commercial: { day: 65, night: 55 },
  Residential: { day: 55, night: 45 },
  Silence: { day: 50, night: 40 },
};

// National Noise Monitoring Network (NNMN) stations — based on CPCB's 7 metro + state capital coverage
export const NOISE_STATIONS = [
  // Delhi (10 stations — DPCC NNMN network)
  { id: "NS01", name: "Anand Vihar ISBT", city: "Delhi", zone: "Commercial" as const, lat: 28.6508, lng: 77.3152 },
  { id: "NS02", name: "ITO Junction", city: "Delhi", zone: "Commercial" as const, lat: 28.6289, lng: 77.2405 },
  { id: "NS03", name: "AIIMS Hospital", city: "Delhi", zone: "Silence" as const, lat: 28.5672, lng: 77.2100 },
  { id: "NS04", name: "Connaught Place", city: "Delhi", zone: "Commercial" as const, lat: 28.6315, lng: 77.2167 },
  { id: "NS05", name: "Karol Bagh Market", city: "Delhi", zone: "Commercial" as const, lat: 28.6514, lng: 77.1907 },
  { id: "NS06", name: "Okhla Industrial Area", city: "Delhi", zone: "Industrial" as const, lat: 28.5310, lng: 77.2710 },
  { id: "NS07", name: "Dwarka Sector 8", city: "Delhi", zone: "Residential" as const, lat: 28.5760, lng: 77.0640 },
  { id: "NS08", name: "Mayur Vihar Phase 1", city: "Delhi", zone: "Residential" as const, lat: 28.6070, lng: 77.2930 },
  { id: "NS09", name: "Safdarjung Hospital", city: "Delhi", zone: "Silence" as const, lat: 28.5680, lng: 77.2060 },
  { id: "NS10", name: "Narela Industrial Area", city: "Delhi", zone: "Industrial" as const, lat: 28.8530, lng: 77.0960 },
  // Mumbai (8 stations — MPCB network)
  { id: "NS11", name: "Dadar Station", city: "Mumbai", zone: "Commercial" as const, lat: 19.0186, lng: 72.8425 },
  { id: "NS12", name: "Powai Lake", city: "Mumbai", zone: "Residential" as const, lat: 19.1275, lng: 72.9060 },
  { id: "NS13", name: "Andheri Station", city: "Mumbai", zone: "Commercial" as const, lat: 19.1197, lng: 72.8464 },
  { id: "NS14", name: "MIDC Andheri East", city: "Mumbai", zone: "Industrial" as const, lat: 19.1150, lng: 72.8690 },
  { id: "NS15", name: "Bandra Kurla Complex", city: "Mumbai", zone: "Commercial" as const, lat: 19.0596, lng: 72.8656 },
  { id: "NS16", name: "KEM Hospital Parel", city: "Mumbai", zone: "Silence" as const, lat: 19.0003, lng: 72.8410 },
  { id: "NS17", name: "Vashi Station", city: "Navi Mumbai", zone: "Commercial" as const, lat: 19.0750, lng: 73.0005 },
  { id: "NS18", name: "Borivali National Park", city: "Mumbai", zone: "Silence" as const, lat: 19.2288, lng: 72.8697 },
  // Bengaluru (6 stations — KSPCB network)
  { id: "NS19", name: "Peenya Industrial Area", city: "Bengaluru", zone: "Industrial" as const, lat: 13.0300, lng: 77.4936 },
  { id: "NS20", name: "MG Road", city: "Bengaluru", zone: "Commercial" as const, lat: 12.9758, lng: 77.6068 },
  { id: "NS21", name: "Whitefield IT Park", city: "Bengaluru", zone: "Commercial" as const, lat: 12.9698, lng: 77.7500 },
  { id: "NS22", name: "Koramangala", city: "Bengaluru", zone: "Residential" as const, lat: 12.9352, lng: 77.6245 },
  { id: "NS23", name: "BGS Global Hospital", city: "Bengaluru", zone: "Silence" as const, lat: 12.8920, lng: 77.5447 },
  { id: "NS24", name: "Bommasandra Industrial", city: "Bengaluru", zone: "Industrial" as const, lat: 12.8160, lng: 77.6940 },
  // Kolkata (5 stations — WBPCB network)
  { id: "NS25", name: "Salt Lake Sector V", city: "Kolkata", zone: "Commercial" as const, lat: 22.5726, lng: 88.4342 },
  { id: "NS26", name: "Park Street", city: "Kolkata", zone: "Commercial" as const, lat: 22.5535, lng: 88.3523 },
  { id: "NS27", name: "Howrah Station", city: "Kolkata", zone: "Commercial" as const, lat: 22.5840, lng: 88.3421 },
  { id: "NS28", name: "Kalyani Industrial", city: "Kolkata", zone: "Industrial" as const, lat: 22.9750, lng: 88.4340 },
  { id: "NS29", name: "SSKM Hospital", city: "Kolkata", zone: "Silence" as const, lat: 22.5360, lng: 88.3440 },
  // Chennai (5 stations — TNPCB network)
  { id: "NS30", name: "Anna Nagar", city: "Chennai", zone: "Residential" as const, lat: 13.0850, lng: 80.2101 },
  { id: "NS31", name: "T Nagar Market", city: "Chennai", zone: "Commercial" as const, lat: 13.0418, lng: 80.2341 },
  { id: "NS32", name: "Ambattur Industrial", city: "Chennai", zone: "Industrial" as const, lat: 13.1143, lng: 80.1548 },
  { id: "NS33", name: "Chennai Central Station", city: "Chennai", zone: "Commercial" as const, lat: 13.0827, lng: 80.2707 },
  { id: "NS34", name: "Apollo Hospital Greams Rd", city: "Chennai", zone: "Silence" as const, lat: 13.0604, lng: 80.2547 },
  // Hyderabad (5 stations — TSPCB network)
  { id: "NS35", name: "Jubilee Hills", city: "Hyderabad", zone: "Residential" as const, lat: 17.4325, lng: 78.4073 },
  { id: "NS36", name: "Secunderabad Station", city: "Hyderabad", zone: "Commercial" as const, lat: 17.4344, lng: 78.5018 },
  { id: "NS37", name: "HITEC City", city: "Hyderabad", zone: "Commercial" as const, lat: 17.4435, lng: 78.3772 },
  { id: "NS38", name: "Jeedimetla Industrial", city: "Hyderabad", zone: "Industrial" as const, lat: 17.4985, lng: 78.4445 },
  { id: "NS39", name: "NIMS Hospital", city: "Hyderabad", zone: "Silence" as const, lat: 17.3943, lng: 78.4867 },
  // Pune (4 stations)
  { id: "NS40", name: "Shivajinagar", city: "Pune", zone: "Commercial" as const, lat: 18.5326, lng: 73.8506 },
  { id: "NS41", name: "Hinjewadi IT Park", city: "Pune", zone: "Commercial" as const, lat: 18.5912, lng: 73.7390 },
  { id: "NS42", name: "Pimpri-Chinchwad MIDC", city: "Pune", zone: "Industrial" as const, lat: 18.6298, lng: 73.8000 },
  { id: "NS43", name: "Sassoon Hospital", city: "Pune", zone: "Silence" as const, lat: 18.5310, lng: 73.8733 },
  // Ahmedabad (4 stations)
  { id: "NS44", name: "CG Road", city: "Ahmedabad", zone: "Commercial" as const, lat: 23.0300, lng: 72.5610 },
  { id: "NS45", name: "Naroda GIDC", city: "Ahmedabad", zone: "Industrial" as const, lat: 23.0772, lng: 72.6570 },
  { id: "NS46", name: "Vastrapur Lake", city: "Ahmedabad", zone: "Residential" as const, lat: 23.0359, lng: 72.5282 },
  { id: "NS47", name: "Civil Hospital", city: "Ahmedabad", zone: "Silence" as const, lat: 23.0563, lng: 72.5994 },
  // Jaipur (3 stations)
  { id: "NS48", name: "MI Road", city: "Jaipur", zone: "Commercial" as const, lat: 26.9125, lng: 75.7873 },
  { id: "NS49", name: "Sitapura Industrial", city: "Jaipur", zone: "Industrial" as const, lat: 26.7824, lng: 75.8513 },
  { id: "NS50", name: "SMS Hospital", city: "Jaipur", zone: "Silence" as const, lat: 26.9032, lng: 75.8090 },
  // Lucknow (3 stations)
  { id: "NS51", name: "Hazratganj", city: "Lucknow", zone: "Commercial" as const, lat: 26.8534, lng: 80.9462 },
  { id: "NS52", name: "Amausi Industrial", city: "Lucknow", zone: "Industrial" as const, lat: 26.7609, lng: 80.8843 },
  { id: "NS53", name: "KGMU Hospital", city: "Lucknow", zone: "Silence" as const, lat: 26.8507, lng: 80.9419 },
  // Chandigarh (2 stations)
  { id: "NS54", name: "Sector 17 Market", city: "Chandigarh", zone: "Commercial" as const, lat: 30.7420, lng: 76.7797 },
  { id: "NS55", name: "Industrial Area Phase 1", city: "Chandigarh", zone: "Industrial" as const, lat: 30.7050, lng: 76.8010 },
  // Patna (2 stations)
  { id: "NS56", name: "Patna Junction", city: "Patna", zone: "Commercial" as const, lat: 25.6096, lng: 85.1347 },
  { id: "NS57", name: "PMCH Hospital", city: "Patna", zone: "Silence" as const, lat: 25.6112, lng: 85.1460 },
  // Bhopal (2 stations)
  { id: "NS58", name: "New Market TT Nagar", city: "Bhopal", zone: "Commercial" as const, lat: 23.2389, lng: 77.4055 },
  { id: "NS59", name: "Govindpura Industrial", city: "Bhopal", zone: "Industrial" as const, lat: 23.2676, lng: 77.4653 },
  // Thiruvananthapuram (2 stations)
  { id: "NS60", name: "MG Road Statue Jn", city: "Thiruvananthapuram", zone: "Commercial" as const, lat: 8.4906, lng: 76.9521 },
  { id: "NS61", name: "Kazhakkoottam Technopark", city: "Thiruvananthapuram", zone: "Commercial" as const, lat: 8.5571, lng: 76.8735 },
  // Guwahati (2 stations)
  { id: "NS62", name: "Fancy Bazaar", city: "Guwahati", zone: "Commercial" as const, lat: 26.1855, lng: 91.7449 },
  { id: "NS63", name: "Beltola", city: "Guwahati", zone: "Residential" as const, lat: 26.1310, lng: 91.7916 },
  // Dehradun (2 stations)
  { id: "NS64", name: "Rajpur Road", city: "Dehradun", zone: "Commercial" as const, lat: 30.3410, lng: 78.0520 },
  { id: "NS65", name: "Selaqui Industrial", city: "Dehradun", zone: "Industrial" as const, lat: 30.3695, lng: 77.8567 },
];

// Major polluting industries monitored via OCEMS (CPCB's 17-category list of grossly polluting industries)
export const INDUSTRIES_DATA = [
  // Steel
  { id: "IND01", name: "Tata Steel Works", type: "Steel", category: "Red", city: "Jamshedpur", state: "Jharkhand", lat: 22.8046, lng: 86.2029 },
  { id: "IND02", name: "SAIL Bhilai Steel Plant", type: "Steel", category: "Red", city: "Bhilai", state: "Chhattisgarh", lat: 21.2145, lng: 81.3788 },
  { id: "IND03", name: "JSW Steel Vijayanagar", type: "Steel", category: "Red", city: "Bellary", state: "Karnataka", lat: 15.1394, lng: 76.9214 },
  { id: "IND04", name: "SAIL Rourkela Steel Plant", type: "Steel", category: "Red", city: "Rourkela", state: "Odisha", lat: 22.2604, lng: 84.8536 },
  { id: "IND05", name: "SAIL Bokaro Steel Plant", type: "Steel", category: "Red", city: "Bokaro", state: "Jharkhand", lat: 23.6693, lng: 86.1511 },
  { id: "IND06", name: "SAIL Durgapur Steel Plant", type: "Steel", category: "Red", city: "Durgapur", state: "West Bengal", lat: 23.5204, lng: 87.3120 },
  { id: "IND07", name: "Vizag Steel Plant (RINL)", type: "Steel", category: "Red", city: "Visakhapatnam", state: "Andhra Pradesh", lat: 17.6312, lng: 83.1676 },
  // Thermal Power
  { id: "IND08", name: "NTPC Dadri", type: "Thermal Power", category: "Red", city: "Dadri", state: "Uttar Pradesh", lat: 28.5520, lng: 77.5490 },
  { id: "IND09", name: "NTPC Singrauli", type: "Thermal Power", category: "Red", city: "Singrauli", state: "Madhya Pradesh", lat: 24.1067, lng: 82.6748 },
  { id: "IND10", name: "NTPC Korba", type: "Thermal Power", category: "Red", city: "Korba", state: "Chhattisgarh", lat: 22.3595, lng: 82.7501 },
  { id: "IND11", name: "NTPC Ramagundam", type: "Thermal Power", category: "Red", city: "Ramagundam", state: "Telangana", lat: 18.7557, lng: 79.4740 },
  { id: "IND12", name: "NTPC Farakka", type: "Thermal Power", category: "Red", city: "Farakka", state: "West Bengal", lat: 24.8095, lng: 87.8960 },
  { id: "IND13", name: "Adani Mundra TPS", type: "Thermal Power", category: "Red", city: "Mundra", state: "Gujarat", lat: 22.8393, lng: 69.7255 },
  { id: "IND14", name: "Tata Mundra UMPP", type: "Thermal Power", category: "Red", city: "Mundra", state: "Gujarat", lat: 22.8250, lng: 69.7050 },
  { id: "IND15", name: "CESC Budge Budge TPS", type: "Thermal Power", category: "Red", city: "Kolkata", state: "West Bengal", lat: 22.4605, lng: 88.1703 },
  // Refinery
  { id: "IND16", name: "Reliance Jamnagar Refinery", type: "Refinery", category: "Red", city: "Jamnagar", state: "Gujarat", lat: 22.4707, lng: 70.0677 },
  { id: "IND17", name: "IOCL Mathura Refinery", type: "Refinery", category: "Red", city: "Mathura", state: "Uttar Pradesh", lat: 27.4924, lng: 77.6737 },
  { id: "IND18", name: "IOCL Panipat Refinery", type: "Refinery", category: "Red", city: "Panipat", state: "Haryana", lat: 29.4040, lng: 76.9753 },
  { id: "IND19", name: "BPCL Mumbai Refinery", type: "Refinery", category: "Red", city: "Mumbai", state: "Maharashtra", lat: 19.0014, lng: 72.8500 },
  { id: "IND20", name: "MRPL Mangaluru Refinery", type: "Refinery", category: "Red", city: "Mangaluru", state: "Karnataka", lat: 12.9254, lng: 74.8260 },
  { id: "IND21", name: "HPCL Vizag Refinery", type: "Refinery", category: "Red", city: "Visakhapatnam", state: "Andhra Pradesh", lat: 17.6650, lng: 83.2472 },
  { id: "IND22", name: "NRL Numaligarh Refinery", type: "Refinery", category: "Red", city: "Numaligarh", state: "Assam", lat: 26.6290, lng: 93.7263 },
  // Cement
  { id: "IND23", name: "Ambuja Cements Ropar", type: "Cement", category: "Red", city: "Ropar", state: "Punjab", lat: 30.9661, lng: 76.5333 },
  { id: "IND24", name: "UltraTech Cement Aditya", type: "Cement", category: "Red", city: "Kota", state: "Rajasthan", lat: 25.1800, lng: 75.8600 },
  { id: "IND25", name: "ACC Wadi Cement Works", type: "Cement", category: "Orange", city: "Gulbarga", state: "Karnataka", lat: 17.3331, lng: 76.8305 },
  { id: "IND26", name: "Dalmia Cement Dalmiapuram", type: "Cement", category: "Red", city: "Trichy", state: "Tamil Nadu", lat: 11.0460, lng: 78.9990 },
  { id: "IND27", name: "Shree Cement Beawar", type: "Cement", category: "Red", city: "Beawar", state: "Rajasthan", lat: 26.1012, lng: 74.3211 },
  // Chemical / Fertilizer
  { id: "IND28", name: "Grasim Industries Nagda", type: "Chemical", category: "Red", city: "Nagda", state: "Madhya Pradesh", lat: 23.4500, lng: 75.4200 },
  { id: "IND29", name: "IFFCO Kalol", type: "Fertilizer", category: "Red", city: "Kalol", state: "Gujarat", lat: 23.2310, lng: 72.5015 },
  { id: "IND30", name: "NFL Nangal", type: "Fertilizer", category: "Red", city: "Nangal", state: "Punjab", lat: 31.3829, lng: 76.3739 },
  { id: "IND31", name: "GNFC Bharuch", type: "Chemical", category: "Red", city: "Bharuch", state: "Gujarat", lat: 21.6952, lng: 72.9781 },
  // Smelter / Mining
  { id: "IND32", name: "Hindustan Zinc Chanderiya", type: "Smelter", category: "Red", city: "Chittorgarh", state: "Rajasthan", lat: 24.7247, lng: 74.6043 },
  { id: "IND33", name: "NALCO Smelter Plant", type: "Smelter", category: "Red", city: "Angul", state: "Odisha", lat: 20.8407, lng: 85.0985 },
  { id: "IND34", name: "HINDALCO Renukoot", type: "Smelter", category: "Red", city: "Renukoot", state: "Uttar Pradesh", lat: 24.2082, lng: 83.0279 },
  { id: "IND35", name: "Vedanta Alumina Lanjigarh", type: "Smelter", category: "Red", city: "Lanjigarh", state: "Odisha", lat: 19.7167, lng: 83.3833 },
  // Petrochemical
  { id: "IND36", name: "Haldia Petrochemicals", type: "Petrochemical", category: "Red", city: "Haldia", state: "West Bengal", lat: 22.0645, lng: 88.1098 },
  { id: "IND37", name: "GAIL Pata Petrochemical", type: "Petrochemical", category: "Red", city: "Auraiya", state: "Uttar Pradesh", lat: 26.4630, lng: 79.5130 },
  // Paper / Pulp
  { id: "IND38", name: "JK Paper Mills Rayagada", type: "Pulp & Paper", category: "Orange", city: "Rayagada", state: "Odisha", lat: 19.1710, lng: 83.4166 },
  { id: "IND39", name: "BILT Yamunanagar", type: "Pulp & Paper", category: "Orange", city: "Yamunanagar", state: "Haryana", lat: 30.1354, lng: 77.2674 },
  // Pharma
  { id: "IND40", name: "Dr Reddy's Bachupally", type: "Pharmaceutical", category: "Orange", city: "Hyderabad", state: "Telangana", lat: 17.5355, lng: 78.3760 },
  { id: "IND41", name: "Cipla Patalganga", type: "Pharmaceutical", category: "Orange", city: "Raigad", state: "Maharashtra", lat: 18.8775, lng: 73.1405 },
  // Sugar / Distillery
  { id: "IND42", name: "Bajaj Hindusthan Sugar", type: "Sugar & Distillery", category: "Orange", city: "Gonda", state: "Uttar Pradesh", lat: 27.1300, lng: 81.9619 },
  // Textile
  { id: "IND43", name: "Arvind Mills Ahmedabad", type: "Textile", category: "Orange", city: "Ahmedabad", state: "Gujarat", lat: 23.0401, lng: 72.5563 },
  { id: "IND44", name: "Raymond Thane", type: "Textile", category: "Orange", city: "Thane", state: "Maharashtra", lat: 19.2183, lng: 72.9781 },
  // Tannery
  { id: "IND45", name: "TFL Leather Vaniyambadi", type: "Tannery", category: "Red", city: "Vaniyambadi", state: "Tamil Nadu", lat: 12.6821, lng: 78.6200 },
];

// Pollutant display names
export const POLLUTANT_NAMES: Record<string, string> = {
  pm25: "PM₂.₅",
  pm10: "PM₁₀",
  so2: "SO₂",
  no2: "NO₂",
  co: "CO",
  o3: "O₃",
  nh3: "NH₃",
};

// Navigation items for sidebar
export const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: "LayoutDashboard" },
  { name: "Pollution Map", href: "/map", icon: "Map" },
  { name: "Alerts", href: "/alerts", icon: "Bell" },
  { name: "Industries", href: "/industries", icon: "Factory" },
  { name: "Reports", href: "/reports", icon: "BarChart3" },
  { name: "AI Copilot", href: "/copilot", icon: "Bot" },
  { name: "Citizen Portal", href: "/citizen", icon: "Users" },
];
