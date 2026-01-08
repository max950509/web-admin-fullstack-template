import request from '@/utils/request';

export interface SummaryListItem {
  build_total: number;
  deploy_total: number;
  build_my: number;
  deploy_my: number;
  builds: SummaryDetailItem[];
  deploys: SummaryDetailItem[];
}

export interface SummaryDetailItem {
  service: string;
  count: number;
}

export async function getSummaryList(formData: any) {
  const params = Object.assign({}, formData);
  return request('/api1/summary/', { method: 'get', params });
}
