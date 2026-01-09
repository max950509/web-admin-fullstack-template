import { useRouteError } from "react-router-dom";

export default function ErrorBoundary() {
	// biome-ignore lint/suspicious/noExplicitAny: temporary ignore
	const error = useRouteError() as any;
	console.error(error);

	return (
		<div>
			<h1>Something went wrong.</h1>
			<p>Check the browser console for more details.</p>
			<pre>{error.message || JSON.stringify(error)}</pre>
		</div>
	);
}
