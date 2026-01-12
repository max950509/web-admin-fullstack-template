import type { PageQueryDto } from '../dto/page-query.dto';
import type { PageResult } from '../types/page-result';

export function getPaginationArgs(query: PageQueryDto) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 10;
  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function createPageResult<T>(
  list: T[],
  total: number,
  query: PageQueryDto,
): PageResult<T> {
  return {
    list,
    total,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 10,
  };
}
