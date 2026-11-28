"use client";

import React, { useState } from "react";
import { AlertCircle, Loader2, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AdsSection from "./_components/AdsSection";
import CountrySelect from "./_components/CountrySelect";
import {
  Assessment,
  Hero,
  LandingPages,
  LaunchesAndGlance,
  Notices,
  SiteCard,
  AudienceDetails,
  Strategy,
} from "./_components/SiteSections";

/**
 * Market Spy (/ad-intelligence/market-spy)
 *
 * POST /competitor-insights → one response drives the whole page. Nothing is
 * inferred or hardcoded here: every figure, label, tag and message on screen
 * is a field of that response (including `dataQuality`, which says whether
 * each field is real, an estimate, an AI assessment or unavailable).
 */

// Values the backend accepts in `country` (it echoes the one it used in
// competitorAds.country; empty means it defaults to ALL).
const COUNTRIES = [
  { value: "", label: "All countries" },
  { value: "AF", label: "Afghanistan" },
  { value: "AX", label: "Åland Islands" },
  { value: "AL", label: "Albania" },
  { value: "DZ", label: "Algeria" },
  { value: "AS", label: "American Samoa" },
  { value: "AD", label: "Andorra" },
  { value: "AO", label: "Angola" },
  { value: "AI", label: "Anguilla" },
  { value: "AQ", label: "Antarctica" },
  { value: "AG", label: "Antigua & Barbuda" },
  { value: "AR", label: "Argentina" },
  { value: "AM", label: "Armenia" },
  { value: "AW", label: "Aruba" },
  { value: "AU", label: "Australia" },
  { value: "AT", label: "Austria" },
  { value: "AZ", label: "Azerbaijan" },
  { value: "BS", label: "Bahamas" },
  { value: "BH", label: "Bahrain" },
  { value: "BD", label: "Bangladesh" },
  { value: "BB", label: "Barbados" },
  { value: "BY", label: "Belarus" },
  { value: "BE", label: "Belgium" },
  { value: "BZ", label: "Belize" },
  { value: "BJ", label: "Benin" },
  { value: "DY", label: "Benin" },
  { value: "BM", label: "Bermuda" },
  { value: "BT", label: "Bhutan" },
  { value: "BO", label: "Bolivia" },
  { value: "BA", label: "Bosnia & Herzegovina" },
  { value: "BW", label: "Botswana" },
  { value: "BV", label: "Bouvet Island" },
  { value: "BR", label: "Brazil" },
  { value: "IO", label: "British Indian Ocean Territory" },
  { value: "VG", label: "British Virgin Islands" },
  { value: "BN", label: "Brunei" },
  { value: "BG", label: "Bulgaria" },
  { value: "BF", label: "Burkina Faso" },
  { value: "BI", label: "Burundi" },
  { value: "KH", label: "Cambodia" },
  { value: "CM", label: "Cameroon" },
  { value: "CA", label: "Canada" },
  { value: "CV", label: "Cape Verde" },
  { value: "BQ", label: "Caribbean Netherlands" },
  { value: "KY", label: "Cayman Islands" },
  { value: "CF", label: "Central African Republic" },
  { value: "TD", label: "Chad" },
  { value: "CL", label: "Chile" },
  { value: "CN", label: "China" },
  { value: "CX", label: "Christmas Island" },
  { value: "CC", label: "Cocos (Keeling) Islands" },
  { value: "CO", label: "Colombia" },
  { value: "KM", label: "Comoros" },
  { value: "CG", label: "Congo - Brazzaville" },
  { value: "CD", label: "Congo - Kinshasa" },
  { value: "CK", label: "Cook Islands" },
  { value: "CR", label: "Costa Rica" },
  { value: "CI", label: "Côte d’Ivoire" },
  { value: "HR", label: "Croatia" },
  { value: "CU", label: "Cuba" },
  { value: "CW", label: "Curaçao" },
  { value: "CY", label: "Cyprus" },
  { value: "CZ", label: "Czechia" },
  { value: "DK", label: "Denmark" },
  { value: "DJ", label: "Djibouti" },
  { value: "DM", label: "Dominica" },
  { value: "DO", label: "Dominican Republic" },
  { value: "EC", label: "Ecuador" },
  { value: "EG", label: "Egypt" },
  { value: "SV", label: "El Salvador" },
  { value: "GQ", label: "Equatorial Guinea" },
  { value: "ER", label: "Eritrea" },
  { value: "EE", label: "Estonia" },
  { value: "SZ", label: "Eswatini" },
  { value: "ET", label: "Ethiopia" },
  { value: "FK", label: "Falkland Islands" },
  { value: "FO", label: "Faroe Islands" },
  { value: "FJ", label: "Fiji" },
  { value: "FI", label: "Finland" },
  { value: "FR", label: "France" },
  { value: "GF", label: "French Guiana" },
  { value: "PF", label: "French Polynesia" },
  { value: "TF", label: "French Southern Territories" },
  { value: "GA", label: "Gabon" },
  { value: "GM", label: "Gambia" },
  { value: "GE", label: "Georgia" },
  { value: "DE", label: "Germany" },
  { value: "GH", label: "Ghana" },
  { value: "GI", label: "Gibraltar" },
  { value: "GR", label: "Greece" },
  { value: "GL", label: "Greenland" },
  { value: "GD", label: "Grenada" },
  { value: "GP", label: "Guadeloupe" },
  { value: "GU", label: "Guam" },
  { value: "GT", label: "Guatemala" },
  { value: "GG", label: "Guernsey" },
  { value: "GN", label: "Guinea" },
  { value: "GW", label: "Guinea-Bissau" },
  { value: "GY", label: "Guyana" },
  { value: "HT", label: "Haiti" },
  { value: "HM", label: "Heard & McDonald Islands" },
  { value: "HN", label: "Honduras" },
  { value: "HK", label: "Hong Kong SAR China" },
  { value: "HU", label: "Hungary" },
  { value: "IS", label: "Iceland" },
  { value: "IN", label: "India" },
  { value: "ID", label: "Indonesia" },
  { value: "IR", label: "Iran" },
  { value: "IQ", label: "Iraq" },
  { value: "IE", label: "Ireland" },
  { value: "IM", label: "Isle of Man" },
  { value: "IL", label: "Israel" },
  { value: "IT", label: "Italy" },
  { value: "JM", label: "Jamaica" },
  { value: "JP", label: "Japan" },
  { value: "JE", label: "Jersey" },
  { value: "JO", label: "Jordan" },
  { value: "KZ", label: "Kazakhstan" },
  { value: "KE", label: "Kenya" },
  { value: "KI", label: "Kiribati" },
  { value: "KW", label: "Kuwait" },
  { value: "KG", label: "Kyrgyzstan" },
  { value: "LA", label: "Laos" },
  { value: "LV", label: "Latvia" },
  { value: "LB", label: "Lebanon" },
  { value: "LS", label: "Lesotho" },
  { value: "LR", label: "Liberia" },
  { value: "LY", label: "Libya" },
  { value: "LI", label: "Liechtenstein" },
  { value: "LT", label: "Lithuania" },
  { value: "LU", label: "Luxembourg" },
  { value: "MO", label: "Macao SAR China" },
  { value: "MG", label: "Madagascar" },
  { value: "MW", label: "Malawi" },
  { value: "MY", label: "Malaysia" },
  { value: "MV", label: "Maldives" },
  { value: "ML", label: "Mali" },
  { value: "MT", label: "Malta" },
  { value: "MH", label: "Marshall Islands" },
  { value: "MQ", label: "Martinique" },
  { value: "MR", label: "Mauritania" },
  { value: "MU", label: "Mauritius" },
  { value: "YT", label: "Mayotte" },
  { value: "MX", label: "Mexico" },
  { value: "FM", label: "Micronesia" },
  { value: "MD", label: "Moldova" },
  { value: "MC", label: "Monaco" },
  { value: "MN", label: "Mongolia" },
  { value: "ME", label: "Montenegro" },
  { value: "MS", label: "Montserrat" },
  { value: "MA", label: "Morocco" },
  { value: "MZ", label: "Mozambique" },
  { value: "MM", label: "Myanmar (Burma)" },
  { value: "NA", label: "Namibia" },
  { value: "NR", label: "Nauru" },
  { value: "NP", label: "Nepal" },
  { value: "NL", label: "Netherlands" },
  { value: "NC", label: "New Caledonia" },
  { value: "NZ", label: "New Zealand" },
  { value: "NI", label: "Nicaragua" },
  { value: "NE", label: "Niger" },
  { value: "NG", label: "Nigeria" },
  { value: "NU", label: "Niue" },
  { value: "NF", label: "Norfolk Island" },
  { value: "KP", label: "North Korea" },
  { value: "MK", label: "North Macedonia" },
  { value: "MP", label: "Northern Mariana Islands" },
  { value: "NO", label: "Norway" },
  { value: "OM", label: "Oman" },
  { value: "PK", label: "Pakistan" },
  { value: "PW", label: "Palau" },
  { value: "PS", label: "Palestinian Territories" },
  { value: "PA", label: "Panama" },
  { value: "PG", label: "Papua New Guinea" },
  { value: "PY", label: "Paraguay" },
  { value: "PE", label: "Peru" },
  { value: "PH", label: "Philippines" },
  { value: "PN", label: "Pitcairn Islands" },
  { value: "PL", label: "Poland" },
  { value: "PT", label: "Portugal" },
  { value: "PR", label: "Puerto Rico" },
  { value: "QA", label: "Qatar" },
  { value: "RE", label: "Réunion" },
  { value: "RO", label: "Romania" },
  { value: "RU", label: "Russia" },
  { value: "RW", label: "Rwanda" },
  { value: "WS", label: "Samoa" },
  { value: "SM", label: "San Marino" },
  { value: "ST", label: "São Tomé & Príncipe" },
  { value: "CQ", label: "Sark" },
  { value: "SA", label: "Saudi Arabia" },
  { value: "SN", label: "Senegal" },
  { value: "RS", label: "Serbia" },
  { value: "SC", label: "Seychelles" },
  { value: "SL", label: "Sierra Leone" },
  { value: "SG", label: "Singapore" },
  { value: "SX", label: "Sint Maarten" },
  { value: "SK", label: "Slovakia" },
  { value: "SI", label: "Slovenia" },
  { value: "SB", label: "Solomon Islands" },
  { value: "SO", label: "Somalia" },
  { value: "ZA", label: "South Africa" },
  { value: "GS", label: "South Georgia & South Sandwich Islands" },
  { value: "KR", label: "South Korea" },
  { value: "SS", label: "South Sudan" },
  { value: "ES", label: "Spain" },
  { value: "LK", label: "Sri Lanka" },
  { value: "BL", label: "St. Barthélemy" },
  { value: "SH", label: "St. Helena" },
  { value: "KN", label: "St. Kitts & Nevis" },
  { value: "LC", label: "St. Lucia" },
  { value: "MF", label: "St. Martin" },
  { value: "PM", label: "St. Pierre & Miquelon" },
  { value: "VC", label: "St. Vincent & Grenadines" },
  { value: "SD", label: "Sudan" },
  { value: "SR", label: "Suriname" },
  { value: "SJ", label: "Svalbard & Jan Mayen" },
  { value: "SE", label: "Sweden" },
  { value: "CH", label: "Switzerland" },
  { value: "SY", label: "Syria" },
  { value: "TW", label: "Taiwan" },
  { value: "TJ", label: "Tajikistan" },
  { value: "TZ", label: "Tanzania" },
  { value: "TH", label: "Thailand" },
  { value: "TL", label: "Timor-Leste" },
  { value: "TG", label: "Togo" },
  { value: "TK", label: "Tokelau" },
  { value: "TO", label: "Tonga" },
  { value: "TT", label: "Trinidad & Tobago" },
  { value: "TN", label: "Tunisia" },
  { value: "TR", label: "Türkiye" },
  { value: "TM", label: "Turkmenistan" },
  { value: "TC", label: "Turks & Caicos Islands" },
  { value: "TV", label: "Tuvalu" },
  { value: "UM", label: "U.S. Outlying Islands" },
  { value: "VI", label: "U.S. Virgin Islands" },
  { value: "UG", label: "Uganda" },
  { value: "UA", label: "Ukraine" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "GB", label: "United Kingdom" },
  { value: "US", label: "United States" },
  { value: "UY", label: "Uruguay" },
  { value: "UZ", label: "Uzbekistan" },
  { value: "NH", label: "Vanuatu" },
  { value: "VU", label: "Vanuatu" },
  { value: "VA", label: "Vatican City" },
  { value: "VE", label: "Venezuela" },
  { value: "VN", label: "Vietnam" },
  { value: "WF", label: "Wallis & Futuna" },
  { value: "EH", label: "Western Sahara" },
  { value: "YE", label: "Yemen" },
  { value: "ZM", label: "Zambia" },
  { value: "ZW", label: "Zimbabwe" },
];

export default function MarketSpyPage() {
  const { getCompetitorInsights } = useAuth();

  const [url, setUrl] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const analyze = async (e) => {
    e?.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setError("");
    setData(null);

    const res = await getCompetitorInsights({ url: url.trim(), country });
    if (!res.ok) setError(res.message);
    else setData(res.data);
    setLoading(false);
  };

  return (
    <div className="pb-8">
      <div className="max-w-[1220px] mx-auto flex flex-col gap-5">
        {/* Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Search className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Market Spy</h1>
            <p className="text-sm text-gray-400">
              Every ad a competitor runs, which ones are working, and your own version in one click
            </p>
          </div>
        </div>

        {/* Search */}
        <form
          onSubmit={analyze}
          className="flex flex-wrap gap-2.5 bg-surface border border-gray-200 rounded-2xl p-2.5"
        >
          <label htmlFor="ms-url" className="sr-only">Competitor website</label>
          <input
            id="ms-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Competitor website, e.g. competitor.com"
            autoComplete="off"
            className="flex-1 basis-[260px] min-w-0 h-12 rounded-xl border border-gray-200 bg-surface px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <label htmlFor="ms-country" className="sr-only">Country</label>
          <CountrySelect
            id="ms-country"
            value={country}
            onChange={setCountry}
            options={COUNTRIES}
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Spy on their ads"}
          </button>
        </form>

        {error && (
          <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-24 bg-surface border border-gray-200 rounded-2xl">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-sm text-gray-600">Fetching their ads and site…</p>
              <p className="text-xs text-gray-400 mt-1">This can take over a minute.</p>
            </div>
          </div>
        )}

        {!data && !loading && !error && (
          <div className="py-24 bg-surface border border-gray-200 rounded-2xl text-center">
            <p className="text-sm font-semibold text-gray-600">Enter a competitor website to get started</p>
          </div>
        )}

        {data && !loading && (
          <>
            <Notices data={data} />
            <Hero data={data} />
            <LaunchesAndGlance data={data} />
            <AdsSection key={`${data.domain}-${data.competitorAds?.country}`} data={data} />
            <Strategy data={data} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <LandingPages data={data} />
              <SiteCard data={data} />
            </div>
            {/* The design ends after the two cards above; the rest of what the
                backend sends is kept here, collapsed. */}
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-blue-600 select-none">
                More insights
              </summary>
              <div className="space-y-4 mt-4">
                <AudienceDetails data={data} />
                <Assessment data={data} />
              </div>
            </details>
            <p className="text-xs text-gray-400">
              {[
                data.competitorAds?.country && `Country: ${data.competitorAds.country}`,
                data.cached !== undefined && `Cached: ${String(data.cached)}`,
                data.tokens_remaining !== undefined && `Tokens remaining: ${data.tokens_remaining}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
