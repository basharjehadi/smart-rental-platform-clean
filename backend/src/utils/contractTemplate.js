export const generateBilingualContractHTML = (contractData) => {
  const {
    contractNumber,
    agreementDate,
    landlord,
    tenant,
    propertyAddress,
    leaseStartDate,
    leaseEndDate,
    rentAmount,
    depositAmount,
    leaseDuration,
    houseRules,
  } = contractData;

  // Format dates
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount);
  };

  // Get full names
  const landlordFullName =
    `${landlord.firstName || ''} ${landlord.lastName || ''}`.trim() ||
    landlord.name;
  const tenantFullName =
    `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || tenant.name;

  // Helper function to format identity information
  const formatIdentityInfo = (person, type) => {
    if (type === 'landlord') {
      return `
        <strong>Full Name / Imię i nazwisko:</strong> ${landlordFullName}<br />
        ${landlord.email ? `<strong>Email:</strong> ${landlord.email}<br />` : ''}
        ${landlord.address ? `<strong>Address / Adres:</strong> ${landlord.address}<br />` : ''}
        ${landlord.dowodOsobistyNumber ? `<strong>ID Card / Nr dowodu osobistego:</strong> ${landlord.dowodOsobistyNumber}<br />` : ''}
        ${landlord.phoneNumber ? `<strong>Phone / Telefon:</strong> ${landlord.phoneNumber}<br />` : ''}
      `;
    } else {
      return `
        <strong>Full Name / Imię i nazwisko:</strong> ${tenantFullName}<br />
        ${tenant.email ? `<strong>Email:</strong> ${tenant.email}<br />` : ''}
        ${tenant.pesel ? `<strong>PESEL:</strong> ${tenant.pesel}<br />` : ''}
        ${tenant.passportNumber ? `<strong>Passport / Paszport:</strong> ${tenant.passportNumber}<br />` : ''}
        ${tenant.kartaPobytuNumber ? `<strong>Residence Card / Karta pobytu:</strong> ${tenant.kartaPobytuNumber}<br />` : ''}
        ${tenant.phoneNumber ? `<strong>Phone / Telefon:</strong> ${tenant.phoneNumber}<br />` : ''}
      `;
    }
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lease Agreement - ${contractNumber}</title>
        <style>
            body {
                font-family: 'Times New Roman', serif;
                line-height: 1.6;
                margin: 40px;
                color: #333;
                font-size: 12px;
            }
            .header {
                text-align: center;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .subtitle {
                font-size: 18px;
                color: #666;
            }
            .contract-number {
                font-size: 14px;
                color: #666;
                margin-top: 10px;
            }
            .bilingual-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            .bilingual-table td {
                width: 50%;
                vertical-align: top;
                padding: 15px;
                border: 1px solid #ccc;
            }
            .section {
                margin-bottom: 25px;
            }
            .section-title {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 10px;
                text-align: center;
                background-color: #f5f5f5;
                padding: 8px;
                border-radius: 4px;
            }
            .info-item {
                margin-bottom: 8px;
            }
            .info-label {
                font-weight: bold;
                display: inline-block;
                width: 120px;
            }
            .identity-section {
                background-color: #f9f9f9;
                padding: 15px;
                border-radius: 6px;
                margin-bottom: 20px;
            }
            .identity-title {
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 10px;
                color: #2c3e50;
            }
            .signature-section {
                margin-top: 40px;
                page-break-inside: avoid;
            }
            .signature-grid {
                display: flex;
                justify-content: space-between;
                margin-top: 20px;
            }
            .signature-box {
                width: 45%;
                text-align: center;
                padding: 20px;
                border: 1px solid #ccc;
                border-radius: 6px;
                background-color: #fafafa;
            }
            .signature-line {
                border-bottom: 1px solid #333;
                margin-bottom: 10px;
                padding-bottom: 5px;
                font-weight: bold;
            }
            .signature-image {
                max-width: 150px;
                max-height: 60px;
                margin: 10px 0;
            }
            .footer {
                margin-top: 40px;
                text-align: center;
                font-size: 10px;
                color: #666;
                border-top: 1px solid #ccc;
                padding-top: 20px;
            }
            .page-break {
                page-break-before: always;
            }
            .payment-info {
                background-color: #e8f5e8;
                padding: 10px;
                border-radius: 4px;
                margin: 10px 0;
                border-left: 4px solid #4caf50;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title">Lease Agreement / Umowa najmu</div>
            <div class="subtitle">Rental Contract / Kontrakt najmu</div>
            <div class="contract-number">Contract No.: ${contractNumber}</div>
            <div style="margin-top: 10px; font-size: 12px;">
                Date: ${formatDate(agreementDate)} / Data: ${formatDate(agreementDate)}
            </div>
        </div>

        <div class="section">
            <div class="section-title">PARTIES TO THE AGREEMENT / STRONY UMOWY</div>
            <table class="bilingual-table">
                <tr>
                    <td>
                        <div class="identity-section">
                            <div class="identity-title">1. LANDLORD / WYNAJMUJĄCY</div>
                            ${formatIdentityInfo(landlord, 'landlord')}
                        </div>
                    </td>
                    <td>
                        <div class="identity-section">
                            <div class="identity-title">1. WYNAJMUJĄCY</div>
                            ${formatIdentityInfo(landlord, 'landlord')}
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>
                        <div class="identity-section">
                            <div class="identity-title">2. TENANT / NAJEMCA</div>
                            ${formatIdentityInfo(tenant, 'tenant')}
                        </div>
                    </td>
                    <td>
                        <div class="identity-section">
                            <div class="identity-title">2. NAJEMCA</div>
                            ${formatIdentityInfo(tenant, 'tenant')}
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <div class="section">
            <div class="section-title">§1. SUBJECT OF THE AGREEMENT / PRZEDMIOT UMOWY</div>
            <table class="bilingual-table">
                <tr>
                    <td>
                        <strong>a)</strong> The Landlord declares that he/she is the owner of the real estate property located at:<br />
                        <strong>${propertyAddress}</strong><br /><br />
                        <strong>b)</strong> The Tenant declares that he/she is familiar with the location and technical condition of the property and accepts it in its current state.<br /><br />
                        <strong>c)</strong> The Landlord hereby rents to the Tenant, and the Tenant hereby rents from the Landlord, the above-described property for residential purposes.
                    </td>
                    <td>
                        <strong>a)</strong> Wynajmujący oświadcza, że jest właścicielem nieruchomości położonej przy:<br />
                        <strong>${propertyAddress}</strong><br /><br />
                        <strong>b)</strong> Najemca oświadcza, że zna lokalizację i stan techniczny nieruchomości i przyjmuje ją w stanie obecnym.<br /><br />
                        <strong>c)</strong> Wynajmujący wynajmuje Najemcy, a Najemca wynajmuje od Wynajmującego powyższą nieruchomość na cele mieszkaniowe.
                    </td>
                </tr>
            </table>
        </div>

        <div class="section">
            <div class="section-title">§2. LEASE TERM / OKRES NAJMU</div>
            <table class="bilingual-table">
                <tr>
                    <td>
                        <strong>a)</strong> The lease term is set for ${leaseDuration} months, starting from ${formatDate(leaseStartDate)} and ending on ${formatDate(leaseEndDate)}.<br /><br />
                        <strong>b)</strong> The agreement may be extended by mutual written consent of both parties.
                    </td>
                    <td>
                        <strong>a)</strong> Okres najmu ustalony jest na ${leaseDuration} miesięcy, rozpoczynając od ${formatDate(leaseStartDate)} i kończąc ${formatDate(leaseEndDate)}.<br /><br />
                        <strong>b)</strong> Umowa może być przedłużona za pisemną zgodą obu stron.
                    </td>
                </tr>
            </table>
        </div>

        <div class="section">
            <div class="section-title">§3. RENT AND DEPOSIT / CZYNSZ I KAUCJA</div>
            <table class="bilingual-table">
                <tr>
                    <td>
                        <div class="payment-info">
                            <strong>a)</strong> Monthly rent: ${formatCurrency(rentAmount)}<br />
                            <strong>b)</strong> Security deposit: ${formatCurrency(depositAmount)}<br />
                            <strong>c)</strong> Total initial payment: ${formatCurrency(rentAmount + depositAmount)}<br />
                        </div>
                        <strong>d)</strong> Rent is due on the 1st day of each month.<br />
                        <strong>e)</strong> Late payment fee: 50 PLN if rent is not received within 5 days of due date.
                    </td>
                    <td>
                        <div class="payment-info">
                            <strong>a)</strong> Miesięczny czynsz: ${formatCurrency(rentAmount)}<br />
                            <strong>b)</strong> Kaucja: ${formatCurrency(depositAmount)}<br />
                            <strong>c)</strong> Łączna płatność początkowa: ${formatCurrency(rentAmount + depositAmount)}<br />
                        </div>
                        <strong>d)</strong> Czynsz płatny do 1-go dnia każdego miesiąca.<br />
                        <strong>e)</strong> Opłata za zwłokę: 50 PLN jeśli czynsz nie zostanie otrzymany w ciągu 5 dni od terminu płatności.
                    </td>
                </tr>
            </table>
        </div>

        <div class="section">
            <div class="section-title">§4. UTILITIES AND SERVICES / MEDIA I USŁUGI</div>
            <table class="bilingual-table">
                <tr>
                    <td>
                        Utilities and services (electricity, water, gas, internet, etc.) are the responsibility of the Tenant unless otherwise specified in writing by the Landlord.
                    </td>
                    <td>
                        Media i usługi (prąd, woda, gaz, internet, itp.) są odpowiedzialnością Najemcy, chyba że Wynajmujący nie określi inaczej na piśmie.
                    </td>
                </tr>
            </table>
        </div>

        <div class="section">
            <div class="section-title">§5. MAINTENANCE AND REPAIRS / KONSERWACJA I NAPRAWY</div>
            <table class="bilingual-table">
                <tr>
                    <td>
                        <strong>a)</strong> The Landlord is responsible for major repairs and structural maintenance.<br />
                        <strong>b)</strong> The Tenant is responsible for minor repairs and general upkeep.<br />
                        <strong>c)</strong> The Tenant must report any damages or necessary repairs to the Landlord immediately.
                    </td>
                    <td>
                        <strong>a)</strong> Wynajmujący odpowiada za poważne naprawy i konserwację strukturalną.<br />
                        <strong>b)</strong> Najemca odpowiada za drobne naprawy i ogólną konserwację.<br />
                        <strong>c)</strong> Najemca musi natychmiast zgłaszać wszelkie szkody lub niezbędne naprawy Wynajmującemu.
                    </td>
                </tr>
            </table>
        </div>

        <div class="section">
            <div class="section-title">§6. TERMINATION / ROZWIĄZANIE UMOWY</div>
            <table class="bilingual-table">
                <tr>
                    <td>
                        <strong>a)</strong> Either party may terminate this agreement with 30 days written notice.<br />
                        <strong>b)</strong> Early termination may result in forfeiture of security deposit.<br />
                        <strong>c)</strong> The Tenant must return the property in the same condition as received, normal wear and tear excepted.
                    </td>
                    <td>
                        <strong>a)</strong> Każda ze stron może rozwiązać umowę z 30-dniowym pisemnym wypowiedzeniem.<br />
                        <strong>b)</strong> Przedwczesne rozwiązanie może skutkować utratą kaucji.<br />
                        <strong>c)</strong> Najemca musi zwrócić nieruchomość w tym samym stanie, w jakim ją otrzymał, z wyjątkiem normalnego zużycia.
                    </td>
                </tr>
            </table>
        </div>

        <div class="section">
            <div class="section-title">§7. ADDITIONAL PROVISIONS / POSTANOWIENIA DODATKOWE</div>
            <table class="bilingual-table">
                <tr>
                    <td>
                        <strong>a)</strong> This agreement is subject to all applicable local, state, and federal laws.<br />
                        <strong>b)</strong> Any disputes arising from this agreement shall be resolved through mediation or legal proceedings as permitted by law.<br />
                        <strong>c)</strong> This agreement constitutes the entire understanding between the parties.
                    </td>
                    <td>
                        <strong>a)</strong> Niniejsza umowa podlega wszystkim obowiązującym przepisom lokalnym, stanowym i federalnym.<br />
                        <strong>b)</strong> Wszelkie spory wynikające z tej umowy będą rozwiązywane poprzez mediację lub postępowanie prawne zgodnie z prawem.<br />
                        <strong>c)</strong> Niniejsza umowa stanowi pełne porozumienie między stronami.
                    </td>
                </tr>
            </table>
        </div>

        <div class="section">
            <div class="section-title">§8. HOUSE RULES / ZASADY NAJMU</div>
            <table class="bilingual-table">
                <tr>
                    <td>
                        ${
                          houseRules && houseRules.rulesText
                            ? `
                            <div style="background-color: #fff3cd; padding: 10px; border-radius: 4px; border-left: 4px solid #ffc107; margin-bottom: 10px;">
                                <strong>House Rules Provided by Landlord:</strong><br />
                                <div style="white-space: pre-wrap; margin-top: 8px; font-size: 11px; line-height: 1.4;">
                                    ${houseRules.rulesText}
                                </div>
                            </div>
                        `
                            : ''
                        }
                        ${
                          houseRules && houseRules.rulesPdf
                            ? `
                            <div style="background-color: #d1ecf1; padding: 10px; border-radius: 4px; border-left: 4px solid #17a2b8; margin-bottom: 10px;">
                                <strong>📄 Additional House Rules Document:</strong><br />
                                <em>See attached PDF file provided by the landlord for detailed house rules and regulations.</em>
                            </div>
                        `
                            : ''
                        }
                        ${
                          !houseRules ||
                          (!houseRules.rulesText && !houseRules.rulesPdf)
                            ? `
                            <div style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; border-left: 4px solid #6c757d; font-style: italic; color: #6c757d;">
                                No specific house rules have been provided by the landlord for this property.
                            </div>
                        `
                            : ''
                        }
                        <div style="background-color: #e8f5e8; padding: 10px; border-radius: 4px; border-left: 4px solid #28a745; margin-top: 10px;">
                            <strong>☑ Tenant Acknowledgment:</strong><br />
                            <em>The tenant confirms understanding and acceptance of the house rules provided by the landlord.</em>
                        </div>
                    </td>
                    <td>
                        ${
                          houseRules && houseRules.rulesText
                            ? `
                            <div style="background-color: #fff3cd; padding: 10px; border-radius: 4px; border-left: 4px solid #ffc107; margin-bottom: 10px;">
                                <strong>Zasady Najmu Określone przez Wynajmującego:</strong><br />
                                <div style="white-space: pre-wrap; margin-top: 8px; font-size: 11px; line-height: 1.4;">
                                    ${houseRules.rulesText}
                                </div>
                            </div>
                        `
                            : ''
                        }
                        ${
                          houseRules && houseRules.rulesPdf
                            ? `
                            <div style="background-color: #d1ecf1; padding: 10px; border-radius: 4px; border-left: 4px solid #17a2b8; margin-bottom: 10px;">
                                <strong>📄 Dodatkowy Dokument Zasad:</strong><br />
                                <em>Zobacz załączony plik PDF dostarczony przez wynajmującego, zawierający szczegółowe zasady i regulamin.</em>
                            </div>
                        `
                            : ''
                        }
                        ${
                          !houseRules ||
                          (!houseRules.rulesText && !houseRules.rulesPdf)
                            ? `
                            <div style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; border-left: 4px solid #6c757d; font-style: italic; color: #6c757d;">
                                Nie określono szczególnych zasad najmu dla tej nieruchomości.
                            </div>
                        `
                            : ''
                        }
                        <div style="background-color: #e8f5e8; padding: 10px; border-radius: 4px; border-left: 4px solid #28a745; margin-top: 10px;">
                            <strong>☑ Potwierdzenie Najemcy:</strong><br />
                            <em>Najemca potwierdza zrozumienie i akceptację zasad najmu określonych przez wynajmującego.</em>
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <div class="signature-section">
            <div class="section-title">§9. SIGNATURES / PODPISY</div>
            <div class="signature-grid">
                <div class="signature-box">
                    <div class="signature-line">Landlord Signature / Podpis Wynajmującego</div>
                    ${landlord.signature ? `<img src="data:image/png;base64,${landlord.signature}" class="signature-image" alt="Landlord Signature" />` : '<div style="height: 60px; border-bottom: 1px solid #ccc; margin: 10px 0;"></div>'}
                    <div style="margin-top: 10px;"><strong>${landlordFullName}</strong></div>
                    <div style="font-size: 10px; color: #666;">Date: ${formatDate(agreementDate)}</div>
                </div>
                <div class="signature-box">
                    <div class="signature-line">Tenant Signature / Podpis Najemcy</div>
                    ${tenant.signature ? `<img src="data:image/png;base64,${tenant.signature}" class="signature-image" alt="Tenant Signature" />` : '<div style="height: 60px; border-bottom: 1px solid #ccc; margin: 10px 0;"></div>'}
                    <div style="margin-top: 10px;"><strong>${tenantFullName}</strong></div>
                    <div style="font-size: 10px; color: #666;">Date: ${formatDate(agreementDate)}</div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>This document was generated by Smart Rental System on ${formatDate(new Date())}</p>
            <p>Contract ID: ${contractNumber} | Generated: ${formatDate(new Date())}</p>
            <p>This is a legally binding document. Please keep a copy for your records.</p>
            <p>To jest dokument prawnie wiążący. Prosimy zachować kopię do celów dokumentacyjnych.</p>
        </div>
    </body>
    </html>
  `;
};
