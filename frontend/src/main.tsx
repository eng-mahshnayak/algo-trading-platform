// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css"; // or alpine/quartz/balloon
import "./axiosSetup"; // ✅ add this at top before App render

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  //   <ThemeProvider>
  //     <AppWrapper>
  //       <App />
  //     </AppWrapper>
  //   </ThemeProvider>
  // </StrictMode>,
  
    <ThemeProvider>
      <AppWrapper>
        <App />
      </AppWrapper>
    </ThemeProvider>
  
);
