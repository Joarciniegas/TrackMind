"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const auctions = ["Manheim", "Copart", "IAAI", "Adesa", "Otro"];
const paymentMethods = ["CASH", "FLOORING"];

// Años desde 2010 hasta 2026
const years = Array.from({ length: 17 }, (_, i) => (2026 - i).toString());

// Marcas y modelos populares
const vehicleData: Record<string, string[]> = {
  Toyota: ["Camry", "Corolla", "RAV4", "Highlander", "Tacoma", "Tundra", "4Runner", "Prius", "Sienna", "Avalon"],
  Honda: ["Civic", "Accord", "CR-V", "Pilot", "HR-V", "Odyssey", "Ridgeline", "Passport", "Fit"],
  Ford: ["F-150", "Escape", "Explorer", "Mustang", "Edge", "Bronco", "Ranger", "Expedition", "Maverick"],
  Chevrolet: ["Silverado", "Equinox", "Tahoe", "Suburban", "Malibu", "Traverse", "Colorado", "Camaro", "Blazer"],
  Nissan: ["Altima", "Sentra", "Rogue", "Pathfinder", "Murano", "Frontier", "Maxima", "Kicks", "Armada"],
  Hyundai: ["Elantra", "Sonata", "Tucson", "Santa Fe", "Kona", "Palisade", "Accent", "Venue"],
  Kia: ["Optima", "Sorento", "Sportage", "Telluride", "Forte", "Soul", "Seltos", "Carnival"],
  BMW: ["3 Series", "5 Series", "X3", "X5", "X1", "7 Series", "X7", "4 Series"],
  "Mercedes-Benz": ["C-Class", "E-Class", "GLC", "GLE", "A-Class", "S-Class", "GLA", "GLB"],
  Audi: ["A4", "A6", "Q5", "Q7", "A3", "Q3", "A5", "e-tron"],
  Lexus: ["ES", "RX", "NX", "IS", "GX", "LX", "UX", "LS"],
  Mazda: ["CX-5", "Mazda3", "CX-30", "CX-9", "Mazda6", "MX-5 Miata", "CX-50"],
  Subaru: ["Outback", "Forester", "Crosstrek", "Impreza", "Ascent", "Legacy", "WRX"],
  Volkswagen: ["Jetta", "Tiguan", "Atlas", "Passat", "Golf", "ID.4", "Taos"],
  Jeep: ["Wrangler", "Grand Cherokee", "Cherokee", "Compass", "Gladiator", "Renegade"],
  Ram: ["1500", "2500", "3500", "ProMaster"],
  GMC: ["Sierra", "Terrain", "Acadia", "Yukon", "Canyon"],
  Dodge: ["Charger", "Challenger", "Durango", "Hornet"],
  Otro: ["Otro"],
};

const makes = Object.keys(vehicleData);

const colors = [
  "Blanco",
  "Negro",
  "Gris",
  "Plata",
  "Rojo",
  "Azul",
  "Azul Marino",
  "Verde",
  "Beige",
  "Marrón",
  "Dorado",
  "Naranja",
  "Amarillo",
  "Otro",
];

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
    const { name, value } = e.target;

    // Si cambia la marca, resetear el modelo
    if (name === "make") {
      setForm({ ...form, make: value, model: "" });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          year: form.year ? parseInt(form.year) : null,
          miles: form.miles ? parseInt(form.miles) : null,
          purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : 0,
          transport_cost: form.transport_cost ? parseFloat(form.transport_cost) : 0,
        }),
      });

      if (response.ok) {
        router.push("/");
      } else {
        alert("Error al guardar");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const availableModels = form.make ? vehicleData[form.make] || [] : [];

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
            pattern="[0-9A-Za-z]{6}"
            required
            placeholder="123456"
            className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-lg"
          />
        </div>

        {/* Year, Make */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
            <select
              name="year"
              value={form.year}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200"
            >
              <option value="">Año</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
            <select
              name="make"
              value={form.make}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200"
            >
              <option value="">Seleccionar marca</option>
              {makes.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Model, Trim */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
            <select
              name="model"
              value={form.model}
              onChange={handleChange}
              disabled={!form.make}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 disabled:bg-gray-100"
            >
              <option value="">Seleccionar modelo</option>
              {availableModels.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trim</label>
            <input
              type="text"
              name="trim"
              value={form.trim}
              onChange={handleChange}
              placeholder="SE, XLE, Sport..."
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200"
            />
          </div>
        </div>

        {/* Color, Miles */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <select
              name="color"
              value={form.color}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200"
            >
              <option value="">Seleccionar color</option>
              {colors.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
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
