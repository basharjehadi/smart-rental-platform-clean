const Step2Location = ({ formData, errors, cities, onInputChange }) => {
  // Polish cities with their districts (same as tenant form)
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
      'Łazarz', 'Górczyn', 'Juniakowo', 'Chartowo', 'Winogrady', 
      'Naramowice', 'Umultowo', 'Morasko', 'Radojewo', 'Kiekrz'
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
      'Stary Widzew', 'Teofilów', 'Wiskitno', 'Wzniesień Łódzkich', 'Zagórnik', 'Zielona Góra'
    ],
    'Szczecin': [
      'Śródmieście', 'Pomorzany', 'Niebużany', 'Świerczewo', 'Warszewo', 'Arkońskie-Niemierzyn', 
      'Głębokie-Pilchowo', 'Gumieńce', 'Krzekowo-Bezrzecze', 'Osów', 'Płonia-Śmierdnica-Jezierzyce', 
      'Podjuchy', 'Wielgowo-Sławociesze', 'Załom-Kasztanowe', 'Bukowo', 'Centrum', 'Dąbie', 
      'Kijewo', 'Międzyodrze-Wyspa Pucka', 'Niebuszewo', 'Nowe Miasto', 'Pogodno', 'Stołczyn', 'Turzyn', 'Zdroje'
    ],
    'Bydgoszcz': [
      'Szwederowo', 'Błonie', 'Okole', 'Śródmieście', 'Fordon', 'Brdyujście', 'Bartodzieje', 
      'Bielawy', 'Bocianowo', 'Czyżkówko', 'Glinki', 'Jary', 'Kapuściska', 
      'Łęgnowo', 'Miedzyń', 'Osowa Góra', 'Piaski', 'Prądy', 'Siernieczek', 'Skrzetusko', 
      'Smukała', 'Stary Fordon', 'Wzgórze Wolności', 'Wyżyny', 'Zimne Wody'
    ],
    'Lublin': [
      'Śródmieście', 'Wieniawa', 'Zabłocie', 'Rury', 'Sławin', 'Sławinek', 'Wrotków', 
      'Bronowice', 'Tatary', 'Kalinowszczyzna', 'Hajdów-Zadębie', 'Konstantynów', 'Lubelskiej Spółdzielni Mieszkaniowej', 
      'Kościelniak', 'Szerokie', 'Zemborzyce', 'Dziesiąta', 'Głusk', 'Węglin', 'Felicity'
    ],
    'Katowice': [
      'Śródmieście', 'Koszutka', 'Bogucice', 'Osiedle Paderewskiego-Muchowiec', 'Dąb', 
      'Wełnowiec-Józefowiec', 'Załęże', 'Osiedle Witosa', 'Piotrowice-Ochojec', 'Ligota-Panewniki', 
      'Brynowiec-Osiedle Zgrzebnioka', 'Giszowiec', 'Murcki', 'Kostuchna', 'Podlesie', 'Szopienice-Burowiec', 
      'Janów-Nikiszowiec', 'Dąbrówka Mała', 'Roździeń', 'Załęska Hałda-Brynów część zachodnia'
    ]
  };

  // Get districts for selected city
  const getDistrictsForCity = (city) => {
    const districts = cityDistricts[city] || [];
    return districts;
  };

  // Handle city change - reset district when city changes
  const handleCityChange = (city) => {
    onInputChange('city', city);
    onInputChange('district', ''); // Reset district when city changes
  };

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Where is your property located?</h2>
        <p className="text-gray-600">Provide the complete address details.</p>
      </div>

      {/* City and District Selection */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Location</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <select
              value={formData.city}
              onChange={(e) => handleCityChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.city ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select city</option>
              {cities.map(city => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
          </div>

          {/* District */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              District *
            </label>
            <select
              value={formData.district}
              onChange={(e) => onInputChange('district', e.target.value)}
              disabled={!formData.city}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.district ? 'border-red-500' : 'border-gray-300'
              } ${!formData.city ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
            >
              <option value="">
                {formData.city ? 'Select district' : 'Select city first'}
              </option>
              {formData.city && getDistrictsForCity(formData.city).map(district => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
            {errors.district && <p className="mt-1 text-sm text-red-600">{errors.district}</p>}
          </div>
        </div>
      </div>

      {/* Address Form */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Address Details</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Street */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street (Ulica) *
            </label>
            <input
              type="text"
              value={formData.street}
              onChange={(e) => onInputChange('street', e.target.value)}
              placeholder="Marszałkowska"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.street ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.street && <p className="mt-1 text-sm text-red-600">{errors.street}</p>}
          </div>

          {/* House Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              House Number *
            </label>
            <input
              type="text"
              value={formData.houseNumber}
              onChange={(e) => onInputChange('houseNumber', e.target.value)}
              placeholder="123"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.houseNumber ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.houseNumber && <p className="mt-1 text-sm text-red-600">{errors.houseNumber}</p>}
          </div>

          {/* Apartment Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Apartment Number
            </label>
            <input
              type="text"
              value={formData.apartmentNumber}
              onChange={(e) => onInputChange('apartmentNumber', e.target.value)}
              placeholder="45"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Postcode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Postcode *
            </label>
            <input
              type="text"
              value={formData.postcode}
              onChange={(e) => onInputChange('postcode', e.target.value)}
              placeholder="00-001"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.postcode ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.postcode && <p className="mt-1 text-sm text-red-600">{errors.postcode}</p>}
          </div>
        </div>
      </div>

      {/* Privacy Protection Note */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">Privacy Protection</h4>
            <p className="text-sm text-blue-800">
              Tenants will only see your district and city until they book the property. Full address details are shared after booking confirmation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2Location; 