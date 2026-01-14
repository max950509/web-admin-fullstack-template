import type { ProFormColumnsType } from "@ant-design/pro-components";

export function patchSchema<T extends Record<string, any>>(
	cols: ProFormColumnsType<T>[],
	overrides: Record<string, Partial<ProFormColumnsType<T>>>,
): ProFormColumnsType<T>[] {
	return cols.map((c) => {
		const k = String(c.dataIndex ?? "");
		return overrides[k]
			? ({ ...c, ...overrides[k] } as ProFormColumnsType<T>)
			: c;
	});
}
