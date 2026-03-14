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

// Extended CPCB CAAQMS station coverage (~170 stations across all Indian states)
// Used as the fallback simulation dataset when live APIs are unavailable
export const EXTENDED_AIR_CITIES: Array<{ name: string; city: string; state: string; lat: number; lng: number }> = [
  // Delhi NCR
  { name: "Anand Vihar", city: "Delhi", state: "Delhi", lat: 28.6508, lng: 77.3152 },
  { name: "ITO", city: "Delhi", state: "Delhi", lat: 28.6289, lng: 77.2405 },
  { name: "R.K. Puram", city: "Delhi", state: "Delhi", lat: 28.5638, lng: 77.1688 },
  { name: "Punjabi Bagh", city: "Delhi", state: "Delhi", lat: 28.6720, lng: 77.1303 },
  { name: "Dwarka Sector 8", city: "Delhi", state: "Delhi", lat: 28.5760, lng: 77.0640 },
  { name: "Wazirpur", city: "Delhi", state: "Delhi", lat: 28.7030, lng: 77.1620 },
  { name: "Okhla Phase 2", city: "Delhi", state: "Delhi", lat: 28.5310, lng: 77.2710 },
  { name: "Shadipur", city: "Delhi", state: "Delhi", lat: 28.6500, lng: 77.1390 },
  { name: "Vivek Vihar", city: "Delhi", state: "Delhi", lat: 28.6705, lng: 77.3120 },
  { name: "Jahangirpuri", city: "Delhi", state: "Delhi", lat: 28.7345, lng: 77.1723 },
  { name: "Narela", city: "Delhi", state: "Delhi", lat: 28.8530, lng: 77.0960 },
  { name: "Bawana", city: "Delhi", state: "Delhi", lat: 28.7840, lng: 77.0350 },
  { name: "Rohini Sector 16", city: "Delhi", state: "Delhi", lat: 28.7420, lng: 77.0690 },
  { name: "Noida Sector 62", city: "Noida", state: "Uttar Pradesh", lat: 28.6280, lng: 77.3640 },
  { name: "Noida Sector 125", city: "Noida", state: "Uttar Pradesh", lat: 28.5458, lng: 77.3240 },
  { name: "Vasundhara", city: "Ghaziabad", state: "Uttar Pradesh", lat: 28.6540, lng: 77.3710 },
  { name: "Loni Industrial", city: "Ghaziabad", state: "Uttar Pradesh", lat: 28.7483, lng: 77.2799 },
  { name: "NHPC Chowk", city: "Faridabad", state: "Haryana", lat: 28.3910, lng: 77.3207 },
  { name: "Sector 16A", city: "Faridabad", state: "Haryana", lat: 28.4272, lng: 77.3062 },
  { name: "Vikas Sadan", city: "Gurugram", state: "Haryana", lat: 28.4860, lng: 77.0565 },
  { name: "Sector 51", city: "Gurugram", state: "Haryana", lat: 28.4263, lng: 77.0472 },
  { name: "IMT Manesar", city: "Manesar", state: "Haryana", lat: 28.3570, lng: 76.9390 },
  { name: "Rohtak", city: "Rohtak", state: "Haryana", lat: 28.8955, lng: 76.6066 },
  { name: "Bahadurgarh", city: "Bahadurgarh", state: "Haryana", lat: 28.6879, lng: 76.9223 },
  { name: "Sonipat", city: "Sonipat", state: "Haryana", lat: 28.9931, lng: 77.0151 },
  { name: "Panipat", city: "Panipat", state: "Haryana", lat: 29.3909, lng: 76.9635 },
  { name: "Dharuhera", city: "Dharuhera", state: "Haryana", lat: 28.2255, lng: 76.7959 },
  { name: "Yamunanagar", city: "Yamunanagar", state: "Haryana", lat: 30.1290, lng: 77.2931 },
  { name: "Hisar", city: "Hisar", state: "Haryana", lat: 29.1492, lng: 75.7217 },
  { name: "Bhiwani", city: "Bhiwani", state: "Haryana", lat: 28.7972, lng: 76.1398 },
  { name: "Kurukshetra", city: "Kurukshetra", state: "Haryana", lat: 29.9695, lng: 76.8783 },
  // Maharashtra
  { name: "Colaba", city: "Mumbai", state: "Maharashtra", lat: 18.9067, lng: 72.8141 },
  { name: "Worli", city: "Mumbai", state: "Maharashtra", lat: 19.0178, lng: 72.8478 },
  { name: "Bandra Kurla", city: "Mumbai", state: "Maharashtra", lat: 19.0544, lng: 72.8402 },
  { name: "Borivali East", city: "Mumbai", state: "Maharashtra", lat: 19.2288, lng: 72.8697 },
  { name: "Malad West", city: "Mumbai", state: "Maharashtra", lat: 19.1857, lng: 72.8465 },
  { name: "Mazagon", city: "Mumbai", state: "Maharashtra", lat: 18.9582, lng: 72.8367 },
  { name: "Kurla West", city: "Mumbai", state: "Maharashtra", lat: 19.0644, lng: 72.8820 },
  { name: "Chembur", city: "Mumbai", state: "Maharashtra", lat: 19.0522, lng: 72.9006 },
  { name: "Shivajinagar", city: "Pune", state: "Maharashtra", lat: 18.5326, lng: 73.8506 },
  { name: "Karve Road", city: "Pune", state: "Maharashtra", lat: 18.5022, lng: 73.8262 },
  { name: "Pimpri Chinchwad", city: "Pune", state: "Maharashtra", lat: 18.6298, lng: 73.8000 },
  { name: "Nashik Gangapur", city: "Nashik", state: "Maharashtra", lat: 19.9975, lng: 73.7898 },
  { name: "Nagpur Civil Lines", city: "Nagpur", state: "Maharashtra", lat: 21.1458, lng: 79.0882 },
  { name: "Aurangabad", city: "Aurangabad", state: "Maharashtra", lat: 19.8762, lng: 75.3433 },
  { name: "Solapur", city: "Solapur", state: "Maharashtra", lat: 17.6805, lng: 75.9064 },
  { name: "Amravati", city: "Amravati", state: "Maharashtra", lat: 20.9333, lng: 77.7500 },
  { name: "Kolhapur", city: "Kolhapur", state: "Maharashtra", lat: 16.7050, lng: 74.2433 },
  { name: "Jalgaon", city: "Jalgaon", state: "Maharashtra", lat: 21.0077, lng: 75.5626 },
  { name: "Nanded", city: "Nanded", state: "Maharashtra", lat: 19.1383, lng: 77.3210 },
  // Karnataka
  { name: "BTM Layout", city: "Bengaluru", state: "Karnataka", lat: 12.9165, lng: 77.6101 },
  { name: "Silk Board", city: "Bengaluru", state: "Karnataka", lat: 12.9173, lng: 77.6237 },
  { name: "Peenya Industrial", city: "Bengaluru", state: "Karnataka", lat: 13.0300, lng: 77.4936 },
  { name: "Hebbal", city: "Bengaluru", state: "Karnataka", lat: 13.0353, lng: 77.5970 },
  { name: "Jayanagar 4th Block", city: "Bengaluru", state: "Karnataka", lat: 12.9308, lng: 77.5838 },
  { name: "Mangaluru", city: "Mangaluru", state: "Karnataka", lat: 12.9141, lng: 74.8560 },
  { name: "Mysuru", city: "Mysuru", state: "Karnataka", lat: 12.2958, lng: 76.6394 },
  { name: "Hubballi", city: "Hubballi", state: "Karnataka", lat: 15.3647, lng: 75.1240 },
  { name: "Belagavi", city: "Belagavi", state: "Karnataka", lat: 15.8497, lng: 74.4977 },
  { name: "Davangere", city: "Davangere", state: "Karnataka", lat: 14.4644, lng: 75.9218 },
  { name: "Kalaburagi", city: "Kalaburagi", state: "Karnataka", lat: 17.3297, lng: 76.8343 },
  // Tamil Nadu
  { name: "Alandur", city: "Chennai", state: "Tamil Nadu", lat: 12.9969, lng: 80.2017 },
  { name: "Manali", city: "Chennai", state: "Tamil Nadu", lat: 13.1665, lng: 80.2665 },
  { name: "Velachery", city: "Chennai", state: "Tamil Nadu", lat: 12.9815, lng: 80.2209 },
  { name: "Arumbakkam", city: "Chennai", state: "Tamil Nadu", lat: 13.0723, lng: 80.2136 },
  { name: "Coimbatore North", city: "Coimbatore", state: "Tamil Nadu", lat: 11.0168, lng: 76.9558 },
  { name: "Madurai South", city: "Madurai", state: "Tamil Nadu", lat: 9.9252, lng: 78.1198 },
  { name: "Salem Steel Plant", city: "Salem", state: "Tamil Nadu", lat: 11.6643, lng: 78.1460 },
  { name: "Tiruchirappalli", city: "Tiruchirappalli", state: "Tamil Nadu", lat: 10.7905, lng: 78.7047 },
  { name: "Tirupur", city: "Tirupur", state: "Tamil Nadu", lat: 11.1085, lng: 77.3411 },
  { name: "Thoothukudi", city: "Thoothukudi", state: "Tamil Nadu", lat: 8.7642, lng: 78.1348 },
  { name: "Hosur SIPCOT", city: "Hosur", state: "Tamil Nadu", lat: 12.7409, lng: 77.8253 },
  { name: "Vellore", city: "Vellore", state: "Tamil Nadu", lat: 12.9165, lng: 79.1325 },
  { name: "Erode", city: "Erode", state: "Tamil Nadu", lat: 11.3410, lng: 77.7172 },
  // Telangana
  { name: "Jubilee Hills", city: "Hyderabad", state: "Telangana", lat: 17.4325, lng: 78.4073 },
  { name: "Bollaram IDA", city: "Hyderabad", state: "Telangana", lat: 17.4985, lng: 78.4445 },
  { name: "ECIL Hyderabad", city: "Hyderabad", state: "Telangana", lat: 17.4715, lng: 78.5609 },
  { name: "Pashamylaram IDA", city: "Hyderabad", state: "Telangana", lat: 17.5248, lng: 78.2614 },
  { name: "Kokapet", city: "Hyderabad", state: "Telangana", lat: 17.3834, lng: 78.3371 },
  { name: "Warangal", city: "Warangal", state: "Telangana", lat: 17.9784, lng: 79.5941 },
  // Andhra Pradesh
  { name: "NAD Kotha Road", city: "Visakhapatnam", state: "Andhra Pradesh", lat: 17.7248, lng: 83.3065 },
  { name: "Gajuwaka", city: "Visakhapatnam", state: "Andhra Pradesh", lat: 17.6868, lng: 83.2185 },
  { name: "Krishnalanka", city: "Vijayawada", state: "Andhra Pradesh", lat: 16.5062, lng: 80.6480 },
  { name: "Rajamahendravaram", city: "Rajamahendravaram", state: "Andhra Pradesh", lat: 17.0005, lng: 81.8040 },
  { name: "Tirupati", city: "Tirupati", state: "Andhra Pradesh", lat: 13.6288, lng: 79.4192 },
  { name: "Guntur", city: "Guntur", state: "Andhra Pradesh", lat: 16.3067, lng: 80.4365 },
  { name: "Nellore", city: "Nellore", state: "Andhra Pradesh", lat: 14.4426, lng: 79.9865 },
  { name: "Kadapa", city: "Kadapa", state: "Andhra Pradesh", lat: 14.4674, lng: 78.8241 },
  { name: "Kurnool", city: "Kurnool", state: "Andhra Pradesh", lat: 15.8281, lng: 78.0373 },
  { name: "Chittoor", city: "Chittoor", state: "Andhra Pradesh", lat: 13.2172, lng: 79.1003 },
  // West Bengal
  { name: "Jadavpur University", city: "Kolkata", state: "West Bengal", lat: 22.5036, lng: 88.3659 },
  { name: "Rabindra Bharati", city: "Kolkata", state: "West Bengal", lat: 22.5958, lng: 88.3636 },
  { name: "Ballygunge", city: "Kolkata", state: "West Bengal", lat: 22.5277, lng: 88.3629 },
  { name: "Fort William", city: "Kolkata", state: "West Bengal", lat: 22.5530, lng: 88.3442 },
  { name: "Asansol", city: "Asansol", state: "West Bengal", lat: 23.6833, lng: 86.9833 },
  { name: "Durgapur Steel", city: "Durgapur", state: "West Bengal", lat: 23.5204, lng: 87.3120 },
  { name: "Haldia", city: "Haldia", state: "West Bengal", lat: 22.0667, lng: 88.0700 },
  { name: "Howrah Station", city: "Howrah", state: "West Bengal", lat: 22.5958, lng: 88.2636 },
  // Uttar Pradesh
  { name: "Lalbagh", city: "Lucknow", state: "Uttar Pradesh", lat: 26.8534, lng: 80.9312 },
  { name: "Talkatora Lucknow", city: "Lucknow", state: "Uttar Pradesh", lat: 26.8510, lng: 80.9420 },
  { name: "Nehru Nagar", city: "Kanpur", state: "Uttar Pradesh", lat: 26.4499, lng: 80.3319 },
  { name: "Taj Mahal Agra", city: "Agra", state: "Uttar Pradesh", lat: 27.1751, lng: 78.0421 },
  { name: "Sanjay Place Agra", city: "Agra", state: "Uttar Pradesh", lat: 27.1854, lng: 78.0055 },
  { name: "Ardhali Bazar", city: "Varanasi", state: "Uttar Pradesh", lat: 25.3176, lng: 83.0130 },
  { name: "Civil Lines Prayagraj", city: "Prayagraj", state: "Uttar Pradesh", lat: 25.4358, lng: 81.8463 },
  { name: "Moradabad", city: "Moradabad", state: "Uttar Pradesh", lat: 28.8389, lng: 78.7768 },
  { name: "Firozabad Glass City", city: "Firozabad", state: "Uttar Pradesh", lat: 27.1591, lng: 78.3957 },
  { name: "Meerut", city: "Meerut", state: "Uttar Pradesh", lat: 28.9845, lng: 77.7064 },
  { name: "Bareilly", city: "Bareilly", state: "Uttar Pradesh", lat: 28.3670, lng: 79.4304 },
  { name: "Ghazipur", city: "Ghazipur", state: "Uttar Pradesh", lat: 25.5772, lng: 83.5730 },
  { name: "Hapur", city: "Hapur", state: "Uttar Pradesh", lat: 28.7297, lng: 77.7760 },
  // Rajasthan
  { name: "Adarsh Nagar Jaipur", city: "Jaipur", state: "Rajasthan", lat: 26.9125, lng: 75.7873 },
  { name: "Central Park Jaipur", city: "Jaipur", state: "Rajasthan", lat: 26.8878, lng: 75.8075 },
  { name: "Jodhpur", city: "Jodhpur", state: "Rajasthan", lat: 26.2389, lng: 73.0243 },
  { name: "Kota", city: "Kota", state: "Rajasthan", lat: 25.2138, lng: 75.8648 },
  { name: "Ajmer", city: "Ajmer", state: "Rajasthan", lat: 26.4499, lng: 74.6399 },
  { name: "Bhiwadi RIICO", city: "Bhiwadi", state: "Rajasthan", lat: 28.2058, lng: 76.8481 },
  { name: "Udaipur", city: "Udaipur", state: "Rajasthan", lat: 24.5854, lng: 73.7125 },
  { name: "Bikaner", city: "Bikaner", state: "Rajasthan", lat: 28.0229, lng: 73.3119 },
  { name: "Alwar", city: "Alwar", state: "Rajasthan", lat: 27.5530, lng: 76.6346 },
  { name: "Sikar", city: "Sikar", state: "Rajasthan", lat: 27.6094, lng: 75.1399 },
  // Gujarat
  { name: "Maninagar", city: "Ahmedabad", state: "Gujarat", lat: 22.9942, lng: 72.6130 },
  { name: "Satellite Ahmedabad", city: "Ahmedabad", state: "Gujarat", lat: 23.0320, lng: 72.5200 },
  { name: "GIDC Vatva", city: "Ahmedabad", state: "Gujarat", lat: 22.9700, lng: 72.6460 },
  { name: "Surat", city: "Surat", state: "Gujarat", lat: 21.1702, lng: 72.8311 },
  { name: "Vadodara", city: "Vadodara", state: "Gujarat", lat: 22.3072, lng: 73.1812 },
  { name: "Rajkot", city: "Rajkot", state: "Gujarat", lat: 22.3039, lng: 70.8022 },
  { name: "Ankleshwar GIDC", city: "Ankleshwar", state: "Gujarat", lat: 21.6267, lng: 73.0162 },
  { name: "Vapi GIDC", city: "Vapi", state: "Gujarat", lat: 20.3727, lng: 72.9100 },
  { name: "Gandhinagar", city: "Gandhinagar", state: "Gujarat", lat: 23.2156, lng: 72.6369 },
  { name: "Valsad", city: "Valsad", state: "Gujarat", lat: 20.6135, lng: 72.9280 },
  // Punjab
  { name: "Amritsar", city: "Amritsar", state: "Punjab", lat: 31.6340, lng: 74.8723 },
  { name: "Ludhiana", city: "Ludhiana", state: "Punjab", lat: 30.9010, lng: 75.8573 },
  { name: "Jalandhar", city: "Jalandhar", state: "Punjab", lat: 31.3260, lng: 75.5762 },
  { name: "Patiala", city: "Patiala", state: "Punjab", lat: 30.3398, lng: 76.3869 },
  { name: "Bathinda", city: "Bathinda", state: "Punjab", lat: 30.2110, lng: 74.9455 },
  { name: "Mandi Gobindgarh", city: "Mandi Gobindgarh", state: "Punjab", lat: 30.6661, lng: 76.3133 },
  { name: "Khanna", city: "Khanna", state: "Punjab", lat: 30.7026, lng: 76.2252 },
  // Madhya Pradesh
  { name: "Bhopal", city: "Bhopal", state: "Madhya Pradesh", lat: 23.2599, lng: 77.4126 },
  { name: "Indore", city: "Indore", state: "Madhya Pradesh", lat: 22.7196, lng: 75.8577 },
  { name: "Gwalior", city: "Gwalior", state: "Madhya Pradesh", lat: 26.2183, lng: 78.1828 },
  { name: "Jabalpur", city: "Jabalpur", state: "Madhya Pradesh", lat: 23.1815, lng: 79.9864 },
  { name: "Dewas", city: "Dewas", state: "Madhya Pradesh", lat: 22.9676, lng: 76.0534 },
  { name: "Singrauli", city: "Singrauli", state: "Madhya Pradesh", lat: 24.1067, lng: 82.6748 },
  { name: "Ujjain", city: "Ujjain", state: "Madhya Pradesh", lat: 23.1828, lng: 75.7772 },
  { name: "Ratlam", city: "Ratlam", state: "Madhya Pradesh", lat: 23.3315, lng: 75.0367 },
  { name: "Pithampur Industrial", city: "Pithampur", state: "Madhya Pradesh", lat: 22.6115, lng: 75.6895 },
  // Bihar
  { name: "IGSC Patna", city: "Patna", state: "Bihar", lat: 25.6096, lng: 85.1347 },
  { name: "Muzaffarpur", city: "Muzaffarpur", state: "Bihar", lat: 26.1209, lng: 85.3647 },
  { name: "Gaya", city: "Gaya", state: "Bihar", lat: 24.7955, lng: 85.0002 },
  { name: "Begusarai", city: "Begusarai", state: "Bihar", lat: 25.4182, lng: 86.1272 },
  // Odisha
  { name: "Bhubaneswar", city: "Bhubaneswar", state: "Odisha", lat: 20.2961, lng: 85.8245 },
  { name: "Talcher", city: "Talcher", state: "Odisha", lat: 20.9574, lng: 85.2294 },
  { name: "Angul", city: "Angul", state: "Odisha", lat: 20.8432, lng: 85.1012 },
  { name: "Jharsuguda", city: "Jharsuguda", state: "Odisha", lat: 21.8617, lng: 84.0073 },
  { name: "Rourkela", city: "Rourkela", state: "Odisha", lat: 22.2604, lng: 84.8536 },
  { name: "Sambalpur", city: "Sambalpur", state: "Odisha", lat: 21.4669, lng: 83.9812 },
  // Jharkhand
  { name: "Dhanbad", city: "Dhanbad", state: "Jharkhand", lat: 23.7957, lng: 86.4304 },
  { name: "Jamshedpur", city: "Jamshedpur", state: "Jharkhand", lat: 22.8046, lng: 86.2029 },
  { name: "Ranchi", city: "Ranchi", state: "Jharkhand", lat: 23.3441, lng: 85.3096 },
  { name: "Bokaro Steel City", city: "Bokaro", state: "Jharkhand", lat: 23.6693, lng: 86.1511 },
  // Chhattisgarh
  { name: "Bhilai Steel Plant", city: "Bhilai", state: "Chhattisgarh", lat: 21.2145, lng: 81.3788 },
  { name: "Korba", city: "Korba", state: "Chhattisgarh", lat: 22.3595, lng: 82.7501 },
  { name: "Raipur", city: "Raipur", state: "Chhattisgarh", lat: 21.2514, lng: 81.6296 },
  { name: "Raigarh", city: "Raigarh", state: "Chhattisgarh", lat: 21.8974, lng: 83.3950 },
  // Himachal Pradesh
  { name: "Baddi Industrial", city: "Baddi", state: "Himachal Pradesh", lat: 30.9598, lng: 76.7954 },
  { name: "Paonta Sahib", city: "Paonta Sahib", state: "Himachal Pradesh", lat: 30.4366, lng: 77.6250 },
  { name: "Nalagarh", city: "Nalagarh", state: "Himachal Pradesh", lat: 31.0393, lng: 76.7226 },
  { name: "Sundernagar", city: "Sundernagar", state: "Himachal Pradesh", lat: 31.5341, lng: 76.8933 },
  // Uttarakhand
  { name: "Dehradun", city: "Dehradun", state: "Uttarakhand", lat: 30.3165, lng: 78.0322 },
  { name: "Haridwar", city: "Haridwar", state: "Uttarakhand", lat: 29.9457, lng: 78.1642 },
  { name: "Rishikesh", city: "Rishikesh", state: "Uttarakhand", lat: 30.0869, lng: 78.2676 },
  { name: "Kashipur", city: "Kashipur", state: "Uttarakhand", lat: 29.2080, lng: 78.9640 },
  // Assam
  { name: "Guwahati", city: "Guwahati", state: "Assam", lat: 26.1445, lng: 91.7362 },
  { name: "Tezpur", city: "Tezpur", state: "Assam", lat: 26.6338, lng: 92.7926 },
  { name: "Silchar", city: "Silchar", state: "Assam", lat: 24.8333, lng: 92.7789 },
  // Kerala
  { name: "Thiruvananthapuram", city: "Thiruvananthapuram", state: "Kerala", lat: 8.5241, lng: 76.9366 },
  { name: "Kochi", city: "Kochi", state: "Kerala", lat: 9.9312, lng: 76.2673 },
  { name: "Kozhikode", city: "Kozhikode", state: "Kerala", lat: 11.2588, lng: 75.7804 },
  { name: "Thrissur", city: "Thrissur", state: "Kerala", lat: 10.5276, lng: 76.2144 },
  // Jammu & Kashmir
  { name: "Jammu", city: "Jammu", state: "Jammu & Kashmir", lat: 32.7266, lng: 74.8570 },
  { name: "Srinagar", city: "Srinagar", state: "Jammu & Kashmir", lat: 34.0837, lng: 74.7973 },
  // Chandigarh
  { name: "Sector 22 Chandigarh", city: "Chandigarh", state: "Chandigarh", lat: 30.7338, lng: 76.7783 },
  { name: "Industrial Phase 1", city: "Chandigarh", state: "Chandigarh", lat: 30.7050, lng: 76.8010 },
  // Other states
  { name: "Panaji", city: "Panaji", state: "Goa", lat: 15.4909, lng: 73.8278 },
  { name: "Vasco da Gama", city: "Vasco", state: "Goa", lat: 15.3958, lng: 73.8119 },
  { name: "Puducherry", city: "Puducherry", state: "Puducherry", lat: 11.9416, lng: 79.8083 },
  { name: "Gangtok", city: "Gangtok", state: "Sikkim", lat: 27.3389, lng: 88.6065 },
  { name: "Imphal", city: "Imphal", state: "Manipur", lat: 24.8170, lng: 93.9368 },
  { name: "Shillong", city: "Shillong", state: "Meghalaya", lat: 25.5788, lng: 91.8933 },
  { name: "Kohima", city: "Kohima", state: "Nagaland", lat: 25.6700, lng: 94.1074 },
  { name: "Agartala", city: "Agartala", state: "Tripura", lat: 23.8315, lng: 91.2868 },
  { name: "Aizawl", city: "Aizawl", state: "Mizoram", lat: 23.7307, lng: 92.7173 },
  { name: "Itanagar", city: "Itanagar", state: "Arunachal Pradesh", lat: 27.0844, lng: 93.6053 },
  { name: "Dimapur", city: "Dimapur", state: "Nagaland", lat: 25.9093, lng: 93.7211 },
  { name: "Shimla", city: "Shimla", state: "Himachal Pradesh", lat: 31.1048, lng: 77.1734 },
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
