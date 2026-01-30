"use client";

export const runtime = "edge";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/UserContext";

const auctions = [
  "Manheim",
  "Copart",
  "IAAI",
  "Adesa",
  "Americas Almeda",
  "Americas Conroe",
  "Americas Buda",
  "Autonation Houston",
  "Otro"
];
const paymentMethods = ["CASH", "FLOORING"];
const flooringCompanies = ["Westlake", "Axle", "Carbucks", "FExpress", "Otro"];

const years = Array.from({ length: 17 }, (_, i) => (2026 - i).toString());

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
  Porsche: ["911", "Cayenne", "Macan", "Panamera", "Taycan", "718 Cayman", "718 Boxster"],
  Lexus: ["ES", "RX", "NX", "IS", "GX", "LX", "UX", "LS"],
  Infiniti: ["Q50", "Q60", "QX50", "QX55", "QX60", "QX80"],
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
  "Blanco", "Negro", "Gris", "Plata", "Rojo", "Azul", "Azul Marino",
  "Verde", "Beige", "Marrón", "Dorado", "Naranja", "Amarillo", "Otro",
];

export default function EditVehicle() {
  const router = useRouter();
  const params = useParams();
  const { permissions } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    vin: "",
    stock_no: "",
    year: "",
    make: "",
    makeOther: "",
    model: "",
    modelOther: "",
    trim: "",
    color: "",
    colorOther: "",
    miles: "",
    auction: "Manheim",
    auctionOther: "",
    payment_method: "CASH",
    flooring_company: "",
    flooringOther: "",
    purchase_price: "",
    transport_cost: "",
    recon_cost: "",
    notes: "",
  });

  useEffect(() => {
    // Verificar permisos
    if (!permissions.canEdit) {
      router.push(`/vehicle/${params.id}`);
      return;
    }

    // Cargar datos del vehículo
    fetch(`/api/vehicles/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          router.push("/");
          return;
        }

        // Determinar si make/model/color son "Otro"
        const makeInList = makes.includes(data.make);
        const modelInList = makeInList && vehicleData[data.make]?.includes(data.model);
        const colorInList = colors.includes(data.color);
        const auctionInList = auctions.includes(data.auction);
        const flooringInList = flooringCompanies.includes(data.flooring_company);

        setForm({
          vin: data.vin || "",
          stock_no: data.stock_no || "",
          year: data.year?.toString() || "",
          make: makeInList ? data.make : "Otro",
          makeOther: makeInList ? "" : data.make || "",
          model: modelInList ? data.model : "Otro",
          modelOther: modelInList ? "" : data.model || "",
          trim: data.trim || "",
          color: colorInList ? data.color : "Otro",
          colorOther: colorInList ? "" : data.color || "",
          miles: data.miles?.toString() || "",
          auction: auctionInList ? data.auction : "Otro",
          auctionOther: auctionInList ? "" : data.auction || "",
          payment_method: data.payment_method || "CASH",
          flooring_company: flooringInList ? (data.flooring_company || "") : "Otro",
          flooringOther: flooringInList ? "" : data.flooring_company || "",
          purchase_price: data.purchase_price?.toString() || "",
          transport_cost: data.transport_cost?.toString() || "",
          recon_cost: data.recon_cost?.toString() || "",
          notes: data.notes || "",
        });
        setLoading(false);
      })
      .catch(() => {
        router.push("/");
      });
  }, [params.id, permissions.canEdit, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === "make") {
      setForm({ ...form, make: value, model: "", makeOther: "", modelOther: "" });
    } else if (name === "model") {
      setForm({ ...form, model: value, modelOther: "" });
    } else if (name === "color") {
      setForm({ ...form, color: value, colorOther: "" });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const finalMake = form.make === "Otro" ? form.makeOther : form.make;
      const finalModel = form.model === "Otro" ? form.modelOther : form.model;
      const finalColor = form.color === "Otro" ? form.colorOther : form.color;
      const finalAuction = form.auction === "Otro" ? form.auctionOther : form.auction;
      const finalFlooringCompany = form.flooring_company === "Otro" ? form.flooringOther : form.flooring_company;

      const response = await fetch(`/api/vehicles/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vin: form.vin,
          stock_no: form.stock_no || null,
          year: form.year ? parseInt(form.year) : null,
          make: finalMake,
          model: finalModel,
          trim: form.trim,
          color: finalColor,
          miles: form.miles ? parseInt(form.miles) : null,
          auction: finalAuction,
          payment_method: form.payment_method,
          flooring_company: form.payment_method === "FLOORING" ? finalFlooringCompany : null,
          purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : 0,
          transport_cost: form.transport_cost ? parseFloat(form.transport_cost) : 0,
          recon_cost: form.recon_cost ? parseFloat(form.recon_cost) : 0,
          notes: form.notes,
        }),
      });

      if (response.ok) {
        router.push(`/vehicle/${params.id}`);
      } else {
        alert("Error al guardar");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const availableModels = form.make ? vehicleData[form.make] || [] : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white px-4 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href={`/vehicle/${params.id}`} className="text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold">Editar Vehículo</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-4 pb-24">
        {/* VIN y Stock # */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              VIN (últimos 6)
            </label>
            <input
              type="text"
              name="vin"
              value={form.vin}
              onChange={handleChange}
              maxLength={6}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock #
            </label>
            <input
              type="text"
              name="stock_no"
              value={form.stock_no}
              onChange={handleChange}
              placeholder="SP001"
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-lg"
            />
          </div>
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

        {form.make === "Otro" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Escribir Marca</label>
            <input
              type="text"
              name="makeOther"
              value={form.makeOther}
              onChange={handleChange}
              placeholder="Ej: Tesla, Rivian..."
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200"
            />
          </div>
        )}

        {/* Model, Trim */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
            {form.make === "Otro" ? (
              <input
                type="text"
                name="modelOther"
                value={form.modelOther}
                onChange={handleChange}
                placeholder="Escribir modelo..."
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200"
              />
            ) : (
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
            )}
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

        {form.make !== "Otro" && form.model === "Otro" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Escribir Modelo</label>
            <input
              type="text"
              name="modelOther"
              value={form.modelOther}
              onChange={handleChange}
              placeholder="Escribir modelo..."
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200"
            />
          </div>
        )}

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

        {form.color === "Otro" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Escribir Color</label>
            <input
              type="text"
              name="colorOther"
              value={form.colorOther}
              onChange={handleChange}
              placeholder="Ej: Turquesa, Champagne..."
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200"
            />
          </div>
        )}

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

        {form.auction === "Otro" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Escribir Subasta</label>
            <input
              type="text"
              name="auctionOther"
              value={form.auctionOther}
              onChange={handleChange}
              placeholder="Nombre de la subasta..."
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200"
            />
          </div>
        )}

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

        {form.payment_method === "FLOORING" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Compañía de Flooring</label>
              <select
                name="flooring_company"
                value={form.flooring_company}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200"
              >
                <option value="">Seleccionar compañía</option>
                {flooringCompanies.map((fc) => (
                  <option key={fc} value={fc}>{fc}</option>
                ))}
              </select>
            </div>

            {form.flooring_company === "Otro" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Escribir Compañía</label>
                <input
                  type="text"
                  name="flooringOther"
                  value={form.flooringOther}
                  onChange={handleChange}
                  placeholder="Nombre de la compañía..."
                  className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200"
                />
              </div>
            )}
          </>
        )}

        <div className="grid grid-cols-3 gap-3">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recon</label>
            <input
              type="number"
              name="recon_cost"
              value={form.recon_cost}
              onChange={handleChange}
              placeholder="1000"
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
            disabled={saving}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
