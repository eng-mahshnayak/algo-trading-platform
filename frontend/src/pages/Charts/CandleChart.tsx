



// import React, { useEffect, useState } from "react";
// import ReactApexChart from "react-apexcharts";
// import type { ApexOptions } from "apexcharts";
// import dayjs from "dayjs";
// import axios from "axios";

// const CandleChart: React.FC = () => {
//   const [series, setSeries] = useState<any[]>([
//     {
//       name: "candle",
//       data: []
//     }
//   ]);

//   useEffect(() => {
//     fetchCandleData();
//   }, []);

//   const fetchCandleData = async () => {
//     try {
//       const res = await axios.get(
//         "http://localhost:5000/api/agnelone/bankchart"
//       );

//       const candles = res.data?.data?.candles || [];

//       // 🔥 Angel → Apex format conversion
//       const formattedData = candles.map((candle: any[]) => {
//         const [time, open, high, low, close] = candle;

//         return {
//           x: new Date(time),
//           y: [open, high, low, close]
//         };
//       });

//       setSeries([
//         {
//           name: "candle",
//           data: formattedData
//         }
//       ]);
//     } catch (err) {
//       console.error("Chart API Error:", err);
//     }
//   };

//   const options: ApexOptions = {
//     chart: {
//       type: "candlestick",
//       height: 350
//     },
//     title: {
//       text: "Angel One Historical Candlestick",
//       align: "left"
//     },
//     xaxis: {
//       type: "datetime",
//       labels: {
//         formatter: (val: string) =>
//           dayjs(val).format("DD MMM HH:mm")
//       }
//     },
//     yaxis: {
//       tooltip: {
//         enabled: true
//       }
//     },
//     tooltip: {
//       enabled: true
//     },
//     plotOptions: {
//       candlestick: {
//         colors: {
//           upward: "#00E396",
//           downward: "#FF4560"
//         },
//         wick: {
//           useFillColor: true
//         }
//       }
//     }
//   };

//   return (
//     <div id="chart">
//       <ReactApexChart
//         options={options}
//         series={series}
//         type="candlestick"
//         height={350}
//       />
//     </div>
//   );
// };

// export default CandleChart;





import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import dayjs from "dayjs";
import axios from "axios";

const CandleChart: React.FC = () => {
  const [series, setSeries] = useState<any[]>([
    {
      name: "Price",
      type: "candlestick",
      data: []
    },
    {
      name: "Volume",
      type: "bar",
      data: []
    }
  ]);

  useEffect(() => {
    fetchCandleData();
  }, []);

  const fetchCandleData = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/agnelone/bankchart"
      );

      const candles = res.data?.data?.candles || [];

      // 🔥 Angel → Apex format conversion
      const priceData = candles.map((candle: any[]) => {
        const [time, open, high, low, close] = candle;

        return {
          x: new Date(time),
          y: [open, high, low, close]
        };
      });

      const volumeData = candles.map((candle: any[]) => {
        const [time, , , , , volume] = candle;

        return {
          x: new Date(time),
          y: volume
        };
      });

      setSeries([
        {
          name: "Price",
          type: "candlestick",
          data: priceData
        },
        {
          name: "Volume",
          type: "bar",
          data: volumeData
        }
      ]);
    } catch (err) {
      console.error("Chart API Error:", err);
    }
  };

  const options: ApexOptions = {
    chart: {
      height: 350,
      type: "candlestick",
      stacked: false
    },
    title: {
      text: "Angel One Candlestick with Volume",
      align: "left"
    },
    xaxis: {
      type: "datetime",
      labels: {
        formatter: (val: string) =>
          dayjs(val).format("DD MMM HH:mm")
      }
    },
    yaxis: [
      {
        tooltip: {
          enabled: true
        },
        title: {
          text: "Price"
        }
      },
      {
        opposite: true,
        title: {
          text: "Volume"
        },
        labels: {
          formatter: (val: number) => {
            if (val >= 100000) return (val / 100000).toFixed(1) + "L";
            if (val >= 1000) return (val / 1000).toFixed(1) + "K";
            return val.toString();
          }
        }
      }
    ],
    tooltip: {
      shared: true
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: "#00E396",
          downward: "#FF4560"
        },
        wick: {
          useFillColor: true
        }
      },
      bar: {
        columnWidth: "60%"
      }
    },
    grid: {
      borderColor: "#e5e7eb"
    }
  };

  return (
    <div id="chart">
      <ReactApexChart
        options={options}
        series={series}
        height={350}
      />
    </div>
  );
};

export default CandleChart;



