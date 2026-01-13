export interface CovidData {
  confirmed: number;
  deaths: number;
  recovered: number;
  active: number;
}

export interface CovidApiResponse {
  data: Array<{
    region: {
      province?: string;
    };
    confirmed: number;
    deaths: number;
    recovered: number;
    active: number;
  }>;
}

export interface Filters {
  country: string;
  province: string;
  specificDate: string;
}

export interface Stats {
  total: string;
  deaths: string;
  recovered: string;
  active: string;
}

export interface StatsCard {
  title: string;
  value: string;
  bgColor: string;
  iconColor: string;
  iconPath: string;
}

export interface TableRow {
  date: string;
  cases: string;
  deaths: string;
  recovered: string;
  active: string;
}

export interface DateRangeResult {
  date: string;
  data: CovidData;
}