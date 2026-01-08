import { AliveScope } from "react-activation";
import { MainLayout, RouteTabs } from "@/components/layouts";
import { TabsProvider } from "@/contexts/TabsContext";

// Main App Component: Now stable
function App() {
	console.log("App render"); // This should no longer re-render on navigation

	return (
		<MainLayout>
			<AliveScope>
				<TabsProvider>
					<RouteTabs />
				</TabsProvider>
			</AliveScope>
		</MainLayout>
	);
}

export default App;
