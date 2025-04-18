import { useState } from 'react'
import './App.css'

import DesignCodeForm from "./components/DesignCodeForm";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">🌏 지진하중 계산기</h1>
      <DesignCodeForm />
    </div>
  );
}
