"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const auctions = ["Manheim", "Copart", "IAAI", "Adesa", "Otro"];
const paymentMethods = ["CASH", "FLOORING"];

export default function NewVehicle() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    vin: "",
    year: "",
    make: "",
    model: "",
    trim: "",
    color: "",
    miles: "",
    auction: "Manheim",
    payment_method: "CASH",
    purchase_price: "",
    transport_cost: "",
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // TODO: API call
    console.log("Saving vehicle:", form);

    // Simular guardado
    setTimeout(() => {
      setLoading(false);
      router.push("/");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white px-4 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold">Nuevo Vehículo</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-4 pb-24">
        {/* VIN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            VIN (últimos 6 dígitos) *
          </label>
          <input
            type="text"
            name="vin"
            value={form.vin}
            onChange={handleChange}
            maxLength={6}
            pattern="[0-9]{6}"
            required
            placeholder="123456"
            className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-lg"
          />
        </div>

        {/* Year, Make, Model */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
            <input
              type="number"
              name="year"
              value={form.year}
              onChange={handleChange}
              placeholder="2020"
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
            <input
              type="text"
              name="make"
              value={form.make}
              onChange={handleChange}
              placeholder="Toyota"
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
            <input
              type="text"
              name="model"
              value={form.model}
              onChange={handleChange}
              placeholder="Camry"
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trim</label>
            <input
              type="text"
              name="trim"
              value={form.trim}
              onChange={handleChange}
              placeholder="SE"
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <input
              type="text"
              name="color"
              value={form.color}
              onChange={handleChange}
              placeholder="Blanco"
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Millas</label>
            <input
              type="number"
              name="miles"
              value={form.miles}
              onChange={handleChange}
              placeholder="50000"
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 pt-4">
          <h2 className="font-semibold text-gray-900 mb-3">Compra</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subasta</label>
          <select
            name="auction"
            value={form.auction}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200"
          >
            {auctions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
          <div className="flex gap-3">
            {paymentMethods.map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setForm({ ...form, payment_method: method })}
                className={`flex-1 py-3 rounded-xl font-semibold transition ${
                  form.payment_method === method
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200 text-gray-700"
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio Compra</label>
            <input
              type="number"
              name="purchase_price"
              value={form.purchase_price}
              onChange={handleChange}
              placeholder="15000"
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transporte</label>
            <input
              type="number"
              name="transport_cost"
              value={form.transport_cost}
              onChange={handleChange}
              placeholder="500"
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Notas adicionales..."
            className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200"
          />
        </div>

        {/* Submit Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t safe-bottom">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar Vehículo"}
          </button>
        </div>
      </form>
    </div>
  );
}
