'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { CovidApiResponse, CovidData, DateRangeResult, Filters, Stats, StatsCard, TableRow } from '../types/index.ts';
import Image from 'next/image';
import LogoNext from '../../public/Next.js.svg';
import LogoTS from '../../public/TypeScript.svg';

const NORTHEAST_STATES = [
  'Todos os estados',
  'Alagoas',
  'Bahia',
  'Ceará',
  'Maranhão',
  'Paraíba',
  'Pernambuco',
  'Piauí',
  'Rio Grande do Norte',
  'Sergipe',
] as const;

const COVID_API_BASE_URL = 'https://covid-api.com/api/reports';

export default function CovidDashboard() {
  const [loading, setLoading] = useState<boolean>(false);
  const [filters, setFilters] = useState<Filters>({
    country: 'BRA',
    province: 'All',
    specificDate: '2022-07-01'
  });
  const [stats, setStats] = useState<Stats>({
    total: '0',
    deaths: '0',
    recovered: '0',
    active: '0'
  });
  const [tableData, setTableData] = useState<TableRow[]>([]);

  const normalizeStr = (s?: string): string => {
    if (!s) return '';
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const formatDateDisplay = (isoDate: string): string => {
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  };

  const getDateRange = (centerDate: string): string[] => {
    const dates: string[] = [];
    const center = new Date(centerDate + 'T00:00:00');

    for (let offset = -3; offset <= 3; offset++) {
      const date = new Date(center);
      date.setDate(center.getDate() + offset);
      dates.push(date.toISOString().slice(0, 10));
    }

    return dates;
  };

  const statsCards = useMemo<StatsCard[]>(() => [
    {
      title: 'Total de Casos',
      value: stats.total,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-500',
      iconPath: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      title: 'Óbitos',
      value: stats.deaths,
      bgColor: 'bg-red-100',
      iconColor: 'text-red-500',
      iconPath: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      title: 'Recuperados',
      value: stats.recovered,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-500',
      iconPath: 'M5 13l4 4L19 7'
    },
    {
      title: 'Ativos',
      value: stats.active,
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-500',
      iconPath: 'M3 3h18v18H3z'
    }
  ], [stats]);

  const dateRangeTitle = useMemo<string>(() => {
    const dates = getDateRange(filters.specificDate);
    return `${formatDateDisplay(dates[0]!)} - ${formatDateDisplay(dates[6]!)}`;
  }, [filters.specificDate]);

  const fetchDataForDate = async (isoDate: string): Promise<CovidData> => {
    try {
      const response = await fetch(
        `${COVID_API_BASE_URL}?date=${isoDate}&iso=${filters.country}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json: CovidApiResponse = await response.json();

      if (!json.data?.length) {
        return { confirmed: 0, deaths: 0, recovered: 0, active: 0 };
      }

      const filteredData = json.data.filter((item) => {
        if (!item.region) return false;
        if (filters.province === 'All') return true;
        return normalizeStr(item.region.province) === normalizeStr(filters.province);
      });

      return filteredData.reduce(
        (acc, item) => ({
          confirmed: acc.confirmed + (item.confirmed || 0),
          deaths: acc.deaths + (item.deaths || 0),
          recovered: acc.recovered + (item.recovered || 0),
          active: acc.active + (item.active || 0)
        }),
        { confirmed: 0, deaths: 0, recovered: 0, active: 0 }
      );
    } catch (error) {
      console.error(`Erro ao buscar dados para ${isoDate}:`, error);
      return { confirmed: 0, deaths: 0, recovered: 0, active: 0 };
    }
  };

  const fetchCovidData = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      const dates = getDateRange(filters.specificDate);

      const results: DateRangeResult[] = await Promise.all(
        dates.map(async (date) => ({
          date,
          data: await fetchDataForDate(date)
        }))
      );

      setTableData(
        results.map(({ date, data }) => ({
          date: formatDateDisplay(date),
          cases: formatNumber(data.confirmed),
          deaths: formatNumber(data.deaths),
          recovered: formatNumber(data.recovered),
          active: formatNumber(data.active)
        }))
      );

      const centerData = results[3]!.data;

      setStats({
        total: formatNumber(centerData.confirmed),
        deaths: formatNumber(centerData.deaths),
        recovered: formatNumber(centerData.recovered),
        active: formatNumber(centerData.active)
      });
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleFilterChange = <K extends keyof Filters>(
    field: K,
    value: Filters[K]
  ): void => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    fetchCovidData();
  }, [fetchCovidData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 justify-center">
            <div className="bg-blue-500 rounded-full p-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">
              Painel COVID-19 no Nordeste Brasileiro
            </h1>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-2xl font-semibold text-gray-800">Filtros de Busca</h2>
            <div className="flex items-end gap-4 w-full md:w-auto md:flex-row flex-col">
              <div className="w-full md:w-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <div className='flex gap-2'>
                  <select
                    value={filters.province}
                    onChange={(e) => handleFilterChange('province', e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {NORTHEAST_STATES.map((state) => (
                      <option
                        key={state}
                        value={state === 'Todos os estados' ? 'All' : state}
                      >
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="w-full md:w-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data específica
                </label>
                <input
                  type="date"
                  value={filters.specificDate}
                  onChange={(e) => handleFilterChange('specificDate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <button
                onClick={fetchCovidData}
                disabled={loading}
                className="w-full md:w-auto bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {loading ? 'Carregando...' : 'Buscar'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statsCards.map((card, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-4">
                <div className={`${card.bgColor} rounded-full p-4`}>
                  <svg className={`${card.iconColor} w-8 h-8`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={card.iconPath} />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-800">{card.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            {filters.province !== 'All'
              ? `Tabela de Resultados do estado: ${filters.province} entre (${dateRangeTitle})`
              : `Tabela de Resultados do Nordeste em: (${dateRangeTitle})`
            }
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Data</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Casos</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Mortes</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Recup.</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ativos</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.date}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{row.cases}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{row.deaths}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{row.recovered}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{row.active}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center text-gray-600">
          <div className="flex flex-col md:flex-row items-center justify-around gap-8">
            <div className="flex items-center gap-2">
              <a
                href="https://nextjs.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Image src={LogoNext} alt="Next.js Logo" width={30} height={30} />
                <span className="font-semibold">Next.js</span>
              </a>
            </div>

            <div className="flex flex-col items-center">
              <div>Desenvolvido com Next.js, TypeScript e Tailwind CSS.</div>
              <div className="mt-2">
                Dados: <a href="https://covid-api.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">COVID-API</a>
              </div>
              <div className="mt-2">Desenvolvedor: Kaynan Pereira de Sousa.</div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://www.typescriptlang.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 hover:opacity-80 transition-opacity">
                <Image src={LogoTS} alt="TypeScript Logo" width={30} height={30} />
                <span className="font-semibold">TypeScript</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}