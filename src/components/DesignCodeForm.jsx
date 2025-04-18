import { useState, useEffect } from "react";
import InputField from "./InputField";
import SelectField from "./SelectField";
import SpectrumChart from "./SpectrumChart";

const riskIeMap = {
  I: 1.0,
  II: 1.0,
  III: 1.25,
  IV: 1.5,
};

const FaTable = {
  A: 0.8, B: 1.0, C: 1.2, D: 1.6, E: 2.5,
};

const FvTable = {
  A: 0.8, B: 1.0, C: 1.5, D: 2.4, E: 3.5,
};

export default function DesignCodeForm() {
  const [code, setCode] = useState("ASCE7");
  const [form, setForm] = useState({ riskCategory: "II", ie: 1.0, storyCount: 5 });
  const [results, setResults] = useState(null);
  const [storyData, setStoryData] = useState([]);
  const [showStoryModal, setShowStoryModal] = useState(false);

  useEffect(() => {
    if (form.riskCategory && riskIeMap[form.riskCategory]) {
      setForm((prev) => ({ ...prev, ie: riskIeMap[form.riskCategory] }));
    }
  }, [form.riskCategory]);

  useEffect(() => {
    const n = parseInt(form.storyCount);
    if (!isNaN(n) && n > 0 && n <= 20) {
      const newStories = Array.from({ length: n }, (_, i) => ({
        name: `${n - i}F`,
        height: 4,
        weight: 1000,
      }));
      setStoryData(newStories);
    }
  }, [form.storyCount]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStoryFieldChange = (i, field, value) => {
    setStoryData((prev) => {
      const copy = [...prev];
      copy[i][field] = parseFloat(value);
      return copy;
    });
  };

  const handleCalculate = () => {
    let sdsNum;
    if (code === "Eurocode8") {
      sdsNum = parseFloat(form.ag);
    } else {
      const ss = parseFloat(form.ss);
      const s1 = parseFloat(form.s1);
      const fa = FaTable[form.siteClass] || 1.0;
      const fv = FvTable[form.siteClass] || 1.0;
      const sds = (fa * ss * 2) / 3;
      const sd1 = (fv * s1 * 2) / 3;
      form.sds = sds.toFixed(3);
      form.sd1 = sd1.toFixed(3);
      sdsNum = sds;
    }

    const { r_x, r_y, ie } = form;
    const rx = parseFloat(r_x);
    const ry = parseFloat(r_y);
    const ieNum = parseFloat(ie);
    const w = storyData.reduce((sum, s) => sum + (s.weight || 0), 0);

    if ([sdsNum, rx, ry, ieNum, w].some((v) => isNaN(v) || v === 0)) {
      setResults(null);
      return;
    }

    const cs_x = sdsNum / (rx / ieNum);
    const cs_y = sdsNum / (ry / ieNum);
    const vx = cs_x * w;
    const vy = cs_y * w;

    const totalWeightedHeight = storyData.reduce(
      (sum, s) => sum + s.height * s.weight,
      0
    );

    const fxTable = storyData.map((s) => {
      const ratio = (s.height * s.weight) / totalWeightedHeight;
      return {
        ...s,
        ratio,
        fx_x: ratio * vx,
        fx_y: ratio * vy,
      };
    });

    let spectrum = [];

    if (code === "Eurocode8") {
      const ag = sdsNum;
      const S = 1.2;
      const TB = 0.15, TC = 0.6, TD = 2.0;

      spectrum = Array.from({ length: 100 }, (_, i) => {
        const T = i * 0.05;
        let Sa = 0;
        if (T <= TB) Sa = ag * S * (1 + T / TB);
        else if (T <= TC) Sa = ag * S * 2.5;
        else if (T <= TD) Sa = ag * S * 2.5 * (TC / T);
        else Sa = ag * S * 2.5 * (TC * TD) / (T * T);
        return { T, Sa };
      });
    } else {
      const sd1 = parseFloat(form.sd1);
      const t0 = 0.2 * sd1 / sdsNum;
      const ts = sd1 / sdsNum;

      spectrum = Array.from({ length: 100 }, (_, i) => {
        const T = i * 0.05;
        let Sa = 0;
        if (T <= t0) Sa = sdsNum * (0.4 + 0.6 * (T / t0));
        else if (T <= ts) Sa = sdsNum;
        else Sa = sd1 / T;
        return { T, Sa };
      });
    }

    setResults({ cs_x, cs_y, vx, vy, fxTable, spectrum });
  };

  return (
    <div className="max-w-xl mx-auto p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded shadow space-y-6">
      <div>
        <label className="block font-bold mb-2">설계 기준</label>
        <select
          className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setForm(e.target.value === "ASCE7" || e.target.value === "KDS"
              ? { riskCategory: "II", ie: 1.0, storyCount: 5 }
              : {});
            setResults(null);
          }}
        >
          <option value="KDS">KDS (대한민국)</option>
          <option value="ASCE7">ASCE 7 (미국)</option>
          <option value="Eurocode8">Eurocode 8 (유럽)</option>
        </select>
      </div>

      <div className="flex items-center gap-4">
        <InputField
          label="층수 (Story Count)"
          name="storyCount"
          value={form.storyCount || ""}
          onChange={handleChange}
        />
        <button
          onClick={() => setShowStoryModal(true)}
          className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-3 py-1 rounded text-sm"
        >
          건물 정보 입력
        </button>
      </div>

      {showStoryModal && (
        <div className="fixed inset-0 bg-gray-500/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow max-h-[90vh] overflow-y-auto w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">층별 높이 및 질량 입력</h2>
            <div className="grid grid-cols-3 gap-2 font-semibold">
              <div>층 이름</div>
              <div>높이 (m)</div>
              <div>질량 (kN)</div>
            </div>
            {storyData.map((s, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 py-1">
                <div>{s.name}</div>
                <input
                  type="number"
                  className="border p-1 rounded bg-white dark:bg-gray-800"
                  value={s.height}
                  onChange={(e) => handleStoryFieldChange(i, "height", e.target.value)}
                />
                <input
                  type="number"
                  className="border p-1 rounded bg-white dark:bg-gray-800"
                  value={s.weight}
                  onChange={(e) => handleStoryFieldChange(i, "weight", e.target.value)}
                />
              </div>
            ))}
            <div className="text-right pt-4">
              <button
                onClick={() => setShowStoryModal(false)}
                className="bg-blue-600 text-black dark:text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <SelectField
          label={code === "Eurocode8" ? "Ground Type" : "Site Class"}
          name="siteClass"
          value={form.siteClass || ""}
          options={code === "KDS" ? ["S1", "S2", "S3"] : ["A", "B", "C", "D", "E"]}
          onChange={handleChange}
        />

        {code === "Eurocode8" ? (
          <>
            <InputField label="ag (설계 기초 가속도)" name="ag" value={form.ag || ""} onChange={handleChange} />
            <InputField label="γI (Importance Factor)" name="ie" value={form.ie || ""} onChange={handleChange} />
          </>
        ) : (
          <>
            <SelectField
              label="Risk Category"
              name="riskCategory"
              value={form.riskCategory || ""}
              options={["I", "II", "III", "IV"]}
              onChange={handleChange}
            />
            <InputField label="Ss (단주기 위험계수)" name="ss" value={form.ss || ""} onChange={handleChange} />
            <InputField label="S1 (장주기 위험계수)" name="s1" value={form.s1 || ""} onChange={handleChange} />
            <InputField label="SDS (자동계산)" name="sds" value={form.sds || ""} onChange={handleChange} readOnly />
            <InputField label="SD1 (자동계산)" name="sd1" value={form.sd1 || ""} onChange={handleChange} readOnly />
          </>
        )}

        <InputField label="R (X 방향)" name="r_x" value={form.r_x || ""} onChange={handleChange} />
        <InputField label="R (Y 방향)" name="r_y" value={form.r_y || ""} onChange={handleChange} />

        <div className="text-sm text-gray-700 dark:text-gray-200">
          구조물 중량 W (kN):
          <span className="font-semibold ml-2">
            {storyData.reduce((sum, s) => sum + (s.weight || 0), 0).toLocaleString()} kN
          </span>
        </div>
      </div>

      <div className="pt-4">
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-black dark:text-white font-semibold py-2 px-4 rounded"
          onClick={handleCalculate}
        >
          설계 지진하중 계산하기
        </button>
      </div>

      {results && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-4 text-sm space-y-2">
          <p>🧮 <strong>계산 결과</strong></p>
          <p>Cs (X 방향): <strong>{results.cs_x.toFixed(4)}</strong></p>
          <p>Cs (Y 방향): <strong>{results.cs_y.toFixed(4)}</strong></p>
          <p>Vx (설계지진하중): <strong>{results.vx.toFixed(2)} kN</strong></p>
          <p>Vy (설계지진하중): <strong>{results.vy.toFixed(2)} kN</strong></p>

          <hr className="my-2 border-gray-300 dark:border-gray-600" />

          <p>📦 <strong>층별 하중 분배</strong></p>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-400">
                <th className="text-left">층</th>
                <th>높이</th>
                <th>질량</th>
                <th>Ratio</th>
                <th>Fx-X</th>
                <th>Fx-Y</th>
              </tr>
            </thead>
            <tbody>
              {results.fxTable.map((s) => (
                <tr key={s.name} className="border-t border-gray-300 dark:border-gray-600">
                  <td>{s.name}</td>
                  <td>{s.height} m</td>
                  <td>{s.weight} kN</td>
                  <td>{(s.ratio * 100).toFixed(1)}%</td>
                  <td>{s.fx_x.toFixed(1)} kN</td>
                  <td>{s.fx_y.toFixed(1)} kN</td>
                </tr>
              ))}
            </tbody>
          </table>
          <SpectrumChart spectrum={results.spectrum} />
        </div>
      )}
    </div>
  );
}
