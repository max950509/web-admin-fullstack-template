import type { ProFormColumnsType } from "@ant-design/pro-components";

export function patchSchema<T extends Record<string, any>>(
	cols: ProFormColumnsType<T>[],
	overrides: Record<string, Partial<ProFormColumnsType<T>>>,
): ProFormColumnsType<T>[] {
	return cols.map((c) => {
		const k = String(c.dataIndex ?? "");
		const merged = overrides[k]
			? ({ ...c, ...overrides[k] } as ProFormColumnsType<T>)
			: ({ ...c } as ProFormColumnsType<T>);
		if ("width" in merged) {
			delete (merged as Record<string, unknown>).width;
		}
		return merged;
	});
}
