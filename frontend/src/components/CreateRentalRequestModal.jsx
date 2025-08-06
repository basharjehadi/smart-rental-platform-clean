import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const CreateRentalRequestModal = ({ isOpen, onClose, onSuccess, editMode = false, requestData = null }) => {
  const [originalRequestId, setOriginalRequestId] = useState(null);
  const [formData, setFormData] = useState({
    city: '',
    district: '',
    budgetFrom: '',
    budgetTo: '',
    propertyType: '',
    numberOfRooms: '',
    moveInDate: '',
    requirements: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { api } = useAuth();

  // Polish cities with their districts
  const cityDistricts = {
    'Warsaw': [
      'Mokotów', 'Praga-Południe', 'Wola', 'Śródmieście', 'Bielany', 'Targówek', 
      'Bemowo', 'Ochota', 'Praga-Północ', 'Żoliborz', 'Włochy', 'Ursus', 
      'Wilanów', 'Wesoła', 'Wawer', 'Rembertów', 'Ursynów', 'Saska Kępa'
    ],
    'Krakow': [
      'Stare Miasto', 'Grzegórzki', 'Prądnik Czerwony', 'Prądnik Biały', 'Krowodrza', 
      'Bronowice', 'Zwierzyniec', 'Dębniki', 'Łagiewniki-Borek Fałęcki', 'Swoszowice', 
      'Podgórze Duchackie', 'Bieżanów-Prokocim', 'Podgórze', 'Czyżyny', 'Mistrzejowice', 
      'Bieńczyce', 'Wzgórza Krzesławickie', 'Nowa Huta'
    ],
    'Poznan': [
      'Stare Miasto', 'Wilda', 'Piątkowo', 'Nowe Miasto', 'Jeżyce', 'Grunwald', 
      'Łazarz', 'Górczyn', 'Juniakowo', 'Chartowo', 'Winogrady', 'Piątkowo', 
      'Naramowice', 'Umultowo', 'Piątkowo', 'Morasko', 'Radojewo', 'Kiekrz'
    ],
    'Gdansk': [
      'Śródmieście', 'Chełm', 'Brzeźno', 'Nowy Port', 'Wrzeszcz Dolny', 'Wrzeszcz Górny', 
      'Oliwa', 'Przymorze Wielkie', 'Przymorze Małe', 'Żabianka-Wejhera-Jelitkowo-Tysiąclecia', 
      'Kokoszki', 'Kiełpino Górne', 'VII Dwór', 'Matarnia', 'Ujeścisko-Łostowice', 
      'Piecki-Migowo', 'Rudniki', 'Suchanino', 'Siedlce', 'Aniołki', 'Młyniska', 
      'Letnica', 'Krakowiec-Górki Zachodnie', 'Osowa', 'Jasień', 'Orunia-Św.Wojciech-Lipce'
    ],
    'Wroclaw': [
      'Stare Miasto', 'Śródmieście', 'Krzyki', 'Fabryczna', 'Psie Pole', 'Karłowice', 
      'Kleczków', 'Kowale', 'Leśnica', 'Muchobór Mały', 'Muchobór Wielki', 'Ołbin', 
      'Ołtaszyn', 'Pilczyce', 'Pracze Odrzańskie', 'Różanka', 'Sępolno', 'Sołtysowice', 
      'Stabłowice', 'Strachocin-Swojczyce-Wojnów', 'Świniary', 'Tarnogaj', 'Widawa', 'Wojszyce', 'Zalesie', 'Żerniki'
    ],
    'Lodz': [
      'Bałuty', 'Górna', 'Polesie', 'Śródmieście', 'Widzew', 'Andrzejów', 'Chojny', 
      'Dąbrowa', 'Doły', 'Fabryczna', 'Górniak', 'Karolew', 'Koziny', 'Kurczaki', 
      'Lublinek', 'Łagiewniki', 'Mileszki', 'Mokra', 'Nowosolna', 'Olechów', 'Olechów-Janów', 
      'Park Reymonta', 'Radogoszcz', 'Retkinia', 'Ruda', 'Sikawa', 'Smulsko', 'Stare Polesie', 
      'Stary Widzew', 'Śródmieście', 'Teofilów', 'Wiskitno', 'Wzniesień Łódzkich', 'Zagórnik', 'Zielona Góra'
    ],
    'Szczecin': [
      'Śródmieście', 'Pomorzany', 'Niebużany', 'Świerczewo', 'Warszewo', 'Arkońskie-Niemierzyn', 
      'Głębokie-Pilchowo', 'Gumieńce', 'Krzekowo-Bezrzecze', 'Osów', 'Płonia-Śmierdnica-Jezierzyce', 
      'Podjuchy', 'Wielgowo-Sławociesze', 'Załom-Kasztanowe', 'Bukowo', 'Centrum', 'Dąbie', 
      'Kijewo', 'Międzyodrze-Wyspa Pucka', 'Niebuszewo', 'Nowe Miasto', 'Pogodno', 'Stołczyn', 'Turzyn', 'Warszewo', 'Zdroje'
    ],
    'Bydgoszcz': [
      'Szwederowo', 'Błonie', 'Okole', 'Śródmieście', 'Fordon', 'Brdyujście', 'Bartodzieje', 
      'Bielawy', 'Bocianowo', 'Czyżkówko', 'Fordon', 'Glinki', 'Jary', 'Kapuściska', 
      'Łęgnowo', 'Miedzyń', 'Osowa Góra', 'Piaski', 'Prądy', 'Siernieczek', 'Skrzetusko', 
      'Smukała', 'Stary Fordon', 'Szwederowo', 'Wzgórze Wolności', 'Wyżyny', 'Zimne Wody'
    ],
    'Lublin': [
      'Śródmieście', 'Wieniawa', 'Zabłocie', 'Rury', 'Sławin', 'Sławinek', 'Wrotków', 
      'Bronowice', 'Tatary', 'Kalinowszczyzna', 'Hajdów-Zadębie', 'Konstantynów', 'Lubelskiej Spółdzielni Mieszkaniowej', 
      'Kościelniak', 'Rury', 'Szerokie', 'Zemborzyce', 'Dziesiąta', 'Głusk', 'Węglin', 'Felicity'
    ],
    'Katowice': [
      'Śródmieście', 'Koszutka', 'Bogucice', 'Osiedle Paderewskiego-Muchowiec', 'Dąb', 
      'Wełnowiec-Józefowiec', 'Załęże', 'Osiedle Witosa', 'Piotrowice-Ochojec', 'Ligota-Panewniki', 
      'Brynowiec-Osiedle Zgrzebnioka', 'Giszowiec', 'Murcki', 'Kostuchna', 'Podlesie', 'Szopienice-Burowiec', 
      'Janów-Nikiszowiec', 'Giszowiec', 'Dąbrówka Mała', 'Szopienice-Burowiec', 'Roździeń', 'Załęska Hałda-Brynów część zachodnia'
    ],
    'Bialystok': [
      'Centrum', 'Białostoczek', 'Sienkiewicza', 'Bojary', 'Piaski', 'Przydworcowe', 
      'Młynarskie', 'Piasta I', 'Piasta II', 'Skorupy', 'Mickiewicza', 'Dojlidy Górne', 
      'Dojlidy', 'Białostoczek', 'Wygoda', 'Wysoki Stoczek', 'Dziesięciny I', 'Dziesięciny II', 
      'Antoniuk', 'Jaroszówka', 'Wygoda', 'Krynicka', 'Mickiewicza', 'Nowe Miasto', 'Osiedle Leśne', 'Piasta', 'Przydworcowe', 'Sienkiewicza', 'Skorupy', 'Starosielce', 'Słoneczny Stok', 'Wysoki Stoczek', 'Zielone Wzgórza'
    ],
    'Gdynia': [
      'Śródmieście', 'Kamienna Góra', 'Grabówek', 'Oksywie', 'Obłuże', 'Pogórze', 
      'Działki Leśne', 'Leszczynki', 'Grabówek', 'Chwarzno-Wiczlino', 'Mały Kack', 'Wielki Kack', 
      'Karwiny', 'Dąbrowa', 'Chylonia', 'Leszczynki', 'Pustki Cisowskie-Demptowo', 'Cisowa', 
      'Pustki Cisowskie-Demptowo', 'Chylonia', 'Leszczynki', 'Pustki Cisowskie-Demptowo', 'Cisowa', 
      'Pustki Cisowskie-Demptowo', 'Chylonia', 'Leszczynki', 'Pustki Cisowskie-Demptowo', 'Cisowa'
    ],
    'Czestochowa': [
      'Śródmieście', 'Stare Miasto', 'Ostatni Grosz', 'Trzech Wieszczów', 'Tysiąclecie', 
      'Północ', 'Raków', 'Błeszno', 'Częstochówka-Parkitka', 'Gnaszyn-Kawodrza', 'Grabówka', 
      'Kiedrzyn', 'Lisiniec', 'Mirów', 'Ostatni Grosz', 'Podjasnogórska', 'Północ', 'Raków', 
      'Stradom', 'Śródmieście', 'Tysiąclecie', 'Wrzosowiak', 'Wyczerpy-Aniołów', 'Zawodzie-Dąbie'
    ],
    'Radom': [
      'Śródmieście', 'Ustronie', 'Gołębiów I', 'Gołębiów II', 'Kozia Góra', 'Klimontów', 
      'Michałów', 'Obozisko', 'Planty', 'Potkanów', 'Prędocice', 'Sadków', 'Śródmieście', 
      'Ustronie', 'Wacyn', 'Wośniki', 'Zakrzew', 'Żakowice'
    ],
    'Sosnowiec': [
      'Śródmieście', 'Pogoń', 'Radocha', 'Rudna I', 'Rudna II', 'Rudna III', 'Rudna IV', 
      'Rudna V', 'Rudna VI', 'Rudna VII', 'Rudna VIII', 'Rudna IX', 'Rudna X', 'Rudna XI', 
      'Rudna XII', 'Rudna XIII', 'Rudna XIV', 'Rudna XV', 'Rudna XVI', 'Rudna XVII', 'Rudna XVIII', 'Rudna XIX', 'Rudna XX'
    ],
    'Torun': [
      'Stare Miasto', 'Nowe Miasto', 'Rubinkowo', 'Bielany', 'Bydgoskie Przedmieście', 
      'Chełmińskie Przedmieście', 'Jakubskie Przedmieście', 'Katarzynka', 'Koniuchy', 
      'Mokre', 'Na Skarpie', 'Podgórz', 'Rynek Nowomiejski', 'Stawki', 'Wrzosy', 'Zieleniec'
    ],
    'Kielce': [
      'Śródmieście', 'Barwinek', 'Białogon', 'Bocianek', 'Bukówka', 'Cedzyna', 'Ciekoty', 
      'Dąbrowa', 'Dobromyśl', 'Domaszowice', 'Drozdów', 'Górno', 'Grabówka', 'Herby', 
      'Jagiellońskie', 'Kadzielnia', 'Karczówka', 'Książnica', 'Laskówka', 'Leśnica', 
      'Lipówka', 'Łazy', 'Maleszowa', 'Miedziana Góra', 'Niewachlów', 'Nowy Folwark', 
      'Ostra Górka', 'Pakosz', 'Piekoszów', 'Piaski', 'Podkarczówka', 'Podklonówka', 
      'Podłęże', 'Podmiejska', 'Podszkodzie', 'Podzamcze', 'Pogorzałe', 'Polanka', 
      'Przypki', 'Raków', 'Reków', 'Słowik', 'Słowik Stary', 'Stadion', 'Stare Miasto', 
      'Szydłówek', 'Ślichowice', 'Świętokrzyskie', 'Targi', 'Tomaszówka', 'Uroczysko', 
      'Warszawskie', 'Wietrznia', 'Wzgórze Świętej Katarzyny', 'Zagórze', 'Zalesie', 'Zielona'
    ],
    'Rzeszow': [
      'Śródmieście', 'Nowe Miasto', 'Pobitno', 'Drabinianka', 'Zalesie', 'Słocina', 
      'Przybyszówka', 'Zwięczyca', 'Budziwój', 'Ruska Wieś', 'Załęże', 'Biała', 'Tyczyn', 
      'Krasne', 'Boguchwała', 'Łańcut', 'Leżajsk', 'Przeworsk', 'Jarosław', 'Przemyśl'
    ],
    'Gliwice': [
      'Śródmieście', 'Kozłów', 'Huta Andrzej', 'Ruda', 'Wirek', 'Bojków', 'Gaj', 'Kleszczów', 
      'Kobiór', 'Krywałd', 'Łabędy', 'Mikołów', 'Ornontowice', 'Orzesze', 'Paniówki', 
      'Pawłowice', 'Pielgrzymowice', 'Pilchowice', 'Pogrzebień', 'Pruchna', 'Pszczyna', 
      'Pszów', 'Radlin', 'Radostowice', 'Rudy', 'Rybnik', 'Rydułtowy', 'Sośnicowice', 
      'Suszec', 'Świerklany', 'Tychy', 'Wodzisław Śląski', 'Żory', 'Żywiec'
    ],
    'Zabrze': [
      'Centrum Południe', 'Centrum Północ', 'Biskupice', 'Borsigwerk', 'Dorota', 'Grzegorz', 
      'Helenka', 'Kończyce', 'Maczki', 'Mikulczyce', 'Osiedle Janek', 'Osiedle Tadeusza', 
      'Pawłów', 'Rokitnica', 'Zaborze Południe', 'Zaborze Północ', 'Zandka'
    ]
  };

  // Polish cities for dropdown
  const polishCities = Object.keys(cityDistricts);

  // Property types
  const propertyTypes = [
    'Room',
    'Shared Room',
    'Studio',
    'Apartment',
    'House'
  ];

  // Number of rooms options
  const roomOptions = ['1', '2', '3', '4', '5', '6'];

  // Get districts for selected city
  const getDistrictsForCity = (city) => {
    const districts = cityDistricts[city] || [];
    return ['All', ...districts]; // Add "All" option at the beginning
  };

  // Pre-fill form when in edit mode
  useEffect(() => {
    if (editMode && requestData) {
      const { city, district } = parseLocation(requestData.location);
      // Handle district - if it's null or empty, set to "All"
      const districtValue = requestData.district || district || 'All';
      
      setFormData({
        city: city || '',
        district: districtValue,
        budgetFrom: requestData.budgetFrom?.toString() || requestData.budget?.toString() || '',
        budgetTo: requestData.budgetTo?.toString() || requestData.budget?.toString() || '',
        propertyType: requestData.propertyType || '',
        numberOfRooms: requestData.bedrooms?.toString() || '',
        moveInDate: requestData.moveInDate ? requestData.moveInDate.split('T')[0] : '',
        requirements: requestData.description || ''
      });
      // Store the original request ID for editing
      setOriginalRequestId(requestData.id);
    }
  }, [editMode, requestData]);

  // Parse location to extract city and district
  const parseLocation = (location) => {
    if (!location) return { city: '', district: '' };
    const parts = location.split(',').map(part => part.trim());
    if (parts.length >= 2) {
      return { district: parts[0], city: parts[1] };
    }
    return { city: location, district: 'All' }; // Default to "All" if no district specified
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Reset district when city changes
    if (field === 'city') {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        district: ''
      }));
    }
    
    // Auto-set number of rooms to 1 for Room, Shared Room, and Studio
    if (field === 'propertyType') {
      const singleRoomTypes = ['Room', 'Shared Room', 'Studio'];
      if (singleRoomTypes.includes(value)) {
        setFormData(prev => ({
          ...prev,
          [field]: value,
          numberOfRooms: '1'
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Handle "All" district option
      const locationText = formData.district === 'All' 
        ? formData.city 
        : `${formData.district}, ${formData.city}`;
      
      const requestData = {
        title: `Looking for ${formData.propertyType} in ${formData.city}`,
        description: formData.requirements,
        location: locationText,
        budget: parseFloat(formData.budgetTo), // Using max budget as primary budget
        budgetFrom: parseFloat(formData.budgetFrom),
        budgetTo: parseFloat(formData.budgetTo),
        moveInDate: formData.moveInDate,
        bedrooms: parseInt(formData.numberOfRooms),
        propertyType: formData.propertyType,
        city: formData.city,
        district: formData.district === 'All' ? null : formData.district, // Store null for "All"
        additionalRequirements: formData.requirements
      };

      let response;
      if (editMode) {
        // Update existing request
        response = await api.put(`/rental-request/${originalRequestId}`, requestData);
      } else {
        // Create new request
        response = await api.post('/rental-request', requestData);
      }

      if (response.status === 200 || response.status === 201) {
        // Reset form
        setFormData({
          city: '',
          district: '',
          budgetFrom: '',
          budgetTo: '',
          propertyType: '',
          numberOfRooms: '',
          moveInDate: '',
          requirements: ''
        });
        
        setOriginalRequestId(null);
        onSuccess && onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error creating/updating rental request:', error);
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError(`Failed to ${editMode ? 'update' : 'create'} rental request. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      city: '',
      district: '',
      budgetFrom: '',
      budgetTo: '',
      propertyType: '',
      numberOfRooms: '',
      moveInDate: '',
      requirements: ''
    });
    setError('');
    setOriginalRequestId(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editMode ? 'Edit Rental Request' : 'Create New Rental Request'}
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* City and District */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <select
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a city</option>
                {polishCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                District *
              </label>
              <select
                value={formData.district}
                onChange={(e) => handleInputChange('district', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
                disabled={!formData.city}
              >
                <option value="">
                  {formData.city ? 'Select a district' : 'Please select a city first'}
                </option>
                {getDistrictsForCity(formData.city).map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Budget Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget Range (PLN) *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="number"
                  value={formData.budgetFrom}
                  onChange={(e) => handleInputChange('budgetFrom', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="From"
                  min="0"
                  step="100"
                  required
                />
              </div>
              <div>
                <input
                  type="number"
                  value={formData.budgetTo}
                  onChange={(e) => handleInputChange('budgetTo', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="To"
                  min="0"
                  step="100"
                  required
                />
              </div>
            </div>
          </div>

          {/* Property Type and Number of Rooms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type *
              </label>
              <select
                value={formData.propertyType}
                onChange={(e) => handleInputChange('propertyType', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select property type</option>
                {propertyTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Rooms *
              </label>
              <select
                value={formData.numberOfRooms}
                onChange={(e) => handleInputChange('numberOfRooms', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
                disabled={['Room', 'Shared Room', 'Studio'].includes(formData.propertyType)}
              >
                <option value="">Select number of rooms</option>
                {roomOptions.map(rooms => (
                  <option key={rooms} value={rooms}>{rooms}</option>
                ))}
              </select>
              {['Room', 'Shared Room', 'Studio'].includes(formData.propertyType) && (
                <p className="text-xs text-gray-500 mt-1">Automatically set to 1 room for this property type</p>
              )}
            </div>
          </div>

          {/* Move-in Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Move-in Date *
            </label>
            <input
              type="date"
              value={formData.moveInDate}
              onChange={(e) => handleInputChange('moveInDate', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Requirements Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requirements Description *
            </label>
            <textarea
              value={formData.requirements}
              onChange={(e) => handleInputChange('requirements', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
              placeholder="Describe your requirements, preferences, and any specific needs (e.g., furnished, parking, pets allowed, etc.)"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {editMode ? 'Updating...' : 'Publishing...'}
                </>
              ) : (
                editMode ? 'Update Request' : 'Publish Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRentalRequestModal; 