"use client"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import {
    Package, Plus, X, Search,
    Trash2, Save, Loader2, Edit3,
    Clock, Image as ImageIcon, AlertCircle,
    TrendingDown, Boxes, ArrowUpRight,
    Tag, UploadCloud, ChevronDown,
    ShieldAlert, Lock, RotateCcw,
    RefreshCw, Truck, Hash, FileText,
    BarChart3, ShieldCheck,
    Eye, EyeOff                          // ← added
} from "lucide-react"
import { Toaster, toast } from "sonner"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Product {
    id: string
    name: string
    category: string
    cost_price: number
    selling_price?: number
    quantity?: number
    supplier_name?: string
    image?: string
    description?: string
    isVisible?: boolean               // ← added
    updatedAt?: any
}

interface Supplier {
    id: string
    company_name: string
}

interface Category {
    id: string
    category_name: string
}

interface DeliveryItem {
    productId: string
    productName: string
    quantity: number
    sellingPrice: number
    costPerUnit: number
}

interface RestockItem {
    productId: string
    productName: string
    quantity: number
    costPerUnit: number
    sellingPrice: number
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const MAX_QUANTITY = 9999
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"]
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png"]
const DEFAULT_IMAGE = "/images/logo/ajp.jpg"          // ← changed

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function generateDeliveryNumber(): string {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, "0")
    const d = String(now.getDate()).padStart(2, "0")
    const rand = Math.floor(1000 + Math.random() * 9000)
    return `DEL-${y}${m}${d}-${rand}`
}

function validateImage(file: File): string | null {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return "Only JPG, JPEG, PNG allowed."
    const ext = "." + file.name.split(".").pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) return `Invalid extension. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`
    return null
}

async function logAudit({ action, details, module = "Inventory" }: { action: string; details: string; module?: string }) {
    try {
        const stored = localStorage.getItem("users")
        const parsed = stored ? JSON.parse(stored) : null
        await addDoc(collection(db, "audit_logs"), {
            adminName: parsed?.name ?? "Unknown Admin",
            adminEmail: parsed?.email ?? "—",
            action, details, module,
            timestamp: serverTimestamp(),
        })
    } catch (err) { console.warn("Audit log failed:", err) }
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
type TabType = "inventory" | "products"

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function InventoryProductsPage() {
    const [activeTab, setActiveTab] = useState<TabType>("inventory")
    const [products, setProducts] = useState<Product[]>([])
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [saving, setSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    // ── MODALS ──
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
    const [isRestockModalOpen, setIsRestockModalOpen] = useState(false)
    const [isEditStockModalOpen, setIsEditStockModalOpen] = useState(false)
    const [isAddProductOpen, setIsAddProductOpen] = useState(false)
    const [isEditProductOpen, setIsEditProductOpen] = useState(false)

    // ── ASSIGN form ──
    const [selectedSupplier, setSelectedSupplier] = useState("")
    const [deliveryDate, setDeliveryDate] = useState("")
    const [selectedItems, setSelectedItems] = useState<DeliveryItem[]>([])
    const [itemQtyErrors, setItemQtyErrors] = useState<Record<number, string>>({})
    const [deliveryNumber, setDeliveryNumber] = useState("")

    // ── RESTOCK form ──
    const [restockSupplier, setRestockSupplier] = useState("")
    const [restockDate, setRestockDate] = useState("")
    const [restockItems, setRestockItems] = useState<RestockItem[]>([])
    const [restockProduct, setRestockProduct] = useState("")
    const [assignSearch, setAssignSearch] = useState("")
    const [assignDropdownOpen, setAssignDropdownOpen] = useState(false)
    const [restockSearch, setRestockSearch] = useState("")
    const [restockDropdownOpen, setRestockDropdownOpen] = useState(false)
    const [restockQtyErrors, setRestockQtyErrors] = useState<Record<number, string>>({})
    const [restockDeliveryNumber, setRestockDeliveryNumber] = useState("")

    // ── EDIT STOCK ──
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [qtyError, setQtyError] = useState<string | null>(null)
    const [priceError, setPriceError] = useState<string | null>(null)
    const [editDeliveryNumber, setEditDeliveryNumber] = useState("")

    // ── PRODUCT form ──
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null)
    const [imageError, setImageError] = useState<string | null>(null)
    const [costPriceError, setCostPriceError] = useState<string | null>(null)
    const [selectedCategory, setSelectedCategory] = useState("All")
    const [productFormData, setProductFormData] = useState({
        name: "", category: "", cost_price: "", image: "", description: ""
    })

    // ── DATES ──
    const today = new Date().toISOString().split("T")[0]
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    const minDate = oneMonthAgo.toISOString().split("T")[0]

    // ─── FETCH ────────────────────────────────────────────────────────────────
    const fetchData = async () => {
        try {
            setLoading(true)
            const [resProd, resSupp, resCat] = await Promise.all([
                fetch("/api/products"),
                fetch("/api/suppliers"),
                fetch("/api/categories"),
            ])
            const [dataProd, dataSupp, dataCat] = await Promise.all([
                resProd.json(), resSupp.json(), resCat.json()
            ])
            if (Array.isArray(dataProd)) setProducts(dataProd)
            if (Array.isArray(dataSupp)) setSuppliers(dataSupp)
            if (Array.isArray(dataCat)) setCategories(dataCat)
        } catch {
            toast.error("Error loading data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = () => { setAssignDropdownOpen(false); setRestockDropdownOpen(false) }
        document.addEventListener("click", handler)
        return () => document.removeEventListener("click", handler)
    }, [])

    // ─── TOGGLE VISIBILITY ────────────────────────────────────────────────────
    const handleToggleVisibility = async (prod: Product) => {
        const newVisibility = !prod.isVisible

        // Optimistic update
        setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, isVisible: newVisibility } : p))
        if (editingProduct?.id === prod.id) setEditingProduct(prev => prev ? { ...prev, isVisible: newVisibility } : prev)

        const doToggle = async () => {
            const res = await fetch("/api/products", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: prod.id, isVisible: newVisibility }),
            })
            if (!res.ok) throw new Error("Failed to update visibility.")
            await logAudit({
                action: newVisibility ? "SHOWED PRODUCT" : "HID PRODUCT",
                details: `${newVisibility ? "Shown" : "Hidden"} product "${prod.name}" (ID: ${prod.id}) — Category: ${prod.category}`,
                module: "Products",
            })
        }

        try {
            await toast.promise(doToggle(), {
                loading: `${newVisibility ? "Publishing" : "Hiding"} ${prod.name}...`,
                success: `${prod.name} is now ${newVisibility ? "visible" : "hidden"} in the shop.`,
                error: (err: Error) => { fetchData(); return err.message },
            })
        } catch { fetchData() }
    }

    // ─── IMAGE UPLOAD ─────────────────────────────────────────────────────────
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, mode: "add" | "edit") => {
        const file = e.target.files?.[0]
        if (!file) return
        const imgErr = validateImage(file)
        if (imgErr) { setImageError(imgErr); toast.error(imgErr); e.target.value = ""; return }
        setImageError(null)
        setIsUploading(true)
        const cloudName = "diwrwmjgw"
        const uploadPreset = "adrenalinejunkypiercinks"
        const uploadData = new FormData()
        uploadData.append("file", file)
        uploadData.append("upload_preset", uploadPreset)
        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: uploadData })
            const data = await res.json()
            if (mode === "add") setProductFormData(prev => ({ ...prev, image: data.secure_url }))
            else if (currentProduct) setCurrentProduct({ ...currentProduct, image: data.secure_url })
            toast.success("Image uploaded.")
        } catch { toast.error("Cloud upload failed.") }
        finally { setIsUploading(false) }
    }

    // ─── ASSIGN DELIVERY ──────────────────────────────────────────────────────
    const addItemToDelivery = (productId: string) => {
        const prod = products.find(p => p.id === productId)
        if (!prod) return
        if (selectedItems.find(i => i.productId === productId)) { toast.warning("Already in list"); return }
        setSelectedItems([...selectedItems, { productId: prod.id, productName: prod.name, quantity: 1, sellingPrice: prod.selling_price || 0, costPerUnit: prod.cost_price || 0 }])
    }

    const updateDeliveryItem = (index: number, field: keyof DeliveryItem, value: any) => {
        const newList = [...selectedItems]
        newList[index] = { ...newList[index], [field]: value }
        setSelectedItems(newList)
        if (field === "quantity") {
            const newErrors = { ...itemQtyErrors }
            if (Number(value) > MAX_QUANTITY) newErrors[index] = `Max ${MAX_QUANTITY} units.`
            else if (Number(value) < 1) newErrors[index] = "Minimum 1 unit."
            else delete newErrors[index]
            setItemQtyErrors(newErrors)
        }
    }

    const handleAssignSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedSupplier || !deliveryDate || selectedItems.length === 0) return toast.error("Fill up all fields.")
        if (Object.keys(itemQtyErrors).length > 0) return toast.error("Fix quantity errors first.")
        const hasPriceError = selectedItems.some(i => i.sellingPrice > 0 && i.costPerUnit > 0 && i.sellingPrice < i.costPerUnit)
        if (hasPriceError) return toast.error("Selling price must be ≥ cost price for all items.")
        setSaving(true)
        try {
            const res = await fetch("/api/inventory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ supplier: selectedSupplier, date: deliveryDate, items: selectedItems })
            })
            if (res.ok) {
                await addDoc(collection(db, "delivery_reports"), {
                    delivery_number: deliveryNumber,
                    supplier: selectedSupplier,
                    date: deliveryDate,
                    items: selectedItems,
                    action: "SUPPLIER_DELIVERY",
                    createdAt: serverTimestamp(),
                })
                await logAudit({
                    action: "ASSIGNED INVENTORY",
                    details: `[${deliveryNumber}] Delivery from ${selectedSupplier} on ${deliveryDate} — Items: ${selectedItems.map(i => `${i.productName} x${i.quantity}`).join(", ")}`,
                })
                toast.success("Inventory assigned!")
                setIsAssignModalOpen(false)
                setSelectedItems([])
                setSelectedSupplier("")
                setDeliveryDate("")
                setDeliveryNumber("")
                setItemQtyErrors({})
                fetchData()
            } else toast.error("Failed to save assignment.")
        } catch { toast.error("Failed to save assignment.") }
        finally { setSaving(false) }
    }

    // ─── RESTOCK ──────────────────────────────────────────────────────────────
    const addRestockItem = (productId: string) => {
        const prod = products.find(p => p.id === productId)
        if (!prod) return
        if (restockItems.find(i => i.productId === productId)) { toast.warning("Already in list"); return }
        setRestockItems([...restockItems, { productId: prod.id, productName: prod.name, quantity: 1, costPerUnit: prod.cost_price || 0, sellingPrice: prod.selling_price || 0 }])
        setRestockProduct("")
    }

    const updateRestockItem = (index: number, field: keyof RestockItem, value: any) => {
        const newList = [...restockItems]
        newList[index] = { ...newList[index], [field]: value }
        setRestockItems(newList)
        if (field === "quantity") {
            const newErrors = { ...restockQtyErrors }
            if (Number(value) > MAX_QUANTITY) newErrors[index] = `Max ${MAX_QUANTITY} units.`
            else if (Number(value) < 1) newErrors[index] = "Minimum 1 unit."
            else delete newErrors[index]
            setRestockQtyErrors(newErrors)
        }
    }

    const handleRestockSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!restockSupplier || !restockDate || restockItems.length === 0) return toast.error("Fill up all fields.")
        if (Object.keys(restockQtyErrors).length > 0) return toast.error("Fix quantity errors first.")
        const hasRestockPriceError = restockItems.some(i => i.sellingPrice > 0 && i.costPerUnit > 0 && i.sellingPrice < i.costPerUnit)
        if (hasRestockPriceError) return toast.error("Selling price must be ≥ cost price for all items.")
        setSaving(true)
        try {
            const updates = restockItems.map(item =>
                fetch("/api/inventory", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: item.productId,
                        quantity: (products.find(p => p.id === item.productId)?.quantity || 0) + item.quantity,
                        sellingPrice: item.sellingPrice || products.find(p => p.id === item.productId)?.selling_price || 0
                    })
                })
            )
            await Promise.all(updates)
            await addDoc(collection(db, "delivery_reports"), {
                delivery_number: restockDeliveryNumber,
                supplier: restockSupplier,
                date: restockDate,
                items: restockItems.map(i => ({ productId: i.productId, productName: i.productName, quantity: i.quantity, costPerUnit: i.costPerUnit, sellingPrice: i.sellingPrice })),
                action: "RESTOCK_DELIVERY",
                createdAt: serverTimestamp(),
            })
            await logAudit({
                action: "RESTOCK",
                details: `[${restockDeliveryNumber}] Restock from ${restockSupplier} on ${restockDate} — ${restockItems.map(i => `${i.productName} x${i.quantity} @₱${i.costPerUnit}`).join(", ")}`,
            })
            toast.success("Restock recorded!")
            setIsRestockModalOpen(false)
            setRestockItems([])
            setRestockSupplier("")
            setRestockDate("")
            setRestockDeliveryNumber("")
            setRestockQtyErrors({})
            fetchData()
        } catch { toast.error("Restock failed.") }
        finally { setSaving(false) }
    }

    // ─── QUICK EDIT STOCK ─────────────────────────────────────────────────────
    const handleQuickUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingProduct) return
        if ((editingProduct.quantity ?? 0) > MAX_QUANTITY) { setQtyError(`Max ${MAX_QUANTITY}.`); return }
        if ((editingProduct.quantity ?? 0) < 0) { setQtyError("Cannot be negative."); return }
        if ((editingProduct.selling_price ?? 0) < (editingProduct.cost_price ?? 0)) { setPriceError("Selling price must be ≥ cost price."); return }

        const prevProduct = products.find(p => p.id === editingProduct.id)
        const prevQty = prevProduct?.quantity ?? 0
        const newQty = editingProduct.quantity ?? 0
        const qtyChanged = prevQty !== newQty

        setSaving(true)
        const doUpdate = async () => {
            const productRes = await fetch("/api/products", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: editingProduct.id, name: editingProduct.name, category: editingProduct.category, cost_price: editingProduct.cost_price, image: editingProduct.image }),
            })
            if (!productRes.ok) throw new Error("Product update failed")
            const inventoryRes = await fetch("/api/inventory", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: editingProduct.id, quantity: editingProduct.quantity, sellingPrice: editingProduct.selling_price })
            })
            if (!inventoryRes.ok) throw new Error("Inventory update failed")
            if (qtyChanged) {
                await addDoc(collection(db, "delivery_reports"), {
                    delivery_number: editDeliveryNumber || generateDeliveryNumber(),
                    item_name: editingProduct.name,
                    action: "MANUAL_STOCK_UPDATE",
                    details: { quantity: newQty, price: editingProduct.selling_price ?? 0, category: editingProduct.category ?? "General", previousQuantity: prevQty },
                    createdAt: serverTimestamp(),
                })
            }
            await logAudit({
                action: "UPDATED PRODUCT",
                details: `[${editDeliveryNumber || "MANUAL"}] Updated "${editingProduct.name}" — Qty: ${prevQty}→${newQty}, Price: ₱${editingProduct.selling_price?.toLocaleString()}`,
            })
            setIsEditStockModalOpen(false)
            setQtyError(null)
            setPriceError(null)
            setEditDeliveryNumber("")
            fetchData()
        }
        try {
            await toast.promise(doUpdate(), { loading: "Syncing updates...", success: "Inventory updated!", error: (err: Error) => `Sync failed: ${err.message}` })
        } finally { setSaving(false) }
    }

    // ─── PRODUCT ADD/EDIT ─────────────────────────────────────────────────────
    const handleProductAction = async (e: React.FormEvent, type: "POST" | "PUT") => {
        e.preventDefault()
        if (type === "PUT" && currentProduct) {
            if (currentProduct.cost_price > (currentProduct.selling_price ?? Infinity)) {
                const err = `Cost price cannot exceed selling price.`
                setCostPriceError(err); toast.error(err); return
            }
        }
        const payload = type === "POST" ? productFormData : currentProduct
        setSaving(true)
        const doAction = async () => {
            const res = await fetch("/api/products", {
                method: type,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error || "Action failed")
            await logAudit({
                action: type === "POST" ? "ADDED PRODUCT" : "EDITED PRODUCT",
                details: type === "POST"
                    ? `Added "${(payload as any).name}" — Category: ${(payload as any).category}, Cost: ₱${Number((payload as any).cost_price).toLocaleString()}`
                    : `Edited "${(payload as any).name}" (ID: ${(payload as any).id})`,
                module: "Products"
            })
            setIsAddProductOpen(false)
            setIsEditProductOpen(false)
            setProductFormData({ name: "", category: "", cost_price: "", image: "", description: "" })
            setCostPriceError(null); setImageError(null)
            fetchData()
            return result
        }
        try {
            await toast.promise(doAction(), { loading: "Saving...", success: "Product saved!", error: (err: Error) => err.message })
        } finally { setSaving(false) }
    }

    const handleDelete = async (prod: Product) => {
        const hasInventoryData = (prod.quantity !== undefined && prod.quantity > 0) || (prod.selling_price !== undefined && prod.selling_price > 0)
        if (hasInventoryData) { toast.error(`Cannot delete "${prod.name}" — has inventory records.`, { description: "Remove from inventory first." }); return }
        if (!confirm(`Delete ${prod.name.toUpperCase()}?`)) return
        const doDelete = async () => {
            const res = await fetch("/api/products", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: prod.id }) })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed.")
            await logAudit({ action: "DELETED PRODUCT", details: `Deleted "${prod.name}"`, module: "Products" })
            fetchData()
            return data
        }
        toast.promise(doDelete(), { loading: `Deleting...`, success: `${prod.name} deleted.`, error: (err: Error) => err.message })
    }

    // ─── FILTERED DATA ────────────────────────────────────────────────────────
    const filteredInventory = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    const filteredProducts = products.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchCat = selectedCategory === "All" || p.category === selectedCategory
        return matchSearch && matchCat
    })
    const freshProducts = products.filter(p => !p.quantity || p.quantity === 0)

    // Stats
    const totalProducts  = products.length
    const lowStock       = products.filter(p => (p.quantity ?? 0) <= 5 && (p.quantity ?? 0) > 0).length
    const outOfStock     = products.filter(p => !p.quantity || p.quantity === 0).length
    const withInventory  = products.filter(p => (p.quantity ?? 0) > 0).length
    const visibleCount   = products.filter(p => p.isVisible).length
    const hiddenCount    = products.filter(p => !p.isVisible).length

    const profit = ((editingProduct?.selling_price ?? 0) - (editingProduct?.cost_price ?? 0))
    const isPriceValid = (editingProduct?.selling_price ?? 0) >= (editingProduct?.cost_price ?? 0)
    const currentImg = isAddProductOpen ? productFormData.image : currentProduct?.image

    // ─── RENDER ───────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-background p-4 md:p-8 text-foreground">
            <Toaster position="top-right" richColors />

            <div className="max-w-7xl mx-auto space-y-8">

                {/* ── HEADER ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground mb-2 flex items-center gap-2">
                            <span className="h-px w-5 bg-current inline-block" />
                            {activeTab === "inventory" ? "Stock Control" : "Product Registry"}
                        </p>
                        <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
                            {activeTab === "inventory" ? <>Inventory<br /><span className="text-muted-foreground/30">Control</span></> : <>Products &<br /><span className="text-muted-foreground/30">Materials</span></>}
                        </h1>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto flex-wrap">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text" placeholder="Search product..."
                                className="w-full pl-11 pr-4 h-12 bg-card border border-border rounded-xl text-sm font-bold outline-none focus:border-foreground transition-all"
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {activeTab === "inventory" ? (
                            <>
                                <button
                                    onClick={() => { setRestockDeliveryNumber(generateDeliveryNumber()); setIsRestockModalOpen(true) }}
                                    className="h-12 px-5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                                >
                                    <RefreshCw className="w-4 h-4" /> Restock
                                </button>
                                <button
                                    onClick={() => { setDeliveryNumber(generateDeliveryNumber()); setIsAssignModalOpen(true) }}
                                    className="h-12 px-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                                >
                                    <Plus className="w-4 h-4" /> Assign New
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={fetchData} disabled={loading} className="h-12 w-12 flex items-center justify-center bg-card border border-border rounded-xl hover:bg-muted transition-all disabled:opacity-40">
                                    <RotateCcw size={16} className={cn(loading && "animate-spin")} />
                                </button>
                                <button
                                    onClick={() => { setIsAddProductOpen(true); setImageError(null); setCostPriceError(null) }}
                                    className="h-12 px-6 bg-foreground text-background rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:opacity-90 transition-all"
                                >
                                    <Plus size={16} /> Add New Item
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* ── TABS ── */}
                <div className="flex gap-1 bg-muted p-1 rounded-2xl w-fit">
                    {(["inventory", "products"] as TabType[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "h-10 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all",
                                activeTab === tab ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {tab === "inventory" ? "Inventory" : "Products"}
                        </button>
                    ))}
                </div>

                {/* ── STATS ── */}
                {activeTab === "inventory" ? (
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: "Total Products", value: totalProducts, icon: Boxes,       color: "text-foreground",  bg: "bg-muted" },
                            { label: "Low Stock",      value: lowStock,      icon: TrendingDown, color: "text-amber-500",  bg: "bg-amber-500/10" },
                            { label: "Out of Stock",   value: outOfStock,    icon: AlertCircle,  color: "text-red-500",    bg: "bg-red-500/10" },
                        ].map(stat => (
                            <div key={stat.label} className="bg-card border border-border rounded-[1.5rem] p-5 flex items-center gap-4">
                                <div className={cn("p-2.5 rounded-xl", stat.bg, stat.color)}><stat.icon className="size-4" /></div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                                    <p className="text-2xl font-black">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Products tab stats — now shows Visible/Hidden counts too
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Total Products", value: totalProducts, icon: Boxes,      color: "text-foreground",   bg: "bg-muted" },
                            { label: "In Inventory",   value: withInventory, icon: Package,    color: "text-emerald-500",  bg: "bg-emerald-500/10" },
                            { label: "Visible",        value: visibleCount,  icon: Eye,        color: "text-emerald-500",  bg: "bg-emerald-500/10" },
                            { label: "Hidden",         value: hiddenCount,   icon: EyeOff,     color: "text-amber-500",    bg: "bg-amber-500/10" },
                        ].map(stat => (
                            <div key={stat.label} className="bg-card border border-border rounded-[1.5rem] p-5 flex items-center gap-4">
                                <div className={cn("p-2.5 rounded-xl", stat.bg, stat.color)}><stat.icon className="size-4" /></div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                                    <p className="text-2xl font-black">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── PRODUCTS CATEGORY FILTER ── */}
                {activeTab === "products" && (
                    <div className="flex gap-3 flex-wrap">
                        {["All", ...categories.map(c => c.category_name)].map(cat => (
                            <button key={cat} onClick={() => setSelectedCategory(cat)}
                                className={cn("h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                    selectedCategory === cat ? "bg-foreground text-background border-transparent" : "bg-card border-border hover:bg-muted text-muted-foreground"
                                )}>{cat}</button>
                        ))}
                    </div>
                )}

                {/* ── INVENTORY TABLE ── */}
                {activeTab === "inventory" && (
                    <div className="bg-card rounded-[2rem] border border-border overflow-hidden shadow-sm">
                        <div className="px-8 py-5 border-b border-border">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{filteredInventory.length} Products</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[700px]">
                                <thead>
                                    <tr className="text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/50">
                                        <th className="px-8 py-4">Product & Supplier</th>
                                        <th className="px-8 py-4 text-center">Stock Level</th>
                                        <th className="px-8 py-4">Selling Price</th>
                                        <th className="px-8 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {loading ? (
                                        <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-muted-foreground" /></td></tr>
                                    ) : filteredInventory.map((prod) => {
                                        const qty = prod.quantity ?? 0
                                        const stockStatus =
                                            qty === 0 ? { label: "Out of Stock", cls: "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse" } :
                                            qty <= 5  ? { label: `${qty} — Critical`, cls: "bg-red-500/10 text-red-500 border-red-500/20" } :
                                            qty <= 20 ? { label: `${qty} — Low`, cls: "bg-amber-500/10 text-amber-500 border-amber-500/20" } :
                                                        { label: `${qty} — OK`, cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" }
                                        return (
                                            <tr key={prod.id} className="group hover:bg-muted/30 transition-all">
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-11 h-11 rounded-xl bg-muted border border-border overflow-hidden flex-shrink-0">
                                                            <img src={prod.image || DEFAULT_IMAGE} className="w-full h-full object-cover" alt={prod.name} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-black uppercase italic tracking-tight text-sm leading-none mb-1 truncate">{prod.name}</p>
                                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest truncate">{prod.supplier_name || "Unassigned"}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4 text-center">
                                                    <span className={cn("inline-flex items-center px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest", stockStatus.cls)}>{stockStatus.label}</span>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <p className="font-black italic text-sm">₱{Number(prod.selling_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                </td>
                                                <td className="px-8 py-4 text-right">
                                                    <button
                                                        disabled={!prod.supplier_name}
                                                        onClick={() => { setEditingProduct(prod); setQtyError(null); setPriceError(null); setEditDeliveryNumber(generateDeliveryNumber()); setIsEditStockModalOpen(true) }}
                                                        title={!prod.supplier_name ? "Assign a supplier first" : "Edit product"}
                                                        className={cn("h-9 w-9 rounded-xl flex items-center justify-center transition-all",
                                                            prod.supplier_name ? "bg-muted hover:bg-foreground hover:text-background text-muted-foreground cursor-pointer" : "bg-muted text-muted-foreground/30 cursor-not-allowed"
                                                        )}
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── PRODUCTS TABLE ── */}
                {activeTab === "products" && (
                    <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
                        <div className="px-8 py-5 border-b border-border flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{filteredProducts.length} Products</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[860px]">
                                <thead>
                                    <tr className="text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/50">
                                        <th className="px-8 py-4">Product Title</th>
                                        <th className="px-8 py-4">Category</th>
                                        <th className="px-8 py-4 w-56">Description</th>
                                        <th className="px-8 py-4">Cost Price</th>
                                        <th className="px-8 py-4">Inventory</th>
                                        <th className="px-8 py-4 text-center">Visibility</th>
                                        <th className="px-8 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {loading ? (
                                        <tr><td colSpan={7} className="py-20 text-center"><Loader2 className="animate-spin mx-auto w-8 h-8 text-muted-foreground/30" /></td></tr>
                                    ) : filteredProducts.length === 0 ? (
                                        <tr><td colSpan={7} className="py-20 text-center">
                                            <Package className="mx-auto size-10 text-muted-foreground/20 mb-3" />
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">No products found</p>
                                        </td></tr>
                                    ) : filteredProducts.map((prod, index) => {
                                        const hasInventory = (prod.quantity ?? 0) > 0 || (prod.selling_price ?? 0) > 0
                                        return (
                                            <tr key={prod.id || `prod-${index}`} className={cn(
                                                "group hover:bg-muted/30 transition-all",
                                                !prod.isVisible && "opacity-50"
                                            )}>
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-11 h-11 rounded-xl bg-muted border border-border overflow-hidden flex-shrink-0">
                                                            <img src={prod.image || DEFAULT_IMAGE} className="w-full h-full object-cover" alt={prod.name} />
                                                        </div>
                                                        <p className="font-black uppercase italic tracking-tight text-sm">{prod.name}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-muted border border-border rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                        <Tag size={9} /> {prod.category}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{prod.description || "No description available."}</p>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <p className="font-black italic text-sm">₱{Number(prod.cost_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                </td>
                                                <td className="px-8 py-4">
                                                    {hasInventory
                                                        ? <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Active</span>
                                                        : <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted text-muted-foreground border border-border rounded-lg text-[9px] font-black uppercase tracking-widest"><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />Unassigned</span>
                                                    }
                                                </td>

                                                {/* ── VISIBILITY CELL ── */}
                                                <td className="px-8 py-4 text-center">
                                                    {prod.isVisible ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Visible
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted text-muted-foreground border border-border rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" /> Hidden
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-8 py-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">

                                                        {/* ── HIDE / SHOW TOGGLE ── */}
                                                        <button
                                                            onClick={() => handleToggleVisibility(prod)}
                                                            title={prod.isVisible ? "Hide from shop" : "Show in shop"}
                                                            className={cn(
                                                                "h-9 w-9 rounded-xl border flex items-center justify-center transition-all",
                                                                prod.isVisible
                                                                    ? "bg-muted border-border text-muted-foreground hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/20"
                                                                    : "bg-muted border-border text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/20"
                                                            )}
                                                        >
                                                            {prod.isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                                                        </button>

                                                        <button onClick={() => { setCurrentProduct(prod); setCostPriceError(null); setImageError(null); setIsEditProductOpen(true) }}
                                                            className="h-9 w-9 rounded-xl bg-muted border border-border flex items-center justify-center hover:bg-foreground hover:text-background transition-all">
                                                            <Edit3 size={15} />
                                                        </button>
                                                        <button onClick={() => handleDelete(prod)}
                                                            className={cn("h-9 w-9 rounded-xl flex items-center justify-center transition-all border",
                                                                hasInventory ? "bg-muted border-border text-muted-foreground/30 cursor-not-allowed" : "bg-muted border-border text-muted-foreground hover:bg-destructive hover:text-white hover:border-transparent"
                                                            )}
                                                            title={hasInventory ? "Cannot delete — has inventory records" : "Delete product"}>
                                                            {hasInventory ? <Lock size={13} /> : <Trash2 size={15} />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* ════════════════════════════════════════════════════════════════
                MODAL 1: ASSIGN NEW INVENTORY
            ════════════════════════════════════════════════════════════════ */}
            {isAssignModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-4xl rounded-[3rem] shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-10 max-h-[90vh] overflow-y-auto space-y-8">
                            <div className="flex justify-between items-center pb-6 border-b border-border">
                                <div>
                                    <h2 className="text-2xl font-black uppercase italic tracking-tighter">New Delivery Assignment</h2>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Assign supplier & incoming stock</p>
                                </div>
                                <button onClick={() => { setIsAssignModalOpen(false); setItemQtyErrors({}); setAssignSearch(""); setAssignDropdownOpen(false) }} className="p-2.5 hover:bg-muted rounded-full transition-all"><X className="size-5" /></button>
                            </div>

                            <div className="flex items-center gap-3 bg-foreground/5 border border-border rounded-2xl px-5 py-3">
                                <Hash className="size-4 text-muted-foreground" />
                                <div className="flex-1">
                                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Delivery Number</p>
                                    <p className="font-black text-sm font-mono">{deliveryNumber}</p>
                                </div>
                                <button type="button" onClick={() => setDeliveryNumber(generateDeliveryNumber())} className="text-[9px] font-black uppercase text-muted-foreground hover:text-foreground transition-all tracking-widest">Regenerate</button>
                            </div>

                            <form onSubmit={handleAssignSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Select Supplier</label>
                                        <select required value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)}
                                            className="w-full h-14 px-4 bg-muted rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-foreground transition-all">
                                            <option value="">Choose supplier...</option>
                                            {suppliers.map(s => <option key={s.id} value={s.company_name}>{s.company_name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Delivery Date</label>
                                        <input required type="date" min={minDate} max={today} value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}
                                            className="w-full h-14 px-4 bg-muted rounded-xl font-bold outline-none border-2 border-transparent focus:border-foreground transition-all" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Add Product</label>
                                    <div className="relative">
                                        <div className="flex items-center gap-2 h-14 px-4 bg-foreground text-background rounded-xl cursor-pointer"
                                            onClick={() => setAssignDropdownOpen(v => !v)}>
                                            <Search size={14} className="text-background/50 flex-shrink-0" />
                                            <input type="text" placeholder="Search by name, category, description..."
                                                className="flex-1 bg-transparent outline-none font-bold text-sm text-background placeholder:text-background/40"
                                                value={assignSearch}
                                                onChange={(e) => { setAssignSearch(e.target.value); setAssignDropdownOpen(true) }}
                                                onClick={(e) => { e.stopPropagation(); setAssignDropdownOpen(true) }} />
                                            <ChevronDown size={14} className={cn("text-background/50 transition-transform flex-shrink-0", assignDropdownOpen && "rotate-180")} />
                                        </div>
                                        {assignDropdownOpen && (
                                            <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
                                                {freshProducts
                                                    .filter(p => { const q = assignSearch.toLowerCase(); return !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q) })
                                                    .map(p => (
                                                        <button key={p.id} type="button"
                                                            onClick={() => { addItemToDelivery(p.id); setAssignSearch(""); setAssignDropdownOpen(false) }}
                                                            className="w-full px-4 py-3 text-left hover:bg-muted transition-all border-b border-border/50 last:border-0">
                                                            <p className="font-black uppercase italic text-xs">{p.name}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-1.5 py-0.5 bg-muted rounded">{p.category}</span>
                                                                {p.description && <span className="text-[9px] text-muted-foreground truncate max-w-[200px]">{p.description}</span>}
                                                            </div>
                                                        </button>
                                                    ))
                                                }
                                                {freshProducts.filter(p => { const q = assignSearch.toLowerCase(); return !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q) }).length === 0 && (
                                                    <p className="text-center py-6 text-[10px] font-black uppercase text-muted-foreground">No products found</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-muted rounded-2xl p-4 max-h-64 overflow-y-auto border border-border space-y-2">
                                    {selectedItems.length === 0 ? (
                                        <p className="text-center py-6 text-muted-foreground text-[10px] font-black uppercase">No products added yet</p>
                                    ) : selectedItems.map((item, idx) => {
                                        const spLessThanCp = item.sellingPrice > 0 && item.costPerUnit > 0 && item.sellingPrice < item.costPerUnit
                                        return (
                                            <div key={item.productId} className="space-y-1">
                                                <div className="flex items-center gap-2 bg-card p-3 rounded-xl border border-border">
                                                    <span className="flex-1 min-w-[80px] font-black uppercase italic text-xs truncate">{item.productName}</span>
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <p className="text-[8px] font-black uppercase text-muted-foreground">Qty</p>
                                                        <input type="number" required max={MAX_QUANTITY} min={1}
                                                            className={cn("w-20 p-2 rounded-xl text-center font-bold text-sm border-2 outline-none transition-all",
                                                                itemQtyErrors[idx] ? "border-destructive bg-destructive/10 text-destructive" : "border-border bg-muted focus:border-foreground")}
                                                            onChange={(e) => updateDeliveryItem(idx, "quantity", parseInt(e.target.value))} />
                                                    </div>
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <p className="text-[8px] font-black uppercase text-amber-600">Cost/Unit ₱</p>
                                                        <input type="number" step="0.01" required min={0}
                                                            className={cn("w-28 p-2 border-2 rounded-xl text-center font-bold text-sm bg-muted outline-none transition-all text-amber-600", spLessThanCp ? "border-destructive" : "border-border focus:border-foreground")}
                                                            defaultValue={item.costPerUnit || ""}
                                                            onChange={(e) => updateDeliveryItem(idx, "costPerUnit", parseFloat(e.target.value))} />
                                                    </div>
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <p className="text-[8px] font-black uppercase text-emerald-600">Selling Price ₱</p>
                                                        <input type="number" step="0.01" required min={0}
                                                            className={cn("w-28 p-2 border-2 rounded-xl text-center font-bold text-sm bg-muted outline-none transition-all text-emerald-600", spLessThanCp ? "border-destructive bg-destructive/5" : "border-border focus:border-foreground")}
                                                            defaultValue={item.sellingPrice || ""}
                                                            onChange={(e) => updateDeliveryItem(idx, "sellingPrice", parseFloat(e.target.value))} />
                                                    </div>
                                                    <button type="button" onClick={() => { setSelectedItems(selectedItems.filter((_, i) => i !== idx)); const e2 = { ...itemQtyErrors }; delete e2[idx]; setItemQtyErrors(e2) }}
                                                        className="text-muted-foreground hover:text-destructive transition-all p-1.5"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                                {itemQtyErrors[idx] && <div className="flex items-center gap-1.5 text-destructive text-[10px] font-bold ml-1"><AlertCircle className="size-3" />{itemQtyErrors[idx]}</div>}
                                                {spLessThanCp && <div className="flex items-center gap-1.5 text-destructive text-[10px] font-bold ml-1"><AlertCircle className="size-3" />Selling price must be ≥ cost price.</div>}
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <button type="button" onClick={() => { setIsAssignModalOpen(false); setItemQtyErrors({}); setAssignSearch(""); setAssignDropdownOpen(false) }} className="flex-1 h-14 font-black uppercase text-xs text-muted-foreground hover:text-foreground transition-all">Cancel</button>
                                    <button type="submit" disabled={saving || Object.keys(itemQtyErrors).length > 0}
                                        className="flex-1 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black uppercase text-xs tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20">
                                        {saving ? <Loader2 className="animate-spin mx-auto size-4" /> : "Assign Inventory"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                MODAL 2: RESTOCK
            ════════════════════════════════════════════════════════════════ */}
            {isRestockModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-4xl rounded-[3rem] shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-10 max-h-[90vh] overflow-y-auto space-y-8">
                            <div className="flex justify-between items-center pb-6 border-b border-border">
                                <div>
                                    <h2 className="text-2xl font-black uppercase italic tracking-tighter">Restock Inventory</h2>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Record incoming stock from supplier</p>
                                </div>
                                <button onClick={() => { setIsRestockModalOpen(false); setRestockQtyErrors({}); setRestockSearch(""); setRestockDropdownOpen(false) }} className="p-2.5 hover:bg-muted rounded-full transition-all"><X className="size-5" /></button>
                            </div>

                            <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl px-5 py-3">
                                <Hash className="size-4 text-blue-500" />
                                <div className="flex-1">
                                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Delivery Number</p>
                                    <p className="font-black text-sm font-mono text-blue-500">{restockDeliveryNumber}</p>
                                </div>
                                <button type="button" onClick={() => setRestockDeliveryNumber(generateDeliveryNumber())} className="text-[9px] font-black uppercase text-muted-foreground hover:text-foreground transition-all tracking-widest">Regenerate</button>
                            </div>

                            <form onSubmit={handleRestockSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Supplier Source</label>
                                        <select required value={restockSupplier} onChange={(e) => setRestockSupplier(e.target.value)}
                                            className="w-full h-14 px-4 bg-muted rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-foreground transition-all">
                                            <option value="">Choose supplier...</option>
                                            {suppliers.map(s => <option key={s.id} value={s.company_name}>{s.company_name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Delivery Arrival Date</label>
                                        <input required type="date" min={minDate} max={today} value={restockDate} onChange={(e) => setRestockDate(e.target.value)}
                                            className="w-full h-14 px-4 bg-muted rounded-xl font-bold outline-none border-2 border-transparent focus:border-foreground transition-all" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Select Product to Restock</label>
                                    <div className="relative">
                                        <div className="flex items-center gap-2 h-14 px-4 bg-foreground text-background rounded-xl cursor-pointer"
                                            onClick={() => setRestockDropdownOpen(v => !v)}>
                                            <Search size={14} className="text-background/50 flex-shrink-0" />
                                            <input type="text" placeholder="Search by name, category, description..."
                                                className="flex-1 bg-transparent outline-none font-bold text-sm text-background placeholder:text-background/40"
                                                value={restockSearch}
                                                onChange={(e) => { setRestockSearch(e.target.value); setRestockDropdownOpen(true) }}
                                                onClick={(e) => { e.stopPropagation(); setRestockDropdownOpen(true) }} />
                                            <ChevronDown size={14} className={cn("text-background/50 transition-transform flex-shrink-0", restockDropdownOpen && "rotate-180")} />
                                        </div>
                                        {restockDropdownOpen && (
                                            <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
                                                {products
                                                    .filter(p => { const q = restockSearch.toLowerCase(); return !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q) })
                                                    .map(p => (
                                                        <button key={p.id} type="button"
                                                            onClick={() => { addRestockItem(p.id); setRestockSearch(""); setRestockDropdownOpen(false) }}
                                                            className="w-full px-4 py-3 text-left hover:bg-muted transition-all border-b border-border/50 last:border-0">
                                                            <div className="flex items-center justify-between">
                                                                <p className="font-black uppercase italic text-xs">{p.name}</p>
                                                                <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-lg border",
                                                                    (p.quantity ?? 0) === 0 ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                                    (p.quantity ?? 0) <= 5 ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                                    (p.quantity ?? 0) <= 20 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                                                    "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                                )}>Stock: {p.quantity ?? 0}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-1.5 py-0.5 bg-muted rounded">{p.category}</span>
                                                                {p.description && <span className="text-[9px] text-muted-foreground truncate max-w-[200px]">{p.description}</span>}
                                                            </div>
                                                        </button>
                                                    ))
                                                }
                                                {products.filter(p => { const q = restockSearch.toLowerCase(); return !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q) }).length === 0 && (
                                                    <p className="text-center py-6 text-[10px] font-black uppercase text-muted-foreground">No products found</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-muted rounded-2xl p-4 max-h-64 overflow-y-auto border border-border space-y-2">
                                    {restockItems.length === 0 ? (
                                        <p className="text-center py-6 text-muted-foreground text-[10px] font-black uppercase">No products selected</p>
                                    ) : restockItems.map((item, idx) => {
                                        const spLessThanCp = item.sellingPrice > 0 && item.costPerUnit > 0 && item.sellingPrice < item.costPerUnit
                                        return (
                                            <div key={item.productId} className="space-y-1">
                                                <div className="flex items-center gap-2 bg-card p-3 rounded-xl border border-border">
                                                    <div className="flex-1 min-w-[80px]">
                                                        <p className="font-black uppercase italic text-xs truncate">{item.productName}</p>
                                                        <p className="text-[9px] text-muted-foreground font-bold uppercase">Stock: {products.find(p => p.id === item.productId)?.quantity ?? 0}</p>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <p className="text-[8px] font-black uppercase text-muted-foreground">Qty</p>
                                                        <input type="number" required min={1} max={MAX_QUANTITY}
                                                            className={cn("w-20 p-2 rounded-xl text-center font-bold text-sm border-2 outline-none transition-all",
                                                                restockQtyErrors[idx] ? "border-destructive bg-destructive/10 text-destructive" : "border-border bg-muted focus:border-foreground")}
                                                            defaultValue={item.quantity}
                                                            onChange={(e) => updateRestockItem(idx, "quantity", parseInt(e.target.value))} />
                                                    </div>
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <p className="text-[8px] font-black uppercase text-amber-600">Cost/Unit ₱</p>
                                                        <input type="number" step="0.01" required min={0}
                                                            className={cn("w-28 p-2 border-2 rounded-xl text-center font-bold text-sm bg-muted outline-none transition-all text-amber-600", spLessThanCp ? "border-destructive" : "border-border focus:border-foreground")}
                                                            defaultValue={item.costPerUnit}
                                                            onChange={(e) => updateRestockItem(idx, "costPerUnit", parseFloat(e.target.value))} />
                                                    </div>
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <p className="text-[8px] font-black uppercase text-emerald-600">Selling Price ₱</p>
                                                        <input type="number" step="0.01" required min={0}
                                                            className={cn("w-28 p-2 border-2 rounded-xl text-center font-bold text-sm bg-muted outline-none transition-all text-emerald-600", spLessThanCp ? "border-destructive bg-destructive/5" : "border-border focus:border-foreground")}
                                                            defaultValue={item.sellingPrice || ""}
                                                            onChange={(e) => updateRestockItem(idx, "sellingPrice", parseFloat(e.target.value))} />
                                                    </div>
                                                    <button type="button" onClick={() => { setRestockItems(restockItems.filter((_, i) => i !== idx)); const e2 = { ...restockQtyErrors }; delete e2[idx]; setRestockQtyErrors(e2) }}
                                                        className="text-muted-foreground hover:text-destructive transition-all p-1.5"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                                {restockQtyErrors[idx] && <div className="flex items-center gap-1.5 text-destructive text-[10px] font-bold ml-1"><AlertCircle className="size-3" />{restockQtyErrors[idx]}</div>}
                                                {spLessThanCp && <div className="flex items-center gap-1.5 text-destructive text-[10px] font-bold ml-1"><AlertCircle className="size-3" />Selling price must be ≥ cost price.</div>}
                                            </div>
                                        )
                                    })}
                                </div>

                                {restockItems.length > 0 && (
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 space-y-1">
                                        <p className="text-[9px] font-black uppercase text-blue-500 tracking-widest">Restock Summary</p>
                                        {restockItems.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-xs font-bold">
                                                <span className="text-muted-foreground uppercase italic">{item.productName}</span>
                                                <span>+{item.quantity} units @ ₱{item.costPerUnit?.toLocaleString()}</span>
                                            </div>
                                        ))}
                                        <div className="pt-2 border-t border-blue-500/20 flex justify-between font-black text-sm">
                                            <span className="text-muted-foreground uppercase text-[10px] tracking-widest">Total Cost</span>
                                            <span className="text-blue-500">₱{restockItems.reduce((sum, i) => sum + (i.quantity * (i.costPerUnit || 0)), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4 pt-2">
                                    <button type="button" onClick={() => { setIsRestockModalOpen(false); setRestockQtyErrors({}); setRestockSearch(""); setRestockDropdownOpen(false) }} className="flex-1 h-14 font-black uppercase text-xs text-muted-foreground hover:text-foreground transition-all">Cancel</button>
                                    <button type="submit" disabled={saving || Object.keys(restockQtyErrors).length > 0}
                                        className="flex-1 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-black uppercase text-xs tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20">
                                        {saving ? <Loader2 className="animate-spin mx-auto size-4" /> : "Confirm Restock"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                MODAL 3: QUICK EDIT STOCK
            ════════════════════════════════════════════════════════════════ */}
            {isEditStockModalOpen && editingProduct && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-lg rounded-[3rem] shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="h-44 bg-muted relative group border-b border-border">
                            <img src={editingProduct.image || DEFAULT_IMAGE} className="w-full h-full object-cover" alt="preview" />
                            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                <div className="bg-white text-black px-4 py-2 rounded-xl flex items-center gap-2 shadow-xl text-xs font-black uppercase">
                                    <Edit3 className="w-4 h-4" /> Change Image
                                </div>
                                <input type="file" accept="image/*" className="hidden"
                                    onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setEditingProduct({ ...editingProduct, image: reader.result as string }); reader.readAsDataURL(file) } }} />
                            </label>
                            <div className="absolute bottom-3 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-lg flex items-center gap-2">
                                <Clock className="w-3 h-3 text-white/60" />
                                <span className="text-[9px] font-black uppercase text-white/80 tracking-wider">Quick Edit Mode</span>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="flex-1 mr-4">
                                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">Product Name</p>
                                    <input type="text" value={editingProduct.name || ""} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                        className="w-full text-xl font-black uppercase italic tracking-tighter bg-transparent border-b-2 border-transparent focus:border-foreground outline-none transition-all" />
                                </div>
                                <button onClick={() => { setIsEditStockModalOpen(false); setQtyError(null); setPriceError(null) }} className="p-2.5 hover:bg-muted rounded-full transition-all"><X className="size-5" /></button>
                            </div>

                            <div className="flex items-center gap-3 bg-foreground/5 border border-border rounded-xl px-4 py-2.5">
                                <Hash className="size-3.5 text-muted-foreground" />
                                <div className="flex-1">
                                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Delivery / Edit Ref. Number</p>
                                    <input value={editDeliveryNumber} onChange={(e) => setEditDeliveryNumber(e.target.value)}
                                        className="w-full text-sm font-black font-mono bg-transparent outline-none" placeholder="DEL-XXXXXXXX-XXXX" />
                                </div>
                            </div>

                            <form onSubmit={handleQuickUpdateSubmit} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Cost Price</label>
                                        <div className="h-14 px-4 flex items-center bg-muted rounded-xl border border-border font-bold text-muted-foreground text-sm">₱{editingProduct.cost_price?.toLocaleString()}</div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Selling Price</label>
                                        <input type="number" step="0.01" value={editingProduct.selling_price || 0}
                                            onChange={(e) => { const val = parseFloat(e.target.value); setEditingProduct({ ...editingProduct, selling_price: val }); setPriceError(val < editingProduct.cost_price ? "Selling price must be ≥ cost price." : null) }}
                                            className={cn("w-full h-14 px-4 rounded-xl font-bold text-sm outline-none border-2 transition-all",
                                                priceError ? "border-destructive bg-destructive/10 text-destructive" : "border-transparent bg-muted focus:border-foreground")} />
                                        {priceError && <div className="flex items-center gap-1.5 text-destructive text-[10px] font-bold"><AlertCircle className="size-3" />{priceError}</div>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Override Quantity</label>
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase">Max: {MAX_QUANTITY.toLocaleString()}</span>
                                    </div>
                                    <input type="number" min={0} max={MAX_QUANTITY} value={editingProduct.quantity || 0}
                                        onChange={(e) => { const val = parseInt(e.target.value); setEditingProduct({ ...editingProduct, quantity: val }); if (val > MAX_QUANTITY) setQtyError(`Maximum is ${MAX_QUANTITY.toLocaleString()}.`); else if (val < 0) setQtyError("Cannot be negative."); else setQtyError(null) }}
                                        className={cn("w-full h-14 px-4 rounded-xl font-black text-xl outline-none border-2 transition-all",
                                            qtyError ? "border-destructive bg-destructive/10 text-destructive" : "border-transparent bg-muted focus:border-foreground")} />
                                    {qtyError && <div className="flex items-center gap-1.5 text-destructive text-[10px] font-bold"><AlertCircle className="size-3" />{qtyError}</div>}
                                </div>

                                <button type="submit" disabled={saving || !!qtyError || !!priceError}
                                    className="w-full h-14 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2">
                                    {saving ? <Loader2 className="animate-spin size-4" /> : <><Save size={14} /> Save Changes</>}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                MODAL 4: ADD / EDIT PRODUCT
            ════════════════════════════════════════════════════════════════ */}
            {(isAddProductOpen || isEditProductOpen) && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-[2.5rem] shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-black uppercase italic tracking-tighter">{isAddProductOpen ? "Register Item" : "Modify Item"}</h2>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{isAddProductOpen ? "Add new product to registry" : `Editing: ${currentProduct?.name}`}</p>
                                </div>
                                <button onClick={() => { setIsAddProductOpen(false); setIsEditProductOpen(false); setImageError(null); setCostPriceError(null) }}
                                    className="p-2.5 hover:bg-muted rounded-full transition-all text-muted-foreground"><X size={20} /></button>
                            </div>

                            <form onSubmit={(e) => handleProductAction(e, isAddProductOpen ? "POST" : "PUT")} className="space-y-4">
                                {/* Image Upload */}
                                <div className="space-y-1">
                                    <label className={cn("relative cursor-pointer block border-2 border-dashed rounded-2xl p-4 transition-all text-center",
                                        imageError ? "border-destructive bg-destructive/5" : isUploading ? "opacity-50 border-border" : "border-border hover:border-foreground bg-muted")}>
                                        <input type="file" className="hidden" accept=".jpg,.jpeg,.png" onChange={(e) => handleImageChange(e, isAddProductOpen ? "add" : "edit")} disabled={isUploading} />
                                        {isUploading ? (
                                            <div className="py-2"><Loader2 className="animate-spin mx-auto w-6 h-6 text-muted-foreground" /><p className="text-[9px] font-black uppercase text-muted-foreground mt-1">Uploading...</p></div>
                                        ) : currentImg ? (
                                            <img src={currentImg} className="h-20 mx-auto rounded-xl object-cover" />
                                        ) : (
                                            <div className="py-2">
                                                <UploadCloud size={22} className="mx-auto text-muted-foreground/40 mb-1" />
                                                <p className="text-[9px] font-black uppercase text-muted-foreground">Upload Image</p>
                                                {/* ← updated hint */}
                                                <p className="text-[8px] text-muted-foreground/60 mt-0.5">JPG, JPEG, PNG only · Uses AJP logo if left empty</p>
                                            </div>
                                        )}
                                    </label>
                                    {imageError && <div className="flex items-center gap-1.5 text-destructive text-[10px] font-bold ml-1"><AlertCircle className="size-3" />{imageError}</div>}
                                </div>

                                {/* Product Title */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Product Title</label>
                                    <input required
                                        className="w-full bg-muted border border-border rounded-xl px-4 py-3.5 text-xs font-bold uppercase outline-none focus:border-foreground transition-all"
                                        value={isAddProductOpen ? productFormData.name : currentProduct?.name ?? ""}
                                        onChange={e => isAddProductOpen ? setProductFormData({ ...productFormData, name: e.target.value }) : setCurrentProduct({ ...currentProduct!, name: e.target.value })} />
                                </div>

                                {/* Category */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Category</label>
                                    <select required
                                        className="w-full bg-muted border border-border rounded-xl px-4 py-3.5 text-[10px] font-bold uppercase outline-none cursor-pointer focus:border-foreground transition-all"
                                        value={isAddProductOpen ? productFormData.category : currentProduct?.category ?? ""}
                                        onChange={e => isAddProductOpen ? setProductFormData({ ...productFormData, category: e.target.value }) : setCurrentProduct({ ...currentProduct!, category: e.target.value })}>
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c.id} value={c.category_name}>{c.category_name}</option>)}
                                    </select>
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Description</label>
                                    <textarea rows={4}
                                        className="w-full bg-muted border border-border rounded-xl px-4 py-3.5 text-xs font-medium outline-none focus:border-foreground transition-all resize-none leading-relaxed"
                                        placeholder="Detailed description of this product or material..."
                                        value={isAddProductOpen ? productFormData.description : currentProduct?.description ?? ""}
                                        onChange={e => isAddProductOpen ? setProductFormData({ ...productFormData, description: e.target.value }) : setCurrentProduct({ ...currentProduct!, description: e.target.value })} />
                                </div>

                                {/* Cost Price */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Cost Price (₱)</label>
                                    <input required type="number" step="0.01" min="0"
                                        className={cn("w-full bg-foreground text-background rounded-xl px-4 py-3.5 text-sm font-black outline-none transition-all border-2",
                                            costPriceError ? "border-destructive" : "border-transparent")}
                                        value={isAddProductOpen ? productFormData.cost_price : currentProduct?.cost_price ?? 0}
                                        onChange={e => {
                                            const val = Number(e.target.value)
                                            if (isAddProductOpen) setProductFormData({ ...productFormData, cost_price: e.target.value })
                                            else { setCurrentProduct({ ...currentProduct!, cost_price: val }); setCostPriceError(val > (currentProduct?.selling_price ?? Infinity) ? "Cost cannot exceed selling price." : null) }
                                        }} />
                                </div>

                                {costPriceError && (
                                    <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-[10px] font-bold">
                                        <AlertCircle className="size-3.5 flex-shrink-0 mt-0.5" />{costPriceError}
                                    </div>
                                )}

                                {isEditProductOpen && currentProduct?.selling_price !== undefined && (
                                    <div className="flex items-center justify-between p-3 bg-muted rounded-xl border border-border">
                                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Current Selling Price</p>
                                        <p className="text-sm font-black">₱{currentProduct.selling_price.toLocaleString()}</p>
                                    </div>
                                )}

                                <button type="submit" disabled={isUploading || saving || !!costPriceError}
                                    className="w-full h-14 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                    {saving ? <Loader2 className="animate-spin size-4" /> : "Commit Record"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}