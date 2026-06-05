import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import { useEffect, useState } from "react";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import PageMeta from "../../components/common/PageMeta";
import TradeChart from "../../components/ecommerce/TradeChart"

export default function Home() {
  const [platformTitle, setPlatformTitle] = useState("Software Setu");

  useEffect(() => {
    const storedTitle = localStorage.getItem("platformtitle");
    if (storedTitle) {
      setPlatformTitle(storedTitle);
    }
  }, []);

  return (
    <>
      <PageMeta title={platformTitle} description={platformTitle} />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 md:px-6 lg:px-8 py-6">
        <div className="max-w-full mx-auto">
          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-12 lg:col-span-7 space-y-5">
              <EcommerceMetrics />
              <TradeChart />
            </div>
            <div className="col-span-12 lg:col-span-5">
              <MonthlyTarget />
            </div>
            <div className="col-span-12">
              <RecentOrders />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}