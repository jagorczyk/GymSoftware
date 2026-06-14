import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Minus, Trash2, Search, User, CreditCard, Coins, ShoppingCart, RefreshCcw } from "lucide-react";
import { getProducts, getEmployeeGuests, checkoutProducts, getEmployeeGuestDetail, getMyProductSalesHistory, getProductByBarcode, type ProductView, type ProductSaleView } from "../../api";
import { secondaryButtonClassName, inputClassName, labelClassName } from "../../components/formStyles";
import { SelectGymDashboardPrompt } from "./EmployeeHome";
import type { EmployeeContext } from "./types";

interface BasketItem {
  product: ProductView;
  quantity: number;
}

export function EmployeePOS({ ctx }: { ctx: EmployeeContext }) {
  const { auth, selectedGymId, overview, refreshOverview, setError, setMessage } = ctx;

  const [searchParams] = useSearchParams();
  const urlGuestId = searchParams.get("guestId");

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductView[]>([]);
  const [basket, setBasket] = useState<BasketItem[]>([]);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  
  // Checkout state
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [selectedGuestId, setSelectedGuestId] = useState<string>("anonymous");
  const [selectedGuestName, setSelectedGuestName] = useState<string>("");
  const [guestSearchQuery, setGuestSearchQuery] = useState("");
  const [searchedGuests, setSearchedGuests] = useState<any[]>([]);
  const [searchingGuests, setSearchingGuests] = useState(false);

  // History & tabs
  const [activeTab, setActiveTab] = useState<"catalog" | "history">("catalog");
  const [salesHistory, setSalesHistory] = useState<ProductSaleView[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Cash calculator
  const [receivedAmount, setReceivedAmount] = useState<string>("");

  // Barcode scanner
  const [barcodeQuery, setBarcodeQuery] = useState("");
  const [expandedSaleId, setExpandedSaleId] = useState<number | null>(null);

  // Load products
  async function loadProducts() {
    if (!selectedGymId) return;
    setLoading(true);
    try {
      const data = await getProducts(auth, Number(selectedGymId), "employee");
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać produktów");
    } finally {
      setLoading(false);
    }
  }

  // Load guests matching search query (for customers not currently present)
  async function searchGuests() {
    if (!selectedGymId || !guestSearchQuery.trim()) {
      setSearchedGuests([]);
      return;
    }
    setSearchingGuests(true);
    try {
      const data = await getEmployeeGuests(auth, Number(selectedGymId), guestSearchQuery);
      setSearchedGuests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd wyszukiwania klientów");
    } finally {
      setSearchingGuests(false);
    }
  }

  async function loadHistory() {
    if (!selectedGymId) return;
    setHistoryLoading(true);
    try {
      const data = await getMyProductSalesHistory(auth, Number(selectedGymId));
      setSalesHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać historii");
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === "history") {
      loadHistory();
    }
  }, [activeTab, selectedGymId]);

  async function handleBarcodeSubmit(code: string) {
    if (!code.trim() || !selectedGymId) return;
    try {
      const product = await getProductByBarcode(auth, Number(selectedGymId), code.trim());
      
      setBasket((prev) => {
        const existing = prev.find((item) => item.product.id === product.id);
        const currentQty = existing ? existing.quantity : 0;
        if (currentQty >= product.quantity) {
          setError(`Brak większej ilości produktu '${product.name}' na magazynie.`);
          return prev;
        }
        if (existing) {
          return prev.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
        }
        return [...prev, { product, quantity: 1 }];
      });
      setBarcodeQuery("");
    } catch (err) {
      setError("Nie znaleziono produktu: " + code);
    }
  }

  useEffect(() => {
    if (barcodeQuery.length >= 8) {
      const timeout = setTimeout(() => {
        handleBarcodeSubmit(barcodeQuery);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [barcodeQuery]);

  // Load preselected guest if urlGuestId is provided
  useEffect(() => {
    async function loadPreselectedGuest() {
      if (!selectedGymId || !urlGuestId) return;
      try {
        const guestData = await getEmployeeGuestDetail(auth, Number(selectedGymId), Number(urlGuestId));
        setSelectedGuestId(urlGuestId);
        setSelectedGuestName(`${guestData.guest.firstName} ${guestData.guest.lastName}`);
      } catch (err) {
        console.error("Failed to load preselected guest detail", err);
      }
    }
    if (selectedGymId && urlGuestId) {
      loadPreselectedGuest();
    }
  }, [selectedGymId, urlGuestId]);

  useEffect(() => {
    if (selectedGymId) {
      loadProducts();
      setBasket([]);
      if (!urlGuestId) {
        setSelectedGuestId("anonymous");
        setSelectedGuestName("");
      }
      setGuestSearchQuery("");
      setSearchedGuests([]);
    }
  }, [selectedGymId]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (guestSearchQuery.trim()) {
        searchGuests();
      } else {
        setSearchedGuests([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [guestSearchQuery]);

  // Derived categories
  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return ["All", ...Array.from(cats)];
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Add to basket
  const addToBasket = (product: ProductView) => {
    if (product.quantity <= 0) return;
    
    setBasket((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      
      if (currentQty >= product.quantity) {
        setError(`Brak większej ilości produktu '${product.name}' na magazynie.`);
        return prev;
      }

      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  // Remove / decrease from basket
  const decreaseQty = (productId: number) => {
    setBasket((prev) => {
      const existing = prev.find((item) => item.product.id === productId);
      if (!existing) return prev;
      if (existing.quantity === 1) {
        return prev.filter((item) => item.product.id !== productId);
      }
      return prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  const increaseQty = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    addToBasket(product);
  };

  const removeFromBasket = (productId: number) => {
    setBasket((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Grand Total calculation
  const totalAmount = useMemo(() => {
    return basket.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [basket]);

  // Final checkout transaction handler
  const handleCheckout = async () => {
    if (basket.length === 0 || !selectedGymId) return;
    setLoading(true);
    setError("");
    setMessage("");

    const payload = {
      guestId: selectedGuestId === "anonymous" ? null : Number(selectedGuestId),
      paymentMethod,
      items: basket.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
    };

    try {
      await checkoutProducts(auth, Number(selectedGymId), payload);
      setMessage("Sprzedaż zakończona pomyślnie!");
      setBasket([]);
      setSelectedGuestId("anonymous");
      setGuestSearchQuery("");
      setSearchedGuests([]);
      loadProducts();
      refreshOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Finalizacja transakcji nie powiodła się");
    } finally {
      setLoading(false);
    }
  };

  const isCheckoutDisabled = basket.length === 0 || loading || (paymentMethod === "CASH" && (Number(receivedAmount || 0) < totalAmount));

  if (!selectedGymId) return <SelectGymDashboardPrompt />;

  // Present guests for selection dropdown
  const presentGuestsList = overview?.presentGuests || [];

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)]">
      {/* Products list / History area */}
      <div className="flex-1 flex flex-col space-y-4">
        <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`pb-2 px-2 text-sm font-bold border-b-2 transition-colors ${
              activeTab === "catalog"
                ? "border-primary-500 text-primary-600 dark:text-primary-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
          >
            Katalog
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-2 px-2 text-sm font-bold border-b-2 transition-colors ${
              activeTab === "history"
                ? "border-primary-500 text-primary-600 dark:text-primary-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
          >
            Historia sprzedaży
          </button>
        </div>

        {activeTab === "catalog" && (
          <>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 gap-2 flex-col sm:flex-row">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Szukaj produktu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${inputClassName} !pl-10 !py-2.5`}
                  />
                </div>
                <div className="relative w-full sm:max-w-xs">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-slate-400 text-[10px] uppercase font-bold">Kod</div>
                  <input
                    type="text"
                    placeholder="Zeskanuj lub wpisz EAN..."
                    value={barcodeQuery}
                    onChange={(e) => setBarcodeQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleBarcodeSubmit(barcodeQuery);
                      }
                    }}
                    className={`${inputClassName} !pl-10 !py-2.5 font-mono text-sm`}
                  />
                </div>
              </div>
              <button
                onClick={loadProducts}
                disabled={loading}
                className={`${secondaryButtonClassName} !py-2.5`}
                title="Odśwież listę produktów"
              >
                <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Odśwież
              </button>
            </div>

        {/* Categories chips */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? "bg-primary-500 text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-805"
              }`}
            >
              {cat === "All" ? "Wszystkie" : cat}
            </button>
          ))}
        </div>

        {/* Product grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-slate-500 dark:text-slate-400">
            {loading ? "Ładowanie produktów..." : "Brak produktów spełniających kryteria wyszukiwania."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProducts.map((p) => {
              const qtyInBasket = basket.find((item) => item.product.id === p.id)?.quantity || 0;
              const availableQty = p.quantity - qtyInBasket;

              return (
                <div
                  key={p.id}
                  className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                    availableQty <= 0
                      ? "border-slate-200 dark:border-slate-800 opacity-60"
                      : "border-slate-200 dark:border-slate-800 hover:border-primary-500 hover:shadow-md"
                  }`}
                >
                  <div>
                    <span className="inline-block text-[10px] uppercase tracking-wide font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 mb-2">
                      {p.category}
                    </span>
                    {p.barcode && (
                      <span className="inline-block text-[10px] font-mono tracking-wider ml-2 px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-2 border border-primary-100 dark:border-primary-800/50">
                        {p.barcode}
                      </span>
                    )}
                    <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2" title={p.name}>
                      {p.name}
                    </h3>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-lg font-black text-primary-500">
                        {p.price.toFixed(2)} PLN
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-405 mt-0.5">
                        Magazyn:{" "}
                        <span
                          className={`font-semibold ${
                            availableQty <= 0
                              ? "text-rose-500 font-bold"
                              : availableQty < 5
                              ? "text-amber-500"
                              : "text-emerald-500"
                          }`}
                        >
                          {availableQty <= 0 ? "Brak" : `${availableQty} szt.`}
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={availableQty <= 0}
                      onClick={() => addToBasket(p)}
                      className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        availableQty <= 0
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                          : "bg-slate-900 dark:bg-slate-800 hover:bg-primary-500 dark:hover:bg-primary-600 text-white shadow-sm hover:shadow"
                      }`}
                    >
                      Dodaj
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
          </>
        )}

        {activeTab === "history" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white">Ostatnie 50 transakcji</h3>
              <button onClick={loadHistory} disabled={historyLoading} className={secondaryButtonClassName}>
                <RefreshCcw className={`w-4 h-4 ${historyLoading ? "animate-spin" : ""}`} /> Odśwież
              </button>
            </div>
            {salesHistory.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-slate-500 dark:text-slate-400">
                Brak historii sprzedaży
              </div>
            ) : (
              <div className="space-y-3">
                {salesHistory.map(sale => (
                  <div key={sale.id} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 rounded-xl">
                    <div className="flex justify-between items-start cursor-pointer" onClick={() => setExpandedSaleId(expandedSaleId === sale.id ? null : sale.id)}>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{new Date(sale.createdAt).toLocaleString()}</div>
                        <div className="text-sm text-slate-500">{sale.paymentMethod} • Klient: {sale.guestName}</div>
                      </div>
                      <div className="font-black text-primary-600">{sale.totalAmount.toFixed(2)} PLN</div>
                    </div>
                    {expandedSaleId === sale.id && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
                        {sale.items.map(item => (
                          <div key={item.id} className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                            <span>{item.quantity}x {item.productName}</span>
                            <span>{(item.quantity * item.unitPrice).toFixed(2)} PLN</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cart sidebar */}
      <div className="w-full lg:w-96 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col h-fit space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <ShoppingCart className="w-5 h-5 text-slate-900 dark:text-white" />
          <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">Koszyk zakupowy</h2>
        </div>

        {/* Basket items list */}
        {basket.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            Koszyk jest pusty. Kliknij "Dodaj" na karcie produktu.
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {basket.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-955/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="font-semibold text-slate-900 dark:text-white truncate" title={item.product.name}>
                    {item.product.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {(item.product.price * item.quantity).toFixed(2)} PLN
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg overflow-hidden h-7">
                    <button
                      type="button"
                      onClick={() => decreaseQty(item.product.id)}
                      className="px-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                    <span className="px-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => increaseQty(item.product.id)}
                      className="px-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromBasket(item.product.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <hr className="border-slate-100 dark:border-slate-800" />

        {/* Customer assignment */}
        <div className="space-y-3">
          <label className={labelClassName}>Przypisz klienta</label>
          <select
            value={selectedGuestId}
            onChange={(e) => {
              setSelectedGuestId(e.target.value);
              if (e.target.value !== "search") {
                setGuestSearchQuery("");
                setSearchedGuests([]);
                // Update name if present in presentGuestsList
                const found = presentGuestsList.find((g: any) => String(g.guestId) === e.target.value);
                if (found) {
                  setSelectedGuestName(`${found.firstName} ${found.lastName}`);
                }
              }
            }}
            className="w-full bg-slate-50 dark:bg-slate-950/40 border-2 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-primary-500 font-medium"
          >
            <option value="anonymous">Gość jednorazowy (Anonimowy)</option>
            {presentGuestsList.length > 0 && (
              <optgroup label="Obecni na siłowni">
                {presentGuestsList.map((g: any) => (
                  <option key={g.guestId} value={g.guestId}>
                    {g.firstName} {g.lastName}
                  </option>
                ))}
              </optgroup>
            )}
            {selectedGuestId !== "anonymous" && selectedGuestId !== "search" && !presentGuestsList.some((g: any) => String(g.guestId) === selectedGuestId) && (
              <option value={selectedGuestId}>
                {selectedGuestName || `Klient ID: ${selectedGuestId}`} (Wybrany)
              </option>
            )}
            <option value="search">-- Wyszukaj innego klienta --</option>
          </select>

          {selectedGuestId === "search" && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Wpisz imię/nazwisko..."
                  value={guestSearchQuery}
                  onChange={(e) => setGuestSearchQuery(e.target.value)}
                  className={`${inputClassName} !pl-9 !py-2 !text-xs`}
                />
              </div>
              
              {searchingGuests && (
                <p className="text-[10px] text-slate-400">Szukanie...</p>
              )}
              
              {searchedGuests.length > 0 && (
                <div className="max-h-32 overflow-y-auto border border-slate-105 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/30 p-1 space-y-1 text-xs">
                  {searchedGuests.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        setSelectedGuestId(String(g.id));
                        setSelectedGuestName(`${g.firstName} ${g.lastName}`);
                        setGuestSearchQuery("");
                        setSearchedGuests([]);
                      }}
                      className="w-full text-left px-2 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-800 dark:text-slate-200 font-medium"
                    >
                      {g.firstName} {g.lastName} ({g.email || "brak e-mail"})
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* If another guest is manually selected (whose id is numeric and is not anonymous or search selection option) */}
          {selectedGuestId !== "anonymous" && selectedGuestId !== "search" && (
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 text-xs px-3 py-2 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              <User className="w-3.5 h-3.5 shrink-0" />
              <span>
                Klient powiązany:{" "}
                <span className="font-bold">
                  {presentGuestsList.find((g: any) => String(g.guestId) === selectedGuestId)
                    ? (() => {
                        const g = presentGuestsList.find((g: any) => String(g.guestId) === selectedGuestId);
                        return `${g.firstName} ${g.lastName}`;
                      })()
                    : selectedGuestName || `Klient o ID: ${selectedGuestId}`}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Payment method */}
        <div className="space-y-2.5">
          <label className={labelClassName}>Metoda płatności</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod("CASH")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-bold transition-all text-sm cursor-pointer ${
                paymentMethod === "CASH"
                  ? "bg-slate-900 border-slate-900 dark:bg-slate-800 dark:border-slate-800 text-white"
                  : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-805 text-slate-700 dark:text-slate-350 bg-transparent"
              }`}
            >
              <Coins className="w-4 h-4" />
              Gotówka
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("CARD")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-bold transition-all text-sm cursor-pointer ${
                paymentMethod === "CARD"
                  ? "bg-slate-900 border-slate-900 dark:bg-slate-800 dark:border-slate-800 text-white"
                  : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-805 text-slate-700 dark:text-slate-350 bg-transparent"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Karta
            </button>
          </div>
        </div>

        <hr className="border-slate-100 dark:border-slate-800" />

        {/* Checkout amount and button */}
        <div className="space-y-4">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-slate-500 dark:text-slate-400">Do zapłaty</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {totalAmount.toFixed(2)} PLN
            </span>
          </div>

          {paymentMethod === "CASH" && (
            <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Kwota otrzymana (PLN)</label>
              <input 
                type="number" 
                step="0.01" 
                value={receivedAmount} 
                onChange={(e) => setReceivedAmount(e.target.value)} 
                className={inputClassName} 
                placeholder="0.00" 
              />
              {receivedAmount && Number(receivedAmount) > 0 && (
                <div className={`text-sm font-bold ${Number(receivedAmount) >= totalAmount ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {Number(receivedAmount) >= totalAmount 
                    ? `Reszta: ${(Number(receivedAmount) - totalAmount).toFixed(2)} PLN`
                    : `Za mało o: ${(totalAmount - Number(receivedAmount)).toFixed(2)} PLN`}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleCheckout}
            disabled={isCheckoutDisabled}
            className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-bold transition-all shadow-md hover:shadow-lg hover:shadow-primary-500/35 disabled:opacity-40 disabled:shadow-none flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? "Przetwarzanie..." : "Sfinalizuj transakcję"}
          </button>
        </div>
      </div>
    </div>
  );
}
