import { useEffect, useState, useMemo } from "react";
import { Plus, Edit2, Trash2, Save, X, Package, ListFilter, AlertTriangle, ChevronDown, ChevronUp, RefreshCcw } from "lucide-react";
import { getProducts, createProduct, updateProduct, deleteProduct, getProductSales, type ProductView, type ProductSaleView } from "../../api";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import { FormSection } from "../../components/FormSection";
import { LoadingState } from "../../components/LoadingState";
import { inputClassName, labelClassName, panelSurfaceClassName, primaryButtonClassName, secondaryButtonClassName, dangerButtonClassName } from "../../components/formStyles";
import type { OwnerContext } from "./types";

export function OwnerProducts({ ctx }: { ctx: OwnerContext }) {
  const { auth, selectedGymId, setError, setInfo } = ctx;

  const [activeTab, setActiveTab] = useState<"inventory" | "sales">("inventory");
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [products, setProducts] = useState<ProductView[]>([]);
  const [sales, setSales] = useState<ProductSaleView[]>([]);

  // Expanded sales log rows
  const [expandedSales, setExpandedSales] = useState<Record<number, boolean>>({});

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductView | null>(null);
  
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("Napoje");
  const [customCategory, setCustomCategory] = useState("");

  const categoriesList = ["Napoje", "Odżywki", "Przekąski", "Akcesoria", "Inne"];

  // Fetch all warehouse/inventory products
  async function loadProducts() {
    if (!selectedGymId) return;
    setLoading(true);
    try {
      const data = await getProducts(auth, Number(selectedGymId), "owner");
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się załadować magazynu");
    } finally {
      setLoading(false);
    }
  }

  // Fetch product sales log
  async function loadSales() {
    if (!selectedGymId) return;
    setLoading(true);
    try {
      const data = await getProductSales(auth, Number(selectedGymId));
      setSales(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się załadować historii sprzedaży");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedGymId) {
      loadProducts();
      loadSales();
      setShowForm(false);
      setEditProduct(null);
    }
  }, [selectedGymId]);

  // Handle product add / edit submit
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGymId) return;
    setError("");
    setInfo("");

    const finalCategory = category === "Inne" && customCategory.trim() ? customCategory.trim() : category;

    const payload = {
      name: name.trim(),
      price: Number(price),
      quantity: Number(quantity),
      category: finalCategory,
    };

    if (Number.isNaN(payload.price) || payload.price < 0) {
      setError("Cena musi być poprawną liczbą dodatnią.");
      return;
    }
    if (Number.isNaN(payload.quantity) || payload.quantity < 0) {
      setError("Ilość musi być liczbą nieujemną.");
      return;
    }

    setLoading(true);
    try {
      if (editProduct) {
        await updateProduct(auth, Number(selectedGymId), editProduct.id, payload);
        setInfo(`Zaktualizowano produkt: ${payload.name}`);
      } else {
        await createProduct(auth, Number(selectedGymId), payload);
        setInfo(`Dodano produkt: ${payload.name}`);
      }
      setName("");
      setPrice("");
      setQuantity("");
      setCategory("Napoje");
      setCustomCategory("");
      setEditProduct(null);
      setShowForm(false);
      loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zapisać produktu");
    } finally {
      setLoading(false);
    }
  }

  // Edit action
  const startEdit = (product: ProductView) => {
    setEditProduct(product);
    setName(product.name);
    setPrice(String(product.price));
    setQuantity(String(product.quantity));
    
    if (categoriesList.includes(product.category)) {
      setCategory(product.category);
      setCustomCategory("");
    } else {
      setCategory("Inne");
      setCustomCategory(product.category);
    }
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Delete action
  const handleDelete = async (productId: number, productName: string) => {
    if (!selectedGymId || !window.confirm(`Czy na pewno chcesz usunąć produkt "${productName}"?`)) return;
    setLoading(true);
    setError("");
    setInfo("");
    try {
      await deleteProduct(auth, Number(selectedGymId), productId);
      setInfo(`Usunięto produkt: ${productName}`);
      loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się usunąć produktu");
    } finally {
      setLoading(false);
    }
  };

  // Toggle expanded sale log row
  const toggleSaleExpand = (saleId: number) => {
    setExpandedSales((prev) => ({ ...prev, [saleId]: !prev[saleId] }));
  };

  // Low stock metrics
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.quantity < 5).length;
  }, [products]);

  const totalValue = useMemo(() => {
    return products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  }, [products]);

  const totalQuantity = useMemo(() => {
    return products.reduce((sum, p) => sum + p.quantity, 0);
  }, [products]);

  const totalSalesRevenue = useMemo(() => {
    return sales.reduce((sum, s) => sum + s.totalAmount, 0);
  }, [sales]);

  if (!selectedGymId) return <SelectGymPrompt />;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-5 flex items-center gap-4 ${panelSurfaceClassName}`}>
          <div className="p-3 bg-primary-50 dark:bg-primary-950/20 text-primary-500 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Wartość magazynu
            </p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {totalValue.toFixed(2)} PLN
            </p>
          </div>
        </div>

        <div className={`p-5 flex items-center gap-4 ${panelSurfaceClassName}`}>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Asortyment w magazynie
            </p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {totalQuantity} {totalQuantity === 1 ? "sztuka" : totalQuantity > 1 && totalQuantity < 5 ? "sztuki" : "sztuk"}
            </p>
            {lowStockCount > 0 && (
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">
                Uwaga: {lowStockCount} na wyczerpaniu
              </p>
            )}
          </div>
        </div>

        <div className={`p-5 flex items-center gap-4 ${panelSurfaceClassName}`}>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl">
            <ListFilter className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Sprzedaż produktów łączna
            </p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {totalSalesRevenue.toFixed(2)} PLN
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`px-5 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "inventory"
              ? "border-primary-500 text-primary-500"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Magazyn (Ewidencja)
        </button>
        <button
          onClick={() => setActiveTab("sales")}
          className={`px-5 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "sales"
              ? "border-primary-500 text-primary-500"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Historia sprzedaży
        </button>
      </div>

      {/* Product Add / Edit Form Card */}
      {showForm && (
        <FormSection title={editProduct ? `Edycja produktu: ${editProduct.name}` : "Dodaj nowy produkt"}>
          <form onSubmit={onSubmit} className="space-y-4 max-w-2xl bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClassName}>Nazwa produktu</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClassName}
                  placeholder="np. Woda gazowana 0.5L"
                  required
                />
              </div>

              <div>
                <label className={labelClassName}>Kategoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border-2 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm rounded-2xl px-4 py-3 outline-none focus:border-primary-500 font-medium"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {category === "Inne" && (
                <div className="sm:col-span-2">
                  <label className={labelClassName}>Własna kategoria</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className={inputClassName}
                    placeholder="Wpisz nazwę kategorii"
                    required
                  />
                </div>
              )}

              <div>
                <label className={labelClassName}>Cena sprzedaży (PLN)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={inputClassName}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className={labelClassName}>Stan magazynowy (Ilość)</label>
                <input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={inputClassName}
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className={primaryButtonClassName}>
                <Save className="w-4 h-4" />
                {editProduct ? "Zapisz zmiany" : "Dodaj produkt"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditProduct(null);
                  setName("");
                  setPrice("");
                  setQuantity("");
                }}
                className={secondaryButtonClassName}
              >
                Anuluj
              </button>
            </div>
          </form>
        </FormSection>
      )}

      {/* Tab: Inventory catalog */}
      {activeTab === "inventory" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">
              Stan magazynowy siłowni
            </h2>
            
            {!showForm && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className={primaryButtonClassName}
              >
                <Plus className="w-4 h-4" />
                Dodaj produkt
              </button>
            )}
          </div>

          {products.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-slate-500 dark:text-slate-400">
              {loading ? "Ładowanie danych..." : "Magazyn jest pusty. Dodaj pierwszy produkt."}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60">
                      <th className="px-6 py-4">Nazwa produktu</th>
                      <th className="px-6 py-4">Kategoria</th>
                      <th className="px-6 py-4 text-right">Cena</th>
                      <th className="px-6 py-4 text-right">Stan magazynu</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Akcje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium text-slate-900 dark:text-slate-200">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{p.name}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg">
                            {p.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-primary-500">{p.price.toFixed(2)} PLN</td>
                        <td className="px-6 py-4 text-right font-semibold">{p.quantity} szt.</td>
                        <td className="px-6 py-4 text-center">
                          {p.quantity === 0 ? (
                            <span className="text-xs font-bold px-2 py-0.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-md border border-rose-100 dark:border-rose-900/30">
                              Brak
                            </span>
                          ) : p.quantity < 5 ? (
                            <span className="text-xs font-bold px-2 py-0.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-md border border-amber-100 dark:border-amber-900/30">
                              Niski
                            </span>
                          ) : (
                            <span className="text-xs font-bold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-100 dark:border-emerald-900/30">
                              OK
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(p)}
                              className="p-1.5 text-slate-500 hover:text-primary-500 transition-colors"
                              title="Edytuj produkt"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(p.id, p.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                              title="Usuń produkt"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Sales History logs */}
      {activeTab === "sales" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">
              Rejestr sprzedaży produktów
            </h2>
            <button
              onClick={loadSales}
              disabled={loading}
              className={`${secondaryButtonClassName} !py-2`}
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Odśwież historię
            </button>
          </div>

          {sales.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-slate-500 dark:text-slate-400">
              {loading ? "Ładowanie danych..." : "Nie zarejestrowano jeszcze żadnej sprzedaży produktów."}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60">
                      <th className="px-6 py-4 w-12"></th>
                      <th className="px-6 py-4">ID Transakcji</th>
                      <th className="px-6 py-4">Data sprzedaży</th>
                      <th className="px-6 py-4">Sprzedawca</th>
                      <th className="px-6 py-4">Klient</th>
                      <th className="px-6 py-4">Metoda</th>
                      <th className="px-6 py-4 text-right">Suma</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium text-slate-900 dark:text-slate-200">
                    {sales.map((sale) => {
                      const isExpanded = !!expandedSales[sale.id];
                      return (
                        <>
                          <tr
                            key={sale.id}
                            onClick={() => toggleSaleExpand(sale.id)}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                          >
                            <td className="px-6 py-4 text-center">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              )}
                            </td>
                            <td className="px-6 py-4 font-bold">#{sale.id}</td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                              {new Date(sale.createdAt).toLocaleString("pl-PL")}
                            </td>
                            <td className="px-6 py-4">{sale.soldByEmail}</td>
                            <td className="px-6 py-4">
                              <span className="font-semibold">{sale.guestName}</span>
                            </td>
                            <td className="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {sale.paymentMethod === "CASH" ? "Gotówka" : "Karta"}
                            </td>
                            <td className="px-6 py-4 text-right font-black text-primary-500">
                              {sale.totalAmount.toFixed(2)} PLN
                            </td>
                          </tr>

                          {/* Expanded products details sub-row */}
                          {isExpanded && (
                            <tr className="bg-slate-50/60 dark:bg-slate-950/20">
                              <td colSpan={7} className="px-12 py-3 border-b border-slate-100 dark:border-slate-800">
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                    Pozycje transakcji
                                  </p>
                                  <div className="space-y-1.5">
                                    {sale.items.map((item) => (
                                      <div key={item.id} className="flex justify-between text-xs max-w-md">
                                        <span className="text-slate-600 dark:text-slate-300">
                                          {item.productName}{" "}
                                          <span className="font-bold text-slate-800 dark:text-slate-200">
                                            x{item.quantity}
                                          </span>
                                        </span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                                          {item.unitPrice.toFixed(2)} PLN / szt.
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
