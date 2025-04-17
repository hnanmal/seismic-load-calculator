import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function SpectrumChart({ spectrum }) {
  if (!spectrum || spectrum.length === 0) return null;

  return (
    <div className="mt-6">
      <p className="font-bold mb-2">📈 설계 응답 스펙트럼</p>
      <Line
        data={{
          labels: spectrum.map((p) => p.T.toFixed(2)),
          datasets: [
            {
              label: "Sa(T)",
              data: spectrum.map((p) => p.Sa),
              fill: false,
              borderColor: "#3b82f6",
              tension: 0.3,
            },
          ],
        }}
        options={{
          responsive: true,
          scales: {
            x: { title: { display: true, text: "진동 주기 T (sec)" } },
            y: { title: { display: true, text: "설계 가속도 Sa(T)" } },
          },
        }}
      />
    </div>
  );
}
