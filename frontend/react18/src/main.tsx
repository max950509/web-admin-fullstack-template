import { render } from "react-dom";
import { RouterProvider } from "react-router-dom";
import router from "./router";
import "antd/dist/reset.css";
import "./index.css";
import { ConfigProvider } from "antd";

render(
	<ConfigProvider>
		<RouterProvider router={router} />
	</ConfigProvider>,
	document.getElementById("root"),
);
